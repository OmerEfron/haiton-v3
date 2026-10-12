import { LandingBody } from './parts'
import { useLandingModel } from './useLandingModel'

export default function LandingMobile() {
  const model = useLandingModel()
  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-[26px] px-5 pt-3.5 pb-10">
        <LandingBody {...model} />
      </div>
    </div>
  )
}
