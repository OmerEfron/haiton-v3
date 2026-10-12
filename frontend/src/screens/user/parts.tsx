import { useNavigate } from 'react-router'
import type { ArticleSummary } from '../../api/types'
import { ArticleCard } from '../../components/ArticleCard'
import { PillTabs } from '../../components/PillTabs'
import { Avatar, btn } from '../../components/ui'
import { firstName } from '../../lib/color'
import { relTime } from '../../lib/time'
import { FactsTab } from './FactsTab'
import { SettingsTab } from './SettingsTab'
import { useConnectionActions } from './useConnectionActions'
import { type UserModel, type UserTab } from './useUserModel'

const TABS: readonly { id: UserTab; label: string }[] = [
  { id: 'articles', label: 'כתבות' },
  { id: 'facts', label: 'כרטסת עובדות' },
  { id: 'settings', label: 'הגדרות' },
]

function isTab(value: string): value is UserTab {
  return TABS.some((t) => t.id === value)
}

export function UserBody({ model }: { model: UserModel }) {
  const { id, isMe, me, user, name } = model
  return (
    <>
      <div className="flex items-center gap-3.5 border-b-2 border-charcoal pb-5">
        <Avatar label={name} size={56} bg="var(--color-charcoal)" photoUrl={isMe ? me?.photoUrl : null} />
        <div className="flex flex-col gap-0.5">
          <div className="text-2xl font-extrabold">{name}</div>
          <div className="text-sm text-dim">{model.articles.length === 1 ? 'כתבה אחת' : `${model.articles.length} כתבות`}</div>
        </div>
      </div>

      {!isMe && user?.isConnection && <ConnectionActions id={id} name={name} muted={user.muted} />}

      {isMe && (
        <div className="flex gap-1.5 pt-3.5 pb-0.5">
          <PillTabs tabs={TABS} active={isTab(model.tab) ? model.tab : undefined} onChange={model.setTab} />
        </div>
      )}

      <TabPanels model={model} />
    </>
  )
}

function ConnectionActions({ id, name, muted }: { id: string; name: string; muted: boolean }) {
  const conn = useConnectionActions()
  const navigate = useNavigate()
  return (
    <>
      <div className="flex flex-wrap gap-2 pt-3.5">
        <button onClick={() => conn.toggleMute(id, muted)} className="h-[34px] rounded-full border border-sand px-3.5 text-[13.5px] font-medium text-ink">
          {muted ? 'ביטול השתקה' : 'השתקה'}
        </button>
        <button onClick={() => conn.askRemove(id, name, () => navigate('/feed'))} className="h-[34px] rounded-full border border-sand px-3.5 text-[13.5px] font-medium text-brand">
          הסרה מהחיבורים
        </button>
      </div>
      {muted && <div className="pt-2.5 text-[13px] leading-normal text-muted">הכתבות של {firstName(name)} לא יופיעו אצלכם בעמוד הראשי.</div>}
    </>
  )
}

function TabPanels({ model }: { model: UserModel }) {
  const { tab, articles, isMe, askRemoveArticle, name } = model
  return (
    <>
      {tab === 'articles' && (
        <>
          {articles.map((a) => (
            <ArticleRow key={a.id} article={a} removable={isMe} onRemove={() => askRemoveArticle(a.id)} />
          ))}
          {!articles.length && <div className="py-10 text-[15px] text-dim">עוד אין כתבות.</div>}
        </>
      )}
      {tab === 'facts' && <FactsTab name={name} />}
      {tab === 'settings' && <SettingsTab />}
    </>
  )
}

function ArticleRow({ article, removable, onRemove }: { article: ArticleSummary; removable: boolean; onRemove: () => void }) {
  return (
    <ArticleCard
      to={`/article/${article.id}`}
      image={article.imageUrl}
      imageClass="h-[74px] w-28 flex-none"
      className="flex gap-3.5 border-b border-soft py-[18px]"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className="text-[17px] leading-snug font-bold">{article.headline}</h3>
        <div className="text-[12.5px] font-medium text-[#666]">{relTime(article.createdAt)}</div>
      </div>
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove()
          }}
          className={`ms-auto self-center flex-none ${btn.chipDanger}`}
        >
          הסרה
        </button>
      )}
    </ArticleCard>
  )
}
