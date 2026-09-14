import { lazy, Suspense } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { LandingLayout } from './layouts/LandingLayout'
import { AppLayout } from './layouts/AppLayout'
import { RouteFallback } from './components/feedback/LoadingState'
import { AuthGate } from './components/auth/AuthGate'

// ── Pages (lazy) ────────────────────────────────────────────────────────────
const LandingPage = lazy(() => import('./pages/LandingPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const SolarPage = lazy(() => import('./pages/SolarPage'))
const WaterPage = lazy(() => import('./pages/WaterPage'))
const EfficiencyPage = lazy(() => import('./pages/EfficiencyPage'))
const WastePage = lazy(() => import('./pages/WastePage'))
const PlannerPage = lazy(() => import('./pages/PlannerPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))

/**
 * Single source of truth for routing. Each route declares its own layout so
 * nested pages never need to mount chrome themselves.
 *
 * Access model:
 *  - guest: landing, onboarding, solar/water/efficiency/waste (with profile)
 *  - authenticated: + dashboard, planner (saved plans, homes, progress)
 */
export const routes: RouteObject[] = [
  {
    element: <LandingLayout />,
    children: [{ path: '/', element: <LandingPage /> }],
  },
  {
    element: (
      <Suspense fallback={<RouteFallback />}>
        <AppLayout />
      </Suspense>
    ),
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        path: '/dashboard',
        element: (
          <AuthGate
            feature="Dashboard"
            reason="The dashboard tracks your home's scores, savings and recommendations across visits — that persistence needs an account."
          >
            <DashboardPage />
          </AuthGate>
        ),
      },
      { path: '/solar', element: <SolarPage /> },
      { path: '/water', element: <WaterPage /> },
      { path: '/efficiency', element: <EfficiencyPage /> },
      { path: '/waste', element: <WastePage /> },
      {
        path: '/planner',
        element: (
          <AuthGate
            feature="Planner"
            reason="The planner saves your roadmap and action progress so you can come back and continue anytime."
          >
            <PlannerPage />
          </AuthGate>
        ),
      },
      { path: '/account', element: <AccountPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]
