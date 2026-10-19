"""Builds the FullTable AI pitch deck from the latest walkthrough run.

    python3 demo/walkthrough/walkthrough.py      # produces demo/walkthrough/out/
    python3 demo/pitch/build_deck.py             # -> demo/pitch/out/FullTable-AI_pitch.pdf (+ .html)
"""
import base64, html, io, json, pathlib
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
WT = ROOT / "demo/walkthrough/out"
OUT = pathlib.Path(__file__).resolve().parent / "out"; OUT.mkdir(exist_ok=True)
T = json.loads((WT / "timings.json").read_text())
D = json.loads((ROOT / "src/client/demo/data/demand.json").read_text())
C, A = D["citywide"], D["assumptions"]
INK, ACC, MUTED, SOFT = "#2f1d33", "#b06b4f", "#7b6f73", "#e9dccf"

def img(p): return "data:image/png;base64," + base64.b64encode(pathlib.Path(p).read_bytes()).decode()
def fig_uri(fig):
    b = io.BytesIO(); fig.savefig(b, format="png", dpi=180, bbox_inches="tight", transparent=True); plt.close(fig)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()
def style(ax):
    for s in ("top", "right"): ax.spines[s].set_visible(False)
    ax.tick_params(colors=INK); [ax.spines[s].set_color(MUTED) for s in ("left", "bottom")]

shot = {s["key"]: WT / s["screenshot"] for s in T["steps"]}
fmt = lambda n: f"{n:,.0f}"

# chart 1: person hours by step
steps = [s for s in T["steps"] if s["manualMinutes"] >= 10]
fig, ax = plt.subplots(figsize=(7, 3.6))
y = range(len(steps))
ax.barh([i + .2 for i in y], [s["manualMinutes"] / 60 for s in steps], .4, color=MUTED, label="By hand")
ax.barh([i - .2 for i in y], [s["assistedMinutes"] / 60 for s in steps], .4, color=ACC, label="With FullTable")
ax.set_yticks(list(y), [s["title"].split(":")[0][:34] for s in steps], fontsize=9); ax.invert_yaxis()
ax.set_xlabel("Person-hours", color=INK); ax.legend(frameon=False); style(ax)
chart_hours = fig_uri(fig)

# chart 2: coverage curve
ar = [x for x in D["areas"] if x["directableCoversMonth"] > 0]
fig, ax = plt.subplots(figsize=(7, 3.6))
xs = list(range(1, len(ar) + 1)); ys = [x["cumulativeShare"] * 100 for x in ar]
ax.plot(xs, ys, color=ACC, lw=3); ax.fill_between(xs, ys, color=ACC, alpha=.12)
for k in (5, 10, C["areasFor80pct"]):
    ax.scatter([k], [ys[k-1]], color=INK, zorder=3); ax.annotate(f"{k} areas → {ys[k-1]:.0f}%", (k, ys[k-1]), xytext=(6, -14), textcoords="offset points", color=INK, fontsize=9)
ax.set_xlabel("Areas covered (ranked by directable demand)", color=INK); ax.set_ylabel("% of county demand", color=INK); ax.set_ylim(0, 105); style(ax)
chart_cov = fig_uri(fig)

# chart 3: top areas directable demand
top = ar[:10]
fig, ax = plt.subplots(figsize=(7, 3.6))
ax.bar([x["area"] for x in top], [x["directableCoversMonth"] for x in top], color=ACC)
ax.set_ylabel("Guests / month", color=INK); plt.setp(ax.get_xticklabels(), rotation=35, ha="right", fontsize=9); style(ax)
chart_top = fig_uri(fig)

weekly = 18 * A["avg_check_usd"] * 4.3
slides = []
def slide(title, body, kicker=""):
    slides.append(f'<section class="s"><div class="k">{kicker}</div><h2>{title}</h2>{body}</section>')
def two(left, right_img, cap=""):
    return f'<div class="two"><div class="txt">{left}</div><figure><img src="{right_img}"/><figcaption>{cap}</figcaption></figure></div>'
def kpis(items): return '<div class="kpis">' + "".join(f'<div><b>{v}</b><span>{l}</span></div>' for v, l in items) + "</div>"

slides.append(f'''<section class="s title"><div><div class="k">FullTable AI · Miami-Dade pilot</div>
<h1>Fill slow services with the groups already around you</h1>
<p>FullTable finds local clubs, teams, associations and schools, maps where group demand is, and turns it into approved, recurring bookings.</p>
{kpis([(fmt(C["directableCoversMonth"]), "group guests / month we can route"), ("$"+fmt(C["restaurantRevenueMonthUsd"]), "restaurant revenue / month"), (f'{T["timeSaved"]*100:.0f}%', "less prospecting time")])}</div>
<img class="hero" src="{img(shot["demand_map"])}"/></section>''')

