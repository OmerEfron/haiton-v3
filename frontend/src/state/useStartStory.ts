import { useLocation, useNavigate } from 'react-router'
import type { Id } from '../api/types'
import { firstName } from '../lib/color'
import { useNameOf } from '../lib/useNameOf'
import { useCompose } from './ComposeContext'
import { useUiActions } from './UiProvider'

/**
 * Start a new story (optionally addressed to someone).
 * If a story is in progress, asks first: start over, keep going, or send the current one to that person.
 */
export function useStartStory() {
  const c = useCompose()
  const { showConfirm, closeConfirm, setNotifs } = useUiActions()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const nameOf = useNameOf()

  const startFresh = (to?: Id) => {
    c.reset(to ? { mode: 'people', selected: [to] } : undefined)
    closeConfirm()
    setNotifs(false)
    nav('/compose')
  }

  return (to?: Id) => {
    if (c.userCount === 0) return startFresh(to)
    const toName = to ? firstName(nameOf(to) ?? '') : ''
    setNotifs(false)
    showConfirm({
      title: 'להתחיל סיפור חדש?',
      text: 'השיחה הנוכחית עם הכתב והטיוטה שלה יימחקו. אפשר גם לחזור אליהן ולהמשיך.',
      yesLabel: 'סיפור חדש',
      noLabel: 'המשך הסיפור הנוכחי',
      onYes: () => startFresh(to),
      onNo: () => {
        closeConfirm()
        if (pathname !== '/compose') nav(c.draftReady ? '/compose/draft' : '/compose')
      },
      alt: to
        ? {
            label: 'שליחת הסיפור הנוכחי ל' + toName,
            onClick: () => {
              c.setAudience({ mode: 'people', selected: [...new Set([...c.audience.selected, to])] })
              closeConfirm()
              nav(c.draftReady ? '/compose/publish' : '/compose')
            },
          }
        : undefined,
    })
  }
}
