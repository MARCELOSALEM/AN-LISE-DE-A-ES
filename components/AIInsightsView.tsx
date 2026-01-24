
import React from 'react';
import { AIInsight } from '../types';

interface AIInsightsViewProps {
  insight: AIInsight;
  isLoading: boolean;
  sources: Array<{ title: string; uri: string }>;
}

const AIInsightsView: React.FC<AIInsightsViewProps> = ({ insight, isLoading, sources }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto mb-4"></div>
        <div className="h-10 bg-slate-200 rounded w-3/4 mx-auto mb-6"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 bg-slate-200 rounded"></div>
          <div className="h-12 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  const recommendationMap = {
    BUY: { text: 'COMPRA', color: 'bg-emerald-500' },
    SELL: { text: 'VENDA', color: 'bg-rose-500' },
    HOLD: { text: 'MANTER', color: 'bg-amber-500' },
    NEUTRAL: { text: 'NEUTRO', color: 'bg-slate-500' },
  };

  const riskMap = {
    LOW: { text: 'BAIXO', color: 'text-emerald-600' },
    MEDIUM: { text: 'MÉDIO', color: 'text-amber-600' },
    HIGH: { text: 'ALTO', color: 'text-rose-600' },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800">Análise Real do Mercado</h3>
        </div>
        
        <p className="text-slate-600 leading-relaxed mb-8 italic">
          "{insight.analysis}"
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col p-4 bg-slate-50 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Recomendação</span>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${recommendationMap[insight.recommendation].color}`}></span>
              <span className="text-lg font-bold text-slate-800">{recommendationMap[insight.recommendation].text}</span>
            </div>
          </div>
          
          <div className="flex flex-col p-4 bg-slate-50 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Nível de Risco</span>
            <span className={`text-lg font-bold ${riskMap[insight.riskLevel].color}`}>{riskMap[insight.riskLevel].text}</span>
          </div>
        </div>
      </div>

      {sources.length > 0 && (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Fontes de Dados (Grounding)
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sources.map((source, idx) => (
              <li key={idx}>
                <a 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors bg-white px-3 py-2 rounded-lg border border-slate-200 hover:shadow-sm"
                >
                  <span className="truncate">{source.title}</span>
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIInsightsView;
