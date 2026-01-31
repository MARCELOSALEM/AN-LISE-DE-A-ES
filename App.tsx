
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import PriceCard from './components/PriceCard';
import AIInsightsView from './components/AIInsightsView';
import StockChart from './components/StockChart';
import { StockData, AIInsight } from './types';
import { getRealMarketData } from './services/geminiService';

const DEFAULT_STOCKS = [
  'PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'WEGE3'
];

const App: React.FC = () => {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [sources, setSources] = useState<Array<{ title: string; uri: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('simustock_watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('simustock_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Focar o campo automaticamente ao carregar
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const performSearch = useCallback(async (targetSymbol: string) => {
    const trimmedSymbol = targetSymbol.trim().toUpperCase();
    if (trimmedSymbol.length < 3) {
      setError('O código da ação deve ter pelo menos 3 letras (ex: PETR4).');
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
        maxPrice2Months: aiResult.realData.maxPrice2Months,
        minPrice2Months: aiResult.realData.minPrice2Months,
        startDate: format(startDate),
        endDate: format(endDate),
        sources: groundingSources
      });
      
      setInsight(aiResult);
      setSources(groundingSources);
    } catch (err: any) {
      setError(`Não encontramos dados para "${trimmedSymbol}". Verifique o código e tente novamente.`);
      console.error("Erro detalhado:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => performSearch(symbol);

  const toggleWatchlist = (s: string) => {
    const upperS = s.toUpperCase().trim();
    if (upperS.length < 3) return;
    setWatchlist(prev => 
      prev.includes(upperS) ? prev.filter(item => item !== upperS) : [upperS, ...prev]
    );
  };

  const quickAddFromInput = () => {
    if (symbol.length >= 3) {
      if (!watchlist.includes(symbol.toUpperCase())) {
        toggleWatchlist(symbol);
        setSymbol('');
        inputRef.current?.focus();
      } else {
        setError('Este código já está na sua lista.');
        setTimeout(() => setError(''), 3000);
      }
    } else {
      setError('Digite o código antes de adicionar.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleQuickSelect = (s: string) => {
    setSymbol(s);
    performSearch(s);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Header />

      <main>
        {/* Banner Informativo */}
        <div className="bg-blue-600 border-l-4 border-blue-800 p-4 rounded-r-xl mb-8 shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 p-2 rounded-lg">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Busca de Ativos B3</h3>
              <p className="text-blue-100 text-xs">Utilize o campo abaixo para digitar o ticker que deseja analisar.</p>
            </div>
          </div>
        </div>

        {/* ÁREA DE BUSCA - TOTALMENTE REESTRUTURADA */}
        <div className="bg-white p-4 rounded-3xl shadow-2xl border border-slate-200 mb-8">
          <label htmlFor="stock-search" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">
            Digite o Código da Ação (Ticker)
          </label>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className={`h-6 w-6 transition-colors ${symbol ? 'text-blue-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <input
                id="stock-search"
                ref={inputRef}
                type="text"
                value={symbol}
                autoComplete="off"
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="EX: PETR4, VALE3, MXRF11..."
                className="w-full pl-12 pr-12 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 text-xl font-black placeholder-slate-300 uppercase tracking-widest text-slate-800 outline-none transition-all"
              />

              {symbol && (
                <button 
                  onClick={() => { setSymbol(''); inputRef.current?.focus(); }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={quickAddFromInput}
                title="Adicionar à Minha Lista"
                className="p-5 bg-amber-50 text-amber-600 border-2 border-amber-100 rounded-2xl hover:bg-amber-100 hover:border-amber-200 transition-all active:scale-95 shadow-sm"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              
              <button
                onClick={handleSearch}
                disabled={loading}
                className={`flex-grow md:flex-none px-10 py-5 rounded-2xl font-black text-white transition-all shadow-xl flex items-center justify-center gap-3 ${
                  loading 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : symbol 
                      ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 hover:shadow-blue-200' 
                      : 'bg-blue-500 opacity-80 cursor-default'
                }`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>ANALISAR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Atalhos Rápidos */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Minha Lista Favorita
              </h4>
              {watchlist.length > 0 && (
                <button 
                  onClick={() => { if(confirm('Deseja limpar sua lista?')) setWatchlist([]); }}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-600 uppercase transition-colors"
                >
                  Limpar Tudo
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 min-h-[44px]">
              {watchlist.length === 0 ? (
                <div className="w-full py-2 text-xs text-slate-400 font-medium italic">
                  Sua lista está vazia. Digite um código e clique no "+" para salvar.
                </div>
              ) : (
                watchlist.map((s) => (
                  <div key={s} className="group relative">
                    <button
                      onClick={() => handleQuickSelect(s)}
                      disabled={loading}
                      className="px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all hover:border-amber-400 hover:text-amber-700 active:scale-95 shadow-sm"
                    >
                      {s}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleWatchlist(s); }}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Sugestões Rápidas
            </h4>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_STOCKS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleQuickSelect(s)}
                  disabled={loading}
                  className="px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-xs font-black transition-all hover:border-blue-400 hover:text-blue-700 active:scale-95 shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-rose-50 text-rose-700 border-2 border-rose-100 rounded-2xl text-center font-bold text-sm shadow-sm flex items-center justify-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {stockData && (
          <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                  {stockData.symbol}
                </h2>
                <button 
                  onClick={() => toggleWatchlist(stockData.symbol)}
                  className={`p-3 rounded-2xl border-2 transition-all ${
                    watchlist.includes(stockData.symbol) 
                    ? 'bg-amber-100 border-amber-300 text-amber-600 shadow-inner' 
                    : 'bg-white border-slate-200 text-slate-300 hover:text-amber-400'
                  }`}
                >
                  <svg className="w-6 h-6" fill={watchlist.includes(stockData.symbol) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.482-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col sm:text-right">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Monitoramento Ativo</p>
                <p className="text-sm font-bold text-slate-500">Histórico: {stockData.startDate} até {stockData.endDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PriceCard label="Preço Atual" value={stockData.currentPrice} type="current" />
              <PriceCard label="Mínima (2m)" value={stockData.minPrice2Months} type="min" />
              <PriceCard label="Máxima (2m)" value={stockData.maxPrice2Months} type="max" />
            </div>

            <StockChart 
              current={stockData.currentPrice} 
              min={stockData.minPrice2Months} 
              max={stockData.maxPrice2Months} 
            />

            {insight && (
              <AIInsightsView insight={insight!} isLoading={loading} sources={sources} />
            )}
          </div>
        )}

        {!stockData && !loading && !error && (
          <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center shadow-inner group transition-all hover:border-blue-200">
            <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-8 transform -rotate-6 transition-transform group-hover:rotate-0">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Onde você quer investir hoje?</h3>
            <p className="text-slate-400 font-medium max-w-sm px-6 leading-relaxed">
              Clique no campo acima e digite o código de qualquer ação brasileira para começar sua análise inteligente.
            </p>
          </div>
        )}
      </main>

      <footer className="mt-24 py-12 border-t border-slate-200 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
        <p>SimuStock AI &bull; Powered by Google Gemini &bull; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
