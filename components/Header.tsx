import React from 'react';
import { BookOpen, Cross } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 text-stone-50 shadow-lg border-b-4 border-amber-600 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600 p-2 rounded-full">
             <Cross className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-amber-50">VERITAS CATHOLICA</h1>
            <p className="text-xs text-stone-400 font-light uppercase tracking-wider">Doutrina & Magistério</p>
          </div>
        </div>
        <div className="hidden md:flex items-center text-xs text-stone-400 gap-4">
          <span className="flex items-center gap-1"><BookOpen size={14}/> Baseado em fontes confiáveis</span>
        </div>
      </div>
    </header>
  );
};
