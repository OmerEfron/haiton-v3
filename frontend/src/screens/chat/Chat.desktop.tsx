import { OnboardingTip } from '../../components/overlays/OnboardingTip'
import { ChatDock, ChatHeader, MessageList } from './parts'
import { useChatModel } from './useChatModel'

export default function ChatDesktop() {
  const m = useChatModel()
  return (
    <div className="flex h-dvh flex-col font-chat">
      <ChatHeader m={m} className="px-8" />
      <div ref={m.scroller} className="min-h-0 flex-1 overflow-y-auto px-8 pt-4 pb-6">
        <div className="mx-auto max-w-[880px]">
          <MessageList m={m} />
        </div>
      </div>
      <div className="flex-none px-8 pt-1.5 pb-[22px]">
        <div className="mx-auto flex max-w-[880px] flex-col gap-2.5">
          <ChatDock m={m} />
        </div>
      </div>
      <OnboardingTip step="chat" />
    </div>
  )
}
