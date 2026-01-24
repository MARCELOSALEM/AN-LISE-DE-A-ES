
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import PriceCard from './components/PriceCard';
import AIInsightsView from './components/AIInsightsView';
import { StockData, AIInsight } from './types';
import { getRealMarketData } from './services/geminiService';

const TOP_STOCKS = [
  'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'BBAS3', 
  'MGLU3', 'WEGE3', 'ABEV3', 'B3SA3', 'RENT3'
];

const App: React.FC = () => {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [sources, setSources] = useState<Array<{ title: string; uri: string }>>([]);

  const performSearch = useCallback(async (targetSymbol: string) => {
    const trimmedSymbol = targetSymbol.trim().toUpperCase();
    if (trimmedSymbol.length < 3) {
      setError('Por favor, insira um ticker válido.');
      return;
    }

    setError('');
    setLoading(true);
    setStockData(null);
    setInsight(null);
    setSources([]);

    try {
      const { insight: aiResult, sources: groundingSources } = await getRealMarketData(trimmedSymbol);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 2);
      const format = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      setStockData({
        symbol: trimmedSymbol,
        currentPrice: aiResult.realData.currentPrice,
        maxPrice: aiResult.realData.maxPrice,
        minPrice: aiResult.realData.minPrice,
        startDate: format(startDate),
        endDate: format(endDate),
        sources: groundingSources
      });
      
      setInsight(aiResult);
      setSources(groundingSources);
    } catch (err) {
      setError('Falha ao obter dados reais. Verifique o ticker e tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => performSearch(symbol);

  const handleQuickSelect = (s: string) => {
    setSymbol(s);
    performSearch(s);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Header />

      <main>
        {/* Banner de Dados Reais */}
        <div className="bg-blue-600 border-l-4 border-blue-800 p-4 rounded-r-xl mb-8 shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-100" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Dados de Mercado em Tempo Real</h3>
              <p className="mt-1 text-sm text-blue-100">
                Agora conectado via Google Search para obter cotações oficiais e recentes diretamente da B3.
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-xl border border-slate-200 flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Digite o Ticker (Ex: PETR4)"
              className="w-full pl-5 pr-4 py-4 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 text-lg font-semibold placeholder-slate-400 uppercase tracking-widest text-slate-800 outline-none"
              maxLength={10}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className={`px-8 py-4 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
              loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Consultando B3...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Buscar Real</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Selection Chips */}
        <div className="mb-10">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            Favoritas da B3
          </p>
          <div className="flex flex-wrap gap-2">
            {TOP_STOCKS.map((s) => (
              <button
                key={s}
                onClick={() => handleQuickSelect(s)}
                disabled={loading}
                className="px-3 py-1.5 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-200 hover:border-blue-300 active:scale-95 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {/* Results Container */}
        {stockData && (
          <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-2">
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                {stockData.symbol}
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold uppercase tracking-widest">Real</span>
              </h2>
              <span className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full w-fit">
                Período de Análise: 60 Dias
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PriceCard label="Cotação Agora" value={stockData.currentPrice} type="current" />
              <PriceCard label="Máxima (60d)" value={stockData.maxPrice} type="max" />
              <PriceCard label="Mínima (60d)" value={stockData.minPrice} type="min" />
            </div>

            {(loading || insight) && (
              <AIInsightsView insight={insight!} isLoading={loading} sources={sources} />
            )}
          </div>
        )}

        {/* Welcome Empty State */}
        {!stockData && !loading && !error && (
          <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-slate-800 font-bold mb-2">Pronto para analisar?</h3>
            <p className="text-slate-400 font-medium px-4 max-w-sm mx-auto">Digite um código da B3 para que nossa IA busque dados reais e gere insights instantâneos.</p>
          </div>
        )}
      </main>

      <footer className="mt-20 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} SimuStock AI. Dados obtidos via Google Search Grounding.</p>
        <p className="mt-1 text-xs">Powered by Gemini 3 Flash & React</p>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default App;
