import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import NavBar from './NavBar.jsx';
  
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <NavBar />  
  </StrictMode>,
)
