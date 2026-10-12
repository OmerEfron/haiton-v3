import type { ReactNode } from 'react'
import { PaperBar } from '../../components/ui'
import { ArticleBody } from './parts'
import { ReportSheet } from './ReportSheet'
import { useArticleModel } from './useArticleModel'

function Frame({ onBack, children }: { onBack: () => void; children?: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper">
      <PaperBar onBack={onBack} />
      {children}
    </div>
  )
}

export default function ArticleMobile() {
  const m = useArticleModel()
  if (m.isPending) return <Frame onBack={m.back} />
  if (!m.article)
    return (
      <Frame onBack={m.back}>
        <div className="p-10 text-center text-muted">הכתבה הזו הוסרה או שאין לכם גישה אליה.</div>
      </Frame>
    )
  return (
    <Frame onBack={m.back}>
      <article className="px-[18px] pt-[26px] pb-12">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4">
          <ArticleBody m={m} headlineClass="font-display text-[38px] leading-[1.06] font-black tracking-tight text-ink" />
        </div>
      </article>
      {m.reporting && <ReportSheet article={m.article} onClose={() => m.setReporting(false)} />}
    </Frame>
  )
}
