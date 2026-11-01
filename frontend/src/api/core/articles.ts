import { coreApi } from '../http'
import type { Article, ArticleSummary, Audience, Id, PublishRequest } from '../types'

export const getFeed = (groupId?: Id) =>
  coreApi.get<ArticleSummary[]>(groupId ? `/feed?group=${encodeURIComponent(groupId)}` : '/feed')

export const getArticle = (id: Id) => coreApi.get<Article>(`/articles/${id}`)
export const getUserArticles = (userId: Id) => coreApi.get<ArticleSummary[]>(`/users/${userId}/articles`)

export const publishArticle = (req: PublishRequest) => coreApi.post<Article>('/articles', req)
export const deleteArticle = (id: Id) => coreApi.del<void>(`/articles/${id}`)
export const setArticleAudience = (id: Id, audience: Audience) =>
  coreApi.put<Article>(`/articles/${id}/audience`, { audience })

export const setReaction = (id: Id, label: string | null) => coreApi.put<void>(`/articles/${id}/reaction`, { label })
export const reportArticle = (id: Id, reason: string, note: string) =>
  coreApi.post<void>(`/articles/${id}/report`, { reason, note })
export const hideArticle = (id: Id) => coreApi.post<void>(`/articles/${id}/hide`)
export const unhideArticle = (id: Id) => coreApi.del<void>(`/articles/${id}/hide`)
