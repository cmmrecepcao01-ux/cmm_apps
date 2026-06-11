import React from 'react';
import { 
  Home, Users, Target, BarChart2, Settings, LogOut, 
  ChevronDown, FileText, Clock, CheckCircle2
} from 'lucide-react';

type Mission = {
  id: string;
  title: string;
  overview: string;
  objective: string;
  progress: number;
  colorClass: string;
  glowClass: string;
  bgClass: string;
  phases: { name: string; status: 'CONCLUÍDA' | 'INICIADA' | 'PENDENTE' }[];
  currentDesc: string;
  score: number;
  maxScore: number;
};

const missions: Mission[] = [
  {
    id: '1',
    title: "MISSÃO 1: 'Exploração Alpha-7'",
    overview: 'Visão Geral (Resumo)',
    objective: 'Descrição Geral (Objetivo)',
    progress: 100,
    colorClass: 'border-emerald-500 text-emerald-500',
    glowClass: 'glow-emerald',
    bgClass: 'bg-emerald-500',
    phases: [
      { name: 'Fase 1', status: 'CONCLUÍDA' },
      { name: 'Fase 2', status: 'CONCLUÍDA' },
      { name: 'Fase 3', status: 'CONCLUÍDA' },
    ],
    currentDesc: 'Descrição da Missão (Objetivo) e Pontuação Total\nPontuação Total: 100%',
    score: 100,
    maxScore: 100,
  },
  {
    id: '2',
    title: "MISSÃO 2: 'Exploração Alpha-Z'",
    overview: 'Visão Geral (Resumo)',
    objective: 'Descrição Geral (Objetivo)',
    progress: 60,
    colorClass: 'border-cyan-500 text-cyan-500',
    glowClass: 'glow-cyan',
    bgClass: 'bg-cyan-500',
    phases: [
      { name: 'Fase 1', status: 'CONCLUÍDA' },
      { name: 'Fase 2', status: 'INICIADA' },
      { name: 'Fase 3', status: 'PENDENTE' },
    ],
    currentDesc: 'Descrição da Missão (Objetivo) e Pontuação Total\nPontuação Total: 60%',
    score: 60,
    maxScore: 100,
  },
  {
    id: '3',
    title: "MISSÃO 3: 'Exploração Alpha-3'",
    overview: 'Visão Geral (Resumo)',
    objective: 'Descrição Geral (Objetivo)',
    progress: 30,
    colorClass: 'border-purple-500 text-purple-500',
    glowClass: 'glow-purple',
    bgClass: 'bg-purple-500',
    phases: [
      { name: 'Fase 1', status: 'CONCLUÍDA' },
      { name: 'Fase 2', status: 'INICIADA' },
      { name: 'Fase 3', status: 'PENDENTE' },
    ],
    currentDesc: 'Descrição da Missão (Objetivo) e Pontuação Total\nPontuação Total: 30%',
    score: 30,
    maxScore: 100,
  },
  {
    id: '4',
    title: "MISSÃO 4: 'Exploração Alpha-5'",
    overview: 'Visão Geral (Resumo)',
    objective: 'Descrição Geral (Objetivo)',
    progress: 0,
    colorClass: 'border-rose-500 text-rose-500',
    glowClass: 'glow-rose',
    bgClass: 'bg-rose-500',
    phases: [
      { name: 'Fase 1', status: 'PENDENTE' },
      { name: 'Fase 2', status: 'PENDENTE' },
      { name: 'Fase 3', status: 'PENDENTE' },
    ],
    currentDesc: 'Descrição da Missão (Objetivo) e Pontuação Total\nPontuação Total: 0%',
    score: 0,
    maxScore: 100,
  }
];

const CircularProgress = ({ percentage, color }: { percentage: number, color: string }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center w-10 h-10">
      <svg width="40" height="40" className="-rotate-90">
        <circle className="text-white/10" strokeWidth="4" stroke="currentColor" fill="transparent" r={radius} cx="20" cy="20" />
        <circle
          className="transition-all duration-1000 ease-out"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="20"
          cy="20"
        />
      </svg>
    </div>
  );
};

