import { useNavigate, useSearchParams } from 'react-router'
import { usePastSessions } from '../../api/queries'

export function useHistoryModel() {
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const q = usePastSessions()
  const sessions = q.data ?? []
  const selectedId = params.get('s')
  const selected = sessions.find((s) => s.id === selectedId) ?? null

  return {
    loading: q.isPending,
    sessions,
    selectedId,
    selected,
    open: (id: string) => setParams({ s: id }),
    backToList: () => setParams({}),
    goFeed: () => nav('/feed'),
  }
}

export type HistoryModel = ReturnType<typeof useHistoryModel>
