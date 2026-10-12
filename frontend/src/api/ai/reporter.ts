import { aiApi } from '../http'
import type { Id, ReporterSession, ReporterTurn } from '../types'

export const startSession = () => aiApi.post<ReporterSession>('/reporter/sessions')

export const sendMessage = (sessionId: Id, text: string) =>
  aiApi.post<ReporterTurn>(`/reporter/sessions/${sessionId}/messages`, { text })
