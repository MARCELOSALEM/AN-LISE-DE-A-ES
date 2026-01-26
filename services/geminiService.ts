
import { GoogleGenAI } from "@google/genai";
import { AIInsight } from "../types";

const extractJson = (text: string): any => {
  try {
    // Tenta encontrar um bloco de JSON dentro da resposta (caso o modelo envie markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("Erro ao parsear JSON do Gemini:", e);
    return null;
  }
};

export const getRealMarketData = async (symbol: string): Promise<{ insight: AIInsight; sources: Array<{ title: string; uri: string }> }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Prompt mais assertivo para dados estruturados mesmo sem schema rígido
  const prompt = `
    Aja como um analista financeiro sênior da B3.
    Utilize o Google Search para encontrar os dados REAIS e MAIS RECENTES da ação ${symbol} no Brasil.
    
    Você DEVE retornar as informações exatamente no formato JSON abaixo:
    {
      "analysis": "Sua análise curta aqui",
      "recommendation": "BUY", "SELL", "HOLD" ou "NEUTRAL",
      "riskLevel": "LOW", "MEDIUM" ou "HIGH",
      "realData": {
        "currentPrice": 0.00,
        "maxPrice": 0.00,
        "minPrice": 0.00
      }
    }
    
    Certifique-se de que os preços sejam números (float). Não adicione texto antes ou depois do JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Removido responseMimeType para evitar conflitos com a ferramenta de busca
      },
    });

    const responseText = response.text || '';
    const insight = extractJson(responseText) as AIInsight;
    
    if (!insight || !insight.realData) {
      throw new Error("Dados reais não encontrados na resposta da IA.");
    }

    // Extrair fontes das Grounding Metadata conforme especificação
    const sources: Array<{ title: string; uri: string }> = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks && Array.isArray(chunks)) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || 'Referência de Mercado',
            uri: chunk.web.uri
          });
        }
      });
    }

    return { insight, sources };
  } catch (error) {
    console.error("Erro detalhado na busca:", error);
    throw error;
  }
};
