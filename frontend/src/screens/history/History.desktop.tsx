import { FlowLayout } from '../../components/FlowLayout'
import { SessionDetail, SessionList } from './parts'
import { useHistoryModel } from './useHistoryModel'

export default function HistoryDesktop() {
  const m = useHistoryModel()
  return (
    <FlowLayout onBack={m.selectedId ? m.backToList : m.goFeed} title={m.selected ? 'שיחה' : 'שיחות קודמות'} width="max-w-[880px]">
      {m.selected ? <SessionDetail s={m.selected} /> : <SessionList m={m} />}
    </FlowLayout>
  )
}
