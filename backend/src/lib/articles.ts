import { pool, tx } from '../db.ts'
import { HttpError } from '../errors.ts'
import { saveFacts } from './facts.ts'
import { IN_GROUP, NOT_HIDDEN, NOT_MUTED, VISIBLE, visible } from './visible.ts'

/** The user looking at Articles. Every function below takes it first. */
export interface Viewer {
  id: string
  name: string
}

interface ArticleRow {
  id: string
  author_id: string
  author: string
  created_at: Date
  image_url: string | null
  headline: string
  sub: string
  flash: string
  push: string | null
  body: string[]
  prev_id: string | null
  has_prev: boolean
}

const SELECT = `
  select a.id, a.author_id, u.name as author, a.created_at, a.image_url,
         a.headline, a.sub, a.flash, a.push, a.body, a.prev_id,
         exists (
           select 1 from articles p
           where p.id = a.prev_id and p.author_id = a.author_id and ${visible('p')}
         ) as has_prev
  from articles a
  join users u on u.id = a.author_id
`

function summary(a: ArticleRow, viewerId: string, viewerName: string) {
  return {
    id: a.id,
    authorId: a.author_id,
    author: a.author_id === viewerId ? viewerName : a.author,
    createdAt: a.created_at.toISOString(),
    imageUrl: a.image_url,
    headline: a.headline,
    sub: a.sub,
    flash: a.flash,
    hasPrev: a.has_prev,
  }
}

async function getVisible(viewerId: string, id: string) {
  const { rows } = await pool.query<ArticleRow>(`${SELECT} where a.id = $2 and ${VISIBLE}`, [viewerId, id])
  return rows[0] ?? null
}

/** The plain Article row if it is Visible to the viewer, else 404. For reactions, hide and report. */
export async function findVisible(viewerId: string, id: string) {
  const a = await getVisible(viewerId, id)
  if (!a) throw new HttpError(404, 'not found')
  return a
}

const list = async (viewer: Viewer, sql: string, params: unknown[]) =>
  (await pool.query<ArticleRow>(sql, params)).rows.map((a) => summary(a, viewer.id, viewer.name))

/** Visible Articles, minus hidden ones and muted Connections. Only filters by a group the viewer owns. */
export async function feed(viewer: Viewer, group?: string) {
  const owned = group ? (await pool.query('select 1 from groups where id = $1 and owner_id = $2', [group, viewer.id])).rowCount : 0
  const where = `${VISIBLE} and ${NOT_HIDDEN} and ${NOT_MUTED}` + (owned ? ` and ${IN_GROUP}` : '')
  return list(viewer, `${SELECT} where ${where} order by a.created_at desc`, owned ? [viewer.id, group] : [viewer.id])
}

/**
 * Visible, unhidden Articles by one author. Named rule: no muted check here, so a muted
 * Connection's Articles stay listed on their own profile (muting only hides them from the feed).
 */
export const articlesBy = (viewer: Viewer, authorId: string) =>
  list(viewer, `${SELECT} where a.author_id = $2 and ${VISIBLE} and ${NOT_HIDDEN} order by a.created_at desc`, [
    viewer.id,
    authorId,
  ])

/** Articles the viewer hid. */
export const hiddenBy = (viewer: Viewer) =>
  list(
    viewer,
    `${SELECT} join hidden h on h.article_id = a.id where h.user_id = $1 order by a.created_at desc`,
    [viewer.id],
  )

/** Full view of one Visible Article (body, history, reactions, Audience for the author), or 404. */
export async function read(viewer: Viewer, id: string) {
  const a = await findVisible(viewer.id, id)
  const viewerId = viewer.id
  const viewerName = viewer.name
  const mine = a.author_id === viewerId
  // Earlier Articles the viewer can see, stopping at the first one they can't.
  const history: ArticleRow[] = []
  let prevId = a.prev_id
  while (prevId && history.length < 5) {
    const p = await getVisible(viewerId, prevId)
    if (!p || p.author_id !== a.author_id) break
    history.push(p)
    prevId = p.prev_id
  }
  const audience = mine
    ? (await pool.query<{ user_id: string }>('select user_id from article_audience where article_id = $1', [a.id])).rows.map(
        (r) => r.user_id,
      )
    : null
  const received = mine
    ? (
        await pool.query<{ person_id: string; name: string; label: string }>(
          `select r.user_id as person_id, u.name, r.label
           from reactions r join users u on u.id = r.user_id
           where r.article_id = $1`,
          [a.id],
        )
      ).rows.map((r) => ({ personId: r.person_id, name: r.name, label: r.label }))
    : []
  const my = await pool.query<{ label: string }>('select label from reactions where article_id = $1 and user_id = $2', [
    a.id,
    viewerId,
  ])
  const reported = await pool.query('select 1 from reports where article_id = $1 and user_id = $2', [a.id, viewerId])
  return {
    ...summary(a, viewerId, viewerName),
    body: a.body,
    history: history.map((h) => summary(h, viewerId, viewerName)),
    audienceIds: audience,
    received,
    myReaction: my.rows[0]?.label ?? null,
    reported: reported.rowCount !== 0,
  }
}

