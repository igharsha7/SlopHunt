#!/usr/bin/env node
/**
 * Assembles the 60s launch composition from audio_meta.json.
 *
 * Frame starts and durations come from MEASURED narration, never estimates, so
 * every cut lands on the sentence it belongs to. Karaoke captions read their
 * word timings from the same file.
 *
 * Design contract (see STORYBOARD.md § Video direction):
 *   paper is the ground · yellow is the ONLY highlight · orange is the verdict
 *   4px ink borders · 8px hard offset shadows · square corners · one tilt max
 */
import { readFile, writeFile } from "node:fs/promises";

const C = {
  ink: "#000000",
  paper: "#EEEEEC",
  white: "#FFFFFF",
  sun: "#EBD22F",
  pop: "#FB4A16",
  grape: "#4D17F5",
  candy: "#FA9DCD",
};

const round = (n) => Math.round(n * 100) / 100;
const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const meta = JSON.parse(await readFile("audio_meta.json", "utf8"));
const F = Object.fromEntries(meta.frames.map((f) => [f.frame, f]));
const TOTAL = round(meta.totalDuration);

/* ------------------------------------------------------------- captions */
/**
 * Karaoke band. Inactive words are ink at 55%; the active word is ink on a
 * solid yellow block — dark-on-light, readable at phone size. White-on-accent
 * was explicitly rejected as unreadable.
 */
function captions() {
  let html = "";
  let tweens = "";

  for (const f of meta.frames) {
    const wordSpans = f.words
      .map((w, i) => `<span class="kw" id="k${f.frame}-${i}">${esc(w.word)}</span>`)
      .join(" ");

    html += `      <div class="clip cap" id="cap-${f.frame}" data-start="${f.start}" data-duration="${round(f.duration + 0.25)}" data-track-index="3">
        <div class="cap-inner">${wordSpans}</div>
      </div>\n`;

    for (let i = 0; i < f.words.length; i++) {
      const w = f.words[i];
      tweens += `  tl.set("#k${f.frame}-${i}", { backgroundColor: "${C.sun}", color: "${C.ink}", opacity: 1 }, ${round(w.start)})
     .set("#k${f.frame}-${i}", { backgroundColor: "transparent", color: "${C.ink}", opacity: 0.55 }, ${round(w.start + w.duration)});\n`;
    }
  }
  return { html, tweens };
}

/* ---------------------------------------------------------------- frames */
function frame(n, inner, bg = C.paper, fg = C.ink) {
  const f = F[n];
  // Derive the duration from the NEXT frame's start rather than summing
  // duration + gap independently: the two rounded to different values (16.93
  // vs 16.92) and the clips overlapped by a hundredth, which the renderer
  // rejects. Butting them start-to-start makes the seam exact by construction.
  const next = F[n + 1];
  const dur = next ? round(next.start - f.start) : round(TOTAL - f.start);
  return `      <div class="clip frame" id="f${n}" data-start="${f.start}" data-duration="${dur}" data-track-index="1" style="background:${bg};color:${fg}">
        <div class="inner">
${inner}
        </div>
      </div>\n`;
}

const cap = captions();

