import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE_PATH = path.join(DATA_DIR, 'search-events.json');

function ensureFile() {
  try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch(_) {}
  if (!fs.existsSync(EVENTS_FILE_PATH)) {
    try { fs.writeFileSync(EVENTS_FILE_PATH, JSON.stringify({ events: [] }, null, 2), 'utf8'); } catch(_) {}
  }
}

function readEvents() {
  ensureFile();
  try {
    const raw = fs.readFileSync(EVENTS_FILE_PATH, 'utf8');
    return JSON.parse(raw || '{"events":[]}');
  } catch (e) {
    return { events: [] };
  }
}

function writeEvents(data) {
  ensureFile();
  try { fs.writeFileSync(EVENTS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8'); } catch(_) {}
}

export async function POST(req) {
  try {
    const { type, payload } = await req.json();
    const t = String(type || '').trim();
    if (!t) return NextResponse.json({ ok: true });

    const store = readEvents();
    const evt = { type: t, payload: payload || null, ts: Date.now() };
    if (!Array.isArray(store.events)) store.events = [];
    store.events.push(evt);
    if (store.events.length > 2000) store.events = store.events.slice(-2000);
    writeEvents(store);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('API Search Event error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
