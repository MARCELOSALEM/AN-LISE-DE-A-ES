
import { GoogleGenAI, Type } from "@google/genai";
import { AIInsight } from "../types";

export const getRealMarketData = async (symbol: string): Promise<{ insight: AIInsight; sources: Array<{ title: string; uri: string }> }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
    Utilize o Google Search para encontrar os dados REAIS e MAIS RECENTES da ação ${symbol} na B3 (Brasil).
    Preciso do:
    1. Preço atual (Current Price).
    2. Preço máximo dos últimos 60 dias (60-day High).
    3. Preço mínimo dos últimos 60 dias (60-day Low).
    
    Além dos dados, forneça uma análise técnica curta e uma recomendação.
    Responda estritamente em JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            recommendation: { 
              type: Type.STRING, 
              enum: ["BUY", "SELL", "HOLD", "NEUTRAL"] 
            },
            riskLevel: { 
              type: Type.STRING, 
              enum: ["LOW", "MEDIUM", "HIGH"] 
            },
            realData: {
              type: Type.OBJECT,
              properties: {
                currentPrice: { type: Type.NUMBER },
                maxPrice: { type: Type.NUMBER },
                minPrice: { type: Type.NUMBER },
              },
              required: ["currentPrice", "maxPrice", "minPrice"]
            }
          },
          required: ["analysis", "recommendation", "riskLevel", "realData"],
        },
      },
    });

    const insight = JSON.parse(response.text || '{}') as AIInsight;
    
    // Extrair fontes das Grounding Metadata
    const sources: Array<{ title: string; uri: string }> = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || 'Fonte de Mercado',
            uri: chunk.web.uri
          });
        }
      });
    }

    return { insight, sources };
  } catch (error) {
    console.error("Erro ao buscar dados reais:", error);
    throw error;
  }
};
