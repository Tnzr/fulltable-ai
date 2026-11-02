import json,math,html,re,numpy as np,pandas as pd
from shapely.geometry import shape
D='/home/ubuntu/ft-geo/'
T=json.load(open(D+'raw/tracts.geojson'))['features']
tr=pd.read_csv(D+'tract_scores.csv',dtype={'GEOID':str}).set_index('GEOID')
eo=pd.read_csv(D+'outreach_ranked.csv',dtype=str);eo['score']=eo.score.astype(float);eo['inc']=eo.inc.astype(float)
rs=pd.read_csv(D+'restaurants_ranked.csv',dtype=str);rs['score']=rs.score.astype(float);rs['seats']=rs.seats.astype(float)
rs=rs[~rs['Business Name'].str.contains(r'HOTEL|SUITES|SHERATON|MARRIOTT|HILTON|INN\b|COUNTRY CLUB|YACHT|BANQUET|CATER|SCHOOL|HOSPITAL|CAFETERIA|UNIVERSITY|COLLEGE|AIRPORT|STADIUM|ARENA|CLUB\b',regex=True,na=False)]
P=json.load(open(D+'points.json'))
NB=[('Brickell',25.760,-80.193),('Downtown',25.775,-80.193),('Wynwood',25.801,-80.199),('Edgewater',25.795,-80.188),('Design District',25.813,-80.193),('Little Havana',25.766,-80.219),('Coconut Grove',25.728,-80.241),('Coral Gables',25.721,-80.268),('South Beach',25.782,-80.134),('Mid-Beach',25.817,-80.124),('North Beach',25.860,-80.121),('Sunny Isles',25.950,-80.123),('Aventura',25.957,-80.139),('North Miami',25.890,-80.186),('Miami Gardens',25.942,-80.245),('Hialeah',25.858,-80.278),('Miami Lakes',25.909,-80.309),('Doral',25.819,-80.355),('Westchester',25.748,-80.327),('Sweetwater / FIU',25.757,-80.375),('Kendall',25.679,-80.317),('Dadeland',25.690,-80.312),('South Miami',25.707,-80.293),('Pinecrest',25.665,-80.308),('Palmetto Bay',25.621,-80.324),('Cutler Bay',25.580,-80.347),('Homestead',25.468,-80.477),('Key Biscayne',25.693,-80.163),('Allapattah',25.815,-80.224),('Little Haiti',25.832,-80.195),('Overtown',25.787,-80.201),('Health District',25.790,-80.212),('Miami Springs',25.822,-80.289),('Kendale Lakes',25.708,-80.407),('The Hammocks',25.671,-80.444),('West Kendall',25.640,-80.420),('Florida City',25.448,-80.479),('Opa-locka',25.902,-80.250),('North Miami Beach',25.933,-80.162),('Bay Harbor / Surfside',25.880,-80.124),('Flagami',25.762,-80.316),('West Miami',25.758,-80.296),('Fontainebleau',25.773,-80.348),('Tamiami',25.735,-80.400),('Richmond West',25.610,-80.430),('Princeton',25.538,-80.409),('Naranja / Leisure City',25.505,-80.430),('Golden Glades',25.912,-80.200),('Medley',25.840,-80.326),('Hialeah Gardens',25.865,-80.324)]
def nb(la,lo): return min(NB,key=lambda n:(n[1]-la)**2+((n[2]-lo)*.9)**2)[0]
tr['area']=[nb(a,b) for a,b in zip(tr.lat,tr.lon)]
# projection; crop to urban east (exclude Everglades)
X0,X1,Y0,Y1=-80.56,-80.11,25.43,25.98;W=760;k=W/((X1-X0)*math.cos(math.radians(25.7)));H=round((Y1-Y0)*k)
px=lambda lo:(lo-X0)*math.cos(math.radians(25.7))*k; py=lambda la:(Y1-la)*k
def path(g):
    polys=[g] if g.geom_type=='Polygon' else list(g.geoms);out=''
    for p in polys:
        for ring in [p.exterior]+list(p.interiors):
            c=list(ring.coords);out+='M'+'L'.join(f'{px(x):.1f},{py(y):.1f}' for x,y in c)+'Z'
    return out
