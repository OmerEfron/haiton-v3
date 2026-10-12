import { lazy, type ComponentType } from 'react'
import { useIsDesktop } from './useIsDesktop'

type Loader = () => Promise<{ default: ComponentType }>

/** Lazy-loads only the view for the current breakpoint. Call at module scope. */
export function responsive(loadMobile: Loader, loadDesktop: Loader) {
  const Mobile = lazy(loadMobile)
  const Desktop = lazy(loadDesktop)
  return function ResponsiveScreen() {
    const desktop = useIsDesktop()
    const View = desktop ? Desktop : Mobile
    return <View />
  }
}
