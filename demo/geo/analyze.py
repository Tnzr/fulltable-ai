import json,glob,csv,math,numpy as np,pandas as pd,sys,re
sys.path.insert(0,'/home/ubuntu/repos')
from shapely.geometry import shape,Point
from shapely.strtree import STRtree
R='/home/ubuntu/ft-geo/raw/'
T=json.load(open(R+'tracts.geojson'))['features']
geoms=[shape(f['geometry']) for f in T]; ids=[f['properties']['GEOID'] for f in T]
tr=pd.DataFrame({'GEOID':ids,'lat':[float(f['properties']['CENTLAT']) for f in T],'lon':[float(f['properties']['CENTLON']) for f in T],'aland':[f['properties']['AREALAND'] for f in T]}).set_index('GEOID')
a=json.load(open(R+'acs_all.json'))
pop=pd.DataFrame(a['pop']).set_index('GEOID');inc=pd.DataFrame(a['inc']).set_index('GEOID')
tr['pop']=pop.B01001_001E;tr['income']=inc.B19049_001E;tr['hh']=inc.B19053_001E
lo=pd.read_csv(R+'lodes_tract.csv',dtype={'tract':str}).set_index('tract')
tr['jobs']=lo.C000;tr['food_jobs']=lo.CNS18;tr=tr.fillna({'pop':0,'jobs':0,'food_jobs':0,'hh':0})
# OSM points
def osm(i):
    out=[]
    for e in json.load(open(R+f'osm_{i}.json'))['elements']:
        la=e.get('lat') or e.get('center',{}).get('lat');ln=e.get('lon') or e.get('center',{}).get('lon')
        if la: out.append((la,ln,e.get('tags',{})))
    return out
rest=osm(1);hot=osm(2);inst=osm(3);club=osm(4);sport=osm(5);off=osm(6)
# IRS
eo=pd.read_csv(R+'eo_md.csv',dtype=str).set_index('EIN')
g=[]
for f in glob.glob(R+'out_g_*.csv'):
    for r in csv.reader(open(f)):
        if len(r)>5 and r[2]=='Match':
            x,y=r[5].split(',');g.append((r[0],float(y),float(x)))
gd=pd.DataFrame(g,columns=['EIN','lat','lon']).drop_duplicates('EIN').set_index('EIN')
eo=eo.join(gd,how='inner');print('irs geocoded',len(eo),'of',6585)
TYPE={'07':('Social club',1.0),'06':('Business / professional league',.9),'08':('Fraternal society',.9),'10':('Fraternal lodge',.9),'19':('Veterans org',.85),'04':('Civic / service league',.8),'05':('Labor / trade org',.7)}
NT={'N':('Sports / recreation',.9),'A':('Arts & culture',.75),'S':('Community / business improvement',.75),'X':('Faith community',.6),'B':('Education / alumni / PTA',.6),'Y':('Mutual benefit / member org',.65),'W':('Public affairs',.5),'O':('Youth development',.35)}
def cls(r):
    if r.SUBSECTION in TYPE: return TYPE[r.SUBSECTION]
    return NT.get(str(r.NTEE_CD)[:1],('Other nonprofit',.3))
eo[['otype','fit']]=eo.apply(lambda r:pd.Series(cls(r)),axis=1)
eo['inc']=pd.to_numeric(eo.INCOME_AMT,errors='coerce').fillna(0)
# kernel counts within radius km
lat0=math.radians(25.75)
def xy(la,ln): return np.c_[np.radians(np.asarray(ln))*math.cos(lat0)*6371,np.radians(np.asarray(la))*6371]
C=xy(tr.lat,tr.lon)
def within(pts,rad=1.5,w=None):
    if len(pts)==0: return np.zeros(len(C))
    P=xy([p[0] for p in pts],[p[1] for p in pts]);w=np.ones(len(P)) if w is None else np.asarray(w)
    d=np.sqrt(((C[:,None,:]-P[None,:,:])**2).sum(-1));return ((d<rad)*w).sum(1)
orgpts=[(r.lat,r.lon) for r in eo.itertuples()]+[(p[0],p[1]) for p in inst+club+sport]
tr['org_n']=within(orgpts);tr['irs_n']=within([(r.lat,r.lon) for r in eo.itertuples()])
tr['osm_inst']=within([(p[0],p[1]) for p in inst+club+sport])
tr['hotels']=within([(p[0],p[1]) for p in hot]);db=pd.read_csv(R+'dbpr_md.csv',dtype=str).set_index('rid');db['seats']=db.seats.astype(float)
gg=[]
for f in glob.glob(R+'out_r_*.csv'):
    for r in csv.reader(open(f)):
        if len(r)>5 and r[2]=='Match':
            x,y=r[5].split(',');gg.append((r[0],float(y),float(x)))
