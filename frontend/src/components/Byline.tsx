import { useMe } from '../api/queries'
import type { ArticleSummary } from '../api/types'
import { colorOf } from '../lib/color'
import { relTime } from '../lib/time'
import { Avatar } from './ui'

export function Byline({ a, size = 24, dark = false, dot = false }: { a: ArticleSummary; size?: number; dark?: boolean; dot?: boolean }) {
  const me = useMe().data
  const mine = a.authorId === me?.id
  return (
    <div className={`flex items-center gap-2 text-[12.5px] font-medium ${dark ? '' : 'text-muted'}`}>
      {dot ? (
        <span className="size-2 flex-none rounded-full" style={{ background: colorOf(a.authorId) }} />
      ) : (
        <Avatar label={a.author} size={size} bg={dark ? '#16130f' : colorOf(a.authorId)} photoUrl={mine ? me?.photoUrl : null} />
      )}
      <span className={`font-bold ${dark ? '' : 'text-ink'}`}>{a.author}</span>
      <span>· {relTime(a.createdAt)}</span>
    </div>
  )
}
