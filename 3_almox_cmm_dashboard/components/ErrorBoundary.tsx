import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-zinc-900 border border-rose-900/50 rounded-lg text-center space-y-6 my-4 max-w-2xl mx-auto">
          <div className="flex justify-center">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full">
              <AlertOctagon className="w-8 h-8" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-black uppercase text-white tracking-wider">Ops! Ocorreu um erro na renderização</h3>
            <p className="text-xs text-zinc-400">
              O componente falhou ao carregar. Detalhes do erro técnico abaixo:
            </p>
          </div>

          <div className="p-4 bg-black border border-zinc-800 rounded font-mono text-[10px] text-rose-400 text-left overflow-x-auto whitespace-pre-wrap max-h-40">
            {this.state.error ? this.state.error.toString() : 'Erro desconhecido'}
            {"\n\nStack:\n"}
            {this.state.error ? this.state.error.stack : 'Nenhum rastreamento disponível'}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 transition-all shadow"
          >
            <RotateCcw className="w-4 h-4" /> Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
