
export interface StockData {
  symbol: string;
  currentPrice: number;
  maxPrice: number;
  minPrice: number;
  startDate: string;
  endDate: string;
  sources: Array<{ title: string; uri: string }>;
}

export interface AIInsight {
  analysis: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'NEUTRAL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  realData: {
    currentPrice: number;
    maxPrice: number;
    minPrice: number;
  };
}
