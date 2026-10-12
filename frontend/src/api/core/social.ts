import { coreApi } from '../http'
import type { AcceptInviteResult, InviteInfo, InviteLink, Notification } from '../types'

export const createInvite = (channel: 'whatsapp' | 'email' | 'link') => coreApi.post<InviteLink>('/invites', { channel })
export const getInvite = (code: string) => coreApi.get<InviteInfo>(`/invites/${code}`)
export const acceptInvite = (code: string) => coreApi.post<AcceptInviteResult>(`/invites/${code}/accept`)
export const declineInvite = (code: string) => coreApi.post<void>(`/invites/${code}/decline`)

export const getNotifications = () => coreApi.get<Notification[]>('/notifications')
export const markNotificationsRead = () => coreApi.post<void>('/notifications/read')
