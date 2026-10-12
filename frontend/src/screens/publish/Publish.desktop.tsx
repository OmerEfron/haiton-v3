import { Navigate } from 'react-router'
import { FlowLayout } from '../../components/FlowLayout'
import { OnboardingTip } from '../../components/overlays/OnboardingTip'
import { PublishBody, PublishFooter } from './parts'
import { PostPublishGroupSheet } from './PostPublishGroupSheet'
import { usePublishModel } from './usePublishModel'

export default function PublishDesktop() {
  const m = usePublishModel()
  if (m.blocked) return m.published ? null : <Navigate to="/compose" replace />
  return (
    <>
      <FlowLayout onBack={m.goDraft} title="למי לפרסם?" width="max-w-[680px]" footer={<PublishFooter m={m} />}>
        <PublishBody m={m} />
      </FlowLayout>
      {m.published && <PostPublishGroupSheet people={m.sheetPeople} onDone={m.onSheetDone} />}
      <OnboardingTip step="publish" />
    </>
  )
}
