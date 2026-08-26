import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import BottomNav from '../components/common/BottomNav.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import Container from '../components/common/Container.jsx';

function PageFallback() {
  return (
    <Container className="py-10">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-6 h-40 rounded-card" />
      <Skeleton className="mt-6 h-64 rounded-card" />
    </Container>
  );
}

export default function CustomerLayout() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-meta focus:font-semibold focus:text-primary-fg"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1 pb-20 md:pb-0">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
