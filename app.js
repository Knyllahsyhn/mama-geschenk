"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const body = document.body;
const leise = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SCHWELLE = 0.8;      // ab diesem Anteil gilt der Streifen als abgerissen
const SPEICHER = "fm-ausgepackt";

const vibriere = (muster) => { try { navigator.vibrate && navigator.vibrate(muster); } catch (_) {} };
const merken = (wert) => { try { wert ? localStorage.setItem(SPEICHER, "1") : localStorage.removeItem(SPEICHER); } catch (_) {} };
const gemerkt = () => { try { return localStorage.getItem(SPEICHER) === "1"; } catch (_) { return false; } };
const themaFarbe = (f) => $('meta[name="theme-color"]').setAttribute("content", f);

/* ───────── Aufreißstreifen ───────── */

const streifen = $("#streifen");
let anteil = 0, zieht = false, startX = 0, startY = 0, startAnteil = 0, breite = 1, letzterRuck = 0;

function zeichneStreifen(hoch = 0) {
  streifen.style.setProperty("--p", (anteil * 100).toFixed(1) + "%");
  streifen.style.setProperty("--q", hoch.toFixed(2));
  streifen.setAttribute("aria-valuenow", Math.round(anteil * 100));
  streifen.classList.toggle("angefangen", anteil > 0.02);
}

function ziehenAuf(neu, hoch) {
  if (body.classList.contains("offen")) return;
  if (neu <= anteil) { zeichneStreifen(hoch); return; }
  anteil = Math.min(neu, 1);
  if (anteil - letzterRuck > 0.06) { vibriere(7); letzterRuck = anteil; }
  zeichneStreifen(hoch);
  if (anteil >= SCHWELLE) oeffnen();
}

streifen.addEventListener("pointerdown", (e) => {
  if (body.classList.contains("offen")) return;
  zieht = true;
  streifen.setPointerCapture(e.pointerId);
  startX = e.clientX; startY = e.clientY; startAnteil = anteil;
  breite = streifen.getBoundingClientRect().width;
  streifen.classList.add("zieht");
  e.preventDefault();
});
streifen.addEventListener("pointermove", (e) => {
  if (!zieht) return;
  const hoch = Math.max(0, Math.min(1, (startY - e.clientY) / 90));
  ziehenAuf(startAnteil + (e.clientX - startX) / breite, hoch);
});
const loslassen = () => { zieht = false; streifen.classList.remove("zieht"); zeichneStreifen(0); };
streifen.addEventListener("pointerup", loslassen);
streifen.addEventListener("pointercancel", loslassen);
streifen.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") { e.preventDefault(); ziehenAuf(anteil + 0.2, 0); }
});

// Hilfe, falls die Geste nicht klappt
const notausgang = $("#notausgang");
setTimeout(() => { if (anteil < 0.1 && !body.classList.contains("offen")) notausgang.classList.add("sichtbar"); }, 9000);
notausgang.addEventListener("click", () => oeffnen());

function oeffnen() {
  if (body.classList.contains("offen")) return;
  body.classList.add("offen");
  vibriere([25, 50, 40]);
  themaFarbe("#a8cdc6");
  merken(true);
  const r = $("#paket").getBoundingClientRect();
  konfetti(r.left + r.width / 2, r.top + r.height * 0.4, 140);
  setTimeout(() => body.classList.remove("zu"), leise ? 0 : 1500);
}

function zuruecksetzen() {
  merken(false);
  window.scrollTo({ top: 0, behavior: "instant" });
  body.classList.add("zu");
  body.classList.remove("offen");
  themaFarbe("#2a110e");
  anteil = 0; letzterRuck = 0;
  streifen.classList.remove("angefangen", "zieht");
  zeichneStreifen(0);
}
$("#nochmal").addEventListener("click", zuruecksetzen);

// Wer schon ausgepackt hat, landet direkt bei den Schuhen. Mit ?neu geht es von vorn los.
if (gemerkt() && !new URLSearchParams(location.search).has("neu")) {
  body.classList.add("offen", "sofort");
  body.classList.remove("zu");
  themaFarbe("#a8cdc6");
  requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove("sofort")));
}

/* ───────── Konfetti aus Filzstücken ───────── */

const leinwand = $("#konfetti");
const stift = leinwand.getContext("2d");
const FARBEN = ["#c9361f", "#e9a7b4", "#4a1712", "#a8cdc6", "#f3ead9", "#c9361f"];
const FORMEN = ["dreieck", "halb", "kreis", "bogen", "streifen"];
let teile = [], laeuft = false;

