import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import VetApp from './VetApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VetApp />
  </StrictMode>,
)
