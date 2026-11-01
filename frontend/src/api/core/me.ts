import { coreApi } from '../http'
import type { ArticleSummary, Fact, Gender, Me, NewFact, NotificationPrefs } from '../types'

export const getMe = () => coreApi.get<Me>('/me')
export const signInWithGoogle = (email: string) => coreApi.post<Me>('/auth/google', { email })
export const logout = () => coreApi.post<void>('/auth/logout')
export const deleteAccount = () => coreApi.del<void>('/me')
export const updateProfile = (patch: Partial<{ name: string; gender: Gender; birthYear: number }>) =>
  coreApi.patch<Me>('/me', patch)

export const uploadPhoto = (file: File) => {
  const form = new FormData()
  form.append('photo', file)
  return coreApi.post<Me>('/me/photo', form)
}
export const removePhoto = () => coreApi.del<Me>('/me/photo')

export const getPrefs = () => coreApi.get<NotificationPrefs>('/me/notification-prefs')
export const updatePrefs = (patch: Partial<NotificationPrefs>) =>
  coreApi.patch<NotificationPrefs>('/me/notification-prefs', patch)

export const getFacts = () => coreApi.get<Fact[]>('/me/facts')
export const addFacts = (facts: NewFact[]) => coreApi.post<Fact[]>('/me/facts', { facts })
export const deleteFact = (id: string) => coreApi.del<void>(`/me/facts/${id}`)

export const getHidden = () => coreApi.get<ArticleSummary[]>('/me/hidden')