function konfetti(x, y, anzahl) {
  if (leise) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  leinwand.width = innerWidth * dpr; leinwand.height = innerHeight * dpr;
  stift.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let i = 0; i < anzahl; i++) {
    const winkel = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
    const tempo = 6 + Math.random() * 11;
    teile.push({
      x, y,
      vx: Math.cos(winkel) * tempo, vy: Math.sin(winkel) * tempo,
      dreh: Math.random() * 6, vdreh: (Math.random() - 0.5) * 0.3,
      gr: 9 + Math.random() * 12,
      farbe: FARBEN[(Math.random() * FARBEN.length) | 0],
      form: FORMEN[(Math.random() * FORMEN.length) | 0],
      kipp: Math.random() * Math.PI,
    });
  }
  if (!laeuft) { laeuft = true; requestAnimationFrame(schritt); }
}

function schritt() {
  stift.clearRect(0, 0, innerWidth, innerHeight);
  teile = teile.filter((t) => t.y < innerHeight + 40);
  for (const t of teile) {
    t.vy += 0.32; t.vx *= 0.985; t.vy *= 0.985;
    t.x += t.vx; t.y += t.vy; t.dreh += t.vdreh; t.kipp += 0.12;
    stift.save();
    stift.translate(t.x, t.y); stift.rotate(t.dreh);
    stift.scale(1, Math.abs(Math.cos(t.kipp)) * 0.7 + 0.3);
    const g = t.gr / 2;
    stift.fillStyle = t.farbe;
    stift.strokeStyle = "#1c0f0d";
    stift.lineWidth = 2; stift.lineJoin = "round"; stift.lineCap = "round";
    stift.beginPath();
    if (t.form === "dreieck") {
      stift.moveTo(0, -g); stift.lineTo(g, g * 0.8); stift.lineTo(-g, g * 0.8); stift.closePath();
    } else if (t.form === "halb") {
      stift.arc(0, g * 0.3, g, Math.PI, 0); stift.closePath();
    } else if (t.form === "kreis") {
      stift.arc(0, 0, g * 0.7, 0, Math.PI * 2);
    } else if (t.form === "streifen") {
      stift.rect(-g * 0.3, -g, g * 0.6, g * 2);
    }
    if (t.form === "bogen") {
      stift.strokeStyle = t.farbe; stift.lineWidth = 3.5;
      stift.arc(0, 0, g * 0.8, 0, Math.PI * 1.3); stift.stroke();
    } else { stift.fill(); stift.stroke(); }
    stift.restore();
  }
  if (teile.length) requestAnimationFrame(schritt);
  else { laeuft = false; stift.clearRect(0, 0, innerWidth, innerHeight); }
}

/* ───────── Brief ───────── */

const umschlag = $("#umschlag");
const briefKarte = $("#brief-karte");
let briefText = null;

fetch("brief.txt", { cache: "no-store" })
  .then((r) => (r.ok ? r.text() : Promise.reject()))
  .then((t) => { briefText = t; })
  .catch(() => { briefText = "Liebe Mama,\n\nder Brief ist gerade nicht zu erreichen. Lade die Seite bitte gleich noch einmal."; });

function briefSetzen() {
  const absaetze = (briefText || "").trim().split(/\n\s*\n/).map((a) => a.trim()).filter(Boolean);
  briefKarte.replaceChildren();
  absaetze.forEach((a, i) => {
    const p = document.createElement("p");
    if (i === absaetze.length - 1 && absaetze.length > 1) p.className = "unterschrift";
    a.split("\n").forEach((zeile, j) => { if (j) p.append(document.createElement("br")); p.append(zeile); });
    briefKarte.append(p);
  });
}

umschlag.addEventListener("click", () => {
  if (umschlag.classList.contains("auf")) return;
  umschlag.classList.add("auf");
  vibriere(15);
  setTimeout(() => {
    briefSetzen();
    umschlag.classList.add("weg");
    briefKarte.hidden = false;
  }, leise ? 200 : 1250);
});

/* ───────── Galerie und Karten ───────── */

const galerie = $("#galerie");
const punkte = $("#punkte");
const bilder = $$("figure", galerie);
bilder.forEach(() => punkte.append(document.createElement("i")));
function punkteSetzen() {
  const schritt = bilder[1] ? bilder[1].offsetLeft - bilder[0].offsetLeft : 1;
  const i = Math.round(galerie.scrollLeft / schritt);
  $$("i", punkte).forEach((p, j) => p.classList.toggle("an", j === i));
}
galerie.addEventListener("scroll", punkteSetzen, { passive: true });
punkteSetzen();

