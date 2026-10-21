// CryptoView shared module: navigation, theme, currency, cached market data, watchlist
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => {
  const d = document.createElement("div");
  d.textContent = v ?? "";
  return d.innerHTML;
};
const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};
const START_CASH = 10000000; // practice wallet starting balance (USD)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let cur = store.get("cv_cur", "USD"),
  rate = store.get("cv_rate", null);
document.documentElement.dataset.theme = store.get("cv_theme", "light");
window.cvRender = () => {};

async function getJSON(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error("The data server returned an error (" + r.status + ").");
      return await r.json();
    } catch (e) {
      if (i >= tries) throw e;
      await sleep(800 * i);
    }
  }
}
// Currency rates: fawazahmed0 exchange-api (https://github.com/fawazahmed0/exchange-api), Frankfurter as PHP fallback
const FX_URLS = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
  "https://latest.currency-api.pages.dev/v1/currencies/usd.json",
];
let fxCache = store.get("cv_fx", null);
async function getFx() {
  if (fxCache && Date.now() - fxCache.t < 3600000) return fxCache.rates;
  for (const u of FX_URLS) {
    try {
      const d = await getJSON(u, 1);
      if (d.usd && d.usd.php) {
        fxCache = { t: Date.now(), rates: d.usd };
        store.set("cv_fx", fxCache);
        rate = d.usd.php;
        store.set("cv_rate", rate);
        return d.usd;
      }
    } catch {}
  }
  try {
    const d = await getJSON("https://api.frankfurter.dev/v1/latest?base=USD&symbols=PHP", 1);
    rate = d.rates.PHP;
    store.set("cv_rate", rate);
    return { php: rate };
  } catch {}
  return fxCache ? fxCache.rates : rate ? { php: rate } : null;
}
async function getRate() {
  const r = await getFx();
  if (r && r.php) rate = r.php;
  return rate;
}
// Shrink text until it fits on one line inside its container
function fitText(el) {
  if (!el) return;
  el.style.fontSize = "";
  let s = parseFloat(getComputedStyle(el).fontSize);
  while (el.scrollWidth > el.clientWidth && s > 12) {
    s -= 1;
    el.style.fontSize = s + "px";
  }
}
async function getMarket(force) {
  const c = store.get("cv_mkt", null);
  if (!force && c && Date.now() - c.t < 60000) return { coins: c.d, stale: false };
  try {
    const d = await getJSON("https://api.coinpaprika.com/v1/tickers?limit=50");
    const coins = d.map((x) => ({
      id: x.id,
      name: x.name,
      symbol: x.symbol,
      rank: x.rank,
      price: x.quotes.USD.price,
      c24: x.quotes.USD.percent_change_24h,
      c7: x.quotes.USD.percent_change_7d,
      cap: x.quotes.USD.market_cap,
    }));
    store.set("cv_mkt", { t: Date.now(), d: coins });
    return { coins, stale: false };
  } catch (e) {
    if (c) return { coins: c.d, stale: true };
    throw e;
  }
}

function money(usd, compact) {
  const p = cur === "PHP" && rate;
  const v = p ? usd * rate : usd,
    s = p ? "₱" : "$";
  if (compact)
    return s + v.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 });
  return (
    s +
    v.toLocaleString(undefined, {
      maximumFractionDigits: Math.abs(v) < 1 ? 6 : 2,
      minimumFractionDigits: 2,
    })
  );
}
const pct = (v) =>
  v == null
    ? "–"
    : `<span class="${v >= 0 ? "up" : "dn"}">${v >= 0 ? "▲" : "▼"} ${Math.abs(v).toFixed(2)}%</span>`;
const getW = () => store.get("cv_watch", []);
const star = (id) => {
  const on = getW().includes(id);
  return `<button class="star" data-id="${esc(id)}" aria-label="Toggle watchlist" aria-pressed="${on}">${on ? "★" : "☆"}</button>`;
};
const coinRow = (c) =>
  `<tr><td>${c.rank}</td><td><a href="coin.html?id=${esc(c.id)}">${esc(c.name)}</a> <small>${esc(c.symbol)}</small></td><td>${money(c.price)}</td><td>${pct(c.c24)}</td><td>${pct(c.c7)}</td><td>${money(c.cap, true)}</td><td>${star(c.id)}</td></tr>`;
function stale(s) {
  const n = $("#notice");
  n.hidden = !s;
  if (s)
    n.textContent =
      "Showing saved data. Live prices could not be loaded, so these values may be outdated.";
}
function fail(e) {
  const n = $("#notice");
  n.hidden = false;
  n.textContent =
    (e && e.message ? e.message : "Something went wrong") +
    " Please check your connection and try again.";
  $$("tbody").forEach((t) => {
    if (t.id === "rows") t.innerHTML = '<tr><td colspan="7">Could not load market data.</td></tr>';
  });
}

