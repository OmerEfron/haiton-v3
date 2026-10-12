import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Group, Id } from '../api/types'

export interface ConfirmSpec {
  title: string
  text: string
  yesLabel: string
  noLabel: string
  onYes: () => void
  onNo?: () => void
  alt?: { label: string; onClick: () => void }
}

export interface GroupEditorSpec {
  groupId?: Id
  onSaved?: (g: Group) => void
}

export interface NoteSpec {
  text: string
  undo?: () => void
}

export interface ToastSpec {
  title: string
  sub?: string
}

interface UiState {
  confirm: ConfirmSpec | null
  groupEditor: GroupEditorSpec | null
  invite: { onboard: boolean } | null
  notifs: boolean
  note: NoteSpec | null
  toast: ToastSpec | null
}

interface UiActions {
  showConfirm: (c: ConfirmSpec) => void
  closeConfirm: () => void
  openGroupEditor: (g?: GroupEditorSpec) => void
  closeGroupEditor: () => void
  openInvite: (onboard?: boolean) => void
  closeInvite: () => void
  setNotifs: (open: boolean) => void
  showNote: (n: NoteSpec) => void
  closeNote: () => void
  showToast: (t: ToastSpec) => void
}

const StateCtx = createContext<UiState | null>(null)
const ActionsCtx = createContext<UiActions | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<UiState>({ confirm: null, groupEditor: null, invite: null, notifs: false, note: null, toast: null })
  const timers = useRef<Record<string, number>>({})
  const set = useCallback((patch: Partial<UiState>) => setS((p) => ({ ...p, ...patch })), [])
  const flash = useCallback(
    (key: 'note' | 'toast', value: NoteSpec | ToastSpec) => {
      clearTimeout(timers.current[key])
      set({ [key]: value })
      timers.current[key] = window.setTimeout(() => set({ [key]: null }), 5000)
    },
    [set],
  )

  const actions = useMemo<UiActions>(
    () => ({
      showConfirm: (confirm) => set({ confirm }),
      closeConfirm: () => set({ confirm: null }),
      openGroupEditor: (g = {}) => set({ groupEditor: g, notifs: false }),
      closeGroupEditor: () => set({ groupEditor: null }),
      openInvite: (onboard = false) => set({ invite: { onboard }, groupEditor: null, notifs: false }),
      closeInvite: () => set({ invite: null }),
      setNotifs: (notifs) => set({ notifs }),
      showNote: (n) => flash('note', n),
      closeNote: () => set({ note: null }),
      showToast: (t) => flash('toast', t),
    }),
    [set, flash],
  )

  return (
    <ActionsCtx.Provider value={actions}>
      <StateCtx.Provider value={s}>{children}</StateCtx.Provider>
    </ActionsCtx.Provider>
  )
}

export function useUiActions() {
  const actions = useContext(ActionsCtx)
  if (!actions) throw new Error('useUiActions outside UiProvider')
  return actions
}

export function useUiState() {
  const state = useContext(StateCtx)
  if (!state) throw new Error('useUiState outside UiProvider')
  return state
}