const frames =
  /* 1 — HOOK */
  frame(
    1,
    `          <div class="grid-bg"></div>
          <div class="pad">
            <div class="h1 f1a">EVERY LAUNCH PAGE</div>
            <div class="h1 f1b">TELLS YOU YOUR PROJECT</div>
            <div class="h1 f1c">IS BRILLIANT.</div>
            <div class="h1 f1d">NONE OF THEM HAVE READ<br/>YOUR <em class="hl">COMMIT HISTORY</em>.</div>
            <img class="f1mark" src="assets/wordmark.png" alt="SlopHunt"/>
          </div>`,
  ) +
  /* 2 — PROBLEM (full-bleed purple) */
  frame(
    2,
    `          <div class="pad center">
            <div class="h1 big f2t">PRODUCT HUNT IS<br/>A HYPE MACHINE</div>
            <div class="pills">
              <div class="pill p1">Congrats on the launch!</div>
              <div class="pill p2">Shipped it!</div>
              <div class="pill p3">Love this!</div>
            </div>
            <div class="h2 f2b">NOBODY MENTIONS THE DEMO<br/>DIED <em class="hl">FOURTEEN MONTHS</em> AGO.</div>
          </div>`,
    C.grape,
    C.paper,
  ) +
  /* 3 — HOW (parallel agents) */
  frame(
    3,
    `          <div class="grid-bg"></div>
          <div class="pad">
            <div class="label f3l">STEP 01 — PASTE A URL</div>
            <div class="urlcard f3u"><span class="urltext" id="typed"></span><span class="caret">|</span></div>
            <div class="cols">
              <div class="col c1"><div class="ct">REPO<br/>CRAWLER</div><div class="cv" id="n1">0</div><div class="cl">COMMITS</div></div>
              <div class="col c2"><div class="ct">SITE<br/>CRAWLER</div><div class="cv" id="n2">0</div><div class="cl">SCREENSHOTS</div></div>
              <div class="col c3"><div class="ct">ORIGINALITY<br/>AGENT</div><div class="cv" id="n3">0</div><div class="cl">RECEIPTS</div></div>
              <div class="col c4"><div class="ct">ANALYSIS<br/>AGENT</div><div class="cv" id="n4">0</div><div class="cl">SUB-SCORES</div></div>
            </div>
            <div class="h2 f3b">FOUR AGENTS. <em class="hl">ALL AT ONCE.</em></div>
          </div>`,
  ) +
  /* 4 — SCORE */
  frame(
    4,
    `          <div class="grid-bg"></div>
          <div class="pad row">
            <div class="scard f4c">
              <div class="slabel">SLOP SCORE</div>
              <div class="snum" id="score">0</div>
              <div class="sverdict">ANNOYINGLY GOOD</div>
              <div class="bars">
                <div class="bar"><span>ORIGINALITY DEFICIT</span><i class="b1"></i></div>
                <div class="bar"><span>ABANDONMENT INDEX</span><i class="b2"></i></div>
                <div class="bar"><span>README COPE</span><i class="b3"></i></div>
                <div class="bar"><span>COMMIT POETRY</span><i class="b4"></i></div>
                <div class="bar"><span>VIBE CHECK</span><i class="b5"></i></div>
              </div>
            </div>
            <div class="side">
              <div class="h2 f4a">COMPUTED FROM<br/>DATES AND COUNTS.</div>
              <div class="h1 f4b"><em class="hl">NOT VIBES.</em></div>
            </div>
          </div>`,
  ) +
  /* 5 — EVIDENCE */
  frame(
    5,
    `          <div class="grid-bg"></div>
          <div class="pad">
            <div class="tag f5tag">EVIDENCE LOG</div>
            <div class="rows">
              <div class="erow e1"><b>01</b><span>Commit: &ldquo;fix&rdquo; &times; 9</span><i></i></div>
              <div class="erow e2"><b>02</b><span>Demo link returns nothing</span><i></i></div>
              <div class="erow e3"><b>03</b><span>Three projects already do this</span><i></i></div>
            </div>
            <div class="receipts">
              <div class="rc r1">roast-my-repo</div>
              <div class="rc r2">gitroast/cli</div>
              <div class="rc r3">repo-critic</div>
            </div>
            <div class="h2 f5b">EVERY JOKE <em class="hl">CITES EVIDENCE.</em></div>
          </div>`,
  ) +
  /* 6 — VIDEO + LEADERBOARD */
  frame(
    6,
    `          <div class="grid-bg"></div>
          <div class="pad split">
            <div class="phone f6p">
              <div class="pbeat pb1">ALREADY A COVER BAND.</div>
              <div class="pbeat pb2">NINE COMMITS JUST SAY FIX.</div>
              <div class="pbeat pb3">SLOP SCORE: SIXTEEN.</div>
            </div>
            <div class="board">
              <div class="pod pod2"><b>2</b><span>28</span></div>
              <div class="pod pod1"><b>1</b><span>16</span></div>
              <div class="pod pod3"><b>3</b><span>—</span></div>
              <div class="h2 f6b">RANKED IN <em class="hl">PUBLIC.</em></div>
            </div>
          </div>`,
  ) +
  /* 7 — CTA (full-bleed yellow) */
  frame(
    7,
    `          <div class="pad center">
            <img class="f7mark" src="assets/wordmark.png" alt="SlopHunt"/>
            <div class="h1 f7a">SUBMIT YOUR REPO.</div>
            <div class="h1 f7b">GET ROASTED.</div>
            <div class="h1 f7c">GET RANKED.</div>
            <div class="urlpill f7d">slophunt.vercel.app</div>
          </div>`,
    C.sun,
    C.ink,
  );

