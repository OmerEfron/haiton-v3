import { useConnections, useGroups } from '../api/queries'
import type { AudienceMode } from '../api/types'
import { useUiActions } from '../state/UiProvider'
import { audienceModes, canPublish, pickedGroup, publishLabel, selectedIds, type AudienceState } from './audience'

export function useAudiencePicker(audience: AudienceState, setAudience: (patch: Partial<AudienceState>) => void) {
  const people = useConnections().data ?? []
  const groups = useGroups().data ?? []
  const ui = useUiActions()
  const np = people.length
  const a = { ...audience, mode: np ? audience.mode : ('me' as AudienceMode) }
  const sel = selectedIds(a, people)
  const group = pickedGroup(a, groups)

  const chooseMode = (mode: AudienceMode) =>
    setAudience(mode === 'group' ? { mode, groupId: (groups.find((g) => g.memberIds.length) ?? groups[0])?.id ?? null } : { mode })
  const toggle = (id: string) => setAudience({ selected: sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id] })

  return {
    modes: audienceModes(np, groups.length),
    mode: a.mode,
    chooseMode,
    np,
    openInvite: () => ui.openInvite(),
    groups,
    people,
    sel,
    addGroupMembers: (memberIds: string[]) => setAudience({ selected: [...new Set([...sel, ...memberIds])] }),
    toggle,
    groupId: group?.id,
    pickGroup: (id: string) => setAudience({ groupId: id }),
    editGroup: (id: string) => ui.openGroupEditor({ groupId: id, onSaved: (saved) => setAudience({ mode: 'group', groupId: saved.id }) }),
    createGroup: () => ui.openGroupEditor({ onSaved: (g) => setAudience({ mode: 'group', groupId: g.id }) }),
    ok: canPublish(a, people, groups),
    label: publishLabel(a, people, groups),
  }
}

export type AudiencePicker = ReturnType<typeof useAudiencePicker>
