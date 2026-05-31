import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { setupViewport } from './mobile/telegram.js'
import './styles/index.css'

// Привязываем реальную высоту вьюпорта до первого рендера, чтобы в Telegram
// и мобильных браузерах layout сразу занимал корректную область.
setupViewport()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