db=db.join(pd.DataFrame(gg,columns=['rid','lat','lon']).drop_duplicates('rid').set_index('rid'),how='inner');print('dbpr geocoded',len(db))
tr['rest_n']=within(list(zip(db.lat,db.lon)));tr['seats_r']=within(list(zip(db.lat,db.lon)),w=db.seats);tr['big_rest']=within(list(zip(db[db.seats>=40].lat,db[db.seats>=40].lon)));tr['offices']=within([(p[0],p[1]) for p in off])
Tc=xy(tr.lat,tr.lon)
tr['jobs_r']=within(list(zip(tr.lat,tr.lon)),w=tr.jobs);tr['pop_r']=within(list(zip(tr.lat,tr.lon)),w=tr['pop']);tr['food_r']=within(list(zip(tr.lat,tr.lon)),w=tr.food_jobs)
import importlib.util
ev=[]
src=open('/home/ubuntu/repos/fulltable-ai/src/lib/network-data.ts').read()
orgs=re.findall(r"\['([^']+)', '([^']+)', '([^']+)', ([\d.]+), (-[\d.]+), (true|false), (true|false)\]",src)
evs=re.findall(r"\['([^']+)', (\d+), '([^']+)', '([^']+)', (\d+), (true|false),",src)
for t,oi,dt,cat,sz,rec in evs:
    o=orgs[int(oi)];ev.append((float(o[3]),float(o[4]),t,int(sz),rec=='true',dt))
tr['events_w']=within([(e[0],e[1]) for e in ev],rad=2,w=[e[3]*(2 if e[4] else 1) for e in ev])
pct=lambda s: s.rank(pct=True)*100
tr=tr[(tr['pop']>0)|(tr.jobs>0)]
tr['inc_p']=pct(tr.income.fillna(tr.income.median()))
tr['demand']=(.25*pct(tr.jobs_r)+.30*pct(tr.org_n)+.10*pct(tr.hotels)+.15*pct(tr.pop_r)+.10*tr.inc_p+.10*pct(tr.events_w))
tr['demand_p']=pct(tr.demand)
tr['supply_p']=pct(.6*pct(tr.seats_r)+.4*pct(tr.food_r))
tr['opp']=pct(tr.demand_p*np.sqrt(tr.supply_p/100))
tr['gap']=tr.demand_p-tr.supply_p
# org outreach score
tree=STRtree(geoms); 
def tract_of(la,ln):
    for i in tree.query(Point(ln,la)):
        if geoms[i].contains(Point(ln,la)): return ids[i]
eo['tract']=[tract_of(r.lat,r.lon) for r in eo.itertuples()]
eo=eo[eo.tract.isin(tr.index)]
eo['opp']=eo.tract.map(tr.opp);eo['rest_near']=eo.tract.map(tr.big_rest)
eo['size_p']=pct(np.log1p(eo.inc))
eo['score']=(100*eo.fit*.40+eo.opp*.35+eo.size_p*.25).round(1)
eo=eo.sort_values('score',ascending=False)
eo.to_csv('/home/ubuntu/ft-geo/outreach_ranked.csv')
tr.to_csv('/home/ubuntu/ft-geo/tract_scores.csv')
json.dump({'ev':ev,'rest':[(p[0],p[1]) for p in rest],'hot':[(p[0],p[1],p[2].get('name','')) for p in hot]},open('/home/ubuntu/ft-geo/points.json','w'))
print(tr[['demand_p','supply_p','opp','gap']].describe().round(1));print(eo.otype.value_counts());print(eo[['NAME','CITY','otype','inc','score']].head(15).to_string())
print('osm',len(rest),len(hot),len(inst),len(club),len(sport),len(off))

db['tract']=[tract_of(r.lat,r.lon) for r in db.itertuples()]
db=db[db.tract.isin(tr.index)&(db.seats>=40)].copy()
db['demand_p']=db.tract.map(tr.demand_p);db['orgs_near']=db.tract.map(tr.org_n);db['comp']=db.tract.map(tr.big_rest)
db['fit']=np.where(db.seats.between(40,250),100,60)
db['groups_per_rest']=pct(db.orgs_near/(db.comp+1))
db['score']=(.45*db.demand_p+.35*db.groups_per_rest+.20*db.fit).round(1)
db=db.sort_values('score',ascending=False);db.to_csv('/home/ubuntu/ft-geo/restaurants_ranked.csv');print(len(db));print(db[['Business Name','Location City','seats','score']].head(10).to_string())
