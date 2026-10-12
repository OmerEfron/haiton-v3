import { useNavigate, useSearchParams } from 'react-router'

const STEPS = [
  ['01', 'מספרים לכתב', 'כמה משפטים על מה שקרה, בשיחה.'],
  ['02', 'העורך כותב', 'כתבה עם כותרת, רק ממה שסיפרתם.'],
  ['03', 'אתם בוחרים מי קורא', 'כל כתבה נשלחת רק למי שבחרתם.'],
] as const

export function useLandingModel() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')
  const login = () => nav(next ? `/login?next=${encodeURIComponent(next)}` : '/login')
  return { steps: STEPS, login }
}

export type LandingModel = ReturnType<typeof useLandingModel>
