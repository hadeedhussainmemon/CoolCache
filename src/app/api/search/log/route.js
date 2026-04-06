import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
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

export async function POST(req) {
  try {
    const body = await req.json();
    const term = (body.term || body.q || '').trim().toLowerCase();
    if (!term || term.length < 2) return NextResponse.json({ ok: true });

    const store = read();
    const now = Date.now();
    if (!store.terms[term]) store.terms[term] = { term, count: 0, timestamps: [] };
    store.terms[term].count += 1;
    store.terms[term].timestamps.push(now);
    if (store.terms[term].timestamps.length > 1000) store.terms[term].timestamps = store.terms[term].timestamps.slice(-1000);
    write(store);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('API Search Log error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
