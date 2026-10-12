export const shortDate = (iso: string | Date) => {
  const d = new Date(iso)
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
}

export function relTime(iso: string, now = Date.now()) {
  const m = Math.floor((now - Date.parse(iso)) / 60_000)
  if (m < 10) return 'עכשיו'
  if (m < 60) return `לפני ${m} דקות`
  const h = Math.floor(m / 60)
  if (h === 1) return 'לפני שעה'
  if (h === 2) return 'לפני שעתיים'
  if (h < 24) return `לפני ${h} שעות`
  const d = Math.floor(h / 24)
  if (d === 1) return 'אתמול'
  if (d === 2) return 'לפני יומיים'
  if (d < 7) return `לפני ${d} ימים`
  if (d < 14) return 'לפני שבוע'
  if (d < 21) return 'לפני שבועיים'
  return shortDate(iso)
}

export const isFresh = (iso: string) => relTime(iso) === 'עכשיו'

export const todayLabel = () =>
  new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(new Date()) + ' · ' + shortDate(new Date())
