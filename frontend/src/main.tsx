import React from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App'
import { NextUIProvider } from '@nextui-org/react'

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <NextUIProvider>
            <App />
        </NextUIProvider>
    </React.StrictMode>
)
