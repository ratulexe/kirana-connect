import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Gateway from '../pages/Gateway.jsx';
import EntrepreneurLayout from '../layouts/EntrepreneurLayout.jsx';

// Gateway loads eagerly: it is the very first thing every visitor sees, so
// there is nothing to gain from a lazy Suspense boundary around it.
const EntrepreneurHome = lazy(() => import('../pages/entrepreneur/EntrepreneurHome.jsx'));
const EntrepreneurAnalysis = lazy(() => import('../pages/entrepreneur/EntrepreneurAnalysis.jsx'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Gateway />} />

      <Route element={<EntrepreneurLayout />}>
        <Route path="entrepreneur" element={<EntrepreneurHome />} />
        <Route path="entrepreneur/analysis" element={<EntrepreneurAnalysis />} />
      </Route>
    </Routes>
  );
}
