import { LandingBody } from './parts'
import { useLandingModel } from './useLandingModel'

export default function LandingDesktop() {
  const model = useLandingModel()
  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-[26px] px-12 pt-8 pb-16">
        <LandingBody {...model} />
      </div>
    </div>
  )
}
