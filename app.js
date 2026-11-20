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
  themaFarbe("#a9d9c9");
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
  themaFarbe("#2a2a2c");
  anteil = 0; letzterRuck = 0;
  streifen.classList.remove("angefangen", "zieht");
  zeichneStreifen(0);
}
$("#nochmal").addEventListener("click", zuruecksetzen);

// Wer schon ausgepackt hat, landet direkt bei den Schuhen. Mit ?neu geht es von vorn los.
if (gemerkt() && !new URLSearchParams(location.search).has("neu")) {
  body.classList.add("offen", "sofort");
  body.classList.remove("zu");
  themaFarbe("#a9d9c9");
  requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove("sofort")));
}

/* ───────── Konfetti aus Filzstücken ───────── */

const leinwand = $("#konfetti");
const stift = leinwand.getContext("2d");
const FARBEN = ["#a9d9c9", "#ff6a3d", "#2a2a2c", "#ebe5d9", "#3f8f78", "#d9f0e7"];
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
      gr: 6 + Math.random() * 9,
      farbe: FARBEN[(Math.random() * FARBEN.length) | 0],
      form: Math.random() < 0.3 ? "faser" : Math.random() < 0.5 ? "kreis" : "filz",
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
    stift.fillStyle = stift.strokeStyle = t.farbe;
    if (t.form === "kreis") {
      stift.beginPath(); stift.arc(0, 0, t.gr / 2.2, 0, Math.PI * 2); stift.fill();
    } else if (t.form === "faser") {
      stift.lineWidth = 2.2; stift.lineCap = "round";
      stift.beginPath(); stift.moveTo(-t.gr, 0);
      stift.quadraticCurveTo(-t.gr / 2, -t.gr / 1.6, 0, 0);
      stift.quadraticCurveTo(t.gr / 2, t.gr / 1.6, t.gr, 0); stift.stroke();
    } else {
      stift.beginPath(); stift.roundRect ? stift.roundRect(-t.gr / 2, -t.gr / 3, t.gr, t.gr / 1.5, 2) : stift.rect(-t.gr / 2, -t.gr / 3, t.gr, t.gr / 1.5); stift.fill();
    }
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

$$(".szene:not(#start) > :not(.umschlag):not(.brief-karte)").forEach((el) => el.classList.add("einblenden"));
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
