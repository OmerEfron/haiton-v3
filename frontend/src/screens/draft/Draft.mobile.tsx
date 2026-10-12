import { Navigate } from 'react-router'
import { OnboardingTip } from '../../components/overlays/OnboardingTip'
import { FlowLayout } from '../../components/FlowLayout'
import { DraftBody, DraftFailed, DraftFooter, Loading, UnpublishedChip } from './parts'
import { useDraftModel } from './useDraftModel'

export default function DraftMobile() {
  const m = useDraftModel()
  if (m.redirect) return <Navigate to="/compose" replace />
  if (m.failed) return <DraftFailed onBack={m.goChat} />
  if (!m.draftReady || !m.draft) return <Loading onCancel={m.goChat} />
  return (
    <>
      <FlowLayout onBack={m.goChat} title="טיוטה" end={<UnpublishedChip />} footer={<DraftFooter m={m} />}>
        <DraftBody m={m} draft={m.draft} />
      </FlowLayout>
      <OnboardingTip step="draft" />
    </>
  )
}
