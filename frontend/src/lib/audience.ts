import type { AudienceMode, Connection, Group, Id } from '../api/types'

export const FRONT = 'עמוד ראשי'
export const DUPLICATE_GROUP = 'כבר יש קבוצה בשם הזה. בחרו שם אחר.'

export interface AudienceState {
  mode: AudienceMode
  selected: Id[]
  groupId: Id | null
}

/** Selected ids that are still connections (people can be removed while a draft waits). */
export const selectedIds = (a: AudienceState, people: Connection[]) =>
  people.filter((p) => a.selected.includes(p.id)).map((p) => p.id)

export const pickedGroup = (a: AudienceState, groups: Group[]) => groups.find((g) => g.id === a.groupId) ?? groups[0]

export function canPublish(a: AudienceState, people: Connection[], groups: Group[]) {
  if (a.mode === 'people') return selectedIds(a, people).length > 0
  if (a.mode === 'group') return !!pickedGroup(a, groups)?.memberIds.length
  if (a.mode === 'circle') return people.length > 0
  return true
}

export function publishLabel(a: AudienceState, people: Connection[], groups: Group[]) {
  if (a.mode === 'people') {
    const n = selectedIds(a, people).length
    return n ? `פרסום ל-${n} אנשים` : 'בחרו למי לפרסם'
  }
  if (a.mode === 'me') return 'שמירה לעצמי'
  if (a.mode === 'group') {
    if (!groups.length) return 'צרו קבוצה כדי לפרסם'
    const g = pickedGroup(a, groups)
    if (g?.memberIds.length) return 'פרסום ל' + g.name
    return groups.some((x) => x.memberIds.length) ? 'בחרו קבוצה שיש בה חברים' : 'כל הקבוצות ריקות · הוסיפו להן חברים'
  }
  return people.length ? 'פרסום לכל המעגל' : 'אין חיבורים'
}

export function audienceModes(np: number, groupCount: number) {
  const none = 'עוד אין לכם חיבורים'
  return [
    { id: 'circle' as const, label: 'כל המעגל', hint: np ? `כל מי שמחובר אליכם (${np})` : none, disabled: !np },
    { id: 'me' as const, label: 'רק אני', hint: 'הכתבה תישאר אצלכם', disabled: false },
    { id: 'people' as const, label: 'אנשים מסוימים', hint: np ? 'בחירה מתוך החיבורים שלכם' : none, disabled: !np },
    {
      id: 'group' as const,
      label: 'קבוצה',
      hint: !np ? none : groupCount ? 'אחת הקבוצות ששמרתם' : 'עוד אין קבוצות, אפשר ליצור אחת',
      disabled: !np,
    },
  ]
}

/** Empty string = valid (or not typed yet). */
export function groupNameError(name: string, groups: Group[], selfId?: Id) {
  const n = name.trim()
  if (!n) return ''
  return n === FRONT || groups.some((g) => g.name === n && g.id !== selfId) ? DUPLICATE_GROUP : ''
}

export function audienceText(ids: Id[] | null, nameOf: (id: Id) => string | undefined) {
  if (!ids) return 'נשלחה לכל המעגל שלכם.'
  if (!ids.length) return 'נשמרה רק אצלכם. אף אחד אחר לא קיבל אותה.'
  return `נשלחה ל-${ids.length}: ` + ids.map(nameOf).filter(Boolean).join(', ')
}
