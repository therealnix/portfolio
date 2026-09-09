import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PortfolioView from './PortfolioView'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PortfolioView />
  </StrictMode>,
)
