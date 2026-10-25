"""Pull upcoming Miami-Dade events from public event feeds into a proof-of-concept database.

Sources (no keys needed unless noted):
  luma        api.lu.ma discover feed (undocumented, used by luma.com/miami)
  meetup      api.meetup.com/gql-ext (Meetup's GraphQL API; unauthenticated read of public events)
  eventbrite  schema.org JSON-LD on eventbrite.com/d/fl--miami/* listing pages
  ticketmaster Discovery API v2, concerts/sports/arts (needs TICKETMASTER_API_KEY, free)

Writes demo/ingest/out/fulltable_poc.sqlite and, with --seed, adds the feeds as Event Sourcing
sources in src/client/demo/data/miami-seed.json.

  python3 demo/ingest/ingest.py [--seed] [--sources luma,meetup,eventbrite,ticketmaster]
"""
import argparse, datetime as dt, json, math, os, re, sqlite3, subprocess, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'demo/ingest/out'
DB = OUT / 'fulltable_poc.sqlite'
SEED = ROOT / 'src/client/demo/data/miami-seed.json'
AREAS = json.load(open(ROOT / 'src/client/demo/data/demand.json'))['areas']
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36 FullTablePoC/0.1'
# Miami-Dade bounding box (rough) and query points spread across the county.
BBOX = (25.13, 25.98, -80.88, -80.11)
POINTS = [(25.7617, -80.1918), (25.94, -80.24), (25.62, -80.40), (25.79, -80.13), (25.75, -80.35), (25.47, -80.48)]

SCHEMA = """
CREATE TABLE IF NOT EXISTS source(id TEXT PRIMARY KEY, name TEXT, access TEXT, needs_key INTEGER);
CREATE TABLE IF NOT EXISTS ingest_run(id INTEGER PRIMARY KEY, source_id TEXT, started_at TEXT, fetched INTEGER, kept INTEGER, error TEXT);
CREATE TABLE IF NOT EXISTS organizer(id TEXT PRIMARY KEY, source_id TEXT, name TEXT, kind TEXT, url TEXT,
  members INTEGER, category TEXT, lat REAL, lng REAL, first_seen TEXT, last_seen TEXT);
CREATE TABLE IF NOT EXISTS venue(id TEXT PRIMARY KEY, name TEXT, address TEXT, city TEXT, lat REAL, lng REAL, area TEXT);
CREATE TABLE IF NOT EXISTS event(id TEXT PRIMARY KEY, source_id TEXT, external_id TEXT, title TEXT, starts_at TEXT,
  category TEXT, url TEXT, organizer_id TEXT, venue_id TEXT, expected_size INTEGER, size_basis TEXT,
  is_recurring INTEGER, fit_score REAL, fit_reason TEXT, fetched_at TEXT, raw TEXT);
CREATE INDEX IF NOT EXISTS event_start ON event(starts_at);
CREATE INDEX IF NOT EXISTS event_venue ON event(venue_id);
"""
SOURCES = {
    'luma': ('Luma: Miami discover feed', 'Undocumented public JSON (luma.com/miami)', 0),
    'meetup': ('Meetup: Miami-Dade groups & events', 'Meetup GraphQL API (public read)', 0),
    'eventbrite': ('Eventbrite: Miami listings', 'schema.org JSON-LD on listing pages', 0),
    'ticketmaster': ('Ticketmaster Discovery: concerts & sports', 'Official API, free key', 1),
}


def get_json(url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers={'User-Agent': UA, **(headers or {})})
    return json.load(urllib.request.urlopen(req, timeout=40))


def get_text(url):
    return subprocess.run(['curl', '-sL', '-A', UA, '--max-time', '30', url], capture_output=True, text=True).stdout


def in_county(lat, lng):
    return lat is not None and lng is not None and BBOX[0] <= lat <= BBOX[1] and BBOX[2] <= lng <= BBOX[3]


def nearest_area(lat, lng):
    best = min(AREAS, key=lambda a: (a['lat'] - lat) ** 2 + ((a['lng'] - lng) * math.cos(math.radians(lat))) ** 2)
    return best['area']


GROUPY = re.compile(r'network|mixer|meetup|club|league|social|run club|hike|book|alumni|chamber|association|team|'
                    r'founders|startup|happy hour|dinner|brunch|women|professionals|community|singles|language|church|faith', re.I)


