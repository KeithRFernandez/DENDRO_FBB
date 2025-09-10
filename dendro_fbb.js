
window.dendro_ad = window.dendro_ad ?? "dendro_ad";
window.dendro_db = window.dendro_db ?? "dendro_db";
window._STOP   = window._STOP   ?? false;
window._PAUSE  = window._PAUSE  ?? false;

const CUTOFF_END_LOCAL = new Date("2025-05-30T23:59:59"); 
const MAX_SCROLLS = 1500;
const SCROLL_PAUSE_MIN_MS = 2100;
const SCROLL_PAUSE_MAX_MS = 2300;
const EXTRA_AFTER_CUTOFF_SCROLLS = 10; 
const EXTRA_AFTER_CUTOFF_STALE = 3;     
const sleep = (ms)=>new Promise(r=>setTimeout(r, ms));
const jitter = (min,max)=>Math.floor(min + Math.random()*(max-min+1));
const cleanUrl = (u) => {
  const url = new URL(u, location.origin);
  const kill = (k) =>
    /^__cft__(?:\[[^\]]*\])?$/i.test(k) ||
    /^__tn__/i.test(k) ||
    /^(mibextid|ref|sfnsn|idorvanity|fbclid)$/i.test(k);
  const toDelete = [];
  url.searchParams.forEach((v, k) => { if (kill(k)) toDelete.push(k); });
  toDelete.forEach(k => url.searchParams.delete(k));
  url.hash = "";
  const qs = url.searchParams.toString();
  url.search = qs ? "?"+qs : "";
  return url.toString();
};

const MES = {enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12};
const MONTHS_RE = "(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)";
const norm = (s)=> (s||"")
  .replace(/[\u202F\u2009\u200A\u00A0]/g,' ')
  .normalize('NFD').replace(/\p{Diacritic}/gu,'')
  .replace(/\s+/g,' ').trim();

const RX_FULL = new RegExp(
  `\\b(\\d{1,2})\\s+de\\s+${MONTHS_RE}\\s+de\\s+(\\d{4})(?:.*?(\\d{1,2}):(\\d{2})\\s*(a\\.?\\s*m\\.?|p\\.?\\s*m\\.)?)?`,
  "i"
);
const RX_NOYEAR = new RegExp(
  `\\b(\\d{1,2})\\s+de\\s+${MONTHS_RE}(?:\\s+(?:a\\s+las\\s+)?(\\d{1,2}):(\\d{2})\\s*(a\\.?\\s*m\\.?|p\\.?\\s*m\\.)?)?\\b`,
  "i"
);

function to24h(hh, ampm){
  let h = +hh;
  if (!ampm) return h;
  const t = ampm.replace(/\./g,'').replace(/\s+/g,'').toLowerCase();
  if (t === 'pm' && h < 12) h += 12;
  if (t === 'am' && h === 12) h = 0;
  return h;
}

function parseDateLoose(text, fallbackYear){
  const s = norm(text);
  let m = s.match(RX_FULL);
  if (m) {
    const d=+m[1], mon=MES[m[2]], y=+m[3];
    let hh=m[4]?+m[4]:0, mm=m[5]?+m[5]:0, ampm=m[6]||"";
    if (mon) return new Date(y, mon-1, d, to24h(hh, ampm), mm);
  }
  m = s.match(RX_NOYEAR);
  if (m) {
    const d=+m[1], mon=MES[m[2]];
    let hh=m[3]?+m[3]:0, mm=m[4]?+m[4]:0, ampm=m[5]||"";
    if (!mon) return null;
    return new Date(fallbackYear, mon-1, d, to24h(hh, ampm), mm);
  }
  return null;
}

function findDateAnchor(card){
  const a1 = card.querySelector('a[aria-label*=" de "][href]');
  if (a1 && /de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)/i.test(a1.getAttribute('aria-label'))) return a1;

  const ab = card.querySelector('abbr[title], time[title], time[datetime]');
  if (ab) return ab.closest('a[href]') || ab;

  const cand = [...card.querySelectorAll('a, span, div, time, abbr')].find(x => {
    const t = x.getAttribute('aria-label') || x.getAttribute('title') || x.textContent || '';
    return /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)/i.test(t);
  });
  return cand || null;
}

function normalizePermalinkFrom(card) {
  const aPfbid = card.querySelector('a[href*="/pfbid"]');
  if (aPfbid?.href) return cleanUrl(aPfbid.href);

  const dateA = findDateAnchor(card);
  if (dateA?.href) return cleanUrl(dateA.href);

  const a =
    card.querySelector('a[href*="/posts/"], a[href*="/permalink/"], a[href*="/videos/"], a[href*="/reel/"], a[href*="/photo/"], a[href*="/photos/"], a[href*="story_fbid"], a[href*="/watch/"]') ||
    card.querySelector('time')?.closest?.('a[href]');
  return a?.href ? cleanUrl(a.href) : "";
}

function getCards(){
  return document.querySelectorAll(
    'div[role="article"], article, div[data-pagelet*="FeedUnit"], div[data-ad-comet-preview="message"]'
  );
}

