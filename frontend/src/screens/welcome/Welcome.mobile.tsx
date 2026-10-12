import { WelcomeBody } from './parts'
import { useWelcomeModel } from './useWelcomeModel'

export default function WelcomeMobile() {
  const model = useWelcomeModel()
  return (
    <div className="flex min-h-dvh items-center justify-center bg-white p-6">
      <div className="flex w-full max-w-[420px] flex-col gap-[22px]">
        <WelcomeBody {...model} />
      </div>
    </div>
  )
}
