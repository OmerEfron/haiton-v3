import { ByeBody } from './parts'
import { useByeModel } from './useByeModel'

export default function ByeDesktop() {
  const model = useByeModel()
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-12 py-10">
      <div className="flex w-full max-w-[480px] flex-col gap-[18px]">
        <ByeBody {...model} />
      </div>
    </div>
  )
}
