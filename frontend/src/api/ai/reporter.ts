import { aiApi } from '../http'
import type { Id, IntroTurn, PastSession, ReporterSession, ReporterTurn } from '../types'

export const listSessions = () => aiApi.get<PastSession[]>('/reporter/sessions')

export const startSession = () => aiApi.post<ReporterSession>('/reporter/sessions')

export const sendMessage = (sessionId: Id, text: string) =>
  aiApi.post<ReporterTurn>(`/reporter/sessions/${sessionId}/messages`, { text })

export const startIntro = () => aiApi.post<ReporterSession>('/intro/sessions')

export const sendIntro = (sessionId: Id, text: string) =>
  aiApi.post<IntroTurn>(`/intro/sessions/${sessionId}/messages`, { text })
