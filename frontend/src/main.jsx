import React from 'react'
import ReactDoom from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

ReactDoom.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
     <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)