slide("Seats aren't scarce. Organized groups are hard to find.", two(f'''<ul>
<li>Miami-Dade has <b>{fmt(C["restaurants"])}</b> restaurants with 40+ seats, with about <b>{fmt(C["spareCoversMonth"]/C["demandCoversMonth"])}×</b> more empty slow-period seats than organized group demand.</li>
<li>The demand is there: <b>{fmt(C["orgs"])}</b> clubs, associations, teams and schools in the IRS registry alone hold recurring meals.</li>
<li>Finding, researching and pitching one organization by hand takes ~{A["manual_minutes_per_org"]} min. Covering the county is <b>{fmt(C["researchHoursManual"])} hours</b>, so nobody does it.</li>
<li>Booking tools (OpenTable, Tripleseat, Perfect Venue) only handle demand that already comes in.</li></ul>''', chart_top, "Directable group guests per month, top 10 areas"), "The problem")

slide("One workflow, from public data to an approved booking", '<div class="flow">' + "".join(
    f'<div><img src="{img(shot[k])}"/><b>{n}. {t}</b><span>{d}</span></div>' for n, (k, t, d) in enumerate([
        ("source_events", "Source", "Engine pulls organizations & recurring events"),
        ("demand_map", "Prioritize", "Demand map picks the areas to cover"),
        ("network_map", "Match", "Groups plotted around the restaurant"),
        ("approvals", "Approve", "Owner signs off before anything is sent")], 1)) + "</div>", "The product")

s2 = next(s for s in T["steps"] if s["key"] == "source_events")
slide("Event Sourcing fills the registry in one click", two(f'''<ul>
<li>One run pulled <b>60 organizations and 60 recurring events</b> from two public registries in <b>{s2["seconds"]} s</b>.</li>
<li>Each lead arrives typed, geocoded, scored and with a plain-English reason it fits a slow weeknight.</li>
<li>Leads without a contact route are flagged <i>Needs review</i>; nothing goes out unverified.</li>
<li>By hand: ~{fmt(s2["manualMinutes"]/60)} person-hours for the same 60 leads.</li></ul>''', img(shot["review_registry"]), "Organizers tab after the run"), "Step 1 · Source")

slide("See every group around the restaurant", two('''<ul>
<li>Sourced organizers and their events appear on the Network Map straight away, next to 150 directory restaurants.</li>
<li>Filter by event type, group size, radius and verification.</li>
<li>Sales sees which groups are a short walk away instead of a list in a spreadsheet.</li></ul>''', img(shot["network_map"])), "Step 2 · Match")

slide("Performance indicator map: where to cover, and how much we can route", two(f'''<ul>
<li>Area-level estimate of group guests per month FullTable can route into partner restaurants' slow services.</li>
<li><b>Top 5 areas = {C["top5Share"]*100:.0f}%</b> of county demand; <b>{C["areasFor80pct"]} areas = 80%</b>.</li>
<li>Covering the top 10 areas: <b>{fmt(sum(x["directableCoversMonth"] for x in ar[:10]))}</b> guests / month, about <b>${fmt(sum(x["directableCoversMonth"] for x in ar[:10])*A["avg_check_usd"])}</b> to restaurants.</li>
<li>The slider in the app lets a manager size the territory to the sales team.</li></ul>''', chart_cov, "Cumulative share of directable demand"), "Step 3 · Prioritize")

slide("A person approves every offer", two('''<ul>
<li>The AI drafts plans, offers and messages; nothing is sent or booked until the owner approves.</li>
<li>Offers outside policy (e.g. a 25% discount above a 15% cap) are flagged as exceptions.</li>
<li>Owners decide in seconds instead of chasing threads by email and text.</li></ul>''', img(shot["approvals"])), "Step 4 · Approve")

slide("Added value: the same work in a fraction of the time", two(f'''{kpis([(f'{T["manualHours"]:g} h', "by hand"), (f'{T["assistedHours"]:g} h', "with FullTable"), (f'{T["timeSaved"]*100:.0f}%', "less person time")])}
<p>Measured on the reproducible walkthrough (60 leads, one territory plan, one approval). At county scale: <b>{fmt(C["researchHoursManual"])} h → {fmt(C["researchHoursAssisted"])} h</b> to work every mapped organization.</p>
<p class="muted">The whole walkthrough replays in {T["automatedMinutes"]*60:.0f} s with zero page errors.</p>''', chart_hours, "Person-hours per step"), "Impact")

slide("What it's worth to one restaurant", kpis([("$"+fmt(weekly), "revenue / month from one weekly group of 18"), ("$149–299", "FullTable plan / month"), (f'~{weekly*0.3/299:.0f}×', "return on the fee at 30% margin")]) + f'''
<p>County-wide, routed demand is worth <b>${fmt(C["restaurantRevenueMonthUsd"])}</b> a month to restaurants and <b>${fmt(C["fullTableFeesMonthUsd"])}</b> a month in FullTable success fees (${A["success_fee_usd"]} per guest), before subscriptions.</p>
<table><tr><th>Stage</th><th>Paying restaurants</th><th>Revenue / year</th></tr><tr><td>Launch</td><td>10</td><td>~$36k</td></tr><tr><td>Traction</td><td>75</td><td>~$269k</td></tr><tr><td>Scale</td><td>500</td><td>~$1.8M</td></tr></table>''', "Business case")

