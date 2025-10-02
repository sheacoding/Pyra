import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './i18n' // 导入 i18n 配置

// Ensure Catppuccin UI theme is applied early
try {
  const saved = localStorage.getItem('pyra-settings')
  let theme = 'catppuccin-mocha'
  if (saved) {
    const parsed = JSON.parse(saved)
    const t = parsed?.theme?.uiTheme || parsed?.theme?.editorTheme
    if (typeof t === 'string' && t.startsWith('catppuccin-')) {
      theme = t
    }
  }
  document.documentElement.setAttribute('data-theme', theme)
  document.body?.setAttribute('data-theme', theme)
} catch {
  document.documentElement.setAttribute('data-theme', 'catppuccin-mocha')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
