import { ByeBody } from './parts'
import { useByeModel } from './useByeModel'

export default function ByeMobile() {
  const model = useByeModel()
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper p-6">
      <div className="flex w-full max-w-[400px] flex-col gap-[18px]">
        <ByeBody {...model} />
      </div>
    </div>
  )
}
