import { LoginBody } from './parts'
import { useLoginModel } from './useLoginModel'

export default function LoginMobile() {
  const model = useLoginModel()
  return (
    <div className="flex min-h-dvh items-center justify-center bg-login p-6">
      <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-2xl bg-white p-6">
        <LoginBody {...model} />
      </div>
    </div>
  )
}
