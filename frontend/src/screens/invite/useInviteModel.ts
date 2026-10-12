import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { logout } from '../../api/core/me'
import { acceptInvite, declineInvite } from '../../api/core/social'
import { useAction, useInvite, useMe } from '../../api/queries'
import { firstName } from '../../lib/color'

export function useInviteModel() {
  const { code = '' } = useParams()
  const nav = useNavigate()
  const qc = useQueryClient()
  const invite = useInvite(code)
  const me = useMe()
  const accept = useAction(() => acceptInvite(code))
  const decline = useAction(() => declineInvite(code))
  const here = `/i/${code}`
  const inviter = invite.data?.inviterName ?? ''

  const onDecline = () =>
    decline.mutate(undefined, { onSuccess: () => nav(`/bye/declined?inviter=${encodeURIComponent(firstName(inviter))}`) })

  const switchAccount = async () => {
    await logout()
    qc.clear()
    nav(`/login?other=1&next=${encodeURIComponent(here)}`)
  }

  const onAccept = () =>
    accept.mutate(undefined, { onSuccess: (r) => nav(r.articleId ? `/article/${r.articleId}` : '/feed', { replace: true }) })

  const status = invite.isError ? 'invalid' : invite.data ? 'ready' : 'pending'

  return {
    status,
    inviter,
    inviterFirst: firstName(inviter),
    signedIn: me.isSuccess,
    email: me.data?.email ?? '',
    acceptPending: accept.isPending,
    onDecline,
    switchAccount,
    onAccept,
    goLogin: () => nav(`/login?next=${encodeURIComponent(here)}`),
  }
}

export type InviteModel = ReturnType<typeof useInviteModel>
