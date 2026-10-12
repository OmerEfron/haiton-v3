import { useSyncExternalStore } from 'react'

const query = '(min-width: 768px)'

function subscribe(cb: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export function useIsDesktop() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}
