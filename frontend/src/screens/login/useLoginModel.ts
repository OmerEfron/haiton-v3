import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { signInWithGoogle } from '../../api/core/me'
import type { Me } from '../../api/types'
import { useBack } from '../../lib/useBack'
import { SEED_ACCOUNTS } from '../../mocks/seed/seed'
import { useCompose } from '../../state/ComposeContext'

const isEmail = (s: string) => /\S+@\S+\.\S+/.test(s)

/**
 * Stand-in for the Google account chooser. With a real backend this page becomes a redirect
 * to the OAuth endpoint, and the callback lands back on `next`.
 */
export function useLoginModel() {
  const nav = useNavigate()
  const back = useBack('/')
  const qc = useQueryClient()
  const compose = useCompose()
  const [params] = useSearchParams()
  const next = params.get('next')
  const [other, setOther] = useState(params.has('other'))
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const signIn = async (address: string) => {
    if (busy) return
    setBusy(true)
    setError(false)
    try {
      const me = await signInWithGoogle(address)
      qc.clear()
      compose.reset()
      qc.setQueryData<Me>(['me'], me)
      nav(next ?? (me.onboarding ? '/welcome' : '/feed'), { replace: true })
    } catch {
      setError(true)
      setBusy(false)
    }
  }

  const submitEmail = () => {
    if (isEmail(email)) signIn(email.trim())
  }

  return {
    accounts: SEED_ACCOUNTS,
    other,
    email,
    setEmail,
    busy,
    error,
    back,
    canSubmit: isEmail(email) && !busy,
    showOther: () => setOther(true),
    signIn,
    submitEmail,
  }
}

export type LoginModel = ReturnType<typeof useLoginModel>