export interface AudienceInput {
  mode: 'circle' | 'me' | 'people' | 'group'
  personIds?: string[]
  groupId?: string
}

export interface PublishInput {
  draftId?: string
  content: { headline: string; sub: string; body: string[]; flash: string; push?: string }
  prevId?: string | null
  audience: AudienceInput
  saveFacts: { k: string; v: string }[]
}

/** Who the author's chosen Audience resolves to: only people they are connected to. Throws 400 if empty (except "me"). */
async function resolveAudience(authorId: string, aud: AudienceInput) {
  const connected = (
    await pool.query<{ other_id: string }>('select other_id from connections where user_id = $1', [authorId])
  ).rows.map((r) => r.other_id)
  let ids: string[] = []
  if (aud.mode === 'people') ids = (aud.personIds ?? []).filter((id) => connected.includes(id))
  else if (aud.mode === 'circle') ids = connected
  else if (aud.mode === 'group') {
    const { rows } = await pool.query<{ user_id: string }>(
      'select user_id from group_members gm join groups g on g.id = gm.group_id where g.id = $1 and g.owner_id = $2',
      [aud.groupId, authorId],
    )
    ids = rows.map((r) => r.user_id)
  }
  if (aud.mode !== 'me' && !ids.length) throw new HttpError(400, 'empty audience')
  return ids
}

const insertAudience = (db: { query: typeof pool.query }, articleId: string, userIds: string[]) =>
  userIds.length
    ? db.query('insert into article_audience (article_id, user_id) select $1, unnest($2::text[])', [articleId, userIds])
    : undefined

/**
 * Publishes an Article: the Article, its Audience, the Facts to save and the end of onboarding
 * are written in one transaction. Empty Audience is rejected (400) and a foreign Draft ignored before writing.
 */
export async function publish(viewer: Viewer, input: PublishInput) {
  const ids = await resolveAudience(viewer.id, input.audience)
  const owned = input.draftId
    ? await pool.query('select 1 from ai_drafts where id = $1 and user_id = $2', [input.draftId, viewer.id])
    : null
  const draftId = owned?.rowCount ? input.draftId : null
  const { content } = input
  const id = await tx(async (db) => {
    const { rows } = await db.query<{ id: string }>(
      `insert into articles (author_id, headline, sub, flash, push, body, prev_id, draft_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
      [viewer.id, content.headline, content.sub, content.flash, content.push ?? null, content.body, input.prevId ?? null, draftId],
    )
    await insertAudience(db, rows[0].id, ids)
    await saveFacts(viewer.id, input.saveFacts, 'נוסף היום, מתוך השיחה', db)
    await db.query('update users set onboarding = false where id = $1', [viewer.id])
    return rows[0].id
  })
  return read(viewer, id)
}

/**
 * Replaces the Audience of one of the viewer's own Articles (404 if not theirs, 400 if empty) and returns the full view.
 * `parseAudience` runs after the ownership check, so a non-owner gets 404 before any body error. */
export async function changeAudience(viewer: Viewer, articleId: string, parseAudience: () => AudienceInput) {
  const owned = await pool.query('select 1 from articles where id = $1 and author_id = $2', [articleId, viewer.id])
  if (!owned.rowCount) throw new HttpError(404, 'not found')
  const ids = await resolveAudience(viewer.id, parseAudience())
  await tx(async (db) => {
    await db.query('delete from article_audience where article_id = $1', [articleId])
    await insertAudience(db, articleId, ids)
  })
  return read(viewer, articleId)
}
