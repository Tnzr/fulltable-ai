// FullTable AI public landing (/home). Hand-placed file (not in .archie/conversion.gen.json), so platform
// regeneration does not overwrite it. Ported 1:1 from "FullTable AI Landing 1.html" (Claude Design export):
// markup and inline styles unchanged; style-hover rules -> CSS classes (fth-N); x-dc logic class -> React.Component.
// Deviations from the HTML: the three "Sign in" links go to the app login route (loginHref) instead of "#signin";
// the assistant calls Archie AI (aiChat, project default model) through src/client/landing-assistant.js, falling back to
// window.claude.complete when present, otherwise the design's own FALLBACK reply. "Powered by" subtitle removed.
import * as React from "react";
import { HERO_SRC } from "./landing-assets";
import { useLandingAssistant } from "@/client/landing-assistant";

const LANDING_CSS = `@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap');
html{scroll-behavior:smooth}
body{margin:0;background:#FFF7EB;color:#492C48;font-family:'Figtree',system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
*{box-sizing:border-box}
a{color:#492C48;text-decoration:none}
a:hover{color:#2E1A2E}
h1,h2,h3,h4,p{margin:0}
@keyframes ftPulse{0%,100%{opacity:1}50%{opacity:.35}}
[data-ft-landing] :is(h1,h2,h3,h4,p){color:inherit;line-height:inherit;letter-spacing:inherit;font-family:inherit;font-weight:inherit;font-size:inherit;margin:0}
.fth-0:hover{background:#2E1A2E !important;color:#FFF7EB !important}
.fth-1:hover{background:#4A6345 !important;color:#FFF7EB !important}
.fth-2:hover{border-color:#492C48 !important}
.fth-3:hover{background:#2E1A2E !important;color:#FFF7EB !important}
.fth-4:hover{background:#F3B58C !important;color:#492C48 !important}
.fth-5:hover{border-color:#FFF7EB !important;color:#FFF7EB !important}
.fth-6:hover{background:#F6EBDD !important}`;