$$(".karte").forEach((k) => k.addEventListener("click", () => { k.classList.toggle("gedreht"); vibriere(6); }));

/* ───────── Lieferstatus ───────── */

const strecke = $("#strecke");

function statusSetzen(s) {
  const stationen = s.stationen || [];
  const jetzt = Math.max(0, Math.min(Number(s.aktuell) || 0, stationen.length - 1));
  const angekommen = jetzt === stationen.length - 1;
  $("#status-notiz").textContent = s.notiz || "";
  strecke.replaceChildren();
  stationen.forEach((st, i) => {
    const li = document.createElement("li");
    const fertig = i < jetzt || (angekommen && i === jetzt);
    li.className = fertig ? "erledigt" : i === jetzt ? "jetzt" : "offen-noch";
    li.style.transitionDelay = i * 120 + "ms";
    const marke = document.createElement("span");
    marke.className = "marke";
    marke.textContent = fertig ? "✓" : String(i + 1);
    const h = document.createElement("h3");
    h.textContent = st.titel;
    li.append(marke, h);
    if (st.text) { const p = document.createElement("p"); p.textContent = st.text; li.append(p); }
    strecke.append(li);
  });
  if (s.aktualisiert) {
    const d = new Date(s.aktualisiert + "T12:00:00");
    if (!isNaN(d)) $("#status-stand").textContent = "Stand: " + d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  }
  if (angekommen) strecke.dataset.angekommen = "1";
}

fetch("status.json?t=" + Date.now(), { cache: "no-store" })
  .then((r) => (r.ok ? r.json() : Promise.reject()))
  .then(statusSetzen)
  .catch(() => { $("#status-notiz").textContent = "Der Lieferstatus lässt sich gerade nicht laden. Probier es später noch einmal."; });

/* ───────── Einblenden beim Scrollen ───────── */

$$(".szene:not(#start) > :not(.umschlag):not(.brief-karte):not(.formen):not(.chart)").forEach((el) => el.classList.add("einblenden"));
const beobachter = new IntersectionObserver((eintraege) => {
  for (const e of eintraege) {
    if (!e.isIntersecting) continue;
    e.target.classList.add("da");
    if (e.target === strecke) {
      strecke.classList.add("sichtbar");
      if (strecke.dataset.angekommen && !strecke.dataset.gefeiert) {
        strecke.dataset.gefeiert = "1";
        konfetti(innerWidth / 2, innerHeight * 0.6, 120);
      }
    }
    beobachter.unobserve(e.target);
  }
}, { threshold: 0.15 });
$$(".einblenden").forEach((el) => beobachter.observe(el));

/* ───────── Formen drehen sich beim Scrollen ───────── */

let scrollGeplant = false;
addEventListener("scroll", () => {
  if (scrollGeplant || leise) return;
  scrollGeplant = true;
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty("--s", Math.round(scrollY));
    scrollGeplant = false;
  });
}, { passive: true });

/* ───────── Augen, die dem Finger folgen ───────── */

const SVG_NS = "http://www.w3.org/2000/svg";
const AUGE = '<path class="weiss" d="M4 52 Q50 8 96 52 Q50 92 4 52Z"/>' +
  '<circle class="pupille" cx="50" cy="56" r="13"/>' +
  '<path class="lid" d="M4 52 Q50 8 96 52 Q50 34 4 52Z"/>' +
  '<path class="zu" d="M4 52 Q50 8 96 52 Q50 92 4 52Z"/>';
const augen = $$(".auge").map((el, i) => {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.innerHTML = AUGE;
  svg.style.setProperty("--blink", (i * 1.7) % 5 + "s");
  el.append(svg);
  return { el, pupille: svg.querySelector(".pupille") };
});

function schauen(x, y) {
  for (const a of augen) {
    const r = a.el.getBoundingClientRect();
    if (r.bottom < -50 || r.top > innerHeight + 50) continue;
    const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / 120);
    a.pupille.style.transform = `translate(${(dx / d) * 20 * k}px, ${(dy / d) * 9 * k}px)`;
  }
}
let zuletztBeruehrt = 0;
const folgen = (x, y) => { zuletztBeruehrt = Date.now(); schauen(x, y); };
addEventListener("pointermove", (e) => folgen(e.clientX, e.clientY), { passive: true });
addEventListener("pointerdown", (e) => folgen(e.clientX, e.clientY), { passive: true });
addEventListener("touchmove", (e) => { const t = e.touches[0]; if (t) folgen(t.clientX, t.clientY); }, { passive: true });
// ohne Berührung schauen die Augen ab und zu woanders hin
setInterval(() => {
  if (Date.now() - zuletztBeruehrt < 2500) return;
  schauen(Math.random() * innerWidth, Math.random() * innerHeight);
}, 1800);

