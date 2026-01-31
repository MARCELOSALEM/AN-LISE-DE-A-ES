
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-10">
      <div className="inline-block bg-blue-100 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">
        Market Intelligence Dashboard
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
        SimuStock <span className="text-blue-600">AI</span>
      </h1>
      <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed font-medium">
        Analise o desempenho de <span className="text-slate-800 font-bold">qualquer ação</span> ou FII da B3 com dados reais e inteligência artificial.
      </p>
    </header>
  );
};

export default Header;
