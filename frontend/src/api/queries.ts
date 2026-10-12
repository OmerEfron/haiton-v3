import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getArticle, getFeed, getUserArticles } from './core/articles'
import { getFacts, getHidden, getMe, getPrefs } from './core/me'
import { getConnections, getGroups, getUser } from './core/people'
import { getInvite, getNotifications } from './core/social'
import type { Id } from './types'

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: getMe, retry: false, staleTime: 60_000 })
export const usePrefs = () => useQuery({ queryKey: ['prefs'], queryFn: getPrefs })
export const useFacts = () => useQuery({ queryKey: ['facts'], queryFn: getFacts })
export const useHidden = () => useQuery({ queryKey: ['hidden'], queryFn: getHidden })

export const useFeed = (groupId?: Id) =>
  useQuery({ queryKey: ['feed', groupId ?? 'front'], queryFn: () => getFeed(groupId) })
export const useArticle = (id: Id) => useQuery({ queryKey: ['article', id], queryFn: () => getArticle(id), retry: false })
export const useUserArticles = (id: Id) => useQuery({ queryKey: ['userArticles', id], queryFn: () => getUserArticles(id) })
export const useUser = (id: Id) => useQuery({ queryKey: ['user', id], queryFn: () => getUser(id), retry: false })

export const useConnections = () => useQuery({ queryKey: ['connections'], queryFn: getConnections })
export const useGroups = () => useQuery({ queryKey: ['groups'], queryFn: getGroups })

/** Polled so server-side events (joins, reactions) show up without a push channel. */
export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: getNotifications, refetchInterval: 5_000 })

export const useInvite = (code: string) =>
  useQuery({ queryKey: ['invite', code], queryFn: () => getInvite(code), retry: false })

/**
 * Any write. On success every cached query is invalidated.
 * ponytail: refetches everything active after each write; fine at this data size,
 * switch to per-mutation invalidation keys if the feed gets heavy.
 */
export function useAction<V, R>(fn: (vars: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries() })
}
