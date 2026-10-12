import { InviteBody } from './parts'
import { useInviteModel } from './useInviteModel'

export default function InviteMobile() {
  const model = useInviteModel()
  return (
    <div className="flex min-h-dvh items-center justify-center bg-field p-6">
      <div className="flex w-full max-w-[400px] flex-col gap-[22px]">
        <InviteBody {...model} />
      </div>
    </div>
  )
}
