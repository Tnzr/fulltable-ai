"""Builds the demo seed (organizers, event-generation pool, restaurants) and the directable-demand
model from the public Miami-Dade datasets in ./data (produced by analyze.py).

    python3 demo/geo/build_seed.py

Writes src/client/demo/data/miami-seed.json and src/client/demo/data/demand.json.
Every coefficient below is an assumption, stated in ASSUMPTIONS and in the output, to be re-fit on pilot data.
"""
import datetime as dt, json, math, pathlib
import pandas as pd

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent.parent / "src/client/demo/data"

NB = [("Brickell",25.760,-80.193),("Downtown",25.775,-80.193),("Wynwood",25.801,-80.199),("Edgewater",25.795,-80.188),
      ("Design District",25.813,-80.193),("Little Havana",25.766,-80.219),("Coconut Grove",25.728,-80.241),("Coral Gables",25.721,-80.268),
      ("South Beach",25.782,-80.134),("Mid-Beach",25.817,-80.124),("North Beach",25.860,-80.121),("Sunny Isles",25.950,-80.123),
      ("Aventura",25.957,-80.139),("North Miami",25.890,-80.186),("North Miami Beach",25.933,-80.162),("Little Haiti",25.830,-80.195),
      ("Allapattah",25.810,-80.223),("Overtown",25.787,-80.202),("Health District",25.790,-80.212),("Doral",25.819,-80.355),
      ("Kendall",25.687,-80.317),("South Miami",25.707,-80.293),("Pinecrest",25.667,-80.308),("Westchester",25.749,-80.327),
      ("Sweetwater",25.763,-80.373),("Hialeah",25.857,-80.278),("Miami Lakes",25.909,-80.309),("Miami Gardens",25.942,-80.245),
      ("Key Biscayne",25.693,-80.162),("Cutler Bay",25.578,-80.346),("Homestead",25.468,-80.477),("Palmetto Bay",25.622,-80.325),
      ("Miami Springs",25.822,-80.290),("Flagami",25.762,-80.300),("Kendall West",25.665,-80.420)]

def area(la, lo):
    return min(NB, key=lambda n: (n[1]-la)**2 + ((n[2]-lo)*.9)**2)[0]

# otype -> (group meals per org per year, average party size, event category, event label)
TYPE = {
    "Social club": (12, 24, "Club dinner", "monthly members' dinner"),
    "Fraternal society": (12, 20, "Club dinner", "monthly chapter dinner"),
    "Fraternal lodge": (12, 18, "Club dinner", "monthly lodge supper"),
    "Veterans org": (12, 16, "Club dinner", "monthly post supper"),
    "Civic / service league": (24, 16, "Meeting meal", "twice-monthly meeting lunch"),
    "Business / professional league": (10, 18, "Networking", "networking dinner"),
    "Community / business improvement": (6, 16, "Networking", "merchant mixer"),
    "Labor / trade org": (4, 20, "Meeting meal", "members' meeting dinner"),
    "Sports / recreation": (20, 14, "Team meal", "post-game team meal"),
    "Youth development": (6, 20, "Team meal", "youth group celebration"),
    "Education / alumni / PTA": (4, 22, "School / alumni", "alumni or PTA dinner"),
    "Arts & culture": (4, 16, "Arts & culture", "post-show patron dinner"),
    "Faith community": (6, 20, "Community", "fellowship lunch"),
    "Public affairs": (4, 12, "Meeting meal", "board dinner"),
    "Mutual benefit / member org": (4, 12, "Meeting meal", "members' lunch"),
}
ASSUMPTIONS = {
    "capture_share": 0.25,         # share of an org's group meals FullTable outreach can route to a partner restaurant
    "slow_services_per_month": 8,  # e.g. Mon-Wed lunch + early dinner the restaurant wants filled
    "empty_seat_share": 0.35,      # share of seats empty in those services
    "avg_check_usd": 42,           # per guest, Miami casual/upscale-casual
    "success_fee_usd": 2,          # FullTable fee per booked guest (business plan)
    "manual_minutes_per_org": 18,  # find + research + qualify + draft first message, by hand
    "assisted_minutes_per_org": 2, # review + approve an AI-drafted, pre-qualified lead
}

orgs = pd.read_csv(HERE/"data/outreach_orgs_ranked.csv", dtype={"tract": str})
orgs = orgs[orgs.otype.isin(TYPE)].copy()
rest = pd.read_csv(HERE/"data/restaurant_targets_ranked.csv", dtype={"tract": str})
orgs["area"] = [area(a, b) for a, b in zip(orgs.lat, orgs.lon)]
rest["area"] = [area(a, b) for a, b in zip(rest.lat, rest.lon)]