/* ───────── Ton ───────── */

// iOS spielt Ton nur nach einer Berührung ab. Darum wird der Clip bei der
// ersten Berührung einmal stumm angespielt und damit freigeschaltet.
const ton = $("#ton");
let tonFrei = false;
function tonFreischalten() {
  if (tonFrei) return;
  tonFrei = true;
  ton.muted = true;
  const p = ton.play();
  const zurueck = () => { ton.pause(); ton.currentTime = 0; ton.muted = false; };
  if (p && p.then) p.then(zurueck, () => { ton.muted = false; tonFrei = false; });
  else zurueck();
}
addEventListener("pointerdown", tonFreischalten, { capture: true });
addEventListener("touchend", tonFreischalten, { capture: true });
function tonAb() {
  try { ton.currentTime = 0; const p = ton.play(); if (p && p.catch) p.catch(() => {}); } catch (_) {}
}

/* ───────── Chart: Preis durch die Decke, Verfügbarkeit durch den Boden ───────── */

const chart = $("#chart");
new IntersectionObserver((e, b) => {
  if (!e[0].isIntersecting) return;
  b.disconnect();
  chart.classList.add("laeuft");
  setTimeout(() => {
    chart.classList.add("kracht");
    vibriere([50, 40, 50]);
  }, leise ? 0 : 2450);
}, { threshold: 0.6 }).observe(chart);

/* ───────── Gemälde fällt von der Wand ───────── */

const gemaelde = $("#gemaelde");
const boden = $("#boden");
const pov = $("#pov");
let gesehen = false, gefallen = false;

new IntersectionObserver((e, b) => {
  if (!e[0].isIntersecting) return;
  b.disconnect();
  gesehen = true;
  gemaelde.classList.add("knall");
}, { threshold: 0.5 }).observe(gemaelde);

function aufschlag() {
  gemaelde.classList.add("gefallen");
  boden.classList.add("belegt");
  pov.classList.remove("bebt"); void pov.offsetWidth; pov.classList.add("bebt");
  vibriere([90, 40, 60]);
  tonAb();
  const r = gemaelde.getBoundingClientRect();
  konfetti(r.left + r.width / 2, r.bottom - 10, 40);
}

function fallen() {
  if (gefallen) return;
  gefallen = true;
  const bild = gemaelde.getBoundingClientRect();
  const b = boden.getBoundingClientRect();
  const weg = b.bottom - 14 - 30 - bild.bottom;   // bis knapp über die Bodenleiste
  // Drehpunkt liegt am Nagel über dem Bild; die Drehung schiebt es sonst seitlich weg
  const versatz = -(bild.height / 2 + 52) * Math.sin(6 * Math.PI / 180);
  const ende = `translate(${versatz.toFixed(1)}px, ${weg}px) rotate(-6deg)`;
  if (leise) { gemaelde.style.transform = ende; aufschlag(); return; }
  const dauer = 1800, treffer = 0.84;
  gemaelde.animate([
    { transform: "rotate(-3deg)" },
    { transform: "rotate(10deg)", offset: 0.22, easing: "ease-in-out" },
    { transform: "rotate(4deg)", offset: 0.34, easing: "ease-in-out" },
    { transform: "rotate(13deg) translateY(12px)", offset: 0.46, easing: "cubic-bezier(.55,0,1,.45)" },
    { transform: ende, offset: treffer, easing: "ease-out" },
    { transform: `translate(${(versatz * 0.6).toFixed(1)}px, ${weg - 28}px) rotate(-3.5deg)`, offset: 0.92, easing: "ease-in" },
    { transform: ende },
  ], { duration: dauer, fill: "forwards" });
  setTimeout(() => vibriere(15), dauer * 0.2);
  setTimeout(aufschlag, dauer * treffer);
}

// fällt, sobald das Bild beim Weiterscrollen in das obere Drittel wandert
addEventListener("scroll", () => {
  if (!gesehen || gefallen) return;
  if (gemaelde.getBoundingClientRect().top < innerHeight * 0.22) fallen();
}, { passive: true });

function antippen() {
  gemaelde.classList.remove("zittert"); void gemaelde.offsetWidth;
  gemaelde.classList.add("zittert");
  vibriere([40, 30, 40, 30, 80]);
  tonAb();
}
gemaelde.addEventListener("click", antippen);
gemaelde.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); antippen(); } });
gemaelde.addEventListener("animationend", (e) => { if (e.animationName === "zittern") gemaelde.classList.remove("zittert"); });
