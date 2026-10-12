import { useIsDesktop } from '../../device/useIsDesktop'
import { useUiActions, useUiState } from '../../state/UiProvider'
import { btn, Dialog } from '../ui'
import { GroupEditorSheet } from './GroupEditorSheet'
import { InviteSheet } from './InviteSheet'
import { NotificationsSheet } from './NotificationsSheet'

/** App-wide overlays driven by UiProvider state. */
export function Overlays() {
  const ui = useUiState()
  const { closeConfirm, closeNote } = useUiActions()
  const desktop = useIsDesktop()
  const c = ui.confirm
  const notePos = desktop
    ? 'fixed top-1/2 left-1/2 z-50 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2'
    : 'fixed bottom-[90px] left-1/2 z-50 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2'
  return (
    <>
      {ui.notifs && <NotificationsSheet />}
      {ui.groupEditor && <GroupEditorSheet spec={ui.groupEditor} />}
      {ui.invite && <InviteSheet onboard={ui.invite.onboard} />}
      {c && (
        <Dialog>
          <div className="text-[21px] leading-snug font-extrabold">{c.title}</div>
          <div className="text-[14.5px] leading-relaxed text-ash">{c.text}</div>
          <div className="flex flex-col gap-2 pt-1">
            <button onClick={c.onYes} className={btn.primary}>{c.yesLabel}</button>
            {c.alt && <button onClick={c.alt.onClick} className={btn.dark}>{c.alt.label}</button>}
            <button onClick={c.onNo ?? closeConfirm} className={btn.outline}>{c.noLabel}</button>
          </div>
        </Dialog>
      )}
      {ui.toast && (
        <div role="status" className="fixed top-2.5 left-1/2 z-50 flex w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 flex-col gap-0.5 rounded-[14px] bg-charcoal px-4 py-3 text-white shadow-xl">
          <div className="text-sm font-bold">{ui.toast.title}</div>
          {ui.toast.sub && <div className="text-[13.5px] leading-snug text-[#d8d8d8]">{ui.toast.sub}</div>}
        </div>
      )}
      {ui.note && (
        <div role="status" className={`${notePos} flex items-center justify-between gap-3 rounded-[14px] bg-charcoal px-4 py-3 text-white shadow-xl`}>
          <span className="text-sm leading-snug font-semibold">{ui.note.text}</span>
          {ui.note.undo && (
            <button
              onClick={() => {
                const undo = ui.note?.undo
                closeNote()
                undo?.()
              }}
              className="flex-none text-sm font-bold underline"
            >
              ביטול
            </button>
          )}
        </div>
      )}
    </>
  )
}
