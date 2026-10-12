import { PaperBar } from '../../components/ui'
import { UserBody } from './parts'
import { useUserModel } from './useUserModel'

export default function UserDesktop() {
  const model = useUserModel()
  return (
    <div className="min-h-dvh bg-paper">
      <PaperBar onBack={model.back} />
      <div className="px-12 pt-10 pb-16">
        <div className="mx-auto max-w-[860px]">
          <UserBody model={model} />
        </div>
      </div>
    </div>
  )
}
