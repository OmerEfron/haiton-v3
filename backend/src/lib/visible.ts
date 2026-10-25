/** Viewer wrote it, or they're in the audience and still connected to the author. */
export const VISIBLE = `
  (a.author_id = $1
   or (
     exists (select 1 from article_audience aa where aa.article_id = a.id and aa.user_id = $1)
     and exists (select 1 from connections c where c.user_id = $1 and c.other_id = a.author_id)
   ))
`

export const NOT_HIDDEN = `not exists (select 1 from hidden h where h.article_id = a.id and h.user_id = $1)`

export const NOT_MUTED = `
  (a.author_id = $1
   or not exists (select 1 from connections c where c.user_id = $1 and c.other_id = a.author_id and c.muted))
`

export const IN_GROUP = `
  exists (
    select 1 from groups g
    where g.id = $2 and g.owner_id = $1
      and (
        (a.author_id = $1 and exists (
          select 1 from group_members gm
          join article_audience aa on aa.user_id = gm.user_id and aa.article_id = a.id
          where gm.group_id = g.id
        ))
        or (a.author_id <> $1 and exists (
          select 1 from group_members gm where gm.group_id = g.id and gm.user_id = a.author_id
        ))
      )
  )
`
