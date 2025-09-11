import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CinemaProvider } from "./context/CinemaContext";

import {BrowserRouter} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from '@react-oauth/google'
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID; // lưu trong .env

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <GoogleOAuthProvider clientId={clientId}>

        <QueryClientProvider client={queryClient}>
        <CinemaProvider>

        <App />
        </CinemaProvider>
   
      </QueryClientProvider>
</GoogleOAuthProvider>
    </BrowserRouter>
)

