import { coreApi } from '../http'
import type { Connection, Group, Id, UserProfile } from '../types'

export const getConnections = () => coreApi.get<Connection[]>('/connections')
export const setMuted = (id: Id, muted: boolean) => coreApi.patch<Connection>(`/connections/${id}`, { muted })
export const removeConnection = (id: Id) => coreApi.del<void>(`/connections/${id}`)

export const getUser = (id: Id) => coreApi.get<UserProfile>(`/users/${id}`)

export const getGroups = () => coreApi.get<Group[]>('/groups')
export const createGroup = (g: { name: string; memberIds: Id[] }) => coreApi.post<Group>('/groups', g)
export const updateGroup = (id: Id, g: { name: string; memberIds: Id[] }) => coreApi.patch<Group>(`/groups/${id}`, g)
export const deleteGroup = (id: Id) => coreApi.del<void>(`/groups/${id}`)
