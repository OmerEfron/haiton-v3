import { LoginBody } from './parts'
import { useLoginModel } from './useLoginModel'

export default function LoginDesktop() {
  const model = useLoginModel()
  return (
    <div className="flex min-h-dvh items-center justify-center bg-login px-12 py-10">
      <div className="flex w-full max-w-[480px] flex-col gap-4 rounded-2xl bg-white p-6">
        <LoginBody {...model} />
      </div>
    </div>
  )
}
