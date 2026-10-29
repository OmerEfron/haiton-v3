// Deterministic checks for reporter replies and editor drafts. Self-check: node docs/ai-reporter/evals/checks.mjs
import assert from 'node:assert/strict'

const H = (s) => `(?<![א-ת])(?:${s})(?![א-ת])`
const BANNED_STORY = new RegExp(
  [H('בסופו של יום'), H('מסע'), H('רגע מרגש'), H('לקחת החלטה|לקח החלטה'), H('חשוב לציין'), H('אין ספק'), H('חוויה בלתי נשכחת'), H('שיתפ[הת]?|שיתפו')].join('|'),
)
const BANNED_REPORTER = /איך הרגשת|איך הרגשתם|איך זה מרגיש|ספר[יו]? (?:לי )?עוד|תודה ש|נשמע מעניין|אני מבין|שאלה מצוינת|ממש מעניין|מה הסיפור|מה מיוחד|מה יצא לך מהפה|יש משפט שנשאר|מה אמרת לעצמ|מה עבר לך בראש/
const CURLY = /[“”„]|(?<=^|[\s(])״|״(?=[\s.,:;)]|$)/m
const BAD_CHARS = /[—–!]|\p{Extended_Pictographic}/u
export const RANGES = { headline: [35, 90], sub: [45, 180], flash: [25, 80], push: [20, 90] }
/** body paragraphs per article type (interview = intro + every Q&A) */
export const BODY = { feature: [3, 5], profile: [3, 5], interview: [3, 8], column: [3, 5], sports_report: [3, 4], quirky: [3, 4] }
const MIN_BODY_CHARS = 350

const words = (s) => s.trim().split(/\s+/).length
const norm = (s) => s.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()

