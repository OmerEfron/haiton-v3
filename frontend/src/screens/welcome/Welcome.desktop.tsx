import { WelcomeBody } from './parts'
import { useWelcomeModel } from './useWelcomeModel'

export default function WelcomeDesktop() {
  const model = useWelcomeModel()
  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-12 py-10">
      <div className="flex w-full max-w-[520px] flex-col gap-[22px]">
        <WelcomeBody {...model} />
      </div>
    </div>
  )
}
