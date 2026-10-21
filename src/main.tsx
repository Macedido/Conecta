import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

type ErrorBoundaryState = { error: Error | null }

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Falha ao carregar a aplicação:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#0b110f', color: '#edf3eb', fontFamily: 'sans-serif', textAlign: 'center' }}>
          <div role="alert" style={{ maxWidth: 480 }}>
            <h1 style={{ fontSize: 22 }}>Não foi possível carregar o Conecta</h1>
            <p style={{ color: '#91a397', lineHeight: 1.6 }}>
              Ocorreu um erro ao abrir esta página. Tente recarregar; se continuar, envie esta mensagem para o suporte:
            </p>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: '#f0a35e', fontSize: 13 }}>
              {this.state.error.message}
            </pre>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 16px', border: 0, borderRadius: 8, background: '#a9e58b', color: '#12200f', fontWeight: 700, cursor: 'pointer' }}>
              Recarregar página
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
)
