import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import TopBar from './TopBar'
import Footer from './Footer'

/**
 * Shared layout. Uses the nested-route pattern: Layout renders <Outlet/>,
 * App.tsx mounts it as a layout route with nested <Route>s. Never mix
 * with the children pattern.
 */
export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-base">
      <TopBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