document.addEventListener("click", (e) => {
  const b = e.target.closest(".star");
  if (!b) return;
  const w = getW(),
    id = b.dataset.id,
    i = w.indexOf(id);
  i < 0 ? w.push(id) : w.splice(i, 1);
  store.set("cv_watch", w);
  $$(".star").forEach((x) => {
    const on = w.includes(x.dataset.id);
    x.textContent = on ? "★" : "☆";
    x.setAttribute("aria-pressed", on);
  });
  document.dispatchEvent(new Event("cv:watch"));
});
$("#menu-btn").onclick = (e) => {
  const o = $("#nav").classList.toggle("open");
  e.currentTarget.setAttribute("aria-expanded", o);
};
const closeNav = () => {
  $("#nav").classList.remove("open");
  $("#menu-btn").setAttribute("aria-expanded", "false");
};
$$("#nav a").forEach((a) => a.addEventListener("click", closeNav));
$("#scrim").addEventListener("click", closeNav);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeNav();
});
addEventListener("resize", () => {
  if (innerWidth > 699) closeNav();
});
// Tooltips for the icon-only sidebar on tablets
$$("#nav a:not(.logo)").forEach((a) => (a.title = a.lastChild.textContent.trim()));
$("#theme-btn").onclick = () => {
  const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = t;
  store.set("cv_theme", t);
  window.cvRender();
};
$("#cur-btn").textContent = cur;
$("#cur-btn").onclick = () => {
  if (cur === "USD" && !rate) {
    stale(false);
    $("#notice").hidden = false;
    $("#notice").textContent = "The peso rate is not available right now.";
    return;
  }
  cur = cur === "USD" ? "PHP" : "USD";
  store.set("cv_cur", cur);
  $("#cur-btn").textContent = cur;
  window.cvRender();
};

// Shared area chart (canvas) and hover helper
const CPL = 50,
  CPR = 12;
function chartIdx(cv, pts, e) {
  return Math.max(
    0,
    Math.min(
      pts.length - 1,
      Math.round((e.offsetX - CPL) / ((cv.clientWidth - CPL - CPR) / (pts.length - 1))),
    ),
  );
}
function drawChart(cv, pts, hi) {
  if (!cv) return;
  const dpr = devicePixelRatio || 1,
    w = cv.clientWidth,
    h = cv.clientHeight;
  cv.width = w * dpr;
  cv.height = h * dpr;
  const x = cv.getContext("2d");
  x.scale(dpr, dpr);
  if (!pts.length) return;
  const st = getComputedStyle(document.documentElement),
    line = st.getPropertyValue("--chart").trim(),
    fill = st.getPropertyValue("--chartfill").trim(),
    mut = st.getPropertyValue("--muted").trim();
  const p = pts.map((d) => d.p),
    mn = Math.min(...p),
    mx = Math.max(...p),
    pt = 14,
    pb = 24,
    X = (i) => CPL + (i * (w - CPL - CPR)) / (p.length - 1),
    Y = (v) => h - pb - ((v - mn) / (mx - mn || 1)) * (h - pt - pb);
  const path = () => {
    x.beginPath();
    p.forEach((v, i) => (i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v))));
  };
  const g = x.createLinearGradient(0, pt, 0, h - pb);
  g.addColorStop(0, fill);
  g.addColorStop(1, "rgba(0,0,0,0)");
  path();
  x.lineTo(X(p.length - 1), h - pb);
  x.lineTo(X(0), h - pb);
  x.closePath();
  x.fillStyle = g;
  x.fill();
  path();
  x.strokeStyle = line;
  x.lineWidth = 2;
  x.lineJoin = "round";
  x.stroke();
  x.fillStyle = mut;
  x.font = "11px sans-serif";
  [mx, (mx + mn) / 2, mn].forEach((v) => x.fillText(money(v, true), 2, Y(v) + 4));
  x.fillText(new Date(pts[0].t).toLocaleDateString(), CPL, h - 6);
  const e = new Date(pts[p.length - 1].t).toLocaleDateString();
  x.fillText(e, w - CPR - x.measureText(e).width, h - 6);
  if (hi != null) {
    x.setLineDash([4, 4]);
    x.strokeStyle = mut;
    x.beginPath();
    x.moveTo(X(hi), pt);
    x.lineTo(X(hi), h - pb);
    x.stroke();
    x.setLineDash([]);
    x.shadowColor = line;
    x.shadowBlur = 14;
    x.fillStyle = line;
    x.beginPath();
    x.arc(X(hi), Y(p[hi]), 6, 0, 7);
    x.fill();
    x.shadowBlur = 0;
  }
}
$("#top-form").onsubmit = (e) => {
  e.preventDefault();
  location.href = "markets.html?q=" + encodeURIComponent($("#tq").value.trim());
};
