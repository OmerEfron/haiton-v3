import { useMe } from '../../api/queries'
import { firstName } from '../../lib/color'
import { useStartStory } from '../../state/useStartStory'

const STEPS = [
  ['1', 'מספרים לכתב', 'מה קרה היום, במילים שלכם'],
  ['2', 'העורך כותב טיוטה', 'אפשר לשנות אותה כמה שרוצים'],
  ['3', 'בוחרים מי קורא', 'שום דבר לא מתפרסם בלי אישור שלכם'],
  ['4', 'מזמינים חברים', 'כדי שיהיה למי לשלוח, וממי לקרוא'],
] as const

export function useWelcomeModel() {
  const me = useMe().data
  const startStory = useStartStory()
  return {
    name: firstName(me?.name ?? ''),
    steps: STEPS,
    start: () => startStory(),
  }
}

export type WelcomeModel = ReturnType<typeof useWelcomeModel>
