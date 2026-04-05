import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import store from './store/store'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
        },
    },
})

import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
    onNeedRefresh() {
        // Show a prompt to user? For now just auto reload or let them ignore
        if (confirm('New content available. Reload?')) {
            updateSW(true)
        }
    },
    onOfflineReady() {
        console.log('App ready to work offline')
    },
})

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <Router>
                    <App />
                </Router>
            </QueryClientProvider>
        </Provider>
    </StrictMode>,
)
