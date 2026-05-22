import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/index.css'
import { setupAutoClosePopups } from './utils/popupControl'
import { registerSW } from 'virtual:pwa-register'

// Block popup opens on watch routes and add unload guard
setupAutoClosePopups()

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
