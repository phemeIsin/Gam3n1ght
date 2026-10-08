import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
//import HowItWorksPage from './HowItWorksPage'
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