LAY=[('opp','FullTable opportunity'),('demand_p','Group-dining demand'),('supply_p','Restaurant seat supply'),('gap','Demand minus supply'),('jobs_p','Daytime workers'),('org_p','Organization density'),('hot_p','Hotels nearby'),('inc_p','Median household income'),('ev_p','Upcoming events (sample)')]
pr=lambda s:s.rank(pct=True)*100
tr['jobs_p']=pr(tr.jobs_r);tr['org_p']=pr(tr.org_n);tr['hot_p']=pr(tr.hotels);tr['ev_p']=pr(tr.events_w);tr['gap_p']=pr(tr.gap)
paths=[]
for f in T:
    gid=f['properties']['GEOID']
    if gid not in tr.index: continue
    g=shape(f['geometry']);b=g.bounds
    if b[2]<X0 or b[0]>X1 or b[0]<-80.62: continue
    r=tr.loc[gid]
    vals={k:(r.gap_p if k=='gap' else r[k]) for k,_ in LAY}
    q=' '.join(f'data-{k.replace("_","")}="{min(4,int(v//20))}"' for k,v in vals.items())
    tip=f"Demand {r.demand_p:.0f} · Seat supply {r.supply_p:.0f} · Opportunity {r.opp:.0f}; {int(r.jobs):,} jobs, {int(r['pop']):,} residents, {int(r.org_n)} orgs within 1.5 km, {int(r.big_rest)} restaurants with 40+ seats"
    paths.append(f'<path d="{path(g.simplify(0.0004))}" class="ft-t" {q} data-a-tip="{html.escape(tip)}" data-a-tip-title="{html.escape(r.area)} · tract {gid[5:]}"/>')
top=eo.head(100)
dots=''.join(f'<circle class="ft-org" cx="{px(float(r.lon)):.1f}" cy="{py(float(r.lat)):.1f}" r="3.2" tabindex="0" data-a-tip-title="#{i+1} {html.escape(r.NAME.title())}" data-a-tip="{html.escape(r.otype)} · score {r.score:.0f} · {html.escape(r.CITY.title())}"/>' for i,r in enumerate(top.itertuples()))
evd=''.join(f'<circle class="ft-ev" cx="{px(e[1]):.1f}" cy="{py(e[0]):.1f}" r="{2+math.sqrt(e[3])/3:.1f}" data-a-tip-title="{html.escape(e[2])}" data-a-tip="Sample event · {e[3]} guests · {e[5]}{" · recurring" if e[4] else ""}"/>' for e in P['ev'])
hot=''.join(f'<rect class="ft-hot" x="{px(h[1])-1.5:.1f}" y="{py(h[0])-1.5:.1f}" width="3" height="3"/>' for h in P['hot'] if X0<h[1]<X1)
rtop=rs.head(60)
rd=''.join(f'<path class="ft-rest" transform="translate({px(float(r.lon)):.1f},{py(float(r.lat)):.1f})" d="M0,-4L4,0L0,4L-4,0Z" tabindex="0" data-a-tip-title="{html.escape(r._2.title())}" data-a-tip="Restaurant target #{i+1} · {int(r.seats)} seats · score {r.score:.0f}"/>' for i,r in enumerate(rtop.rename(columns={'Business Name':'_2'}).itertuples()))
opts=''.join(f'<button type="button" class="ft-chip" data-layer="{k.replace("_","")}" aria-pressed="{"true" if i==0 else "false"}">{n}</button>' for i,(k,n) in enumerate(LAY))
def table(cap,cols,rows,num=(),attrs=None):
    h='<div class="a-table-scroll"><table class="a-table" data-a-sticky-columns="2"><caption class="a-visually-hidden">'+cap+'</caption><thead><tr>'+''.join(f'<th scope="col"{" data-numeric" if i in num else ""}>{c}</th>' for i,c in enumerate(cols))+'</tr></thead><tbody>'
    for j,r in enumerate(rows):
        a=attrs[j] if attrs else ''
        h+=f'<tr {a}>'+''.join(f'<td{" data-numeric" if i in num else ""}>{c}</td>' for i,c in enumerate(r))+'</tr>'
    return h+'</tbody></table></div>'
