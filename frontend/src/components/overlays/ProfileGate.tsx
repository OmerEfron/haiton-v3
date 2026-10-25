import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { updateProfile } from '../../api/core/me'
import type { Gender, Me } from '../../api/types'
import { Logo } from '../ui'

const GENDERS: [Gender, string][] = [
  ['male', 'זכר'],
  ['female', 'נקבה'],
  ['other', 'אחר'],
]

const yearNow = new Date().getFullYear()

/** Blocks the app until a new account has a preferred name, a gender, and a birth year. */
export function ProfileGate() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [year, setYear] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const birthYear = Number(year)
  const yearOk = Number.isInteger(birthYear) && birthYear >= yearNow - 120 && birthYear <= yearNow
  const canSubmit = !!name.trim() && !!gender && yearOk && !busy

  const submit = async () => {
    if (!canSubmit || !gender) return
    setBusy(true)
    setError(false)
    try {
      const me = await updateProfile({ name: name.trim(), gender, birthYear })
      qc.setQueryData<Me>(['me'], me)
    } catch {
      setError(true)
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className="flex w-full max-w-[420px] flex-col gap-[22px]"
      >
        <Logo className="text-right text-[30px] leading-none" />
        <div className="flex flex-col gap-2">
          <div className="text-[27px] leading-tight font-extrabold">עוד כמה פרטים</div>
          <div className="text-[15.5px] leading-relaxed text-ash">כדי להתחיל, ספרו לנו איך לקרוא לכם, וגם את המגדר ושנת הלידה.</div>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-bold">איך תרצו שיקראו לכם?</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="מאיה"
            aria-label="איך תרצו שיקראו לכם?"
            className="h-[52px] rounded-xl border border-disabled px-3.5 text-base font-medium"
          />
        </label>
        <div className="flex flex-col gap-2">
          <div className="text-[15px] font-bold">מגדר</div>
          <div className="grid grid-cols-3 gap-2">
            {GENDERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setGender(value)}
                className={`h-12 rounded-xl border text-[15.5px] font-bold ${
                  gender === value ? 'border-charcoal bg-charcoal text-white' : 'border-disabled bg-white text-charcoal'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-bold">שנת לידה</span>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            type="number"
            inputMode="numeric"
            min={yearNow - 120}
            max={yearNow}
            placeholder="1990"
            aria-label="שנת לידה"
            className="h-[52px] rounded-xl border border-disabled px-3.5 text-base font-medium"
          />
        </label>
        <button
          disabled={!canSubmit}
          className="h-[52px] rounded-xl bg-brand text-[17px] font-bold text-white disabled:bg-disabled"
        >
          המשך
        </button>
        {error && <div className="text-[13px] text-brand">משהו השתבש. נסו שוב.</div>}
      </form>
    </div>
  )
}
