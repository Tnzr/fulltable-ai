"""Reproducible FullTable AI demo walkthrough (demo mode, no Archie keys).

    bunx vite --config vite.config.demo.ts --port 3000 &      # from the repo root
    python3 demo/walkthrough/walkthrough.py [--base http://localhost:3000] [--headed]

Starts from a clean browser profile every run, so results are identical each time. Writes to
demo/walkthrough/out/: numbered screenshots, walkthrough.webm, timings.json and summary.md comparing
each step's automated time with the manual baseline in MANUAL_MINUTES.
"""
import argparse, json, pathlib, shutil, time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

OUT = pathlib.Path(__file__).resolve().parent / "out"
DEMAND = json.loads((pathlib.Path(__file__).resolve().parents[2] / "src/client/demo/data/demand.json").read_text())

# Manual baseline per step (minutes), how a coordinator does it today with Google, spreadsheets and email.
MANUAL_MINUTES = {
    "sign_in": 0.5,
    "source_events": 18 * 60,       # 18 min to find, research and log each of the 60 organizations a run adds
    "review_registry": 30,          # dedupe and sort a spreadsheet of leads
    "network_map": 45,              # plot leads vs. restaurant on a map by hand
    "demand_map": 8 * 60,           # pull Census/IRS/licence data and build a territory plan
    "pipeline": 20,                 # update deal tracker
    "approvals": 15,                # chase owner sign-off over email/text
    "sales_tasks": 10,              # build today's to-do list
}

# Human time to do the same step inside FullTable (minutes): the engine does the search, the person reviews.
ASSISTED_MINUTES = {
    "sign_in": 0.5, "source_events": 1, "review_registry": 60 * 2, "network_map": 2,
    "demand_map": 5, "pipeline": 5, "approvals": 2, "sales_tasks": 2,
}

class Run:
    def __init__(self, page):
        self.page, self.steps, self.n = page, [], 0
    def step(self, key, title, fn):
        t0 = time.perf_counter()
        note = fn() or ""
        secs = round(time.perf_counter() - t0, 1)
        self.n += 1
        shot = f"{self.n:02d}-{key}.png"
        self.page.wait_for_timeout(600)
        self.page.screenshot(path=str(OUT / shot))
        self.steps.append({"key": key, "title": title, "seconds": secs, "manualMinutes": MANUAL_MINUTES[key], "assistedMinutes": ASSISTED_MINUTES[key], "screenshot": shot, "note": note})
        print(f"[{self.n:02d}] {title}: {secs}s  {note}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3000")
    ap.add_argument("--headed", action="store_true")
    args = ap.parse_args()
    shutil.rmtree(OUT, ignore_errors=True); OUT.mkdir(parents=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not args.headed)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, record_video_dir=str(OUT / "video"),
                                  record_video_size={"width": 1440, "height": 900})
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        r = Run(page)
        go = lambda path: page.goto(args.base + path, wait_until="networkidle")

        def sign_in(role="Owner / General Manager"):
            go("/login")
            page.locator("#demo-role").select_option(label=role)
            page.get_by_role("button", name=f"Continue as {role}").click()
            page.wait_for_url(lambda u: urlparse(u).path not in ("/", "/login"))
            page.wait_for_load_state("networkidle")
            return "landed on " + page.url.replace(args.base, "")
        r.step("sign_in", "Owner signs in (demo access)", sign_in)

        def source():
            go("/event-sourcing")
            page.get_by_role("button", name="Run engine").wait_for()
            for name in ("IRS registry: associations & clubs", "IRS registry: teams, schools & community"):
                box = page.get_by_label(name)
                if not box.is_checked(): box.check()
            page.locator("input[type=number]").first.fill("60")
            page.get_by_role("button", name="Run engine").click()
            st = page.get_by_role("status").filter(has_text="Run finished")
            st.wait_for(timeout=20000)
            return st.inner_text()
        r.step("source_events", "Lead engine populates events from public registries", source)

        def registry():
            page.get_by_role("tab", name="Organizers").click() if page.get_by_role("tab", name="Organizers").count() else None
            page.mouse.wheel(0, 700)
            return f"{page.locator('table tbody tr').count()} rows visible"
        r.step("review_registry", "Registry: qualified, deduplicated organizers with match reasons", registry)

        def netmap():
            go("/network-map")
            page.wait_for_timeout(2500)
            return ""
        r.step("network_map", "Network Map shows acquired organizers around the restaurant", netmap)

        def dmap():
            go("/demand-map")
            page.get_by_test_id("demand-map").wait_for()
            page.wait_for_timeout(2000)
            s = page.get_by_test_id("coverage-slider")
            s.focus()
            for _ in range(5): page.keyboard.press("ArrowRight")
            return page.get_by_test_id("coverage-summary").inner_text()
        r.step("demand_map", "Demand map: where to cover and how many guests we can route", dmap)

        def pipeline():
            go("/deal-pipeline"); page.wait_for_timeout(1200); return ""
        r.step("pipeline", "Deal pipeline", pipeline)

        def approvals():
            go("/approvals"); page.wait_for_timeout(1200)
            btn = page.get_by_role("button", name="Approve").first
            if btn.count():
                btn.click(); page.wait_for_timeout(800); return "approved first item"
            return ""
        r.step("approvals", "Owner approves a drafted offer (human in the loop)", approvals)

        def sales():
            go("/sign-out"); page.wait_for_url("**/login")
            return sign_in("Internal Marketing / Sales")
        r.step("sales_tasks", "Sales user lands on My Tasks", sales)

        video = page.video.path() if page.video else None
        ctx.close(); browser.close()
        if video:
            shutil.move(video, OUT / "walkthrough.webm"); shutil.rmtree(OUT / "video", ignore_errors=True)

    auto = sum(s["seconds"] for s in r.steps) / 60
    manual = sum(s["manualMinutes"] for s in r.steps)
    assisted = sum(s["assistedMinutes"] for s in r.steps)
    result = {"steps": r.steps, "automatedMinutes": round(auto, 2), "manualMinutes": manual, "assistedMinutes": assisted,
              "assistedHours": round(assisted / 60, 1), "timeSaved": round(1 - assisted / manual, 3),
              "manualHours": round(manual / 60, 1), "pageErrors": errors, "citywide": DEMAND["citywide"]}
    (OUT / "timings.json").write_text(json.dumps(result, indent=1))
    lines = ["# FullTable AI walkthrough", "", "| # | Step | Script run (s) | Person with FullTable (min) | Manual baseline (min) |", "|---|---|---|---|---|"]
    lines += [f"| {i+1} | {s['title']} | {s['seconds']} | {s['assistedMinutes']:g} | {s['manualMinutes']:g} |" for i, s in enumerate(r.steps)]
    lines += ["", f"Person time: {assisted/60:.1f} h with FullTable vs {manual/60:.1f} h by hand ({(1-assisted/manual)*100:.0f}% less). Script replay: {auto:.1f} min.", f"Page errors: {len(errors)}"]
    (OUT / "summary.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))

if __name__ == "__main__":
    main()
