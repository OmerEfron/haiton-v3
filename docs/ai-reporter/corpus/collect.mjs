// Collects (1) headline/sub pairs from public Israeli RSS feeds -> feeds.json
//          (2) ~200 full ynet article bodies, paragraph by paragraph -> bodies.json
//          (3) Q&A pairs from interview-like bodies -> interviews.json
// Run: node docs/ai-reporter/corpus/collect.mjs   (polite: 4 concurrent requests)
import { writeFileSync } from 'node:fs'

const Y = (id) => `https://www.ynet.co.il/Integration/StoryRss${id}.xml`
const W = (id) => `https://rss.walla.co.il/feed/${id}`
const FEEDS = [
  ['ynet', 'news', Y(2)], ['ynet', 'sport', Y(3)], ['ynet', 'economy', Y(6)], ['ynet', 'culture', Y(538)],
  ['ynet', 'digital', Y(544)], ['ynet', 'health', Y(1208)], ['ynet', 'flash', Y(1854)], ['ynet', 'crime', Y(190)],
  ['ynet', 'engagement', Y(3262)], ['ynet', 'guides', Y(14)],
  ['walla', 'news', W(1)], ['walla', 'world', W(2)], ['walla', 'flash', W(22)], ['walla', 'health', W(18)],
  ['walla', 'story-in-a-minute', W(20)], ['walla', 'economy', W(3)],
  ['walla', 'sport-football-il', W(156)], ['walla', 'sport-basketball', W(151)], ['walla', 'sport-tennis', W(152)],
  ['mako', 'news', 'https://www.mako.co.il/rss/31750a2610f26110VgnVCM1000005201000aRCRD.xml'],
  ['haaretz', 'main', 'https://www.haaretz.co.il/srv/rss---feedly'],
]
// section home pages: more lifestyle / soft-news article links than the RSS feeds expose
const SECTION_PAGES = ['food', 'judaism', 'wellness', 'parents', 'entertainment', 'sport', 'health', 'digital', 'economy', 'news']
const MAX_BODIES = 200

const ent = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
const strip = (s = '') => ent(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
const tag = (x, t) => (x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1]
const get = (url) => fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) }).then((r) => r.text())

async function pool(items, n, fn) {
  let i = 0
  const out = []
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; try { out[k] = await fn(items[k]) } catch { out[k] = null } }
  }))
  return out
}

// ---- 1. feeds
const feeds = []
for (const [site, section, url] of FEEDS) {
  try {
    const items = (await get(url)).split(/<item[ >]/).slice(1)
    for (const it of items) {
      const title = strip(tag(it, 'title'))
      if (title) feeds.push({ site, section, title, sub: strip(tag(it, 'description')), date: strip(tag(it, 'pubDate')), link: strip(tag(it, 'link')) })
    }
    console.log(site, section, items.length)
  } catch (e) { console.log(site, section, 'FAIL', e.message) }
}
writeFileSync(new URL('./feeds.json', import.meta.url), JSON.stringify(feeds, null, 1))

// ---- 2. bodies
const links = new Set(feeds.filter((x) => x.site === 'ynet' && x.link.includes('/article/')).map((x) => x.link))
for (const s of SECTION_PAGES) {
  try { for (const m of (await get(`https://www.ynet.co.il/${s}`)).matchAll(/href="((?:https:\/\/www\.ynet\.co\.il)?\/[a-z-]+\/article\/[a-zA-Z0-9]+)"/g)) links.add(m[1].startsWith('http') ? m[1] : 'https://www.ynet.co.il' + m[1]) } catch {}
}
// round-robin across URL sections so no section dominates
const bySec = {}
for (const l of links) (bySec[new URL(l).pathname.split('/')[1]] ??= []).push(l)
// interview-like items first (title starts with a quote, or mentions an interview): the rarest and most useful material
const INTERVIEWISH = /^["“]|בריאיון|בראיון|ראיון/
const picks = [...links].filter((l) => feeds.some((f) => f.link === l && INTERVIEWISH.test(f.title + ' ' + f.sub)))
for (let i = 0; picks.length < MAX_BODIES * 1.3 + 30; i++) {
  const row = Object.values(bySec).map((a) => a[i]).filter(Boolean)
  if (!row.length) break
  picks.push(...row)
}
console.log('sections', Object.fromEntries(Object.entries(bySec).map(([k, v]) => [k, v.length])), 'candidates', picks.length)

async function fetchBody(url) {
  const html = await get(url)
  const paragraphs = html.split('text_editor_paragraph').slice(1)
    // one paragraph = several draft blocks; interviews put the question and the answer in separate blocks of one paragraph
    .map((c) => c.split('public-DraftStyleDefault-block').map((b) => ent([...b.matchAll(/data-text="true">([^<]*)</g)].map((m) => m[1]).join('')).replace(/[ \t\r]+/g, ' ').replace(/ ?\n ?/g, '\n').trim()).filter(Boolean).join('\n')).filter(Boolean)
  let meta = {}
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { for (const o of [].concat(JSON.parse(m[1])['@graph'] || JSON.parse(m[1]))) if (o.headline) meta = { title: ent(o.headline), sub: ent(o.description || ''), date: o.datePublished || '' } } catch {}
  }
  if (paragraphs.length < 3 || !meta.title) return null
  return { site: 'ynet', path: new URL(url).pathname.split('/')[1], url, ...meta, paragraphs }
}
const bodies = (await pool([...new Set(picks)], 4, fetchBody)).filter(Boolean).slice(0, MAX_BODIES)
writeFileSync(new URL('./bodies.json', import.meta.url), JSON.stringify(bodies, null, 1))

// ---- 3. interviews: a paragraph whose first line is a question and whose next line is the answer
const interviews = []
for (const b of bodies) {
  const qa = b.paragraphs.map((t) => t.split('\n')).filter((l) => l.length >= 2 && /\?["”]?$/.test(l[0]) && l[0].length < 220)
  if (qa.length < 3) continue
  interviews.push({
    url: b.url, title: b.title, path: b.path,
    pairs: qa.map((l, k) => ({ q: l[0], a: l.slice(1).join(' ').slice(0, 400), pos: k === 0 ? 'opening' : k === qa.length - 1 ? 'closing' : 'middle' })),
  })
}
writeFileSync(new URL('./interviews.json', import.meta.url), JSON.stringify(interviews, null, 1))
console.log('feed items', feeds.length, 'bodies', bodies.length, 'interviews', interviews.length, 'Q&A pairs', interviews.reduce((n, x) => n + x.pairs.length, 0))
