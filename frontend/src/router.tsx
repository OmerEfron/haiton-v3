import { Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router'
import { useMe } from './api/queries'
import { Overlays } from './components/overlays/Overlays'
import { ProfileGate } from './components/overlays/ProfileGate'
import { responsive } from './device/responsive'
import { ComposeProvider } from './state/ComposeContext'
import { UiProvider } from './state/UiProvider'

const Landing = responsive(
  () => import('./screens/landing/Landing.mobile'),
  () => import('./screens/landing/Landing.desktop'),
)
const Login = responsive(
  () => import('./screens/login/Login.mobile'),
  () => import('./screens/login/Login.desktop'),
)
const Invite = responsive(
  () => import('./screens/invite/Invite.mobile'),
  () => import('./screens/invite/Invite.desktop'),
)
const Bye = responsive(
  () => import('./screens/bye/Bye.mobile'),
  () => import('./screens/bye/Bye.desktop'),
)
const Welcome = responsive(
  () => import('./screens/welcome/Welcome.mobile'),
  () => import('./screens/welcome/Welcome.desktop'),
)
const Feed = responsive(
  () => import('./screens/feed/Feed.mobile'),
  () => import('./screens/feed/Feed.desktop'),
)
const Chat = responsive(
  () => import('./screens/chat/Chat.mobile'),
  () => import('./screens/chat/Chat.desktop'),
)
const Draft = responsive(
  () => import('./screens/draft/Draft.mobile'),
  () => import('./screens/draft/Draft.desktop'),
)
const Publish = responsive(
  () => import('./screens/publish/Publish.mobile'),
  () => import('./screens/publish/Publish.desktop'),
)
const History = responsive(
  () => import('./screens/history/History.mobile'),
  () => import('./screens/history/History.desktop'),
)
const Article = responsive(
  () => import('./screens/article/Article.mobile'),
  () => import('./screens/article/Article.desktop'),
)
const User = responsive(
  () => import('./screens/user/User.mobile'),
  () => import('./screens/user/User.desktop'),
)

function Root() {
  return (
    <UiProvider>
      <ComposeProvider>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
        <Overlays />
      </ComposeProvider>
    </UiProvider>
  )
}

function RequireAuth() {
  const me = useMe()
  const loc = useLocation()
  if (me.isPending) return null
  if (me.isError) return <Navigate to={`/?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
  if (!me.data?.gender || !me.data.birthYear) return <ProfileGate />
  return <Outlet />
}

function Home() {
  const me = useMe()
  if (me.isPending) return null
  return me.isSuccess ? <Navigate to="/feed" replace /> : <Landing />
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/i/:code', element: <Invite /> },
      { path: '/bye/:reason', element: <Bye /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/welcome', element: <Welcome /> },
          { path: '/feed', element: <Feed /> },
          { path: '/compose', element: <Chat /> },
          { path: '/compose/history', element: <History /> },
          { path: '/compose/draft', element: <Draft /> },
          { path: '/compose/publish', element: <Publish /> },
          { path: '/article/:id', element: <Article /> },
          { path: '/u/:id', element: <User /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
