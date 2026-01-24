
import React from 'react';

interface PriceCardProps {
  label: string;
  value: number;
  type: 'current' | 'max' | 'min';
}

const PriceCard: React.FC<PriceCardProps> = ({ label, value, type }) => {
  const styles = {
    current: "bg-blue-50 border-blue-200 text-blue-800",
    max: "bg-emerald-50 border-emerald-200 text-emerald-800",
    min: "bg-rose-50 border-rose-200 text-rose-800",
  };

  const labelStyles = {
    current: "text-blue-600",
    max: "text-emerald-600",
    min: "text-rose-600",
  };

  return (
    <div className={`p-6 rounded-2xl border-2 transition-all hover:shadow-md ${styles[type]}`}>
      <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${labelStyles[type]}`}>
        {label}
      </p>
      <p className="text-3xl font-black">
        R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
};

export default PriceCard;
