import type { ArticleSummary } from '../../api/types'
import { ArticleCard } from '../../components/ArticleCard'
import { Byline } from '../../components/Byline'
import { Img } from '../../components/ui'
import { isFresh } from '../../lib/time'
import { ComposeFab, DraftChip, EmptyFeed, FeedTop } from './parts'
import { useFeedModel } from './useFeedModel'

const kickerOf = (a: ArticleSummary) => (isFresh(a.createdAt) ? 'חדש · עכשיו' : 'הסיפור של היום')

function Lead({ a }: { a: ArticleSummary }) {
  const kicker = kickerOf(a)
  const to = `/article/${a.id}`
  if (!a.imageUrl)
    return (
      <ArticleCard to={to} className="flex cursor-pointer flex-col gap-[18px] bg-hot px-11 pt-10 pb-9 text-white">
        <div className="flex">
          <span className="bg-white px-[9px] py-1 text-[13px] font-extrabold tracking-wide text-hot">{kicker}</span>
        </div>
        <h2 className="max-w-[980px] font-display text-[66px] leading-[1.02] font-black">{a.headline}</h2>
        <p className="max-w-[760px] text-[21px] leading-normal font-medium">{a.sub}</p>
        <Byline a={a} dark />
      </ArticleCard>
    )
  return (
    <ArticleCard
      to={to}
      className="grid cursor-pointer grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-end gap-x-9 gap-y-4 border-b border-ink px-0 pt-0 pb-7"
    >
      <div className="col-start-1 text-[13px] font-extrabold tracking-wide text-hot">{kicker}</div>
      <h2 className="col-start-1 font-display text-[54px] leading-[1.03] font-black text-ink">{a.headline}</h2>
      <Img src={a.imageUrl} className="col-start-2 row-span-4 row-start-1 aspect-[4/3] w-full" />
      <p className="col-start-1 text-lg leading-normal text-body">{a.sub}</p>
      <div className="col-start-1"><Byline a={a} /></div>
    </ArticleCard>
  )
}

function Subs({ items }: { items: ArticleSummary[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-px border-b border-sand bg-sand">
      {items.map((a) => (
        <ArticleCard
          key={a.id}
          to={`/article/${a.id}`}
          className="flex cursor-pointer flex-col border-0 bg-paper px-[22px] pt-1 pb-6"
        >
          <div className="flex flex-col gap-3">
            {a.imageUrl && <Img src={a.imageUrl} className="aspect-[3/2] w-full" />}
            {a.hasPrev && <div className="pt-3.5 text-xs font-extrabold tracking-wide text-hot">המשך סיפור</div>}
            <h3 className="font-display text-[22px] leading-tight font-extrabold text-ink">{a.headline}</h3>
            <Byline a={a} size={20} />
          </div>
        </ArticleCard>
      ))}
    </div>
  )
}

function More({ items }: { items: ArticleSummary[] }) {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-center gap-3 p-0">
        <span className="font-display text-[26px] font-black text-ink">עוד מהמעגל</span>
        <span className="h-[3px] flex-1 bg-ink" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-6 gap-y-7">
        {items.map((a) => (
          <ArticleCard
            key={a.id}
            to={`/article/${a.id}`}
            image={a.imageUrl}
            imageClass="aspect-[16/10] h-auto w-full flex-none"
            className="flex cursor-pointer flex-col gap-2.5 border-t border-b-0 border-ink px-0 pt-3 pb-0"
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <h4 className="font-display text-[17px] leading-snug font-bold text-ink">{a.headline}</h4>
              <Byline a={a} dot />
            </div>
          </ArticleCard>
        ))}
      </div>
    </div>
  )
}

function Stories({ list }: { list: ArticleSummary[] }) {
  const [main, ...rest] = list
  const subs = rest.slice(0, 3)
  const more = rest.slice(3, 11)
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-7 px-8 pt-7">
      <Lead a={main} />
      {subs.length > 0 && <Subs items={subs} />}
      {more.length > 0 && <More items={more} />}
    </div>
  )
}

export default function FeedDesktop() {
  const m = useFeedModel()
  return (
    <div className="min-h-dvh bg-paper pb-24">
      <FeedTop m={m} />
      {m.list.length > 0 && <Stories list={m.list} />}
      {!m.loading && !m.list.length && <EmptyFeed onWrite={m.startStory} onInvite={m.openInvite} />}
      <DraftChip m={m} />
      <ComposeFab onClick={m.startStory} />
    </div>
  )
}