def fit(title, category, size, starts_at, recurring, concert=False):
    """Heuristic 0-100 fit for an organised group meal. Refit against pilot bookings."""
    s, why = 40.0, []
    if concert:
        s += 10; why.append('large crowd: pre/post-show dining near the venue')
    elif GROUPY.search(f'{title} {category}'):
        s += 20; why.append('organised group format')
    if size:
        if 10 <= size <= 80: s += 20; why.append(f'~{size} attendees fits a group table')
        elif size > 80: s += 8; why.append(f'{size} attendees: split into several tables')
    if recurring:
        s += 15; why.append('recurring series, so it can be a standing booking')
    if starts_at:
        t = dt.datetime.fromisoformat(starts_at.replace('Z', '+00:00'))
        local_h = (t.hour - 4) % 24 if t.tzinfo and t.utcoffset() == dt.timedelta(0) else t.hour
        if t.weekday() <= 3 and 17 <= local_h <= 21:
            s += 10; why.append('Mon–Thu evening (slow service)')
    return min(round(s, 1), 99.0), '; '.join(why) or 'general event'


def luma():
    seen = {}
    for lat, lng in POINTS:
        cur = None
        for _ in range(30):
            q = f'latitude={lat}&longitude={lng}&pagination_limit=50' + (f'&pagination_cursor={cur}' if cur else '')
            d = get_json('https://api.lu.ma/discover/get-paginated-events?' + q)
            for e in d['entries']:
                seen[e['api_id']] = e
            cur = d.get('next_cursor'); time.sleep(0.4)
            if not d.get('has_more'):
                break
    rows = []
    for e in seen.values():
        ev, g, cal = e['event'], e['event'].get('geo_address_info') or {}, e.get('calendar') or {}
        c = g.get('place_coordinate') or ev.get('coordinate') or {}
        lat, lng = c.get('latitude'), c.get('longitude')
        if ev.get('location_type') != 'offline' or not in_county(lat, lng):
            continue
        rows.append(dict(ext=e['api_id'], title=ev['name'], starts=ev['start_at'], category='Luma event', url='https://luma.com/' + ev['url'],
                         org=dict(ext=cal.get('api_id'), name=cal.get('name') or 'Luma host', kind='Luma calendar', url='https://luma.com/' + (cal.get('slug') or ''), members=None, category=None),
                         venue=dict(name=g.get('address'), address=g.get('full_address'), city=g.get('city'), lat=lat, lng=lng),
                         size=e.get('guest_count') or None, basis='registered guests', recurring=False, raw=e))
    return len(seen), rows


MEETUP_Q = """query($lat:Float!,$lon:Float!,$after:String){ recommendedEvents(first:50, after:$after,
 filter:{lat:$lat, lon:$lon, radius:15, eventType:PHYSICAL}){ pageInfo{hasNextPage endCursor}
 edges{ node{ id title dateTime eventUrl series{ description } venue{ name lat lon city address }
 group{ id name urlname topicCategory{ name } stats{ memberCounts{ all } } } rsvps{ totalCount } } } } }"""


def meetup():
    gql = lambda v: get_json('https://api.meetup.com/gql-ext', json.dumps({'query': MEETUP_Q, 'variables': v}).encode(), {'Content-Type': 'application/json'})
    seen = {}
    for lat, lng in POINTS:
        after = None
        for _ in range(20):
            d = gql({'lat': lat, 'lon': lng, 'after': after})
            if d.get('errors'):
                raise RuntimeError(d['errors'][0]['message'])
            r = d['data']['recommendedEvents']
            for x in r['edges']:
                seen[x['node']['id']] = x['node']
            if not r['pageInfo']['hasNextPage']:
                break
            after = r['pageInfo']['endCursor']; time.sleep(0.3)
    per_group = {}
    for n in seen.values():
        per_group[n['group']['id']] = per_group.get(n['group']['id'], 0) + 1
    rows = []
    for n in seen.values():
        v, gr = n.get('venue') or {}, n['group']
        if not in_county(v.get('lat'), v.get('lon')):
            continue
        cat = (gr.get('topicCategory') or {}).get('name') or 'Meetup'
        rows.append(dict(ext=n['id'], title=n['title'], starts=n['dateTime'], category=cat, url=n['eventUrl'],
                         org=dict(ext=gr['id'], name=gr['name'], kind='Meetup group', url='https://www.meetup.com/' + gr['urlname'],
                                  members=((gr.get('stats') or {}).get('memberCounts') or {}).get('all'), category=cat),
                         venue=dict(name=v.get('name'), address=v.get('address'), city=v.get('city'), lat=v['lat'], lng=v['lon']),
                         size=(n.get('rsvps') or {}).get('totalCount') or None, basis='RSVPs so far',
                         recurring=bool(n.get('series')) or per_group[gr['id']] > 1, raw=n))
    return len(seen), rows