export default function App() {
  const totalScore = missions.reduce((acc, m) => acc + m.score, 0);
  const maxTotalScore = missions.reduce((acc, m) => acc + m.maxScore, 0);
  const overallProgress = Math.round((totalScore / maxTotalScore) * 100);

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-emerald-500/30">
      
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0a0a0a]">
        <div className="flex items-center gap-8">
          <nav className="flex gap-6">
            <button className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest"><Home size={16}/> Início</button>
            <button className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest"><Users size={16}/> Equipe</button>
            <button className="flex items-center gap-2 text-xs font-bold text-emerald-400 border-b-2 border-emerald-400 pb-1 uppercase tracking-widest"><Target size={16}/> Missões</button>
            <button className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest"><BarChart2 size={16}/> Estatísticas</button>
            <button className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest"><Settings size={16}/> Configurações</button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest"><LogOut size={16}/> Sair</button>
          <button className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white uppercase">PT-BR <ChevronDown size={14}/></button>
        </div>
      </header>

      <main className="p-8 max-w-[1800px] mx-auto space-y-8">
        
        <div className="text-center">
          <h1 className="text-3xl font-black uppercase tracking-widest text-white">
            Dashboard Principal de Missões - Visão Geral
          </h1>
        </div>

        <div className="grid grid-cols-12 gap-8">
          
          <div className="col-span-3 flex flex-col gap-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-center text-gray-400 mb-2">Visão Geral das Missões</h2>
            {missions.map((mission) => (
              <div key={mission.id} className={`h-[180px] rounded-2xl border-2 ${mission.colorClass} ${mission.glowClass} bg-black p-5 flex flex-col justify-between relative`}>
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-black uppercase tracking-tight w-2/3">{mission.title}</h3>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Membros</span>
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gray-700 border border-black z-10 flex items-center justify-center text-[8px]">JD</div>
                      <div className="w-6 h-6 rounded-full bg-gray-600 border border-black z-0 flex items-center justify-center text-[8px]">MS</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-xs text-gray-400"><FileText size={12}/> {mission.overview}</p>
                  <p className="flex items-center gap-2 text-xs text-gray-400"><Clock size={12}/> {mission.objective}</p>
                  <div className="flex items-center gap-3">
                    <CircularProgress percentage={mission.progress} color={`var(--color-${mission.colorClass.split('-')[1]}-500, currentColor)`} />
                    <span className="text-xs text-gray-400">Andamento (%) total</span>
                  </div>
                </div>

                <button className={`absolute bottom-4 right-4 ${mission.bgClass} text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all`}>
                  Acessar Subdashboard
                </button>
              </div>
            ))}
          </div>

          <div className="col-span-6 flex flex-col gap-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-center text-gray-400 mb-2">Linha do Tempo e Progressos</h2>
            {missions.map((mission) => (
              <div key={`timeline-${mission.id}`} className="h-[180px] rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 flex flex-col justify-center relative">
                
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-6">
                  <div className={`h-full ${mission.bgClass} ${mission.glowClass}`} style={{ width: `${mission.progress}%` }} />
                </div>
                
                <div className="flex justify-between relative px-2">
                  {mission.phases.map((phase, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-4 border-[#0a0a0a] -mt-[38px] z-10 
                        ${phase.status === 'CONCLUÍDA' ? mission.bgClass : phase.status === 'INICIADA' ? `bg-gray-400 ${mission.colorClass.split(' ')[0]}` : 'bg-gray-800 border-gray-600'}`} 
                      />
                      <span className={`text-[10px] font-black uppercase mt-4 ${phase.status !== 'PENDENTE' ? mission.colorClass.split(' ')[1] : 'text-gray-600'}`}>{phase.name}</span>
                      <span className={`text-[9px] font-bold uppercase ${phase.status !== 'PENDENTE' ? 'text-gray-400' : 'text-gray-600'}`}>{phase.status}</span>
                    </div>
                  ))}
                  
                  <div className={`absolute left-1/2 -translate-x-1/2 top-14 w-[80%] border ${mission.colorClass.split(' ')[0]} bg-black/50 rounded-xl p-3 text-center`}>
                     <p className="text-[10px] text-gray-300 font-medium whitespace-pre-line leading-relaxed">{mission.currentDesc}</p>
                  </div>
                  
                  <div className="absolute right-0 top-6 text-right">
                    <p className="text-xs font-black text-white">{mission.progress}% concluído</p>
                    <p className="text-[9px] text-gray-500 uppercase"></p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="col-span-3 flex flex-col gap-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-center text-gray-400 mb-2">KPIs & Pontuação Total</h2>
            
            <div className="h-[260px] rounded-2xl border border-emerald-500 glow-emerald bg-black p-6 flex gap-6 items-center justify-center">
               <div className="w-12 h-full bg-white/5 rounded-full p-1 flex items-end">
                 <div className="w-full bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-full glow-cyan" style={{ height: '100%' }} />
               </div>
               <div className="flex flex-col justify-center items-center text-center">
                 <p className="text-sm font-black uppercase tracking-widest text-white mb-4">Pontuação<br/>Missão 1 (%)</p>
                 <p className="text-5xl font-black font-mono text-white mb-2">100%</p>
               </div>
            </div>

            <div className="h-[260px] rounded-2xl border border-cyan-500 glow-cyan bg-black p-6 flex gap-6 items-center justify-center">
               <div className="w-12 h-full bg-white/5 rounded-full p-1 flex items-end">
                 <div className="w-full bg-gradient-to-t from-emerald-500 to-purple-500 rounded-full glow-purple" style={{ height: '80%' }} />
               </div>
               <div className="flex flex-col justify-center items-center text-center">
                 <p className="text-sm font-black uppercase tracking-widest text-white mb-4">Pontuação<br/>Missão 2 (%)</p>
                 <p className="text-5xl font-black font-mono text-white mb-2">240<span className="text-2xl text-gray-500">/300</span></p>
               </div>
            </div>

            <div className="flex-1 rounded-2xl border border-purple-500 glow-purple bg-black p-6 flex gap-6 items-center justify-center">
               <div className="w-12 h-full bg-white/5 rounded-full p-1 flex items-end">
                 <div className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-full glow-cyan" style={{ height: '80%' }} />
               </div>
               <div className="flex flex-col justify-center items-center text-center">
                 <p className="text-sm font-black uppercase tracking-widest text-white mb-4">Pontuação<br/>Geral (Total)</p>
                 <p className="text-4xl font-black font-mono text-white mb-1">{totalScore}<span className="text-xl text-gray-500">/{maxTotalScore}</span></p>
                 <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mb-2">Pontos</p>
               </div>
            </div>

          </div>
        </div>

        <div className="rounded-2xl border-2 border-rose-500 glow-rose bg-black p-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-white mb-4">Resumo do Progresso Total Geral de Todas as Missões</h2>
          
          <div className="w-full h-8 bg-white/10 rounded-full overflow-hidden mb-6 p-1 relative border border-white/20">
             <div 
               className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500 relative transition-all duration-1000"
               style={{ width: `${overallProgress}%` }}
             >
               <div className="absolute inset-0 bg-white/20" style={{ mixBlendMode: 'overlay' }} />
             </div>
          </div>
          
          <div className="flex justify-between items-end px-4">
            <ul className="text-[10px] text-gray-400 list-disc list-inside uppercase tracking-widest leading-relaxed">
              <li>Visão Geral (Resumo)</li>
              <li>Descrição Geral (Objetivo)</li>
              <li>Andamento (%) Total</li>
            </ul>
            <div className="text-center">
              <span className="text-sm font-black uppercase tracking-widest text-white">Progresso Geral: {overallProgress}% </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mx-2"></span>
              <span className="text-sm font-black uppercase tracking-widest text-emerald-400">CONCLUÍDO</span>
            </div>
            <ul className="text-[10px] text-gray-400 list-disc list-inside uppercase tracking-widest leading-relaxed text-right">
              <li>Descrição da Missão</li>
              <li>Detalhes do Objetivo</li>
              <li>Andamento (%) Final</li>
            </ul>
          </div>
        </div>

      </main>
    </div>
  );
}