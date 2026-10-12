import { useNavigate, useParams, useSearchParams } from 'react-router'

export function useByeModel() {
  const { reason } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const inviter = params.get('inviter') ?? ''

  const copy =
    reason === 'deleted'
      ? { title: 'החשבון נמחק', text: 'הכתבות, הכרטסת והקבוצות שלכם נמחקו. אפשר להירשם מחדש בכל זמן.', cta: 'הרשמה מחדש', to: '/' }
      : reason === 'declined'
        ? { title: 'ההזמנה נדחתה', text: `לא נצרף אתכם למעגל של ${inviter}. אם תתחרטו, אפשר לבקש ממנו קישור חדש.`, cta: 'מה זה haiton?', to: '/' }
        : { title: 'התנתקתם', text: 'הכתבות והכרטסת שלכם שמורות ויחכו לכם כשתתחברו שוב.', cta: 'התחברות', to: '/login?next=/feed' }

  return { copy, go: () => nav(copy.to) }
}

export type ByeModel = ReturnType<typeof useByeModel>