def eventbrite():
    seen = {}
    for cat in ['all-events', 'music--events', 'business--events', 'community--events', 'food-and-drink--events', 'sports-and-fitness--events']:
        for p in range(1, 4):
            h = get_text(f'https://www.eventbrite.com/d/fl--miami/{cat}/?page={p}')
            for x in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', h, re.S):
                try:
                    j = json.loads(x)
                except ValueError:
                    continue
                if isinstance(j, dict) and j.get('@type') == 'ItemList':
                    for it in j['itemListElement']:
                        seen.setdefault(it['item']['url'], dict(it['item'], _cat=cat))
            time.sleep(1)
    rows = []
    for e in seen.values():
        loc = e.get('location') or {}
        geo, adr = loc.get('geo') or {}, loc.get('address') or {}
        try:
            lat, lng = float(geo.get('latitude')), float(geo.get('longitude'))
        except (TypeError, ValueError):
            continue
        if not in_county(lat, lng):
            continue
        cat = e['_cat'].split('--')[0].replace('-and-', ' & ').replace('-', ' ').title() if e['_cat'] != 'all-events' else 'Eventbrite'
        rows.append(dict(ext=e['url'].rsplit('-', 1)[-1], title=e['name'], starts=e.get('startDate'), category=cat, url=e['url'],
                         org=None, venue=dict(name=loc.get('name'), address=adr.get('streetAddress'), city=adr.get('addressLocality'), lat=lat, lng=lng),
                         size=None, basis=None, recurring=False, raw=e))
    return len(seen), rows


def ticketmaster():
    key = os.environ.get('TICKETMASTER_API_KEY')
    if not key:
        raise RuntimeError('TICKETMASTER_API_KEY not set (free key: developer.ticketmaster.com)')
    rows, total = [], 0
    for page in range(5):
        q = urllib.parse.urlencode(dict(apikey=key, dmaId=422, size=200, page=page, sort='date,asc'))  # 422 = Miami-Ft Lauderdale DMA
        d = get_json('https://app.ticketmaster.com/discovery/v2/events.json?' + q)
        evs = (d.get('_embedded') or {}).get('events', [])
        total += len(evs)
        for e in evs:
            v = ((e.get('_embedded') or {}).get('venues') or [{}])[0]
            loc = v.get('location') or {}
            try:
                lat, lng = float(loc['latitude']), float(loc['longitude'])
            except (KeyError, ValueError):
                continue
            if not in_county(lat, lng):
                continue
            seg = ((e.get('classifications') or [{}])[0].get('segment') or {}).get('name') or 'Event'
            rows.append(dict(ext=e['id'], title=e['name'], starts=(e.get('dates') or {}).get('start', {}).get('dateTime'), category=seg, url=e.get('url'),
                             org=None, venue=dict(name=v.get('name'), address=(v.get('address') or {}).get('line1'), city=(v.get('city') or {}).get('name'), lat=lat, lng=lng),
                             size=None, basis=None, recurring=False, raw={'id': e['id'], 'name': e['name']}))
        if page + 1 >= (d.get('page') or {}).get('totalPages', 0):
            break
        time.sleep(0.25)
    return total, rows


FETCHERS = {'luma': luma, 'meetup': meetup, 'eventbrite': eventbrite, 'ticketmaster': ticketmaster}


