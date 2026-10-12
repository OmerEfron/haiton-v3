import { aiApi } from '../http'
import type { Draft, Id, RevisionKind } from '../types'

export const createDraft = (sessionId: Id, signal?: AbortSignal) =>
  aiApi.post<Draft>('/editor/drafts', { sessionId }, signal)

export const reviseDraft = (draftId: Id, kind: RevisionKind) =>
  aiApi.post<Draft>(`/editor/drafts/${draftId}/revise`, { kind })
