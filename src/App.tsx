import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Terminal from './pages/Terminal'
import Methodology from './pages/Methodology'

/**
 * Nested-route pattern: Layout renders <Outlet/>, so routes are nested
 * inside the layout route. Never mix with the children pattern.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="terminal" element={<Terminal />} />
        <Route path="methodology" element={<Methodology />} />
      </Route>
    </Routes>
  )
}
