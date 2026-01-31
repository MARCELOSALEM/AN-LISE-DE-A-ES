
import React from 'react';

interface StockChartProps {
  current: number;
  min: number;
  max: number;
}

const StockChart: React.FC<StockChartProps> = ({ current, min, max }) => {
  // Calcula a porcentagem onde o preço atual está entre a mínima e a máxima
  const range = max - min;
  const position = range === 0 ? 50 : ((current - min) / range) * 100;
  const safePosition = Math.min(Math.max(position, 0), 100);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Desempenho (60 dias)</h3>
          <p className="text-xs text-slate-500">Posição atual em relação ao intervalo</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-blue-600">
            {safePosition.toFixed(1)}%
          </span>
          <span className="text-[10px] block font-bold text-slate-400 uppercase">Do Range</span>
        </div>
      </div>

      <div className="relative h-12 flex items-center">
        {/* Track */}
        <div className="absolute w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div 
              className="h-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400 opacity-60"
              style={{ width: '100%' }}
            ></div>
        </div>

        {/* Current Price Marker */}
        <div 
          className="absolute transition-all duration-1000 ease-out z-10"
          style={{ left: `${safePosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="flex flex-col items-center">
             <div className="w-1 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
             <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded mt-1 whitespace-nowrap">
                R$ {current.toFixed(2)}
             </div>
          </div>
        </div>

        {/* Extremos Labels */}
        <div className="absolute top-10 left-0 text-[10px] font-bold text-rose-600 uppercase">
          Mín: R$ {min.toFixed(2)}
        </div>
        <div className="absolute top-10 right-0 text-[10px] font-bold text-emerald-600 text-right uppercase">
          Máx: R$ {max.toFixed(2)}
        </div>
      </div>
      
      <div className="mt-10 grid grid-cols-2 gap-4 text-center">
        <div className="bg-slate-50 rounded-lg py-2 border border-slate-100">
           <p className="text-[10px] font-bold text-slate-400 uppercase">Volatilidade Estimada</p>
           <p className="text-sm font-bold text-slate-700">{((range/min)*100).toFixed(2)}%</p>
        </div>
        <div className="bg-slate-50 rounded-lg py-2 border border-slate-100">
           <p className="text-[10px] font-bold text-slate-400 uppercase">Distância da Máxima</p>
           <p className="text-sm font-bold text-slate-700">{(((max-current)/max)*100).toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
};

export default StockChart;
