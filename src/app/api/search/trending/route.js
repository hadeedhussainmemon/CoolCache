import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'search-analytics.json');

function read() {
  try {
    if (!fs.existsSync(FILE_PATH)) return { terms: {} };
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(raw || '{"terms":{}}');
  } catch (e) {
    return { terms: {} };
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get('days') || 7);
    const limit = Number(searchParams.get('limit') || 8);

    const store = read();
    const ms = Math.max(1, days) * 24 * 60 * 60 * 1000;
    const since = Date.now() - ms;

    const items = Object.values(store.terms || {}).map(t => {
      const recent = (t.timestamps || []).filter(ts => ts >= since).length;
      return { term: t.term, recent };
    }).filter(x => x.recent > 0).sort((a,b) => b.recent - a.recent).slice(0, Math.max(1, limit));

    return NextResponse.json({ terms: items.map(x => x.term) }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('API Search Trending error:', error);
    return NextResponse.json({ terms: [] });
  }
}
