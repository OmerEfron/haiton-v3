import { useState } from 'react'
import { useMe } from '../../api/queries'

const TIPS = {
  chat: { step: 'שלב 1 מתוך 4', title: 'ספרו לכתב מה קרה', text: 'כמה משפטים מספיקים. הכתב ישאל שאלה או שתיים, וכשיש סיפור יופיע הכפתור "די, תיצור טיוטה".' },
  draft: { step: 'שלב 2 מתוך 4', title: 'זו הטיוטה שלכם', text: 'העורך כתב כתבה רק ממה שסיפרתם. אפשר לבקש נוסח אחר או לחזור לשיחה. למטה מופיעים פרטים שהכתב למד עליכם, ואתם מחליטים אם לשמור אותם בכרטסת.' },
  publish: { step: 'שלב 3 מתוך 4', title: 'אתם בוחרים מי קורא', text: 'כל כתבה נשלחת רק למי שבחרתם. עוד אין לכם חיבורים, אז הכתבה הראשונה תישמר אצלכם. בשלב הבא נזמין חברים.' },
}

const KEY = 'haiton-tips-seen'
const seen = (): string[] => JSON.parse(localStorage.getItem(KEY) ?? '[]')

/** One-time explainer shown to onboarding users on each compose step. */
export function OnboardingTip({ step }: { step: keyof typeof TIPS }) {
  const me = useMe().data
  const [hidden, setHidden] = useState(() => seen().includes(step))
  if (!me?.onboarding || hidden) return null
  const tip = TIPS[step]
  const ok = () => {
    localStorage.setItem(KEY, JSON.stringify([...seen(), step]))
    setHidden(true)
  }
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[150px] z-20 flex justify-center">
      <div className="pointer-events-auto flex w-full max-w-[440px] flex-col gap-2 rounded-2xl bg-[#141414] px-[18px] py-4 text-white shadow-2xl">
        <div className="text-xs font-bold text-[#ff8a80]">{tip.step}</div>
        <div className="text-lg leading-snug font-extrabold">{tip.title}</div>
        <div className="text-[14.5px] leading-relaxed text-[#e4e4e4]">{tip.text}</div>
        <div className="flex justify-end pt-1">
          <button onClick={ok} className="h-9 rounded-full bg-white px-[18px] text-sm font-bold text-[#141414]">הבנתי</button>
        </div>
      </div>
    </div>
  )
}