/** quoted segments of 3+ words, with abbreviation quotes like ק"ג ignored */
export function quotes(text) {
  const t = text.replace(/[“”„״]/g, '"').replace(/(?<=[א-ת])"(?=[א-ת])/g, "'")
  return [...t.matchAll(/"([^"]+)"/g)].flatMap((m) => m[1].split(/\.\.\.|…/)).map(norm).filter((q) => words(q) >= 3)
}

export function checkDraft(d, userText, type = 'feature', reporterQs = []) {
  const fails = []
  for (const [k, [lo, hi]] of Object.entries(RANGES)) if (d[k].length < lo || d[k].length > hi) fails.push(`${k} length ${d[k].length}`)
  const [bLo, bHi] = BODY[type] || BODY.feature
  if (!Array.isArray(d.body) || d.body.length < bLo || d.body.length > bHi) fails.push(`${type} body paragraphs ${d.body?.length}`)
  const bodyChars = Array.isArray(d.body) ? d.body.reduce((n, p) => n + p.length, 0) : 0
  if (bodyChars < MIN_BODY_CHARS) fails.push(`body chars ${bodyChars}`)
  if (/[.]$/.test(d.headline.trim())) fails.push('headline ends with period')
  const all = [d.headline, d.sub, d.summary, d.flash, d.push, ...d.body].join('\n')
  if (BANNED_STORY.test(all)) fails.push('banned phrase: ' + all.match(BANNED_STORY)[0])
  if (BAD_CHARS.test(all)) fails.push('em dash / exclamation / emoji')
  if (CURLY.test(all)) fails.push('curly quotes instead of "')
  if (d.push === d.headline || d.push === d.flash) fails.push('push repeats headline/flash')
  if (/[.,]"\s*,/.test(all)) fails.push('period or comma before closing quote')
  if (norm(d.body[0]) === norm(d.summary) || norm(d.sub) === norm(d.summary)) fails.push('body or sub copies the summary')
  const u = norm(userText)
  for (const q of [d.headline, d.sub, d.summary, d.flash, d.push, ...d.body].flatMap(quotes)) if (!u.includes(q)) fails.push(`quote not said by user: ${q}`)
  if (type === 'sports_report' && !/\d/.test(d.headline + d.body[0])) fails.push('sports_report without a number in headline/lede')
  if (type === 'column' && /["“”״]/.test(d.body.join(' '))) fails.push('column body with quotation marks')
  if (type === 'interview') {
    const qn = reporterQs.map(norm)
    for (const p of d.body.slice(1)) {
      const [q, a] = p.split('\n')
      if (!a || !q.includes('?')) fails.push(`interview paragraph not question?\\nanswer: ${p.slice(0, 30)}`)
      else if (!qn.some((r) => r.includes(norm(q)) || norm(q).includes(r))) fails.push(`interview question not asked by reporter: ${q}`)
    }
  }
  return fails
}

export function checkReporter(replies, userMsgs = []) {
  const fails = []
  const asked = replies.filter(Boolean)
  if (asked.length > 7) fails.push(`asked ${asked.length} questions`)
  asked.forEach((r, i) => { if (i && r.trim().split(/\s+/)[0] === asked[i - 1].trim().split(/\s+/)[0]) fails.push(`repeated opener word: ${r}`) })
  for (let i = 0; i < replies.length; i++) {
    const r = replies[i]
    if (!r) continue
    const prior = userMsgs.slice(0, i + 1).join(' ')
    if (words(r) > (/\. /.test(r) ? 18 : 12)) fails.push(`long reply: ${r}`)
    if ((r.match(/\?/g) || []).length > 1) fails.push(`multi-question: ${r}`)
    if (BANNED_REPORTER.test(r) || BAD_CHARS.test(r)) fails.push(`robotic reply: ${r}`)
    if (r.trim() === 'מה קרה?') fails.push('repeated opener')
    if (/כמה (?:זה )?(?:עלה|עלו|עולה|עולים|שילמת|כסף)/.test(r) && !/מחיר|עלה|עלו|עולה|עולים|שילמ|כסף|שקל|₪/.test(prior)) fails.push(`unsupported price question: ${r}`)
    if (/שעון/.test(r) && !/שעון/.test(prior)) fails.push(`unsupported object in question: ${r}`)
  }
  return fails
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ok = { headline: 'אחרי חודשיים של טפטוף: שלמה תיקן לבד את הברז במטבח', sub: 'סרטון אחד ביוטיוב וגומייה חדשה הספיקו. "לא האמנתי שתצליח", אמרה אשתו', summary: 'שלמה תיקן ברז.', body: ['אחרי חודשיים של טפטוף תיקן שלמה אוחיון לבד את הברז במטבח. סרטון אחד ביוטיוב וגומייה חדשה הספיקו לו. העבודה נגמרה באותו ערב, והברז חזר לעבוד.', 'הברז במטבח טפטף חודשיים, והתיקון נעשה בלי בעל מקצוע. הגומייה החדשה נכנסה למקום של הישנה. שלמה עשה את כל העבודה לבד, מהסרטון ועד הסגירה.', 'אשתו עמדה לידו בסיום. "לא האמנתי שתצליח", אמרה. הברז הפסיק לטפטף באותו ערב, אחרי חודשיים שבהם הוא לא הפסיק.'], flash: 'שלמה אוחיון תיקן לבד את הברז המטפטף', push: '"לא האמנתי שתצליח": שלמה ניצח את הברז' }
  assert.deepEqual(checkDraft(ok, 'אשתי אמרה: לא האמנתי שתצליח'), [])
  assert.ok(checkDraft({ ...ok, sub: ok.sub.replace('לא האמנתי שתצליח', 'לא האמנתי בכלל שתצליח') }, 'אשתי אמרה: לא האמנתי שתצליח').some((f) => f.startsWith('quote')))
  assert.ok(checkDraft({ ...ok, headline: ok.headline + '.' }, '').some((f) => f.includes('period')))
  assert.ok(checkDraft({ ...ok, body: ['חוויה בלתי נשכחת', 'ב'] }, '').some((f) => f.startsWith('banned')))
  assert.ok(checkDraft({ ...ok, push: '״לא האמנתי שתצליח״: שלמה ניצח' }, 'לא האמנתי שתצליח').some((f) => f.startsWith('curly')))
  assert.deepEqual(quotes('שחר הרים 100 ק"ג, "אין מצב שזה קורה"'), ['אין מצב שזה קורה'])
  assert.ok(checkReporter(['ואיך הרגשת כשזה קרה?']).length === 1)
  assert.deepEqual(checkReporter(['כמה הרמת?', null]), [])
  assert.ok(checkReporter(['ומה אמר?', 'ומה עשית?']).some((f) => f.startsWith('repeated')))
  assert.ok(checkReporter(['מה הסיפור פה?']).length === 1)
  assert.ok(checkReporter(['כמה עלו האופניים?'], ['קניתי אופניים']).some((f) => f.startsWith('unsupported price')))
  assert.deepEqual(checkReporter(['כמה עלו האופניים?'], ['קניתי אופניים ב-200 שקל']), [])
  assert.ok(checkReporter(['מה עשית כשהשעון הראה עשרה קילומטרים?'], ['רצתי 10 קילומטר']).some((f) => f.startsWith('unsupported object')))
  assert.ok(checkDraft({ ...ok, body: ['אחת.', 'שתיים.', 'שלוש.'] }, '').some((f) => f.startsWith('body chars')))
  assert.ok(checkDraft({ ...ok, body: ['אחת.'] }, '', 'feature').some((f) => f.includes('body')))
  assert.ok(checkDraft({ ...ok, body: ['הדר פתחה.', 'חלום ישן?\nכן', 'מה אמרו?'] }, '', 'interview', ['חלום ישן?']).some((f) => f.includes('not question?')))
  assert.ok(checkDraft({ ...ok, body: ['הדר פתחה.', 'חלום ישן?\nכן', 'מי בא?\nאמא'] }, '', 'interview', ['חלום ישן?']).some((f) => f.includes('not asked')))
  assert.ok(checkDraft(ok, '', 'sports_report').some((f) => f.includes('number')))
  assert.ok(checkDraft({ ...ok, sub: '"זה קר.", אמרה וזה משפט מספיק ארוך כאן' }, '').some((f) => f.includes('closing quote')))
  assert.ok(checkDraft({ ...ok, summary: 'אחת', body: ['אחת', 'שתיים'] }, '').some((f) => f.includes('copies')))
  console.log('checks ok')
}