# zone ranking: aggregate by area
ar=tr.groupby('area').agg(opp=('opp','mean'),demand=('demand_p','mean'),supply=('supply_p','mean'),jobs=('jobs','sum'),pop=('pop','sum'),rest=('big_rest','max'),n=('opp','size')).sort_values('opp',ascending=False)
ar=ar[ar.n>=2]
zrows=[(i+1,a,f'{r.opp:.0f}',f'{r.demand:.0f}',f'{r.supply:.0f}',f'{int(r.jobs):,}',f'{int(r["pop"]):,}') for i,(a,r) in enumerate(ar.head(15).iterrows())]
ztab=table('Top 15 neighborhoods by mean FullTable opportunity',['#','Neighborhood','Opportunity','Demand','Seat supply','Jobs','Residents'],zrows,num=(0,2,3,4,5,6))
zchart='<figure class="a-panel" data-a-chart="bar" data-a-chart-max="100"><figcaption class="a-panel__title">Top 10 neighborhoods: demand vs. seat supply (percentile, 0–100)</figcaption><div class="a-table-scroll"><table class="a-table"><caption class="a-visually-hidden">Demand and supply percentile by neighborhood</caption><thead><tr><th scope="col">Neighborhood</th><th scope="col" data-numeric>Group-dining demand</th><th scope="col" data-numeric>Seat supply</th></tr></thead><tbody>'+''.join(f'<tr><th scope="row">{a}</th><td data-numeric>{r.demand:.0f}</td><td data-numeric>{r.supply:.0f}</td></tr>' for a,r in ar.head(10).iterrows())+'</tbody></table></div></figure>'
ws=tr[(tr.demand_p>=70)].sort_values('gap',ascending=False).groupby('area').first().sort_values('gap',ascending=False).head(6)
types=sorted(top.otype.unique())
orows=[(i+1,html.escape(r.NAME.title()),r.otype,html.escape(r.CITY.title()),tr.area.get(r.tract,'') if isinstance(r.tract,str) else '',f'${r.inc/1e6:.1f}M' if r.inc>=1e6 else f'${r.inc/1e3:.0f}k',f'{r.score:.0f}') for i,r in enumerate(top.itertuples())]
oattr=[f'data-type="{html.escape(r.otype)}"' for r in top.itertuples()]
ofilter='<label class="ft-filter">Organization type <select data-a-filter="#orgtab" data-a-filter-key="type"><option value="">All types</option>'+''.join(f'<option value="{html.escape(t)}">{html.escape(t)}</option>' for t in types)+'</select></label>'
otab=table('Top 100 organizations to contact, ranked',['#','Organization','Type','City','Nearest area','Reported income','Score'],orows,num=(0,5,6),attrs=oattr).replace('<table ','<table id="orgtab" ',1)
rrows=[(i+1,html.escape(r['Business Name'].title()),html.escape(str(r['Location City']).title()),tr.area.get(r.tract,''),int(r.seats),int(float(r.orgs_near)),f'{r.score:.0f}') for i,(_,r) in enumerate(rs.head(25).iterrows())]
rtab=table('Top 25 restaurants to sell FullTable to',['#','Restaurant','City','Area','Seats','Orgs within 1.5 km','Score'],rrows,num=(0,4,5,6))
mix=top.otype.value_counts()
mixbars=''.join(f'<span>{t}</span><span class="t"><i style="width:{v/mix.max()*100:.0f}%"></i></span><span>{v}</span>' for t,v in mix.items())
S=dict(irs=len(eo),rest=len(pd.read_csv(D+'restaurants_ranked.csv')),tr=len(tr),jobs=int(tr.jobs.sum()),seats=int(pd.read_csv(D+'raw/dbpr_md.csv').seats.sum()))
body=open(D+'body.tpl.html').read()
for k,v in dict(PATHS=''.join(paths),DOTS=dots,EV=evd,HOT=hot,REST=rd,OPTS=opts,W=W,H=H,ZTAB=ztab,ZCHART=zchart,OTAB=otab,OFILTER=ofilter,RTAB=rtab,MIX=mixbars,
  WS=', '.join(ws.index[:5]),TOPZ=', '.join(ar.index[:5]),N_IRS=f"{S['irs']:,}",N_REST=f"{S['rest']:,}",N_TR=S['tr'],N_JOBS=f"{S['jobs']:,}",N_SEATS=f"{S['seats']:,}").items():
    body=body.replace('{{'+k+'}}',str(v))
open(D+'body.html','w').write(body);print(len(body)//1024,'KB',W,H,ar.index[:8].tolist(),ws.index[:6].tolist())