def store(con, sid, rows, now):
    for r in rows:
        v = r['venue']
        vid = f"v:{round(v['lat'], 4)}:{round(v['lng'], 4)}"
        area = nearest_area(v['lat'], v['lng'])
        con.execute('INSERT OR IGNORE INTO venue VALUES(?,?,?,?,?,?,?)', (vid, v.get('name'), v.get('address'), v.get('city'), v['lat'], v['lng'], area))
        oid = None
        if r['org'] and r['org'].get('ext'):
            o = r['org']; oid = f"{sid}:{o['ext']}"
            con.execute('INSERT INTO organizer VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen, members=excluded.members',
                        (oid, sid, o['name'], o['kind'], o['url'], o.get('members'), o.get('category'), v['lat'], v['lng'], now, now))
        score, why = fit(r['title'], r['category'], r['size'], r['starts'], r['recurring'], concert=r['category'] in ('Music', 'Sports'))
        con.execute('INSERT OR REPLACE INTO event VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    (f"{sid}:{r['ext']}", sid, r['ext'], r['title'], r['starts'], r['category'], r['url'], oid, vid, r['size'], r['basis'],
                     int(r['recurring']), score, f'{area}: {why}', now, json.dumps(r['raw'])[:20000]))


def seed_pools(con):
    """Add each feed as an Event Sourcing source in the demo seed (upcoming events, best fit first)."""
    seed = json.load(open(SEED))
    seed['sources'] = [s for s in seed['sources'] if not s['id'].startswith('src-feed-') and s['id'] != 'src-ticketmaster']
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    for sid, (name, _, needs_key) in SOURCES.items():
        q = con.execute('''SELECT e.title, e.starts_at, e.category, e.url, e.expected_size, e.size_basis, e.is_recurring, e.fit_score, e.fit_reason,
                           COALESCE(o.name, v.name), COALESCE(o.kind, 'Venue'), o.members, v.name, v.address, v.lat, v.lng, v.area
                           FROM event e JOIN venue v ON v.id=e.venue_id LEFT JOIN organizer o ON o.id=e.organizer_id
                           WHERE e.source_id=? AND e.starts_at>=? ORDER BY e.fit_score DESC, e.starts_at''', (sid, now[:10])).fetchall()
        pid = f'src-feed-{sid}'
        seed['sources'].append({'id': pid, 'name': name, 'committed': bool(q)})
        seed['pools'][pid] = [dict(name=r[9] or r[12] or 'Unknown organizer', type=r[10], address=f"{r[12] or ''}, {r[13] or ''}".strip(', '),
                                   lat=round(r[14], 5), lng=round(r[15], 5), area=r[16], score=r[7], category=r[2], eventLabel=r[0],
                                   partySize=r[4] or 0, perYear=12 if r[6] else 1, hasContact=r[10] != 'Venue',
                                   startsAt=r[1], url=r[3], isRecurring=bool(r[6]), reason=r[8], sizeBasis=r[5], members=r[11]) for r in q]
        if not q:
            seed['pools'].pop(pid)
    json.dump(seed, open(SEED, 'w'), indent=1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sources', default='luma,meetup,eventbrite,ticketmaster')
    ap.add_argument('--seed', action='store_true')
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB); con.executescript(SCHEMA)
    now = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
    for sid in a.sources.split(','):
        n, acc, k = SOURCES[sid]
        con.execute('INSERT OR REPLACE INTO source VALUES(?,?,?,?)', (sid, n, acc, k))
        try:
            fetched, rows = FETCHERS[sid]()
            store(con, sid, rows, now); err = None
        except Exception as ex:  # one failing feed must not stop the others
            fetched, rows, err = 0, [], str(ex)[:300]
        con.execute('INSERT INTO ingest_run(source_id,started_at,fetched,kept,error) VALUES(?,?,?,?,?)', (sid, now, fetched, len(rows), err))
        con.commit()
        print(f'{sid:13} fetched {fetched:4}  kept (in Miami-Dade, in person) {len(rows):4}' + (f'  ERROR {err}' if err else ''))
    tot = con.execute('SELECT COUNT(*), COUNT(DISTINCT organizer_id), COUNT(DISTINCT venue_id) FROM event').fetchone()
    print(f'database {DB.relative_to(ROOT)}: {tot[0]} events, {tot[1]} organizers, {tot[2]} venues')
    if a.seed:
        seed_pools(con); print('updated', SEED.relative_to(ROOT))


if __name__ == '__main__':
    main()
