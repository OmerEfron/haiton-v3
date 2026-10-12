import { InviteBody } from './parts'
import { useInviteModel } from './useInviteModel'

export default function InviteDesktop() {
  const model = useInviteModel()
  return (
    <div className="flex min-h-dvh items-center justify-center bg-field px-12 py-10">
      <div className="flex w-full max-w-[480px] flex-col gap-[22px]">
        <InviteBody {...model} />
      </div>
    </div>
  )
}
