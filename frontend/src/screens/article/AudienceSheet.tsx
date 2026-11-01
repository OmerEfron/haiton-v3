import { useState } from 'react'
import { setArticleAudience } from '../../api/core/articles'
import { useAction, useConnections } from '../../api/queries'
import type { Article, Audience, Id } from '../../api/types'
import { btn, Sheet, SheetTitle } from '../../components/ui'
import type { AudienceState } from '../../lib/audience'
import { useAudiencePicker } from '../../lib/useAudiencePicker'
import { PublishBody } from '../publish/parts'

function initialAudience(ids: Id[] | null, people: { id: Id }[]): AudienceState {
  const set = new Set(ids ?? [])
  if (!set.size) return { mode: 'me', selected: [], groupId: null }
  if (people.length && set.size === people.length && people.every((p) => set.has(p.id)))
    return { mode: 'circle', selected: [], groupId: null }
  return { mode: 'people', selected: [...set], groupId: null }
}

export function AudienceSheet({ article, onClose }: { article: Article; onClose: () => void }) {
  const people = useConnections()
  const [audience, setAudience] = useState<AudienceState | null>(() =>
    people.data ? initialAudience(article.audienceIds, people.data) : null,
  )
  if (!audience && people.data) setAudience(initialAudience(article.audienceIds, people.data))
  const picker = useAudiencePicker(
    audience ?? { mode: 'me', selected: [], groupId: null },
    (patch) => setAudience((a) => ({ ...(a ?? { mode: 'me', selected: [], groupId: null }), ...patch })),
  )
  const save = useAction((aud: Audience) => setArticleAudience(article.id, aud))
  const onSave = () =>
    save.mutate(
      {
        mode: picker.mode,
        personIds: picker.mode === 'people' ? picker.sel : undefined,
        groupId: picker.mode === 'group' ? picker.groupId : undefined,
      },
      { onSuccess: onClose },
    )

  return (
    <Sheet onClose={onClose}>
      <SheetTitle>מי יכול לראות</SheetTitle>
      {audience && (
        <>
          <PublishBody m={picker} />
          {save.isError && <div className="text-[13px] text-brand">השמירה נכשלה. נסו שוב.</div>}
          <button onClick={onSave} disabled={!picker.ok || save.isPending} className={btn.cta}>
            {save.isPending ? 'שומר…' : 'שמירה'}
          </button>
        </>
      )}
    </Sheet>
  )
}