slide("Next 12 weeks", '''<ul class="big">
<li><b>Pilot</b> with 5–10 Miami restaurants in the top-ranked areas; re-fit the demand coefficients on real bookings.</li>
<li><b>Live backend</b>: connect the Archie keys so sourcing, approvals and bookings persist.</li>
<li><b>More sources</b>: Ticketmaster events, Overture business places and Sunbiz company officers.</li>
<li><b>Ship</b>: deploy, real sign-up, licensed map tiles.</li></ul>''', "Roadmap")

slide("How the numbers are made", f'''<ul class="small">
<li>Organizations: IRS exempt-organization registry (Miami-Dade), geocoded with the Census geocoder. Restaurants: Florida DBPR licences, 40+ seats.</li>
<li>Group meals per organization by type (e.g. social club 12/yr × 24 guests, service club 24/yr × 16). Capture share {A["capture_share"]}. Spare capacity = seats × {A["empty_seat_share"]} empty × {A["slow_services_per_month"]} slow services / month. Directable = min(demand, capacity).</li>
<li>Average check ${A["avg_check_usd"]}; fee ${A["success_fee_usd"]} per guest. Manual prospecting {A["manual_minutes_per_org"]} min per organization vs {A["assisted_minutes_per_org"]} min to review an engine lead; other manual step times are stated in the walkthrough script.</li>
<li>All coefficients are assumptions until the pilot. Companies and schools outside the IRS file aren't counted, so demand is conservative. Screens run in demo mode (local sign-in, in-memory data), not production.</li>
<li>Reproduce: <code>bunx vite --config vite.config.demo.ts --port 3000</code>, then <code>python3 demo/walkthrough/walkthrough.py</code> and <code>python3 demo/pitch/build_deck.py</code>.</li></ul>''', "Method & assumptions")

CSS = f"""@page{{size:1280px 720px;margin:0}}*{{box-sizing:border-box}}body{{margin:0;font-family:Inter,system-ui,sans-serif;color:{INK};background:#fbf5ee}}
.s{{width:1280px;height:720px;padding:56px 64px;page-break-after:always;overflow:hidden;position:relative}}
.k{{color:{ACC};font-weight:600;text-transform:uppercase;letter-spacing:.08em;font-size:14px}}h1{{font-size:50px;line-height:1.05;margin:12px 0 18px}}h2{{font-size:34px;margin:6px 0 24px;line-height:1.15}}
.title{{display:grid;grid-template-columns:1fr 1.15fr;gap:40px;align-items:center;background:{INK};color:#fbf5ee}}.title .kpis b{{color:#f3c9b3}}.title p{{font-size:19px;line-height:1.45;opacity:.9}}
.hero{{width:100%;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.35)}}
.two{{display:grid;grid-template-columns:1fr 1.25fr;gap:36px;align-items:start}}.two figure{{margin:0}}.two img{{width:100%;border-radius:10px;border:1px solid {SOFT};box-shadow:0 8px 24px rgba(47,29,51,.12)}}
figcaption{{color:{MUTED};font-size:13px;margin-top:6px}}ul{{padding-left:20px;margin:0}}li{{font-size:18px;line-height:1.45;margin-bottom:12px}}ul.big li{{font-size:22px}}ul.small li{{font-size:15px}}
.kpis{{display:flex;gap:28px;margin:18px 0}}.kpis div{{display:flex;flex-direction:column}}.kpis b{{font-size:38px;color:{ACC}}}.kpis span{{font-size:14px;color:inherit;opacity:.8;max-width:220px}}
.flow{{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}}.flow div{{display:flex;flex-direction:column;gap:6px}}.flow img{{width:100%;border-radius:8px;border:1px solid {SOFT}}}.flow b{{font-size:20px}}.flow span{{color:{MUTED};font-size:15px}}
table{{border-collapse:collapse;margin-top:18px;font-size:17px}}td,th{{padding:8px 22px;border-bottom:1px solid {SOFT};text-align:left}}.muted{{color:{MUTED}}}p{{font-size:18px;line-height:1.45}}code{{font-size:13px;background:{SOFT};padding:1px 4px;border-radius:4px}}"""
doc = f"<!doctype html><html><head><meta charset=utf-8><title>FullTable AI pitch</title><style>{CSS}</style></head><body>{''.join(slides)}</body></html>"
(OUT / "FullTable-AI_pitch.html").write_text(doc)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1280, "height": 720})
    pg.set_content(doc, wait_until="load")
    pg.pdf(path=str(OUT / "FullTable-AI_pitch.pdf"), width="1280px", height="720px", print_background=True)
    for i in range(len(slides)):
        pg.evaluate(f"window.scrollTo(0,{i*720})"); pg.screenshot(path=str(OUT / f"slide-{i+1:02d}.png"))
    b.close()
print(len(slides), "slides ->", OUT)
