import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import EntrepreneurHeader from './EntrepreneurHeader.jsx';
import EntrepreneurFooter from './EntrepreneurFooter.jsx';
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

/**
 * The Entrepreneur Platform's own shell. No shopping chrome, no particle
 * background, no bottom shopping nav: this is a business advisory surface,
 * calm and analytical rather than vibrant/playful like the Consumer app.
 */
export default function EntrepreneurLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-meta focus:font-semibold focus:text-primary-fg"
      >
        Skip to content
      </a>
      <EntrepreneurHeader />
      <main id="main" className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <EntrepreneurFooter />
    </div>
  );
}
