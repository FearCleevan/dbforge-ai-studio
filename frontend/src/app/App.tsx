import { Providers } from './Providers'
import { Router } from './Router'
import { ToastContainer } from '@/components/shared/ToastContainer'

export default function App() {
  return (
    <Providers>
      <Router />
      <ToastContainer />
    </Providers>
  )
}
