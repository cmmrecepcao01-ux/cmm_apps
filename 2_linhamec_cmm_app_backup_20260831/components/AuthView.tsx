import React, { useState } from 'react';
import { Mechanic } from '../types';

interface AuthViewProps {
  mechanic: Mechanic;
  onSuccess: (m: Mechanic, p?: string) => void;
  onCancel: () => void;
  onRequestReset: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  mechanic,
  onSuccess,
  onCancel,
  onRequestReset,
}) => {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mechanic.passwordSet) {
      if (p1.length < 4) return setErr('MÍNIMO 4 CARACTERES');
      if (p1 !== p2) return setErr('SENHAS DIFERENTES');
      onSuccess(mechanic, p1);
    } else {
      if (p1 === mechanic.password) onSuccess(mechanic);
      else setErr('SENHA INCORRETA');
    }
  };

  return (
    <form onSubmit={handleAuth} className="max-w-md mx-auto py-20 space-y-6">
      <div className="bg-zinc-950 border border-zinc-900 p-8 space-y-4 shadow-2xl rounded-2xl">
        <h2 className="text-xl font-black text-center uppercase text-white">
          {mechanic.name}
        </h2>
        <input
          type="password"
          value={p1}
          onChange={(e) => setP1(e.target.value)}
          placeholder="****"
          className="w-full bg-zinc-900 border border-zinc-800 text-white text-center py-4 text-4xl font-mono focus:border-white focus:outline-none rounded-lg"
          autoFocus
        />
        {!mechanic.passwordSet && (
          <input
            type="password"
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            placeholder="CONFIRMAR SENHA"
            className="w-full bg-zinc-900 border border-zinc-800 text-white text-center py-4 text-4xl font-mono focus:border-white focus:outline-none rounded-lg"
          />
        )}
        {err && (
          <p className="text-rose-600 text-[10px] font-bold text-center uppercase">
            {err}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="w-full py-6 bg-white text-black font-black uppercase text-xs tracking-widest shadow-xl rounded-lg active:scale-95 transition-all"
      >
        Validar Acesso
      </button>
      {mechanic.passwordSet && (
        <button
          type="button"
          onClick={onRequestReset}
          className="w-full py-2 text-rose-500 uppercase font-black text-[10px] hover:text-rose-450 text-center underline decoration-dotted transition-colors"
        >
          Esqueci minha senha / Solicitar Reset
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        className="w-full py-4 text-zinc-500 uppercase font-black text-[10px] hover:text-white transition-colors"
      >
        Voltar
      </button>
    </form>
  );
};