a = ASSUMPTIONS
orgs["covers_month"] = [TYPE[t][0] / 12 * TYPE[t][1] * a["capture_share"] for t in orgs.otype]
rest["spare_month"] = rest.seats.clip(upper=250) * a["empty_seat_share"] * a["slow_services_per_month"]

g = (orgs.groupby("area").agg(orgs=("NAME", "size"), demand=("covers_month", "sum"), lat=("lat", "mean"), lon=("lon", "mean"))
     .join(rest.groupby("area").agg(restaurants=("Business Name", "size"), seats=("seats", "sum"), capacity=("spare_month", "sum")), how="outer")
     .fillna(0))
g["directable"] = g[["demand", "capacity"]].min(axis=1)
g["unmet"] = (g.demand - g.capacity).clip(lower=0)
g = g.sort_values("directable", ascending=False)
total_dir = g.directable.sum()
g["cum_share"] = g.directable.cumsum() / total_dir
areas = [{"area": k, "orgs": int(r.orgs), "restaurants": int(r.restaurants), "demandCoversMonth": round(r.demand),
          "spareCoversMonth": round(r.capacity), "directableCoversMonth": round(r.directable), "unmetCoversMonth": round(r.unmet),
          "cumulativeShare": round(r.cum_share, 3), "lat": round(r.lat, 4) if r.lat else None, "lng": round(r.lon, 4) if r.lon else None}
         for k, r in g.iterrows()]
top5 = g.head(5)
demand = {
    "generated": dt.date.today().isoformat(),
    "assumptions": ASSUMPTIONS,
    "citywide": {
        "orgs": int(len(orgs)), "restaurants": int(len(rest)),
        "demandCoversMonth": round(g.demand.sum()), "spareCoversMonth": round(g.capacity.sum()),
        "directableCoversMonth": round(total_dir),
        "restaurantRevenueMonthUsd": round(total_dir * a["avg_check_usd"]),
        "fullTableFeesMonthUsd": round(total_dir * a["success_fee_usd"]),
        "top5Areas": list(top5.index), "top5Share": round(top5.directable.sum() / total_dir, 3),
        "areasFor80pct": int((g.cum_share < 0.8).sum() + 1),
        "researchHoursManual": round(len(orgs) * a["manual_minutes_per_org"] / 60),
        "researchHoursAssisted": round(len(orgs) * a["assisted_minutes_per_org"] / 60),
    },
    "areas": areas,
}

# event-generation pool: the best-ranked orgs, split into the two committed sources
def pool(df):
    out = []
    for r in df.itertuples():
        meals, party, cat, label = TYPE[r.otype]
        out.append({"name": r.NAME.title(), "type": r.otype, "address": f"{str(r.STREET).title()}, {str(r.CITY).title()} FL",
                    "lat": round(r.lat, 5), "lng": round(r.lon, 5), "area": r.area, "score": round(r.score, 1),
                    "category": cat, "eventLabel": label, "partySize": party, "perYear": meals,
                    "hasContact": bool(r.INCOME_AMT and r.INCOME_AMT > 250000)})
    return out
clubs_mask = orgs.otype.isin(["Social club", "Fraternal society", "Fraternal lodge", "Veterans org", "Civic / service league",
                              "Business / professional league", "Community / business improvement", "Labor / trade org"])
seed = {
    "sources": [
        {"id": "src-irs-assoc", "name": "IRS registry: associations & clubs", "committed": True},
        {"id": "src-irs-teams", "name": "IRS registry: teams, schools & community", "committed": True},
        {"id": "src-ticketmaster", "name": "Ticketmaster Discovery (needs API key)", "committed": False},
    ],
    "pools": {
        "src-irs-assoc": pool(orgs[clubs_mask].sort_values("score", ascending=False).head(220)),
        "src-irs-teams": pool(orgs[~clubs_mask].sort_values("score", ascending=False).head(220)),
    },
    "restaurants": [{"name": r._1.title(), "address": f"{str(r._2).title()}, {str(r._3).title()} FL", "lat": round(r.lat, 5),
                     "lng": round(r.lon, 5), "seats": int(r.seats), "area": r.area}
                    for r in rest.sort_values("score", ascending=False).head(150).itertuples()],
}
OUT.mkdir(parents=True, exist_ok=True)
(OUT/"miami-seed.json").write_text(json.dumps(seed, separators=(",", ":")))
(OUT/"demand.json").write_text(json.dumps(demand, indent=1))
print(json.dumps(demand["citywide"], indent=1)); print(pd.DataFrame(areas).head(10).to_string())
