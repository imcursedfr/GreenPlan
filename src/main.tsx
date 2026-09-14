import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { RouteFallback } from './components/feedback/LoadingState'
import { ThemeProvider } from './theme/ThemeProvider'
import { ProfileProvider } from './hooks/useProfile'
import { AuthProvider } from './hooks/useAuth'
import { HomesProvider } from './hooks/useHomes'
import { initPrismTracing } from './ai/prism'
import './styles/index.css'

// PRISM observability: one sink, registered once, receives every AiCallLog
// the AI funnel emits. Failures inside the sink never affect the app.
initPrismTracing()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <HomesProvider>
            <BrowserRouter>
              <Suspense fallback={<RouteFallback />}>
                <App />
              </Suspense>
            </BrowserRouter>
          </HomesProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
