import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from '@/lib/auth-context'
import { BookingProvider } from '@/lib/booking-context'
import { ChatProvider } from '@/lib/chat-context'
import { ThemeProvider } from '@/components/theme-provider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <BookingProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </BookingProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
