import React, { useState } from 'react';
import { Mechanic } from '../types';

export const PreAuthView: React.FC<{
  mechanics: Mechanic[];
  onSuccess: () => void;
  onUpdatePass: (m: Mechanic, p: string) => Promise<void>;
}> = ({ mechanics, onSuccess, onUpdatePass }) => {
  const [typedName, setTypedName] = useState('');
  const [typedPass, setTypedPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [step, setStep] = useState<'NAME' | 'PASS'>('NAME');
  const [foundMech, setFoundMech] = useState<Mechanic | null>(null);

  const handleIdentify = () => {
    const mech = mechanics.find(
      (m) => m.name.toUpperCase() === typedName.toUpperCase().trim()
    );
    if (!mech) return alert('NOME NÃO ENCONTRADO NO EFETIVO.');
    setFoundMech(mech);
    setStep('PASS');
  };

  const handleFinalAuth = async () => {
    if (!foundMech) return;
    if (!foundMech.passwordSet) {
      if (typedPass.length < 4)
        return alert('SENHA DEVE TER NO MÍNIMO 4 DÍGITOS.');
      if (typedPass !== confirmPass) return alert('AS SENHAS NÃO CONFEREM.');
      await onUpdatePass(foundMech, typedPass);
      onSuccess();
    } else {
      if (typedPass === foundMech.password) {
        onSuccess();
      } else {
        alert('SENHA INCORRETA.');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 animate-in fade-in duration-500">
      <div className="bg-zinc-950 border border-zinc-900 p-8 space-y-6 shadow-2xl rounded-2xl text-center">
        <h2 className="text-xl font-black uppercase text-white italic border-b border-zinc-900 pb-4">
          Identificação do Efetivo
        </h2>

        {step === 'NAME' ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="NOME (EX: CB MIKE)"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value.toUpperCase())}
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 font-mono font-bold text-center uppercase focus:border-white outline-none rounded-lg"
              autoFocus
            />
            <button
              onClick={handleIdentify}
              className="w-full py-5 bg-white text-black font-black uppercase tracking-widest text-sm rounded-lg active:scale-95 transition-all shadow-md"
            >
              Avançar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
              {foundMech.name}
            </p>
            <input
              type="password"
              placeholder="DIGITE SUA SENHA"
              value={typedPass}
              onChange={(e) => setTypedPass(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 font-mono text-center focus:border-white outline-none rounded-lg"
              autoFocus
            />
            {!foundMech.passwordSet && (
              <input
                type="password"
                placeholder="CONFIRME SUA SENHA"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 font-mono text-center focus:border-white outline-none rounded-lg"
              />
            )}
            <button
              onClick={handleFinalAuth}
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-sm rounded-lg active:scale-95 transition-all shadow-md"
            >
              {foundMech.passwordSet
                ? 'Entrar na Oficina'
                : 'Cadastrar e Entrar'}
            </button>
            <button
              onClick={() => setStep('NAME')}
              className="text-[10px] text-zinc-500 hover:text-white uppercase underline transition-colors"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
