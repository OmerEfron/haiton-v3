import { describe, expect, it } from 'vitest'
import type { Connection, Group } from '../api/types'
import { audienceText, canPublish, DUPLICATE_GROUP, groupNameError, publishLabel, type AudienceState } from './audience'

const people: Connection[] = [
  { id: 'mom', name: 'אמא', muted: false },
  { id: 'dad', name: 'אבא', muted: false },
]
const groups: Group[] = [
  { id: 'g1', name: 'משפחה', memberIds: ['mom', 'dad'] },
  { id: 'g2', name: 'ריקה', memberIds: [] },
]
const a = (p: Partial<AudienceState>): AudienceState => ({ mode: 'me', selected: [], groupId: null, ...p })

describe('publish rules', () => {
  it('me can always publish', () => {
    expect(canPublish(a({}), [], [])).toBe(true)
    expect(publishLabel(a({}), [], [])).toBe('שמירה לעצמי')
  })
  it('people needs a selected, still-connected person', () => {
    expect(canPublish(a({ mode: 'people', selected: ['ghost'] }), people, groups)).toBe(false)
    expect(canPublish(a({ mode: 'people', selected: ['mom'] }), people, groups)).toBe(true)
    expect(publishLabel(a({ mode: 'people', selected: ['mom', 'dad'] }), people, groups)).toBe('פרסום ל-2 אנשים')
  })
  it('group needs a group with members', () => {
    expect(canPublish(a({ mode: 'group', groupId: 'g2' }), people, groups)).toBe(false)
    expect(publishLabel(a({ mode: 'group', groupId: 'g2' }), people, groups)).toBe('בחרו קבוצה שיש בה חברים')
    expect(canPublish(a({ mode: 'group', groupId: 'g1' }), people, groups)).toBe(true)
    expect(publishLabel(a({ mode: 'group' }), people, [])).toBe('צרו קבוצה כדי לפרסם')
  })
  it('circle needs connections', () => {
    expect(canPublish(a({ mode: 'circle' }), [], [])).toBe(false)
    expect(canPublish(a({ mode: 'circle' }), people, [])).toBe(true)
  })
})

describe('group names', () => {
  it('rejects duplicates and the front page name, allows renaming itself', () => {
    expect(groupNameError('משפחה', groups)).toBe(DUPLICATE_GROUP)
    expect(groupNameError('עמוד ראשי', groups)).toBe(DUPLICATE_GROUP)
    expect(groupNameError(' משפחה ', groups, 'g1')).toBe('')
    expect(groupNameError('חדשה', groups)).toBe('')
  })
})

describe('audience text', () => {
  it('describes who received the article', () => {
    expect(audienceText([], () => '')).toMatch('נשמרה רק אצלכם')
    expect(audienceText(['mom'], () => 'אמא')).toBe('נשלחה ל-1: אמא')
  })
})