class FullTableLandingInner extends React.Component {
  state = { sel: 0, chatOpen: false, input: '', busy: false, msgs: [{ who: 'ai', text: 'Hi, I’m the FullTable assistant. Ask how group bookings, event sourcing or approvals work for Lumen Table.' }] };
  CAP = 96; GROUP = 18;
  DATES = [
    { d: 'Nov 3', long: 'Tuesday, November 3', base: 38, staff: 'Current rota covers it', kitchen: 'Prep 18 family-style mains', note: 'Quiet night — strong fit.' },
    { d: 'Nov 10', long: 'Tuesday, November 10', base: 44, staff: 'Current rota covers it', kitchen: 'Prep 18 mains · hold bread par at 85%', note: 'Quiet night — strong fit.' },
    { d: 'Nov 17', long: 'Tuesday, November 17', base: 52, staff: '+1 server, 6:30–9:30 PM', kitchen: 'Prep 18 mains · add one braise batch', note: 'Fits with one extra server.' },
    { d: 'Nov 24', long: 'Tuesday, November 24', base: 71, staff: '+1 server, +1 line cook', kitchen: 'Order produce by Mon — supplier closed Thu', note: 'Thanksgiving week. Fits, but tight.' },
    { d: 'Dec 1', long: 'Tuesday, December 1', base: 40, staff: 'Current rota covers it', kitchen: 'Prep 18 family-style mains', note: 'Quiet night — strong fit.' },
    { d: 'Dec 8', long: 'Tuesday, December 8', base: 58, staff: '+1 server, 6:30–9:30 PM', kitchen: 'Prep 18 mains · par down dessert 15%', note: 'Fits with one extra server.' },
    { d: 'Dec 15', long: 'Tuesday, December 15', base: 86, staff: 'No change — move the group', kitchen: 'No group prep this week', note: 'Holiday parties fill the room. Suggest Wed, Dec 16 (34 forecast).' },
    { d: 'Dec 22', long: 'Tuesday, December 22', base: 63, staff: '+1 server, +1 host', kitchen: 'Prep 18 mains · confirm wine order', note: 'Fits, but tight.' }
  ];
  SYS = 'You are the FullTable AI assistant on the landing page of an internal prototype for Lumen Table, a fictional restaurant. FullTable AI helps restaurant owners and GMs turn predictable slow periods into recurring group bookings. The Owner/GM or Partnership Coordinator submits a goal; AI researches and matches nearby partner groups, drafts offers within approved terms, and prepares recurring booking schedules; people approve offers, outbound messages and booking commitments. An Event Sourcing registry collects, standardizes, deduplicates and qualifies upcoming events and organizers about 12 months ahead and routes demand to calendar gaps. Staff Scheduling and Inventory & Waste turn expected demand into staffing and kitchen recommendations for manager approval. Insights cover recurring booking value, slow-period effects, partner reach and conversion, staffing and kitchen capacity, serving cost per group, and nearby groups dining patterns. Marketing/Sales monitor social KPI insights. A System Administrator runs an Admin CRM for vetting restaurants, manual B2B billing and moderation, and selects the AI model. Outreach is simulated and figures are illustrative. Answer warmly in 2-4 short sentences, plain text, no markdown.';
  FALLBACK = 'I can’t reach the model right now. In short: you set a goal, FullTable AI finds and matches nearby groups, drafts offers inside your terms, and you approve every offer, message and booking before anything goes out.';
  chatRef = (el) => { this.chatEl = el; };
  componentDidUpdate() { if (this.chatEl) this.chatEl.scrollTop = this.chatEl.scrollHeight; }
  send = async (q) => {
    const text = String(q ?? this.state.input).trim();
    if (!text || this.state.busy) return;
    const msgs = [...this.state.msgs, { who: 'me', text }];
    this.setState({ msgs, input: '', busy: true, chatOpen: true });
    let reply;
    const history = msgs.slice(1).map(m => ({ role: m.who === 'me' ? 'user' : 'assistant', content: m.text }));
    try {
      if (this.props.ask) {
        reply = await this.props.ask({ system: this.SYS, maxTokens: 300, messages: history });
      } else {
        if (!(typeof window !== 'undefined' && window.claude && window.claude.complete)) throw new Error('no model bridge');
        reply = await window.claude.complete({
          model: this.props.assistantModel ?? 'claude-haiku-4-5',
          max_tokens: 300, system: this.SYS,
          messages: history
        });
      }
    } catch (e) { if (typeof console !== 'undefined') console.warn('[FullTable assistant] Archie AI call failed', e); reply = this.FALLBACK; }
    this.setState(s => ({ msgs: [...s.msgs, { who: 'ai', text: reply || this.FALLBACK }], busy: false }));
  };
  status(base) {
    const t = base + this.GROUP;
    if (t <= 80) return { label: 'Fits', fg: '#3F5A3A', bg: '#E4ECDD', dot: '#5C7755' };
    if (t <= this.CAP) return { label: 'Tight', fg: '#7A5A12', bg: '#F6EACB', dot: '#D4A94E' };
    return { label: 'Conflict', fg: '#9A3D27', bg: '#FBE0D6', dot: '#E57F63' };
  }
  renderVals() {
    const sel = this.state.sel;
    const dates = this.DATES.map((x, i) => {
      const s = this.status(x.base), on = i === sel;
      return { ...x, ...s, pick: () => this.setState({ sel: i }),
        cbg: on ? '#492C48' : '#FFFCF6', cfg: on ? '#FFF7EB' : '#492C48', cbd: on ? '#492C48' : 'rgba(73,44,72,0.12)', csub: on ? 'rgba(255,247,235,0.7)' : '#6B5568' };
    });
    const c = dates[sel], total = c.base + this.GROUP;
    const cur = { ...c, total: Math.min(total, 999), baseW: (c.base / this.CAP * 100) + '%', addW: (Math.min(this.GROUP, this.CAP - c.base) / this.CAP * 100) + '%',
      over: total > this.CAP ? (total - this.CAP) + ' over capacity' : (this.CAP - total) + ' seats to spare' };
    const msgs = this.state.msgs.map(m => ({ ...m, align: m.who === 'me' ? 'flex-end' : 'flex-start', bg: m.who === 'me' ? '#492C48' : '#F6EBDD', fg: m.who === 'me' ? '#FFF7EB' : '#492C48' }));
    const prompts = ['How does approval work?', 'What is event sourcing?', 'Which groups book on Tuesdays?'].map(p => ({ p, ask: () => this.send(p) }));
    return {
      showShapes: this.props.showShapes ?? true,
      showAssistant: this.props.showAssistant ?? true,
      modelLabel: (this.props.assistantModel ?? 'claude-haiku-4-5').includes('sonnet') ? 'Sonnet' : 'Haiku',
      dates, cur, msgs, prompts, busy: this.state.busy,
      chatOpen: this.state.chatOpen, chatClosed: !this.state.chatOpen,
      openChat: () => this.setState({ chatOpen: true }), closeChat: () => this.setState({ chatOpen: false }),
      input: this.state.input, onInput: (e) => this.setState({ input: e.target.value }),
      onKey: (e) => { if (e.key === 'Enter') this.send(); }, sendNow: () => this.send(), chatRef: this.chatRef
    };
  }
  render() {
    const { busy, chatClosed, chatOpen, chatRef, closeChat, cur, dates, input, modelLabel, msgs, onInput, onKey, openChat, prompts, sendNow, showAssistant, showShapes } = this.renderVals();
    const loginHref = this.props.loginHref ?? '/login';
    return (
      <div data-vid="9g34gzt" data-ft-landing="" style={{ background: '#FFF7EB', color: '#492C48', fontFamily: "'Figtree',system-ui,sans-serif", lineHeight: 'normal', WebkitFontSmoothing: 'antialiased', overflowX: 'hidden', minHeight: '100vh' }}>
        <style data-vid="ecwawfd">{LANDING_CSS}</style>
      {" "}
      {" "}
      <header data-vid="i1drbg1" data-screen-label="Nav" style={{ position: "sticky", top: "0", zIndex: "20", background: "rgba(255,247,235,0.86)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: "1px solid rgba(73,44,72,0.08)" }}>
        {" "}
        <div data-vid="0xprzmn" style={{ maxWidth: "1280px", margin: "0 auto", padding: "16px clamp(20px,4vw,48px)", display: "flex", alignItems: "center", gap: "32px" }}>
          {" "}
          <a data-vid="kaevaav" href="#top" style={{ display: "flex", alignItems: "center", gap: "12px", flex: "none" }}>
            {" "}
            <span data-vid="9ehn99a" style={{ position: "relative", width: "40px", height: "40px", flex: "none" }}>
              {" "}
              <span data-vid="ojeqa4c" style={{ position: "absolute", left: "11px", top: "14px", width: "18px", height: "12px", borderRadius: "4px", background: "#492C48" }}></span>
              {" "}
              <span data-vid="d95zq88" style={{ position: "absolute", left: "14px", top: "2px", width: "12px", height: "10px", borderRadius: "5px", background: "#7E9671" }}></span>
              {" "}
              <span data-vid="n11dpma" style={{ position: "absolute", left: "14px", top: "28px", width: "12px", height: "10px", borderRadius: "5px", background: "#D4A94E" }}></span>
              {" "}
              <span data-vid="ai2boci" style={{ position: "absolute", left: "0", top: "14px", width: "9px", height: "12px", borderRadius: "5px", background: "#F2937A" }}></span>
              {" "}
              <span data-vid="uimf8he" style={{ position: "absolute", left: "31px", top: "14px", width: "9px", height: "12px", borderRadius: "5px", background: "#D4A94E" }}></span>
              {" "}
              <span data-vid="lxfs5v3" style={{ position: "absolute", left: "4px", top: "5px", width: "6px", height: "6px", borderRadius: "50%", background: "#492C48" }}></span>
              {" "}
              <span data-vid="7sv8n6w" style={{ position: "absolute", left: "30px", top: "5px", width: "6px", height: "6px", borderRadius: "50%", background: "#492C48" }}></span>
              {" "}
              <span data-vid="58y5au0" style={{ position: "absolute", left: "4px", top: "29px", width: "6px", height: "6px", borderRadius: "50%", background: "#492C48" }}></span>
              {" "}
              <span data-vid="lqtak8j" style={{ position: "absolute", left: "30px", top: "29px", width: "6px", height: "6px", borderRadius: "50%", background: "#492C48" }}></span>
              {" "}
            </span>
            {" "}
            <span data-vid="t83gv31" style={{ fontFamily: "'Outfit',sans-serif", fontWeight: "700", fontSize: "25px", letterSpacing: "-0.035em", color: "#492C48", display: "flex", alignItems: "flex-start", gap: "3px" }}>
              {"FullTable"}
              <span data-vid="w4wbtwv" style={{ fontSize: "14px", fontWeight: "600", letterSpacing: "0", color: "#E57F63", marginTop: "1px" }}>
                {"AI"}
              </span>
            </span>
            {" "}
          </a>
          {" "}
          <nav data-vid="8sxyskm" style={{ display: "flex", gap: "28px", flex: "1", flexWrap: "wrap", fontSize: "15px", fontWeight: "500" }}>
            {" "}
            <a data-vid="9o7ss68" href="#how" style={{ color: "#492C48", opacity: "0.82" }}>
              {"How it works"}
            </a>
            <a data-vid="da6z8yf" href="/growth-diagnostic" style={{ color: "#492C48", opacity: "0.82" }}>
              {"Revenue calculator"}
            </a>
            {" "}
            <a data-vid="0c1v8t4" href="#sourcing" style={{ color: "#492C48", opacity: "0.82" }}>
              {"Event sourcing"}
            </a>
            {" "}
            <a data-vid="tbnx7az" href="#insights" style={{ color: "#492C48", opacity: "0.82" }}>
              {"Insights"}
            </a>
            {" "}
            <a data-vid="uyw5bdb" href="#teams" style={{ color: "#492C48", opacity: "0.82" }}>
              {"For teams"}
            </a>
            {" "}
          </nav>
          {" "}
          <div data-vid="9jxegci" style={{ display: "flex", alignItems: "center", gap: "20px", flex: "none" }}>
            {" "}
            <a data-vid="6taqtqx" href="/contact-us" style={{ fontSize: "15px", fontWeight: "500", color: "#492C48" }}>
              {"Contact us"}
            </a>
            {" "}
            <a data-vid="htve3ew" href={loginHref} style={{ fontFamily: "'Outfit',sans-serif", fontSize: "15px", fontWeight: "500", background: "#492C48", color: "#FFF7EB", padding: "11px 22px", borderRadius: "999px" }} className="fth-0">
              {"Sign in"}
            </a>
            {" "}
          </div>
          {" "}
        </div>
        {" "}
      </header>
      {" "}
      <section data-vid="q4adwk1" id="top" data-screen-label="Hero" style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(20px,4vw,48px) clamp(64px,8vw,112px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,460px),1fr))", gap: "clamp(40px,5vw,72px)", alignItems: "center" }}>
        {" "}
        <div data-vid="cpm7fz1" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {" "}
          <div data-vid="4ocl4jo" style={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "500", letterSpacing: "0.22em", textTransform: "uppercase", color: "#492C48" }}>
            {" "}
            <span data-vid="ihzzgtq" style={{ width: "28px", height: "2px", background: "#D4A94E", borderRadius: "2px" }}></span>
            {"FullTable AI for Lumen Table "}
          </div>
          {" "}
          <h1 data-vid="5f58jjp" style={{ fontFamily: "'Outfit',sans-serif", fontWeight: "700", fontSize: "clamp(48px,6.4vw,92px)", lineHeight: "0.96", letterSpacing: "-0.045em", color: "#492C48", textWrap: "balance" }}>
            {"Your next regulars might be a whole organization."}
          </h1>
          {" "}
          <p data-vid="y9q11ke" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(22px,2.2vw,30px)", fontWeight: "400", letterSpacing: "-0.015em", color: "#492C48" }}>
            {"Good neighbors. Great business."}
          </p>
          {" "}
          <p data-vid="ammd0bg" style={{ fontSize: "18px", lineHeight: "1.6", color: "#6B5568", maxWidth: "520px", textWrap: "pretty" }}>
            {"FullTable AI finds the clubs, teams and associations near you, drafts offers within your terms, and turns your quiet nights into recurring group bookings. You approve every offer, message and booking."}
          </p>
          {" "}
          <div data-vid="3ch5d13" style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", paddingTop: "4px" }}>
            {" "}
            <a data-vid="zdjps95" href={loginHref} style={{ display: "flex", alignItems: "center", gap: "14px", fontFamily: "'Outfit',sans-serif", fontSize: "18px", fontWeight: "500", background: "#5C7755", color: "#FFF7EB", padding: "18px 30px", borderRadius: "999px" }} className="fth-1">
              {"Sign in to plan bookings"}
              <span data-vid="hc25igd" style={{ fontSize: "20px" }}>
                {"\u2192"}
              </span>
            </a>
            {" "}
            <a data-vid="hpyz08k" href="#how" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "17px", fontWeight: "500", color: "#492C48", padding: "17px 26px", borderRadius: "999px", border: "1.5px solid rgba(73,44,72,0.22)" }} className="fth-2">
              {"See how it works"}
            </a>
            {" "}
          </div>
          {" "}
        </div>
        {" "}
        <div data-vid="tkhwars" style={{ position: "relative", padding: "clamp(0px,2vw,28px) clamp(0px,2vw,28px) 0 0" }}>
          {" "}
          {(showShapes) && (
            <>
              {" "}
              <span data-vid="0fzgrg5" style={{ position: "absolute", right: "0", top: "0", width: "clamp(70px,9vw,120px)", height: "clamp(70px,9vw,120px)", borderRadius: "50%", background: "#F2937A" }}></span>
              {" "}
              <span data-vid="gooo1c3" style={{ position: "absolute", right: "clamp(60px,9vw,130px)", top: "-18px", width: "clamp(80px,9vw,128px)", height: "clamp(44px,5vw,64px)", borderRadius: "999px", background: "#D4A94E" }}></span>
              {" "}
              <span data-vid="l0qkxln" style={{ position: "absolute", left: "-26px", bottom: "-26px", width: "110px", height: "110px", borderRadius: "30px", background: "#492C48" }}></span>
              {" "}
            </>
          )}
          {" "}
          <div data-vid="k2hdz8o" style={{ position: "relative", borderRadius: "32px", overflow: "hidden", aspectRatio: "1.08", background: "#E9DCCB", boxShadow: "0 30px 60px -30px rgba(73,44,72,0.45)" }}>
            {" "}
            <img data-vid="ugfosm7" src={HERO_SRC} alt="Friends laughing over dinner at Lumen Table" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            {" "}
            <div data-vid="30g15nw" style={{ position: "absolute", left: "clamp(14px,2vw,24px)", bottom: "clamp(14px,2vw,24px)", width: "min(310px,calc(100% - 28px))", background: "rgba(255,250,242,0.96)", backdropFilter: "blur(10px)", borderRadius: "22px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 20px 40px -20px rgba(46,26,46,0.5)" }}>
              {" "}
              <div data-vid="9ypby01" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A6A1F" }}>
                {" "}
                <span data-vid="5ugkfyi" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#D4A94E", animation: "ftPulse 2s ease-in-out infinite" }}></span>
                {"Awaiting your approval "}
              </div>
              {" "}
              <div data-vid="jvuy4py" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {" "}
                <div data-vid="ijckaym" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "21px", fontWeight: "600", letterSpacing: "-0.02em", color: "#492C48" }}>
                  {"Eastside Running Club"}
                </div>
                {" "}
                <div data-vid="kbv5xtt" style={{ fontSize: "14px", color: "#6B5568" }}>
                  {"Every Tuesday \u00b7 7:00 PM \u00b7 18 guests"}
                </div>
                {" "}
              </div>
              {" "}
              <div data-vid="ilxgljr" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", paddingTop: "12px", borderTop: "1px solid rgba(73,44,72,0.1)" }}>
                {" "}
                <div data-vid="8i5kwmn" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span data-vid="olz2ndr" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "17px", fontWeight: "600" }}>
                    {"12 wks"}
                  </span>
                  <span data-vid="f2od2l8" style={{ fontSize: "12px", color: "#6B5568" }}>
                    {"Recurring"}
                  </span>
                </div>
                {" "}
                <div data-vid="0dwgkf8" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span data-vid="he6do35" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "17px", fontWeight: "600" }}>
                    {"$13.4k"}
                  </span>
                  <span data-vid="es6gq9h" style={{ fontSize: "12px", color: "#6B5568" }}>
                    {"Est. value"}
                  </span>
                </div>
                {" "}
                <div data-vid="k17e1fz" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span data-vid="aqzq6pv" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "17px", fontWeight: "600", color: "#5C7755" }}>
                    {"\u2713"}
                  </span>
                  <span data-vid="qf0o1h7" style={{ fontSize: "12px", color: "#6B5568" }}>
                    {"In terms"}
                  </span>
                </div>
                {" "}
              </div>
              {" "}
              <a data-vid="0uviddu" href="#dates" style={{ textAlign: "center", fontFamily: "'Outfit',sans-serif", fontSize: "15px", fontWeight: "500", background: "#492C48", color: "#FFF7EB", padding: "12px", borderRadius: "999px" }} className="fth-3">
                {"Review the schedule"}
              </a>
              {" "}
            </div>
            {" "}
          </div>
          {" "}
        </div>
        {" "}
      </section>
      {" "}
      <section data-vid="8pd5jf3" id="how" data-screen-label="How it works" style={{ background: "#F8EEDF", borderTop: "1px solid rgba(73,44,72,0.08)" }}>
        {" "}
        <div data-vid="zjg890h" style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(72px,9vw,128px) clamp(20px,4vw,48px)", display: "flex", flexDirection: "column", gap: "56px" }}>
          {" "}
          <div data-vid="pcbyrdt" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: "24px 64px", alignItems: "end" }}>
            {" "}
            <div data-vid="3mqgkhj" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {" "}
              <div data-vid="a90lva3" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "500", letterSpacing: "0.22em", textTransform: "uppercase" }}>
                {"How it works"}
              </div>
              {" "}
              <h2 data-vid="5orfa1s" style={{ fontFamily: "'Outfit',sans-serif", fontWeight: "700", fontSize: "clamp(36px,4.4vw,60px)", lineHeight: "1.02", letterSpacing: "-0.04em", textWrap: "balance" }}>
                {"AI does the legwork. You make the calls."}
              </h2>
              {" "}
            </div>
            {" "}
            <p data-vid="7rvgdc5" style={{ fontSize: "18px", lineHeight: "1.6", color: "#6B5568", maxWidth: "520px", textWrap: "pretty" }}>
              {"An Owner, GM or Partnership Coordinator sets the goal. FullTable researches, matches and drafts. Nothing reaches a partner, and nothing lands on your calendar, until a person signs off."}
            </p>
            {" "}
          </div>
          {" "}
          <div data-vid="nyk2n16" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "16px" }}>
            {" "}
            <div data-vid="33uwyql" style={{ background: "#FFFCF6", borderRadius: "28px", padding: "30px 28px 32px", display: "flex", flexDirection: "column", gap: "18px", minHeight: "280px" }}>
              {" "}
              <div data-vid="bwvh6ru" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span data-vid="k8vpg6q" style={{ width: "48px", height: "48px", borderRadius: "16px", background: "#492C48" }}></span>
                <span data-vid="q7okf56" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "600", letterSpacing: "0.1em", padding: "6px 12px", borderRadius: "999px", background: "#F3E4EE", color: "#492C48" }}>
                  {"YOU"}
                </span>
              </div>
              {" "}
              <div data-vid="sye44kk" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "15px", fontWeight: "500", color: "#6B5568", marginTop: "auto" }}>
                {"01"}
              </div>
              {" "}
              <h3 data-vid="1dgi6qh" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.025em" }}>
                {"Set a goal"}
              </h3>
              {" "}
              <p data-vid="lrr48r0" style={{ fontSize: "16px", lineHeight: "1.55", color: "#6B5568" }}>
                {"\u201cFill 30 seats on Tuesday evenings through spring.\u201d Add your terms: minimum spend, menus, discounts you allow."}
              </p>
              {" "}
            </div>
            {" "}
            <div data-vid="dly3ih5" style={{ background: "#FFFCF6", borderRadius: "28px", padding: "30px 28px 32px", display: "flex", flexDirection: "column", gap: "18px", minHeight: "280px" }}>
              {" "}
              <div data-vid="6r6mrxs" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span data-vid="a6qqs1n" style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#F2937A" }}></span>
                <span data-vid="6bbgbld" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "600", letterSpacing: "0.1em", padding: "6px 12px", borderRadius: "999px", background: "#FBE5DC", color: "#9A3D27" }}>
                  {"AI"}
                </span>
              </div>
              {" "}
              <div data-vid="czzvwni" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "15px", fontWeight: "500", color: "#6B5568", marginTop: "auto" }}>
                {"02"}
              </div>
              {" "}
              <h3 data-vid="2l9eodq" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.025em" }}>
                {"Research & match"}
              </h3>
              {" "}
              <p data-vid="13vz5jk" style={{ fontSize: "16px", lineHeight: "1.55", color: "#6B5568" }}>
                {"It scores nearby clubs, teams and associations by size, schedule, distance and how they like to dine."}
              </p>
              {" "}
            </div>
            {" "}
            <div data-vid="trv0xnj" style={{ background: "#FFFCF6", borderRadius: "28px", padding: "30px 28px 32px", display: "flex", flexDirection: "column", gap: "18px", minHeight: "280px" }}>
              {" "}
              <div data-vid="bhkj045" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span data-vid="s18kc0n" style={{ width: "72px", height: "48px", borderRadius: "999px", background: "#D4A94E" }}></span>
                <span data-vid="ztbdqop" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "600", letterSpacing: "0.1em", padding: "6px 12px", borderRadius: "999px", background: "#FBE5DC", color: "#9A3D27" }}>
                  {"AI"}
                </span>
              </div>
              {" "}
              <div data-vid="w6yecxb" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "15px", fontWeight: "500", color: "#6B5568", marginTop: "auto" }}>
                {"03"}
              </div>
              {" "}
              <h3 data-vid="2kc21ju" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.025em" }}>
                {"Draft offers & schedules"}
              </h3>
              {" "}
              <p data-vid="pvg0nov" style={{ fontSize: "16px", lineHeight: "1.55", color: "#6B5568" }}>
                {"Offers stay inside your approved terms. A recurring schedule is checked against every date on your calendar."}
              </p>
              {" "}
            </div>
            {" "}
            <div data-vid="4avwzku" style={{ background: "#492C48", color: "#FFF7EB", borderRadius: "28px", padding: "30px 28px 32px", display: "flex", flexDirection: "column", gap: "18px", minHeight: "280px" }}>
              {" "}
              <div data-vid="cuo6fc9" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span data-vid="tedwb12" style={{ width: "48px", height: "48px", borderRadius: "16px 16px 16px 4px", background: "#7E9671" }}></span>
                <span data-vid="jj3prcb" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "600", letterSpacing: "0.1em", padding: "6px 12px", borderRadius: "999px", background: "rgba(255,247,235,0.14)", color: "#FFF7EB" }}>
                  {"YOU"}
                </span>
              </div>
              {" "}
              <div data-vid="uc8nqoz" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "15px", fontWeight: "500", color: "rgba(255,247,235,0.7)", marginTop: "auto" }}>
                {"04"}
              </div>
              {" "}
              <h3 data-vid="mxplp6a" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.025em" }}>
                {"Approve & book"}
              </h3>
              {" "}
              <p data-vid="rgisl4z" style={{ fontSize: "16px", lineHeight: "1.55", color: "rgba(255,247,235,0.82)" }}>
                {"You approve each offer, each outbound message and each booking commitment. Then the series goes on the calendar."}
              </p>
              {" "}
            </div>
            {" "}
          </div>
          {" "}
        </div>
        {" "}
      </section>
      {" "}
      <section data-vid="sslp4aq" id="dates" data-screen-label="Date by date" style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(72px,9vw,128px) clamp(20px,4vw,48px)", display: "flex", flexDirection: "column", gap: "40px" }}>
        {" "}
        <div data-vid="8fnl7ty" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "24px" }}>
          {" "}
          <div data-vid="4qxfh93" style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "720px" }}>
            {" "}
            <div data-vid="akbgfa4" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "500", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              {"Date by date"}
            </div>
            {" "}
            <h2 data-vid="yjstgjl" style={{ fontFamily: "'Outfit',sans-serif", fontWeight: "700", fontSize: "clamp(36px,4.4vw,60px)", lineHeight: "1.02", letterSpacing: "-0.04em", textWrap: "balance" }}>
              {"Every date shows whether the group fits."}
            </h2>
            {" "}
          </div>
          {" "}
          <div data-vid="4hludsl" style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px", fontSize: "15px", color: "#6B5568", alignItems: "center" }}>
            {" "}
            <span data-vid="4rcirhl" style={{ fontWeight: "600", color: "#492C48" }}>
              {"Eastside Running Club"}
            </span>
            <span data-vid="zgnipbi">
              {"18 guests"}
            </span>
            <span data-vid="e1y9iuy">
              {"Tuesdays, 7:00 PM"}
            </span>
            <span data-vid="sxswqdu">
              {"96-seat room"}
            </span>
            {" "}
          </div>
          {" "}
        </div>
        {" "}
        <div data-vid="prj8ras" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(118px,1fr))", gap: "10px" }}>
          {" "}
          {(dates).map((x, __i) => (
            <React.Fragment data-vid="de70pri" key={__i}>
              {" "}
              <button data-vid="b3az560" onClick={x.pick} style={{ all: "unset", cursor: "pointer", background: `${x.cbg}`, color: `${x.cfg}`, border: `1px solid ${x.cbd}`, borderRadius: "20px", padding: "16px 16px 14px", display: "flex", flexDirection: "column", gap: "10px", transition: "background .2s,color .2s" }}>
                {" "}
                <span data-vid="7wg7eq3" style={{ fontSize: "13px", color: `${x.csub}` }}>
                  {"Tue"}
                </span>
                {" "}
                <span data-vid="76rd5rm" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.02em" }}>
                  {x.d}
                </span>
                {" "}
                <span data-vid="r8yukv4" style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", fontWeight: "500" }}>
                  <span data-vid="kr6air9" style={{ width: "8px", height: "8px", borderRadius: "50%", background: `${x.dot}` }}></span>
                  {x.label}
                </span>
                {" "}
              </button>
              {" "}
            </React.Fragment>
          ))}
          {" "}
        </div>
        {" "}
        <div data-vid="0hsgl2x" style={{ background: "#FFFCF6", border: "1px solid rgba(73,44,72,0.1)", borderRadius: "32px", padding: "clamp(24px,3.5vw,44px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: "40px 56px" }}>
          {" "}
          <div data-vid="im2m2q5" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            {" "}
            <div data-vid="wxrtx2v" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px" }}>
              {" "}
              <h3 data-vid="i4fcep6" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(26px,2.6vw,34px)", fontWeight: "600", letterSpacing: "-0.03em" }}>
                {cur.long}
              </h3>
              {" "}
              <span data-vid="apfg8wo" style={{ fontSize: "14px", fontWeight: "600", padding: "6px 14px", borderRadius: "999px", background: `${cur.bg}`, color: `${cur.fg}` }}>
                {cur.label}
              </span>
              {" "}
            </div>
            {" "}
            <p data-vid="658hy0k" style={{ fontSize: "17px", lineHeight: "1.55", color: "#6B5568" }}>
              {cur.note}
            </p>
            {" "}
            <div data-vid="r5qr7io" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {" "}
              <div data-vid="atfju1i" style={{ display: "flex", height: "18px", borderRadius: "999px", background: "#F1E6D6", overflow: "hidden" }}>
                {" "}
                <span data-vid="jtf7gh8" style={{ width: `${cur.baseW}`, background: "#492C48", transition: "width .35s" }}></span>
                {" "}
                <span data-vid="7hqiyk4" style={{ width: `${cur.addW}`, background: `${cur.dot}`, transition: "width .35s" }}></span>
                {" "}
              </div>
              {" "}
              <div data-vid="czj48k9" style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px", fontSize: "14px", color: "#6B5568" }}>
                {" "}
                <span data-vid="2tkbvh2" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span data-vid="q9hdcdm" style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#492C48" }}></span>
                  <span data-vid="e914lxo">{cur.base}</span>{" forecast covers"}
                </span>
                {" "}
                <span data-vid="n8iebeu" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span data-vid="i6h5xuv" style={{ width: "10px", height: "10px", borderRadius: "3px", background: `${cur.dot}` }}></span>
                  {"+18 group"}
                </span>
                {" "}
                <span data-vid="hk4oy7v" style={{ fontWeight: "600", color: "#492C48" }}>
                  {cur.over}
                </span>
                {" "}
              </div>
              {" "}
            </div>
            {" "}
          </div>
          {" "}
          <div data-vid="qrc0jl3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "12px" }}>
            {" "}
            <div data-vid="0q6ugoo" style={{ background: "#F8EEDF", borderRadius: "20px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {" "}
              <span data-vid="ec3u8wp" style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6B5568" }}>
                {"Staffing"}
              </span>
              {" "}
              <span data-vid="qt8gjd0" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "19px", fontWeight: "500", letterSpacing: "-0.01em", lineHeight: "1.3" }}>
                {cur.staff}
              </span>
              {" "}
            </div>
            {" "}
            <div data-vid="k5sl113" style={{ background: "#F8EEDF", borderRadius: "20px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {" "}
              <span data-vid="ttyqasr" style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6B5568" }}>
                {"Kitchen"}
              </span>
              {" "}
              <span data-vid="3mmsnyz" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "19px", fontWeight: "500", letterSpacing: "-0.01em", lineHeight: "1.3" }}>
                {cur.kitchen}
              </span>
              {" "}
            </div>
            {" "}
            <div data-vid="dhe97v4" style={{ background: "#F8EEDF", borderRadius: "20px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {" "}
              <span data-vid="wvr2g86" style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6B5568" }}>
                {"Est. booking value"}
              </span>
              {" "}
              <span data-vid="i96zlnx" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "19px", fontWeight: "500" }}>
                {"$1,116 "}
                <span data-vid="cz7r61l" style={{ fontSize: "14px", color: "#6B5568" }}>
                  {"\u00b7 18 \u00d7 $62 avg. check"}
                </span>
              </span>
              {" "}
            </div>
            {" "}
            <div data-vid="pe1yvdx" style={{ background: "#F8EEDF", borderRadius: "20px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {" "}
              <span data-vid="zaqfbtj" style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6B5568" }}>
                {"Serving cost"}
              </span>
              {" "}
              <span data-vid="669peoi" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "19px", fontWeight: "500" }}>
                {"$266 "}
                <span data-vid="vxclthd" style={{ fontSize: "14px", color: "#6B5568" }}>
                  {"\u00b7 $14.80 per cover"}
                </span>
              </span>
              {" "}
            </div>
            {" "}
          </div>
          {" "}
        </div>
        {" "}
        <p data-vid="tdbacza" style={{ fontSize: "14px", color: "#6B5568" }}>
          {"Fictional demo record for Lumen Table. Values are illustrative estimates, not recorded sales."}
        </p>
        {" "}
      </section>
      {" "}
      <section data-vid="s7b5h3m" id="sourcing" data-screen-label="Event sourcing" style={{ padding: "0 clamp(10px,1.6vw,24px)" }}>
        {" "}
        <div data-vid="wwlfug4" style={{ background: "#492C48", color: "#FFF7EB", borderRadius: "clamp(28px,3vw,44px)", position: "relative", overflow: "hidden" }}>
          {" "}
          {(showShapes) && (
            <>
              {" "}
              <span data-vid="wpexz9z" style={{ position: "absolute", right: "-60px", top: "-60px", width: "220px", height: "220px", borderRadius: "50%", background: "#5A3A58" }}></span>
              {" "}
              <span data-vid="alq313h" style={{ position: "absolute", right: "150px", top: "-30px", width: "140px", height: "70px", borderRadius: "999px", background: "#D4A94E", opacity: "0.9" }}></span>
              {" "}
            </>
          )}
          {" "}
          <div data-vid="abfbfri" style={{ position: "relative", maxWidth: "1232px", margin: "0 auto", padding: "clamp(64px,8vw,112px) clamp(20px,4vw,48px)", display: "flex", flexDirection: "column", gap: "56px" }}>
            {" "}
            <div data-vid="053pfsy" style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "780px" }}>
              {" "}
              <div data-vid="rgb4arw" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "500", letterSpacing: "0.22em", textTransform: "uppercase", color: "#F3B58C" }}>
                {"Event sourcing"}
              </div>
              {" "}
              <h2 data-vid="sr80rwg" style={{ fontFamily: "'Outfit',sans-serif", fontWeight: "700", fontSize: "clamp(36px,4.4vw,60px)", lineHeight: "1.02", letterSpacing: "-0.04em", textWrap: "balance" }}>
                {"Twelve months of local demand, routed to your quiet nights."}
              </h2>
              {" "}
              <p data-vid="s73pce1" style={{ fontSize: "18px", lineHeight: "1.6", color: "rgba(255,247,235,0.8)", maxWidth: "600px", textWrap: "pretty" }}>
                {"A living registry gathers upcoming events and organizers about a year ahead, cleans them into one record each, and sends the qualified ones to the gaps in your calendar."}
              </p>
              {" "}
            </div>
            {" "}
            <div data-vid="o5o7f8s" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "10px" }}>
              {" "}
              <div data-vid="whyfwpm" style={{ border: "1px solid rgba(255,247,235,0.18)", borderRadius: "22px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <span data-vid="0jp3mxn" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "#F3B58C" }}>
                  {"01"}
                </span>
                <span data-vid="gb5tjai" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "20px", fontWeight: "600" }}>
                  {"Collect"}
                </span>
                <span data-vid="iu5xsih" style={{ fontSize: "14px", color: "rgba(255,247,235,0.72)" }}>
                  {"Calendars, leagues, associations"}
                </span>
              </div>
              {" "}
              <div data-vid="yz0tz74" style={{ border: "1px solid rgba(255,247,235,0.18)", borderRadius: "22px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <span data-vid="okfv0d4" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "#F3B58C" }}>
                  {"02"}
                </span>
                <span data-vid="hxuaepx" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "20px", fontWeight: "600" }}>
                  {"Standardize"}
                </span>
                <span data-vid="m7q3v4n" style={{ fontSize: "14px", color: "rgba(255,247,235,0.72)" }}>
                  {"One format for date, size, place"}
                </span>
              </div>
              {" "}
              <div data-vid="aes93dv" style={{ border: "1px solid rgba(255,247,235,0.18)", borderRadius: "22px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <span data-vid="ap6kh1f" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "#F3B58C" }}>
                  {"03"}
                </span>
                <span data-vid="rgfr0mq" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "20px", fontWeight: "600" }}>
                  {"Deduplicate"}
                </span>
                <span data-vid="ptv4y4d" style={{ fontSize: "14px", color: "rgba(255,247,235,0.72)" }}>
                  {"One record per event and organizer"}
                </span>
              </div>
              {" "}
              <div data-vid="7vupzc1" style={{ border: "1px solid rgba(255,247,235,0.18)", borderRadius: "22px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <span data-vid="4nr0h95" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "14px", color: "#F3B58C" }}>
                  {"04"}
                </span>
                <span data-vid="faz99xn" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "20px", fontWeight: "600" }}>
                  {"Qualify"}
                </span>
                <span data-vid="5ncc4rb" style={{ fontSize: "14px", color: "rgba(255,247,235,0.72)" }}>
                  {"Group size, timing, distance, fit"}
                </span>
              </div>
              {" "}
              <div data-vid="dezdkqv" style={{ background: "#F3B58C", color: "#492C48", borderRadius: "22px", padding: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <span data-vid="r9at3ol" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "14px" }}>
                  {"05"}
                </span>
                <span data-vid="6qwcvwd" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "20px", fontWeight: "600" }}>
                  {"Route"}
                </span>
                <span data-vid="467y9oe" style={{ fontSize: "14px" }}>
                  {"To open dates on your calendar"}
                </span>
              </div>
              {" "}
            </div>
            {" "}
            <div data-vid="8z884k3" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {" "}
              <div data-vid="p6d8jbt" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "12px" }}>
                {" "}
                <div data-vid="gooui5a" style={{ background: "rgba(255,247,235,0.07)", borderRadius: "22px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {" "}
                  <span data-vid="lh8pq7h" style={{ fontSize: "13px", color: "rgba(255,247,235,0.7)" }}>
                    {"Weekly \u00b7 from Jan 2027"}
                  </span>
                  {" "}
                  <span data-vid="ik40u7a" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "20px", fontWeight: "600", letterSpacing: "-0.015em" }}>
                    {"Harbor Book Society"}
                  </span>
                  {" "}
                  <span data-vid="l7l9zrg" style={{ fontSize: "15px", color: "rgba(255,247,235,0.78)" }}>
                    {"12\u201316 guests \u00b7 prefers early evening"}
                  </span>
                  {" "}
                  <span data-vid="mgk7w6a" style={{ alignSelf: "flex-start", marginTop: "4px", fontSize: "13px", fontWeight: "600", padding: "6px 12px", borderRadius: "999px", background: "#7E9671", color: "#1F2B1C" }}>
                    {"Routed \u2192 Wednesdays"}
                  </span>
                  {" "}
                </div>
                {" "}
                <div data-vid="8hxwyeb" style={{ background: "rgba(255,247,235,0.07)", borderRadius: "22px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {" "}
                  <span data-vid="4zp0ush" style={{ fontSize: "13px", color: "rgba(255,247,235,0.7)" }}>
                    {"Mar 12, 2027 \u00b7 one-off"}
                  </span>
                  {" "}
                  <span data-vid="t0o6cxx" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "20px", fontWeight: "600", letterSpacing: "-0.015em" }}>
                    {"Northgate PTA fundraiser dinner"}
                  </span>
                  {" "}
                  <span data-vid="f1wa1wa" style={{ fontSize: "15px", color: "rgba(255,247,235,0.78)" }}>
                    {"60 guests \u00b7 prix-fixe"}
                  </span>
                  {" "}
                  <span data-vid="grfhvdx" style={{ alignSelf: "flex-start", marginTop: "4px", fontSize: "13px", fontWeight: "600", padding: "6px 12px", borderRadius: "999px", background: "#D4A94E", color: "#3A2A08" }}>
                    {"Routed \u2192 Thu, Mar 11"}
                  </span>
                  {" "}
                </div>
                {" "}
                <div data-vid="jerje59" style={{ background: "rgba(255,247,235,0.07)", borderRadius: "22px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {" "}
                  <span data-vid="t1ej0zk" style={{ fontSize: "13px", color: "rgba(255,247,235,0.7)" }}>
                    {"Monthly \u00b7 from Apr 2027"}
                  </span>
                  {" "}
                  <span data-vid="p2lx57p" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "20px", fontWeight: "600", letterSpacing: "-0.015em" }}>
                    {"Riverside Small Business Guild"}
                  </span>
                  {" "}
                  <span data-vid="q2l3777" style={{ fontSize: "15px", color: "rgba(255,247,235,0.78)" }}>
                    {"24 guests \u00b7 first Monday"}
                  </span>
                  {" "}
                  <span data-vid="1j3c05m" style={{ alignSelf: "flex-start", marginTop: "4px", fontSize: "13px", fontWeight: "600", padding: "6px 12px", borderRadius: "999px", background: "#F2937A", color: "#3E160B" }}>
                    {"Routed \u2192 Mondays"}
                  </span>
                  {" "}
                </div>
                {" "}
              </div>
              {" "}
              <p data-vid="scu7rns" style={{ fontSize: "14px", color: "rgba(255,247,235,0.66)" }}>
                {"Fictional organizers shown for illustration."}
              </p>
              {" "}
            </div>
            {" "}
          </div>
          {" "}
        </div>
        {" "}
      </section>
      {" "}
      <section data-vid="6eo22rk" id="ops" data-screen-label="Operations" style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(72px,9vw,128px) clamp(20px,4vw,48px)", display: "flex", flexDirection: "column", gap: "48px" }}>
        {" "}
        <div data-vid="5fwwtky" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: "24px 64px", alignItems: "end" }}>
          {" "}
          <div data-vid="fsjxzq5" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {" "}
            <div data-vid="47h1322" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "500", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              {"Staffing & kitchen"}
            </div>
            {" "}
            <h2 data-vid="st8kt5e" style={{ fontFamily: "'Outfit',sans-serif", fontWeight: "700", fontSize: "clamp(36px,4.4vw,60px)", lineHeight: "1.02", letterSpacing: "-0.04em", textWrap: "balance" }}>
              {"Booked demand becomes a rota and a prep list."}
            </h2>
            {" "}
          </div>
          {" "}
          <p data-vid="vdftlt6" style={{ fontSize: "18px", lineHeight: "1.6", color: "#6B5568", maxWidth: "520px", textWrap: "pretty" }}>
            {"Staff Scheduling and Inventory & Waste read the same forecast, then recommend. Your managers approve before anything changes."}
          </p>
          {" "}
        </div>
        {" "}
        <div data-vid="h9wcrap" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "16px" }}>
          {" "}
          <div data-vid="2zmpyou" style={{ background: "#FFFCF6", border: "1px solid rgba(73,44,72,0.1)", borderRadius: "32px", padding: "clamp(24px,3vw,36px)", display: "flex", flexDirection: "column", gap: "22px" }}>
            {" "}
            <div data-vid="ov2oly7" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span data-vid="n3yj1dt" style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#7E9671" }}></span>
              <h3 data-vid="u9dva02" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.025em" }}>
                {"Staff Scheduling"}
              </h3>
            </div>
            {" "}
            <div data-vid="6c6ebi9" style={{ display: "flex", flexDirection: "column" }}>
              {" "}
              <div data-vid="07p4xtq" style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "14px 0", borderTop: "1px solid rgba(73,44,72,0.1)", fontSize: "16px" }}>
                <span data-vid="r3yygkb">
                  {"Tue, Nov 17 \u00b7 Floor"}
                </span>
                <span data-vid="y2rcqso" style={{ fontWeight: "600" }}>
                  {"+1 server, 6:30\u20139:30"}
                </span>
              </div>
              {" "}
              <div data-vid="a4uiscb" style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "14px 0", borderTop: "1px solid rgba(73,44,72,0.1)", fontSize: "16px" }}>
                <span data-vid="xkvqzw0">
                  {"Tue, Nov 24 \u00b7 Kitchen"}
                </span>
                <span data-vid="0elklwo" style={{ fontWeight: "600" }}>
                  {"+1 line cook"}
                </span>
              </div>
              {" "}
              <div data-vid="b9tsy27" style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "14px 0", borderTop: "1px solid rgba(73,44,72,0.1)", borderBottom: "1px solid rgba(73,44,72,0.1)", fontSize: "16px" }}>
                <span data-vid="ofp44a4">
                  {"Tue, Dec 22 \u00b7 Front"}
                </span>
                <span data-vid="t2j545f" style={{ fontWeight: "600" }}>
                  {"+1 host"}
                </span>
              </div>
              {" "}
            </div>
            {" "}
            <div data-vid="tkqu2qf" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <span data-vid="woaf90g" style={{ fontSize: "14px", color: "#6B5568" }}>
                {"3 recommendations for manager review"}
              </span>
              <span data-vid="tdd2wo0" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "14px", fontWeight: "500", padding: "9px 18px", borderRadius: "999px", background: "#492C48", color: "#FFF7EB" }}>
                {"Review rota"}
              </span>
            </div>
            {" "}
          </div>
          {" "}
          <div data-vid="ebpv0a4" style={{ background: "#FFFCF6", border: "1px solid rgba(73,44,72,0.1)", borderRadius: "32px", padding: "clamp(24px,3vw,36px)", display: "flex", flexDirection: "column", gap: "22px" }}>
            {" "}
            <div data-vid="1omzmrr" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span data-vid="p5ae77e" style={{ width: "64px", height: "44px", borderRadius: "999px", background: "#D4A94E" }}></span>
              <h3 data-vid="sfiw727" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.025em" }}>
                {"Inventory & Waste"}
              </h3>
            </div>
            {" "}
            <div data-vid="d6mc1oy" style={{ display: "flex", flexDirection: "column" }}>
              {" "}
              <div data-vid="jhu5eze" style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "14px 0", borderTop: "1px solid rgba(73,44,72,0.1)", fontSize: "16px" }}>
                <span data-vid="qqp8zld">
                  {"Family-style mains"}
                </span>
                <span data-vid="tunz3qc" style={{ fontWeight: "600" }}>
                  {"Prep 18 per Tuesday"}
                </span>
              </div>
              {" "}
              <div data-vid="wk4009k" style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "14px 0", borderTop: "1px solid rgba(73,44,72,0.1)", fontSize: "16px" }}>
                <span data-vid="a6a9gvi">
                  {"Bread & dessert par"}
                </span>
                <span data-vid="maav4uw" style={{ fontWeight: "600" }}>
                  {"Lower 15% on quiet nights"}
                </span>
              </div>
              {" "}
              <div data-vid="hxd533v" style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "14px 0", borderTop: "1px solid rgba(73,44,72,0.1)", borderBottom: "1px solid rgba(73,44,72,0.1)", fontSize: "16px" }}>
                <span data-vid="iust45u">
                  {"Produce order, Nov 24"}
                </span>
                <span data-vid="rtnqrf4" style={{ fontWeight: "600" }}>
                  {"Move to Monday"}
                </span>
              </div>
              {" "}
            </div>
            {" "}
            <div data-vid="ydhn421" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <span data-vid="akkilgc" style={{ fontSize: "14px", color: "#6B5568" }}>
                {"Less over-prep, steadier waste"}
              </span>
              <span data-vid="tfz6fwf" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "14px", fontWeight: "500", padding: "9px 18px", borderRadius: "999px", background: "#492C48", color: "#FFF7EB" }}>
                {"Review prep list"}
              </span>
            </div>
            {" "}
          </div>
          {" "}
        </div>
        {" "}
      </section>
      {" "}
      <section data-vid="ffpcoeo" id="insights" data-screen-label="Insights" style={{ background: "#F8EEDF", borderTop: "1px solid rgba(73,44,72,0.08)" }}>
        {" "}
        <div data-vid="3ehft9s" style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(72px,9vw,128px) clamp(20px,4vw,48px)", display: "flex", flexDirection: "column", gap: "48px" }}>
          {" "}
          <div data-vid="57y0nav" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: "24px 64px", alignItems: "end" }}>
            {" "}
            <div data-vid="bjicmg3" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {" "}
              <div data-vid="4p2i44r" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "500", letterSpacing: "0.22em", textTransform: "uppercase" }}>
                {"Economic impact"}
              </div>
              {" "}
              <h2 data-vid="mtb3wvq" style={{ fontFamily: "'Outfit',sans-serif", fontWeight: "700", fontSize: "clamp(36px,4.4vw,60px)", lineHeight: "1.02", letterSpacing: "-0.04em", textWrap: "balance" }}>
                {"Know what a full table is worth."}
              </h2>
              {" "}
            </div>
            {" "}
            <p data-vid="t1dzy3c" style={{ fontSize: "18px", lineHeight: "1.6", color: "#6B5568", maxWidth: "520px", textWrap: "pretty" }}>
              {"Booking value, slow-period lift, partner conversion and cost to serve \u2014 side by side, so the next offer is an informed one."}
            </p>
            {" "}
          </div>
          {" "}
          <div data-vid="u7chma2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: "14px" }}>
            {" "}
            <div data-vid="lt3chah" style={{ background: "#492C48", color: "#FFF7EB", borderRadius: "32px", padding: "30px", display: "flex", flexDirection: "column", gap: "10px", minHeight: "240px" }}>
              {" "}
              <span data-vid="oan4rtu" style={{ fontSize: "14px", color: "rgba(255,247,235,0.75)" }}>
                {"Recurring booking value"}
              </span>
              {" "}
              <span data-vid="uqx1laq" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(48px,5vw,64px)", fontWeight: "600", letterSpacing: "-0.045em", lineHeight: "1", marginTop: "auto" }}>
                {"$13.4k"}
              </span>
              {" "}
              <span data-vid="cjy55cd" style={{ fontSize: "15px", color: "rgba(255,247,235,0.8)" }}>
                {"per 12-week Tuesday series"}
              </span>
              {" "}
            </div>
            {" "}
            <div data-vid="opumyqj" style={{ background: "#F3B58C", color: "#492C48", borderRadius: "32px", padding: "30px", display: "flex", flexDirection: "column", gap: "10px", minHeight: "240px" }}>
              {" "}
              <span data-vid="s0v1w2p" style={{ fontSize: "14px" }}>
                {"Slow-period effect"}
              </span>
              {" "}
              <span data-vid="i203fik" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(48px,5vw,64px)", fontWeight: "600", letterSpacing: "-0.045em", lineHeight: "1", marginTop: "auto" }}>
                {"+31%"}
              </span>
              {" "}
              <span data-vid="4nfqkcc" style={{ fontSize: "15px" }}>
                {"Tuesday covers vs. last season"}
              </span>
              {" "}
            </div>
            {" "}
            <div data-vid="5olqkto" style={{ background: "#7E9671", color: "#1F2B1C", borderRadius: "32px", padding: "30px", display: "flex", flexDirection: "column", gap: "10px", minHeight: "240px" }}>
              {" "}
              <span data-vid="e9bldu3" style={{ fontSize: "14px" }}>
                {"Partner reach & conversion"}
              </span>
              {" "}
              <span data-vid="cyykghr" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(48px,5vw,64px)", fontWeight: "600", letterSpacing: "-0.045em", lineHeight: "1", marginTop: "auto" }}>
                {"42 \u2192 9"}
              </span>
              {" "}
              <span data-vid="8jd6hjl" style={{ fontSize: "15px" }}>
                {"groups reached \u2192 groups booked"}
              </span>
              {" "}
            </div>
            {" "}
            <div data-vid="axdv6vz" style={{ background: "#D4A94E", color: "#3A2A08", borderRadius: "32px", padding: "30px", display: "flex", flexDirection: "column", gap: "10px", minHeight: "240px" }}>
              {" "}
              <span data-vid="dncmo9f" style={{ fontSize: "14px" }}>
                {"Serving cost per group"}
              </span>
              {" "}
              <span data-vid="b389ph9" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(48px,5vw,64px)", fontWeight: "600", letterSpacing: "-0.045em", lineHeight: "1", marginTop: "auto" }}>
                {"$14.80"}
              </span>
              {" "}
              <span data-vid="x4egzz7" style={{ fontSize: "15px" }}>
                {"per cover, staffing and kitchen included"}
              </span>
              {" "}
            </div>
            {" "}
          </div>
          {" "}
          <div data-vid="inamt9d" style={{ background: "#FFFCF6", border: "1px solid rgba(73,44,72,0.1)", borderRadius: "32px", padding: "clamp(24px,3vw,36px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: "32px 56px", alignItems: "end" }}>
            {" "}
            <div data-vid="wjrgect" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {" "}
              <span data-vid="i4hczwp" style={{ fontSize: "14px", color: "#6B5568" }}>
                {"Nearby groups\u2019 dining patterns"}
              </span>
              {" "}
              <h3 data-vid="e7jgw38" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(24px,2.4vw,30px)", fontWeight: "600", letterSpacing: "-0.03em", lineHeight: "1.15", textWrap: "balance" }}>
                {"Local groups prefer to sit down between 6:30 and 8 PM on weeknights."}
              </h3>
              {" "}
              <p data-vid="027hffm" style={{ fontSize: "15px", color: "#6B5568" }}>
                {"Group demand by start time, Mon\u2013Thu"}
              </p>
              {" "}
            </div>
            {" "}
            <div data-vid="wm77y2d" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "10px", alignItems: "end", height: "160px" }}>
              {" "}
              <div data-vid="pn1cnh5" style={{ display: "flex", flexDirection: "column", gap: "8px", height: "100%", justifyContent: "flex-end", alignItems: "stretch" }}>
                <span data-vid="i9e7nc9" style={{ height: "28%", background: "#EADBC6", borderRadius: "12px" }}></span>
                <span data-vid="mrrhszs" style={{ fontSize: "13px", color: "#6B5568", textAlign: "center" }}>
                  {"5 PM"}
                </span>
              </div>
              {" "}
              <div data-vid="6mqle9x" style={{ display: "flex", flexDirection: "column", gap: "8px", height: "100%", justifyContent: "flex-end", alignItems: "stretch" }}>
                <span data-vid="rnuqehc" style={{ height: "58%", background: "#F3B58C", borderRadius: "12px" }}></span>
                <span data-vid="23do97e" style={{ fontSize: "13px", color: "#6B5568", textAlign: "center" }}>
                  {"6 PM"}
                </span>
              </div>
              {" "}
              <div data-vid="8c23euo" style={{ display: "flex", flexDirection: "column", gap: "8px", height: "100%", justifyContent: "flex-end", alignItems: "stretch" }}>
                <span data-vid="oeo9hsc" style={{ height: "86%", background: "#492C48", borderRadius: "12px" }}></span>
                <span data-vid="v9zrh2p" style={{ fontSize: "13px", color: "#6B5568", textAlign: "center" }}>
                  {"7 PM"}
                </span>
              </div>
              {" "}
              <div data-vid="aom04yv" style={{ display: "flex", flexDirection: "column", gap: "8px", height: "100%", justifyContent: "flex-end", alignItems: "stretch" }}>
                <span data-vid="rn785zw" style={{ height: "70%", background: "#492C48", borderRadius: "12px" }}></span>
                <span data-vid="xavg3jo" style={{ fontSize: "13px", color: "#6B5568", textAlign: "center" }}>
                  {"8 PM"}
                </span>
              </div>
              {" "}
              <div data-vid="cz6by8a" style={{ display: "flex", flexDirection: "column", gap: "8px", height: "100%", justifyContent: "flex-end", alignItems: "stretch" }}>
                <span data-vid="hmewqkb" style={{ height: "36%", background: "#F3B58C", borderRadius: "12px" }}></span>
                <span data-vid="ddnvf0z" style={{ fontSize: "13px", color: "#6B5568", textAlign: "center" }}>
                  {"9 PM"}
                </span>
              </div>
              {" "}
              <div data-vid="r0u8mjt" style={{ display: "flex", flexDirection: "column", gap: "8px", height: "100%", justifyContent: "flex-end", alignItems: "stretch" }}>
                <span data-vid="7jkpswl" style={{ height: "14%", background: "#EADBC6", borderRadius: "12px" }}></span>
                <span data-vid="iox3akd" style={{ fontSize: "13px", color: "#6B5568", textAlign: "center" }}>
                  {"10 PM"}
                </span>
              </div>
              {" "}
            </div>
            {" "}
          </div>
          {" "}
          <p data-vid="vbfa62v" style={{ fontSize: "14px", color: "#6B5568" }}>
            {"Illustrative estimates for fictional Lumen Table."}
          </p>
          {" "}
        </div>
        {" "}
      </section>
      {" "}
      <section data-vid="bxibs9h" id="teams" data-screen-label="For teams" style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(72px,9vw,128px) clamp(20px,4vw,48px)", display: "flex", flexDirection: "column", gap: "48px" }}>
        {" "}
        <div data-vid="6u8lswd" style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "760px" }}>
          {" "}
          <div data-vid="scmnrh7" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "13px", fontWeight: "500", letterSpacing: "0.22em", textTransform: "uppercase" }}>
            {"For teams"}
          </div>
          {" "}
          <h2 data-vid="ynxbwyn" style={{ fontFamily: "'Outfit',sans-serif", fontWeight: "700", fontSize: "clamp(36px,4.4vw,60px)", lineHeight: "1.02", letterSpacing: "-0.04em", textWrap: "balance" }}>
            {"One workspace for everyone who fills the room."}
          </h2>
          {" "}
        </div>
        {" "}
        <div data-vid="qxd7dcw" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: "0", borderTop: "1px solid rgba(73,44,72,0.14)" }}>
          {" "}
          <div data-vid="5jyzbf3" style={{ padding: "32px 28px 8px 0", display: "flex", flexDirection: "column", gap: "14px" }}>
            {" "}
            <span data-vid="iu8z89t" style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#492C48" }}></span>
            {" "}
            <h3 data-vid="nvq3xzi" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.02em" }}>
              {"Owner & GM"}
            </h3>
            {" "}
            <p data-vid="ai7lt4c" style={{ fontSize: "16px", lineHeight: "1.55", color: "#6B5568" }}>
              {"Set goals and terms, approve offers and bookings, sign off on staffing and prep."}
            </p>
            {" "}
          </div>
          {" "}
          <div data-vid="6jiqs4f" style={{ padding: "32px 28px 8px 0", display: "flex", flexDirection: "column", gap: "14px" }}>
            {" "}
            <span data-vid="wh78j7n" style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#F2937A" }}></span>
            {" "}
            <h3 data-vid="3k6lxnc" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.02em" }}>
              {"Partnership Coordinator"}
            </h3>
            {" "}
            <p data-vid="3pj16s1" style={{ fontSize: "16px", lineHeight: "1.55", color: "#6B5568" }}>
              {"Submit goals, review matches, and approve each outbound message to a partner group."}
            </p>
            {" "}
          </div>
          {" "}
          <div data-vid="q9cogc0" style={{ padding: "32px 28px 8px 0", display: "flex", flexDirection: "column", gap: "14px" }}>
            {" "}
            <span data-vid="vg0q9pl" style={{ width: "60px", height: "40px", borderRadius: "999px", background: "#D4A94E" }}></span>
            {" "}
            <h3 data-vid="mgm6xqm" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.02em" }}>
              {"Marketing & Sales"}
            </h3>
            {" "}
            <p data-vid="bwq2inx" style={{ fontSize: "16px", lineHeight: "1.55", color: "#6B5568" }}>
              {"Track social analytics as KPIs that sharpen partner targeting and messaging."}
            </p>
            {" "}
          </div>
          {" "}
          <div data-vid="q8oq9r9" style={{ padding: "32px 28px 8px 0", display: "flex", flexDirection: "column", gap: "14px" }}>
            {" "}
            <span data-vid="mlmx2j3" style={{ width: "40px", height: "40px", borderRadius: "12px 12px 12px 2px", background: "#7E9671" }}></span>
            {" "}
            <h3 data-vid="ip3vn2j" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.02em" }}>
              {"System Administrator"}
            </h3>
            {" "}
            <p data-vid="zh5rdo2" style={{ fontSize: "16px", lineHeight: "1.55", color: "#6B5568" }}>
              {"Run the Admin CRM: vet restaurants into the directory, track manual billing, moderate usage, choose the assistant\u2019s AI model."}
            </p>
            {" "}
          </div>
          {" "}
        </div>
        {" "}
      </section>
      {" "}
      <section data-vid="n9hx5yl" id="signin" data-screen-label="Closing CTA" style={{ padding: "0 clamp(10px,1.6vw,24px) clamp(10px,1.6vw,24px)" }}>
        {" "}
        <div data-vid="7gshyv4" style={{ background: "#492C48", color: "#FFF7EB", borderRadius: "clamp(28px,3vw,44px)", position: "relative", overflow: "hidden", padding: "clamp(64px,9vw,128px) clamp(20px,4vw,48px)" }}>
          {" "}
          {(showShapes) && (
            <>
              {" "}
              <span data-vid="5an029d" style={{ position: "absolute", left: "-40px", bottom: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "#F3B58C" }}></span>
              {" "}
              <span data-vid="i4eh7sc" style={{ position: "absolute", left: "150px", bottom: "-24px", width: "120px", height: "64px", borderRadius: "999px", background: "#D4A94E" }}></span>
              {" "}
              <span data-vid="u78c7k2" style={{ position: "absolute", right: "-30px", top: "40px", width: "120px", height: "120px", borderRadius: "32px", background: "#7E9671" }}></span>
              {" "}
              <span data-vid="jsuisc5" style={{ position: "absolute", right: "110px", top: "-30px", width: "80px", height: "80px", borderRadius: "50%", background: "#F2937A" }}></span>
              {" "}
            </>
          )}
          {" "}
          <div data-vid="hvz2i80" style={{ position: "relative", maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "28px" }}>
            {" "}
            <h2 data-vid="5sfwno6" style={{ fontFamily: "'Outfit',sans-serif", fontWeight: "700", fontSize: "clamp(40px,5.6vw,80px)", lineHeight: "0.98", letterSpacing: "-0.045em", textWrap: "balance" }}>
              {"Fill the quiet nights. Keep every decision."}
            </h2>
            {" "}
            <p data-vid="jg3greh" style={{ fontSize: "19px", lineHeight: "1.55", color: "rgba(255,247,235,0.82)", maxWidth: "560px", textWrap: "pretty" }}>
              {"Sign in to set your first goal and see which neighbors fit your calendar."}
            </p>
            {" "}
            <div data-vid="vycqro0" style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center" }}>
              {" "}
              <a data-vid="9a0i7da" href={loginHref} style={{ display: "flex", alignItems: "center", gap: "14px", fontFamily: "'Outfit',sans-serif", fontSize: "18px", fontWeight: "500", background: "#FFF7EB", color: "#492C48", padding: "18px 30px", borderRadius: "999px" }} className="fth-4">
                {"Sign in to plan bookings"}
                <span data-vid="n9wx0dk" style={{ fontSize: "20px" }}>
                  {"\u2192"}
                </span>
              </a>
              {" "}
              <a data-vid="s80z8wh" href="/contact-us" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "17px", fontWeight: "500", color: "#FFF7EB", padding: "17px 26px", borderRadius: "999px", border: "1.5px solid rgba(255,247,235,0.35)" }} className="fth-5">
                {"Contact us"}
              </a>
              {" "}
            </div>
            {" "}
          </div>
          {" "}
        </div>
        {" "}
      </section>
      {" "}
      <footer data-vid="cqr0c4q" id="contact" data-screen-label="Footer" style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px clamp(20px,4vw,48px) 56px", display: "flex", flexDirection: "column", gap: "32px" }}>
        {" "}
        <div data-vid="x642i7u" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "24px" }}>
          {" "}
          <div data-vid="msk6cay" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {" "}
            <span data-vid="ehmmqu6" style={{ fontFamily: "'Outfit',sans-serif", fontWeight: "700", fontSize: "24px", letterSpacing: "-0.035em", display: "flex", alignItems: "flex-start", gap: "3px" }}>
              {"FullTable"}
              <span data-vid="dp8epwx" style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "0", color: "#E57F63", marginTop: "1px" }}>
                {"AI"}
              </span>
            </span>
            {" "}
            <span data-vid="y8hzba9" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "12px", fontWeight: "500", letterSpacing: "0.32em", textTransform: "uppercase", color: "#6B5568" }}>
              {"People bring places to life"}
            </span>
            {" "}
          </div>
          {" "}
          <div data-vid="xwxr9g1" style={{ display: "flex", flexWrap: "wrap", gap: "24px", fontSize: "15px", fontWeight: "500" }}>
            {" "}
            <a data-vid="39n9g48" href="#how">
              {"How it works"}
            </a>
            <a data-vid="56r64ov" href="#sourcing">
              {"Event sourcing"}
            </a>
            <a data-vid="8wz011b" href="#insights">
              {"Insights"}
            </a>
            <a data-vid="aeeeqov" href="mailto:hello@fulltable.ai">
              {"hello@fulltable.ai"}
            </a>
            {" "}
          </div>
          {" "}
        </div>
        {" "}
        <p data-vid="s923653" style={{ fontSize: "14px", lineHeight: "1.55", color: "#6B5568", paddingTop: "24px", borderTop: "1px solid rgba(73,44,72,0.12)" }}>
          {"Internal prototype for fictional Lumen Table. Outreach is simulated and economic insights are illustrative."}
        </p>
        {" "}
      </footer>
      {" "}
      {(showAssistant) && (
        <>
          {" "}
          {(chatClosed) && (
            <>
              {" "}
              <button data-vid="qjtf9tp" onClick={openChat} style={{ all: "unset", cursor: "pointer", position: "fixed", right: "clamp(14px,2vw,28px)", bottom: "clamp(14px,2vw,28px)", zIndex: "40", display: "flex", alignItems: "center", gap: "12px", background: "#492C48", color: "#FFF7EB", padding: "12px 22px 12px 12px", borderRadius: "999px", fontFamily: "'Outfit',sans-serif", fontSize: "16px", fontWeight: "500", boxShadow: "0 18px 40px -16px rgba(46,26,46,0.6)" }}>
                {" "}
                <span data-vid="wrleiqi" style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#F3B58C", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span data-vid="8zcwnia" style={{ width: "12px", height: "12px", borderRadius: "4px", background: "#492C48" }}></span>
                </span>
                {"Ask FullTable "}
              </button>
              {" "}
            </>
          )}
          {" "}
          {(chatOpen) && (
            <>
              {" "}
              <div data-vid="xbb7odz" style={{ position: "fixed", right: "clamp(10px,2vw,28px)", bottom: "clamp(10px,2vw,28px)", zIndex: "40", width: "min(380px,calc(100vw - 20px))", height: "min(540px,calc(100vh - 100px))", background: "#FFFCF6", border: "1px solid rgba(73,44,72,0.12)", borderRadius: "28px", boxShadow: "0 30px 70px -24px rgba(46,26,46,0.5)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {" "}
                <div data-vid="fgoyjr2" style={{ background: "#492C48", color: "#FFF7EB", padding: "18px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
                  {" "}
                  <span data-vid="7ujzrq9" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#F3B58C", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <span data-vid="h73m7q4" style={{ width: "12px", height: "12px", borderRadius: "4px", background: "#492C48" }}></span>
                  </span>
                  {" "}
                  <div data-vid="qk45oxd" style={{ display: "flex", flexDirection: "column", gap: "2px", flex: "1" }}>
                    <span data-vid="7vlj6vq" style={{ fontFamily: "'Outfit',sans-serif", fontSize: "17px", fontWeight: "600" }}>
                      {"FullTable Assistant"}
                    </span>
                  </div>
                  {" "}
                  <button data-vid="dnw4q57" onClick={closeChat} aria-label="Close" style={{ all: "unset", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", background: "rgba(255,247,235,0.12)" }}>
                    {"\u00d7"}
                  </button>
                  {" "}
                </div>
                {" "}
                <div data-vid="f2dr4zo" ref={chatRef} style={{ flex: "1", overflowY: "auto", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {" "}
                  {(msgs).map((m, __i) => (
                    <React.Fragment data-vid="15nchoz" key={__i}>
                      {" "}
                      <div data-vid="x1m0uot" style={{ alignSelf: `${m.align}`, maxWidth: "86%", background: `${m.bg}`, color: `${m.fg}`, padding: "11px 15px", borderRadius: "18px", fontSize: "15px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                        {m.text}
                      </div>
                      {" "}
                    </React.Fragment>
                  ))}
                  {" "}
                  {(busy) && (
                    <>
                      {" "}
                      <div data-vid="rq9fcwg" style={{ alignSelf: "flex-start", background: "#F6EBDD", padding: "11px 15px", borderRadius: "18px", fontSize: "15px", color: "#6B5568", animation: "ftPulse 1.4s ease-in-out infinite" }}>
                        {"Thinking\u2026"}
                      </div>
                      {" "}
                    </>
                  )}
                  {" "}
                </div>
                {" "}
                <div data-vid="y9lbeye" style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "0 18px 12px" }}>
                  {" "}
                  {(prompts).map((q, __i) => (
                    <React.Fragment data-vid="j0opqyx" key={__i}>
                      {" "}
                      <button data-vid="tt18ien" onClick={q.ask} style={{ all: "unset", cursor: "pointer", fontSize: "13px", fontWeight: "500", padding: "7px 12px", borderRadius: "999px", border: "1px solid rgba(73,44,72,0.2)", color: "#492C48" }} className="fth-6">
                        {q.p}
                      </button>
                      {" "}
                    </React.Fragment>
                  ))}
                  {" "}
                </div>
                {" "}
                <div data-vid="zdmolxh" style={{ display: "flex", gap: "8px", padding: "12px", borderTop: "1px solid rgba(73,44,72,0.1)" }}>
                  {" "}
                  <input data-vid="b83blj6" value={input} onChange={onInput} onKeyDown={onKey} placeholder="Ask about bookings, sourcing, insights…" style={{ flex: "1", minWidth: "0", border: "1px solid rgba(73,44,72,0.18)", background: "#FFF7EB", borderRadius: "999px", padding: "12px 16px", font: "inherit", fontSize: "15px", color: "#492C48", outline: "none" }} />
                  {" "}
                  <button data-vid="18lnx3j" onClick={sendNow} aria-label="Send" style={{ all: "unset", cursor: "pointer", width: "44px", height: "44px", borderRadius: "50%", background: "#492C48", color: "#FFF7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flex: "none" }}>
                    {"\u2192"}
                  </button>
                  {" "}
                </div>
                {" "}
              </div>
              {" "}
            </>
          )}
          {" "}
        </>
      )}
      {" "}
      </div>
    );
  }
}

/** @param {{ loginHref?: string, showShapes?: boolean, showAssistant?: boolean, assistantModel?: string }} props */
export function FullTableLanding(props) {
  const ask = useLandingAssistant();
  return <FullTableLandingInner data-vid="tuh1ebh" {...props} ask={ask} />;
}

export default FullTableLanding;