function downloadCSV(rows, filename){
  const header = ['dendro_ad','dendro_db','date_iso','date_local','url','raw_label'];
  const out = [header, ...rows.map(r=>[window.dendro_ad, window.dendro_db, r.date_iso, r.date_local, r.url, r.raw_label])];
  const csv = out.map(r=>r.map(c=>`"${String(c??'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
}

window.fbScrape = {
  pause(){ window._PAUSE = true;  console.warn("⏸️ PAUSA activada"); },
  resume(){ window._PAUSE = false; console.warn("▶️ REANUDADO"); },
  stop(){ window._STOP = true;    console.warn("⛔ STOP solicitado"); },
  dump(){ if (Array.isArray(window.__rows) && window.__rows.length){ downloadCSV(window.__rows, window.__fname||'facebook_posts.csv'); } else { console.warn("Nada que descargar aún."); } },
  clean: cleanUrl,
  setCutoff(isoLocal){ try{ window.__cutoff = new Date(isoLocal); console.log("Nuevo cutoff:", window.__cutoff); }catch(e){ console.error("Cutoff inválido"); } },
  status(){ console.log({ rows: window.__rows?.length||0, seen: window.__seen?.size||0, currentYear: window.__currentYear, reached: window.__reached, extraScrolls: window.__extraScrolls, minDateSeen: window.__minDateSeen }); },
  help(){ console.log(`Comandos:
  fbScrape.pause()   → Pausar
  fbScrape.resume()  → Reanudar
  fbScrape.stop()    → Detener (y guardar al finalizar)
  fbScrape.dump()    → Descargar CSV manual
  fbScrape.clean(u)  → Limpiar una URL
  fbScrape.setCutoff("YYYY-MM-DDTHH:mm:ss") → Cambiar cutoff
  fbScrape.status()  → Ver estado`); }
};

window.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') { window._STOP = true; console.warn('⛔ STOP por ESC'); } });

(async ()=>{
  console.log("🔖 dendro_ad:", window.dendro_ad, "| dendro_db:", window.dendro_db);
  const cutoff = window.__cutoff ?? CUTOFF_END_LOCAL;
  console.log("⏳ Recolectando posts HASTA (incluido):", cutoff.toString());

  const seen = new Set();
  const rows = [];
  window.__rows = rows;
  window.__seen = seen;

  let reached = false;
  let extraScrolls = 0;
  let staleAfterCutoff = 0;
  let minDateSeen = null;

  let currentYear = new Date().getFullYear();
  let lastMonth = null;

  const filename = `facebook_posts_hasta_2025-03-30.csv`;
  window.__fname = filename;

  for (let i=0; i<MAX_SCROLLS; i++){
    if (window._STOP) { console.warn("⛔ Detenido por el usuario."); break; }
    while (window._PAUSE) { await sleep(250); } // bucle de pausa

    let added=0;
    for (const card of getCards()){
      const url = normalizePermalinkFrom(card);
      if (!url) continue;

      let key = url;
      const mp = url.match(/\/(pfbid[^/?#]+)/i);
      if (mp) key = mp[1].toLowerCase();
      if (seen.has(key)) continue;

      const dateNode = findDateAnchor(card);
      if (!dateNode) continue;

      const label = (dateNode.getAttribute('aria-label') || dateNode.getAttribute('title') || dateNode.textContent || '').trim();
      let d = parseDateLoose(label, currentYear);
      if (!d) continue;

      const month = d.getMonth()+1;
      if (lastMonth != null && month > lastMonth){ 
        currentYear -= 1;
        const di = parseDateLoose(label, currentYear);
        if (di) d = di;
      }
      lastMonth = month;
      window.__currentYear = currentYear;

      if (!minDateSeen || d < minDateSeen) minDateSeen = d;
      window.__minDateSeen = minDateSeen;

      if (d <= cutoff) reached = true;
      window.__reached = reached;

      seen.add(key);
      rows.push({
        date_iso: d.toISOString(),
        date_local: d.toLocaleString(),
        url,
        raw_label: norm(label)
      });
      added++;
    }

    console.log(`🔎 Iter ${i+1}: +${added} (total=${rows.length}) año=${currentYear} reached=${reached} min=${minDateSeen?.toLocaleString?.()||'-'}`);

    if (reached){
      extraScrolls += 1;
      staleAfterCutoff = (added===0) ? (staleAfterCutoff+1) : 0;

      // Regla de corte robusta: reached + (extra suficientes || 3 iteraciones sin nuevos) ⇒ parar
      if (extraScrolls >= EXTRA_AFTER_CUTOFF_SCROLLS || staleAfterCutoff >= EXTRA_AFTER_CUTOFF_STALE){
        console.warn(`⛔ Corte por cutoff. extraScrolls=${extraScrolls}, stale=${staleAfterCutoff}`);
        break;
      }
    }
    window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
    await sleep(jitter(SCROLL_PAUSE_MIN_MS, SCROLL_PAUSE_MAX_MS));
  }

  if (rows.length){
    console.log(`✅ ${rows.length} filas. Generando ${filename} …`);
    downloadCSV(rows, filename);
  } else {
    console.warn("⚠️ No se recolectaron posts. Abre el TIMELINE (no un post suelto), espera a que cargue y baja un poco. Prueba también en m.facebook.com.");
  }

  window._dump = ()=>downloadCSV(rows, filename);
  window._pause  = ()=>fbScrape.pause();
  window._resume = ()=>fbScrape.resume();
  window._stop   = ()=>fbScrape.stop();
  window._dump   = ()=>fbScrape.dump();
  window._help   = ()=>fbScrape.help();

})();
