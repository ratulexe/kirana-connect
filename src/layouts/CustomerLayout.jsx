import { Outlet } from 'react-router-dom';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import QuickActions from '../components/common/QuickActions.jsx';
import ParticleCanvas from '../components/common/ParticleCanvas.jsx';
import BottomNav from '../components/common/BottomNav.jsx';

export default function CustomerLayout() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-x-clip">
      <ParticleCanvas />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <span className="float-orbit absolute -left-20 top-[28rem] size-64 rounded-full bg-[#ffd45e]/25 blur-3xl" />
        <span className="float-orbit-delayed absolute -right-24 top-[52rem] size-72 rounded-full bg-[#e93483]/15 blur-3xl" />
        <span className="gloss-orb absolute right-[12%] top-[38%] size-48 rounded-full opacity-70" />
      </div>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-meta focus:font-semibold focus:text-primary-fg"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <SiteFooter />
      <QuickActions />
      <BottomNav />
    </div>
  );
}
