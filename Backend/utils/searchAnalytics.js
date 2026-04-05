const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE_PATH = path.join(DATA_DIR, 'search-analytics.json');

function ensureFile() {
  try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch(_) {}
  if (!fs.existsSync(FILE_PATH)) {
    try { fs.writeFileSync(FILE_PATH, JSON.stringify({ terms: {} }, null, 2), 'utf8'); } catch(_) {}
  }
}

function read() {
  ensureFile();
  try {
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(raw || '{"terms":{}}');
  } catch (e) {
    return { terms: {} };
  }
}

function write(data) {
  ensureFile();
  try { fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8'); } catch(_) {}
}

function logSearch(term) {
  if (!term) return; const q = String(term).trim().toLowerCase(); if (!q || q.length < 2) return;
  const store = read();
  const now = Date.now();
  if (!store.terms[q]) store.terms[q] = { term: q, count: 0, timestamps: [] };
  store.terms[q].count += 1;
  store.terms[q].timestamps.push(now);
  // trim to last 1000 timestamps per term to bound file size
  if (store.terms[q].timestamps.length > 1000) store.terms[q].timestamps = store.terms[q].timestamps.slice(-1000);
  write(store);
}

function getTrending(days = 7, limit = 8) {
  const store = read();
  const ms = Math.max(1, Number(days)) * 24 * 60 * 60 * 1000;
  const since = Date.now() - ms;
  const items = Object.values(store.terms || {}).map(t => {
    const recent = (t.timestamps || []).filter(ts => ts >= since).length;
    return { term: t.term, recent };
  }).filter(x => x.recent > 0).sort((a,b) => b.recent - a.recent).slice(0, Math.max(1, Number(limit)));
  return items.map(x => x.term);
}

function readEvents() {
  ensureFile();
  const EVENTS_FILE_PATH = path.join(DATA_DIR, 'search-events.json');
  try {
    if (!fs.existsSync(EVENTS_FILE_PATH)) fs.writeFileSync(EVENTS_FILE_PATH, JSON.stringify({ events: [] }, null, 2), 'utf8');
    const raw = fs.readFileSync(EVENTS_FILE_PATH, 'utf8');
    return JSON.parse(raw || '{"events":[]}');
  } catch (e) {
    return { events: [] };
  }
}

function writeEvents(data) {
  ensureFile();
  const EVENTS_FILE_PATH = path.join(DATA_DIR, 'search-events.json');
  try { fs.writeFileSync(EVENTS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8'); } catch(_) {}
}

function logEvent(type, payload) {
  try {
    const t = String(type || '').trim();
    if (!t) return;
    const store = readEvents();
    const evt = { type: t, payload: payload || null, ts: Date.now() };
    if (!Array.isArray(store.events)) store.events = [];
    store.events.push(evt);
    if (store.events.length > 2000) store.events = store.events.slice(-2000);
    writeEvents(store);
  } catch (_) {}
}

module.exports = { logSearch, getTrending, logEvent };
