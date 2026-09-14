import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { RouteFallback } from './components/feedback/LoadingState'
import { ThemeProvider } from './theme/ThemeProvider'
import { ProfileProvider } from './hooks/useProfile'
import { AuthProvider } from './hooks/useAuth'
import { HomesProvider } from './hooks/useHomes'
import './styles/index.css'

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
