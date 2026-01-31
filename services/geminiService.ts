
import { GoogleGenAI } from "@google/genai";
import { AIInsight } from "../types";

const flexibleExtract = (text: string): AIInsight | null => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.realData && typeof parsed.realData.currentPrice === 'number' && parsed.realData.currentPrice > 0) {
        return parsed as AIInsight;
      }
    }
  } catch (e) {
    console.warn("Falha no parse de JSON estruturado.");
  }

  // Fallback via Regex ultra-flexível (captura formatos como R$ 10,50 ou 10.50)
  const findPrice = (regex: RegExp) => {
    const match = text.match(regex);
    if (match) {
      const val = match[1].replace(/\./g, '').replace(',', '.');
      return parseFloat(val);
    }
    return 0;
  };

  const current = findPrice(/atual.*?(\d+[.,]\d+)/i) || findPrice(/cotação.*?(\d+[.,]\d+)/i) || findPrice(/R\$\s*(\d+[.,]\d+)/i);
  const min = findPrice(/mínima.*?(\d+[.,]\d+)/i);
  const max = findPrice(/máxima.*?(\d+[.,]\d+)/i);
  
  if (current > 0) {
    return {
      analysis: text.length > 50 ? text.substring(0, 300) + "..." : "Análise baseada em dados de mercado encontrados via busca Google.",
      recommendation: text.toUpperCase().includes("COMPRA") || text.toUpperCase().includes("BUY") ? "BUY" : "HOLD",
      riskLevel: "MEDIUM",
      realData: {
        currentPrice: current,
        maxPrice2Months: max || current * 1.05,
        minPrice2Months: min || current * 0.95
      }
    };
  }
  return null;
};

export const getRealMarketData = async (symbol: string): Promise<{ insight: AIInsight; sources: Array<{ title: string; uri: string }> }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Otimizando o termo de busca para cobrir mais tickers
  const searchQuery = `cotação atual hoje e histórico 60 dias (mínima e máxima) da ação ${symbol} ou FII ${symbol} na B3 Brasil`;

  const prompt = `
    PESQUISA GOOGLE SEARCH: ${searchQuery}
    
    Analise os resultados da busca e retorne os dados no formato JSON abaixo. 
    Certifique-se de encontrar o MENOR e o MAIOR preço dos ÚLTIMOS 2 MESES.
    Se não encontrar o JSON exato, responda em texto claro mencionando os valores para que eu possa extrair.

    {
      "analysis": "Sua análise estratégica detalhada sobre ${symbol}",
      "recommendation": "BUY", "SELL", "HOLD" ou "NEUTRAL",
      "riskLevel": "LOW", "MEDIUM" ou "HIGH",
      "realData": {
        "currentPrice": 0.00,
        "maxPrice2Months": 0.00,
        "minPrice2Months": 0.00
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const responseText = response.text || '';
    const insight = flexibleExtract(responseText);
    
    if (!insight) {
      throw new Error(`Não encontramos dados suficientes para o ticker ${symbol}.`);
    }

    const sources: Array<{ title: string; uri: string }> = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks && Array.isArray(chunks)) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || 'Referência B3',
            uri: chunk.web.uri
          });
        }
      });
    }

    return { insight, sources };
  } catch (error) {
    console.error("Erro no serviço Gemini:", error);
    throw error;
  }
};