/* ------------------------------------------------------------------ HTML */
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      html,body{width:1920px;height:1080px;overflow:hidden;background:${C.paper};
        font-family:"Inter",sans-serif;color:${C.ink}}
      .clip{position:absolute;inset:0}
      .frame{display:flex}
      .inner{position:relative;width:100%;height:100%;display:flex}
      .pad{position:relative;z-index:2;width:100%;height:100%;padding:110px 130px 240px;
        display:flex;flex-direction:column;justify-content:center}
      .center{align-items:center;text-align:center}
      .row{flex-direction:row;align-items:center;gap:80px}
      .split{flex-direction:row;align-items:center;gap:70px}

      /* graph paper — the site's own ground */
      .grid-bg{position:absolute;inset:0;z-index:1;
        background-image:linear-gradient(to right,rgba(0,0,0,.05) 1px,transparent 1px),
                         linear-gradient(to bottom,rgba(0,0,0,.05) 1px,transparent 1px);
        background-size:120px 120px}

      .h1{font-family:"Oswald",sans-serif;font-weight:900;text-transform:uppercase;
        font-size:96px;line-height:1.02;letter-spacing:-.02em}
      .h1.big{font-size:120px}
      .h2{font-family:"Oswald",sans-serif;font-weight:700;text-transform:uppercase;
        font-size:56px;line-height:1.1;letter-spacing:-.01em}
      .label{font-family:"Inter",sans-serif;font-weight:700;font-size:22px;
        letter-spacing:.18em;text-transform:uppercase;color:#555}
      /* yellow block = the one highlight. ink on yellow, never white on accent. */
      em.hl{font-style:normal;background:${C.sun};color:${C.ink};padding:0 .12em;
        box-decoration-break:clone;-webkit-box-decoration-break:clone}

      .f1d{margin-top:38px}
      .f1mark{position:absolute;left:130px;bottom:250px;width:300px}

      .pills{display:flex;gap:26px;margin:52px 0 46px}
      .pill{background:${C.white};color:${C.ink};border:4px solid ${C.ink};
        box-shadow:8px 8px 0 ${C.ink};padding:20px 34px;font-size:26px;font-weight:700}
      .p1{transform:rotate(-2deg)}.p2{transform:rotate(1.5deg)}.p3{transform:rotate(-1deg)}

      .urlcard{background:${C.white};border:4px solid ${C.ink};box-shadow:8px 8px 0 ${C.ink};
        padding:26px 34px;font-size:34px;font-weight:700;width:860px;margin:26px 0 54px;
        transform:rotate(-1.2deg);white-space:nowrap;overflow:hidden}
      .caret{color:${C.pop}}
      .cols{display:grid;grid-template-columns:repeat(4,1fr);gap:26px}
      .col{background:${C.white};border:4px solid ${C.ink};box-shadow:8px 8px 0 ${C.ink};padding:28px}
      .ct{font-family:"Oswald",sans-serif;font-weight:700;text-transform:uppercase;font-size:28px;line-height:1.1}
      .cv{font-family:"Oswald",sans-serif;font-weight:900;font-size:76px;line-height:1;margin-top:14px}
      .cl{font-size:18px;letter-spacing:.12em;text-transform:uppercase;color:#666;margin-top:4px}
      .f3b{margin-top:48px}
      .f3l{margin-bottom:6px}

      .scard{background:${C.white};border:4px solid ${C.ink};box-shadow:12px 12px 0 ${C.ink};
        padding:44px;width:720px}
      .slabel{font-size:22px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#666}
      /* orange = the verdict, and only here + the crime markers */
      .snum{font-family:"Oswald",sans-serif;font-weight:900;font-size:230px;line-height:.86;color:${C.pop}}
      .sverdict{font-family:"Oswald",sans-serif;font-weight:700;font-size:34px;text-transform:uppercase;
        border:4px solid ${C.ink};display:inline-block;padding:8px 24px;margin-top:10px}
      .bars{margin-top:34px;display:flex;flex-direction:column;gap:16px}
      .bar{display:flex;flex-direction:column;gap:7px}
      .bar span{font-size:19px;font-weight:700;letter-spacing:.09em;text-transform:uppercase}
      .bar i{display:block;height:16px;background:${C.sun};border:3px solid ${C.ink};transform-origin:left center}
      .side{flex:1}
      .f4b{margin-top:26px}

      .tag{display:inline-block;background:${C.sun};border:4px solid ${C.ink};box-shadow:8px 8px 0 ${C.ink};
        font-family:"Oswald",sans-serif;font-weight:700;font-size:30px;letter-spacing:.16em;
        text-transform:uppercase;padding:14px 30px;transform:rotate(2deg);align-self:flex-start}
      .rows{margin-top:52px;display:flex;flex-direction:column;gap:26px}
      .erow{position:relative;display:flex;align-items:baseline;gap:28px;padding-bottom:14px}
      .erow b{font-family:"Oswald",sans-serif;font-weight:900;font-size:42px;color:#D93A0C}
      .erow span{font-size:38px;font-weight:700}
      .erow i{position:absolute;left:0;bottom:0;height:4px;width:100%;background:${C.ink};transform-origin:left center}
      .receipts{display:flex;gap:22px;margin-top:38px}
      .rc{background:${C.white};border:4px solid ${C.ink};box-shadow:8px 8px 0 ${C.ink};
        padding:20px 28px;font-size:24px;font-weight:700}
      .f5b{margin-top:46px}

      .phone{width:420px;height:740px;background:${C.grape};border:4px solid ${C.ink};
        box-shadow:12px 12px 0 ${C.ink};position:relative;overflow:hidden;transform:rotate(-2deg)}
      .pbeat{position:absolute;inset:0;display:flex;align-items:center;padding:44px;
        font-family:"Oswald",sans-serif;font-weight:900;text-transform:uppercase;
        font-size:54px;line-height:1.06;color:${C.paper}}
      .pb2{background:${C.sun};color:${C.ink}}
      .pb3{background:${C.candy};color:${C.ink}}
      .board{flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;align-items:end}
      .pod{border:4px solid ${C.ink};box-shadow:8px 8px 0 ${C.ink};padding:28px;text-align:center}
      .pod b{display:block;font-family:"Oswald",sans-serif;font-weight:700;font-size:30px}
      .pod span{display:block;font-family:"Oswald",sans-serif;font-weight:900;font-size:88px;line-height:1;color:${C.pop}}
      .pod1{background:${C.sun};height:280px;transform:translateY(-26px)}
      .pod2{background:${C.candy};height:210px}
      .pod3{background:${C.white};height:180px}
      .f6b{grid-column:1/-1;margin-top:34px}

      .f7mark{width:640px}
      .f7a,.f7b,.f7c{margin-top:14px;font-size:82px}
      .urlpill{margin-top:44px;background:${C.ink};color:${C.sun};border:4px solid ${C.ink};
        box-shadow:8px 8px 0 ${C.white};font-family:"Oswald",sans-serif;font-weight:700;
        font-size:40px;letter-spacing:.06em;padding:20px 44px}

      /* karaoke band — fixed lower keep-out, ink on yellow when active */
      /* The band carries its own paper ground. Without it, inactive words sat
         at ink-55% directly on whatever the frame ground was — 2.76:1 on the
         purple frame, unreadable. A backed band is contrast-safe everywhere
         and doubles as a deliberate lower-third. */
      .cap{z-index:5;display:flex;align-items:flex-end;justify-content:center;padding-bottom:64px}
      .cap-inner{max-width:1480px;text-align:center;font-family:"Inter",sans-serif;
        font-weight:700;font-size:38px;line-height:1.4;
        background:${C.paper};border:4px solid ${C.ink};box-shadow:8px 8px 0 ${C.ink};
        padding:22px 34px}
      .kw{color:${C.ink};opacity:.5;padding:2px 6px}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}"
         data-width="1920" data-height="1080">
      <audio id="vo" class="clip" src="audio/mix.wav" data-start="0" data-duration="${TOTAL}" data-track-index="0"></audio>
${frames}${cap.html}    </div>

    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      // Frame start times, measured from the narration.
      const STARTS = ${JSON.stringify(Object.fromEntries(meta.frames.map((f) => [f.frame, f.start])))};
      const S = (n) => STARTS[n];

      /* 1 — hook: clause by clause, then the turn */
      tl.from("#f1 .f1a",{opacity:0,y:44,duration:.24,ease:"power4.out"},S(1)+.15)
        .from("#f1 .f1b",{opacity:0,y:44,duration:.24,ease:"power4.out"},S(1)+.75)
        .from("#f1 .f1c",{opacity:0,y:44,duration:.24,ease:"power4.out"},S(1)+1.35)
        .from("#f1 .f1d",{opacity:0,y:40,duration:.3,ease:"power4.out"},S(1)+3.5)
        .from("#f1 .f1mark",{opacity:0,duration:.4},S(1)+5.4);

      /* 2 — problem */
      tl.from("#f2 .f2t",{opacity:0,scale:.92,duration:.34,ease:"back.out(1.6)"},S(2)+.2)
        .from("#f2 .pill",{opacity:0,y:34,duration:.3,stagger:.12,ease:"back.out(1.5)"},S(2)+2.4)
        .to("#f2 .pills",{opacity:.3,duration:.4},S(2)+5.4)
        .from("#f2 .f2b",{opacity:0,y:30,duration:.3,ease:"power4.out"},S(2)+5.6);

      /* 3 — how: type, then FOUR columns land near-simultaneously */
      const url="github.com/nickthelegend/loom", typed={i:0};
      tl.from("#f3 .f3l",{opacity:0,duration:.25},S(3)+.1)
        .from("#f3 .f3u",{opacity:0,y:26,duration:.28,ease:"power4.out"},S(3)+.3)
        .to(typed,{i:url.length,duration:1.5,ease:"none",
          onUpdate:()=>{document.getElementById("typed").textContent=url.slice(0,Math.round(typed.i));}},S(3)+.8)
        .to("#f3 .f3u",{y:6,boxShadow:"2px 2px 0 #000",duration:.1},S(3)+2.5)
        .to("#f3 .f3u",{y:0,boxShadow:"8px 8px 0 #000",duration:.14},S(3)+2.62)
        .from("#f3 .col",{opacity:0,scale:.9,duration:.3,stagger:.03,ease:"back.out(1.7)"},S(3)+3.1);
      [["n1",100],["n2",0],["n3",3],["n4",5]].forEach(([id,to],k)=>{
        const o={v:0};
        tl.to(o,{v:to,duration:1.1,ease:"power3.out",
          onUpdate:()=>{document.getElementById(id).textContent=Math.round(o.v);}},S(3)+4.4+k*.12);
      });
      tl.from("#f3 .f3b",{opacity:0,y:26,duration:.3,ease:"power4.out"},S(3)+7.4);

      /* 4 — score: the count-up is the hero, everything else waits */
      const sc={v:0};
      tl.from("#f4 .f4c",{opacity:0,y:40,duration:.34,ease:"back.out(1.8)"},S(4)+.1)
        .to(sc,{v:16,duration:1.5,ease:"power3.out",
          onUpdate:()=>{document.getElementById("score").textContent=Math.round(sc.v);}},S(4)+.5)
        .from("#f4 .sverdict",{opacity:0,duration:.26},S(4)+2.1)
        .fromTo("#f4 .bar i",{scaleX:0},{scaleX:1,duration:.44,stagger:.1,ease:"power3.out"},S(4)+2.4)
        .from("#f4 .f4a",{opacity:0,y:28,duration:.3,ease:"power4.out"},S(4)+5.0)
        .from("#f4 .f4b",{opacity:0,y:24,duration:.3,ease:"power4.out"},S(4)+6.2);

      /* 5 — evidence: rows land, each underlining itself */
      tl.from("#f5 .f5tag",{opacity:0,scale:.86,duration:.3,ease:"back.out(2)"},S(5)+.1);
      ["e1","e2","e3"].forEach((c,k)=>{
        tl.from("#f5 ."+c,{opacity:0,x:-30,duration:.28,ease:"power4.out"},S(5)+.6+k*.75)
          .fromTo("#f5 ."+c+" i",{scaleX:0},{scaleX:1,duration:.4,ease:"power3.out"},S(5)+.7+k*.75);
      });
      tl.from("#f5 .rc",{opacity:0,y:26,duration:.28,stagger:.1,ease:"back.out(1.5)"},S(5)+4.6)
        .from("#f5 .f5b",{opacity:0,y:26,duration:.3,ease:"power4.out"},S(5)+6.6);

      /* 6 — the product's own video, cutting inside the frame */
      tl.from("#f6 .f6p",{opacity:0,y:40,duration:.32,ease:"back.out(1.6)"},S(6)+.1);
      [["pb1",0],["pb2",1],["pb3",2]].forEach(([c,k])=>{
        tl.set("#f6 ."+c,{opacity:1},S(6)+.4+k*.8)
          .set("#f6 ."+c,{opacity:0},S(6)+1.2+k*.8);
      });
      tl.set("#f6 .pb3",{opacity:1},S(6)+2.8)
        .from("#f6 .pod2",{opacity:0,y:30,duration:.28,ease:"back.out(1.6)"},S(6)+1.6)
        .from("#f6 .pod1",{opacity:0,y:40,duration:.32,ease:"back.out(1.8)"},S(6)+1.75)
        .from("#f6 .pod3",{opacity:0,y:24,duration:.26,ease:"back.out(1.6)"},S(6)+1.9)
        .from("#f6 .f6b",{opacity:0,duration:.3},S(6)+3.2);

      /* 7 — land it */
      tl.from("#f7 .f7mark",{opacity:0,scale:.86,duration:.42,ease:"back.out(1.8)"},S(7)+.1)
        .from("#f7 .f7a",{opacity:0,y:26,duration:.24,ease:"power4.out"},S(7)+.7)
        .from("#f7 .f7b",{opacity:0,y:26,duration:.24,ease:"power4.out"},S(7)+1.0)
        .from("#f7 .f7c",{opacity:0,y:26,duration:.24,ease:"power4.out"},S(7)+1.3)
        .from("#f7 .f7d",{opacity:0,y:22,duration:.3,ease:"back.out(1.6)"},S(7)+1.9);

      /* karaoke highlight */
${cap.tweens}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;

await writeFile("index.html", html);
console.log(JSON.stringify({ total: TOTAL, frames: meta.frames.length, bytes: html.length }));
