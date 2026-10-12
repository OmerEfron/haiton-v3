import { PaperBar } from '../../components/ui'
import { UserBody } from './parts'
import { useUserModel } from './useUserModel'

export default function UserMobile() {
  const model = useUserModel()
  return (
    <div className="min-h-dvh bg-paper">
      <PaperBar onBack={model.back} />
      <div className="px-[18px] pt-7 pb-12">
        <div className="mx-auto max-w-[720px]">
          <UserBody model={model} />
        </div>
      </div>
    </div>
  )
}
