
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-10">
      <div className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
        Market Simulator Pro
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
        SimuStock <span className="text-blue-600">AI</span>
      </h1>
      <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
        Analise ativos com precisão simulada e insights inteligentes gerados por IA.
      </p>
    </header>
  );
};

export default Header;
