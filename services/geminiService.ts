
import { GoogleGenAI } from "@google/genai";
import { AIInsight } from "../types";

/**
 * Tenta extrair dados estruturados de uma resposta que pode conter texto e JSON misturados.
 */
const flexibleExtract = (text: string): AIInsight | null => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.realData && typeof parsed.realData.currentPrice === 'number') {
        return parsed as AIInsight;
      }
    }
  } catch (e) {
    console.warn("Falha no parse de JSON estruturado.");
  }

  // Fallback de extração via Regex caso o JSON falhe
  const findPrice = (regex: RegExp) => {
    const match = text.match(regex);
    if (match) return parseFloat(match[1].replace(',', '.'));
    return 0;
  };

  const current = findPrice(/atual.*?(\d+[.,]\d+)/i) || findPrice(/cotação.*?(\d+[.,]\d+)/i);
  
  if (current > 0) {
    return {
      analysis: "Análise baseada em dados reais encontrados via busca.",
      recommendation: text.toUpperCase().includes("COMPRA") ? "BUY" : "HOLD",
      riskLevel: "MEDIUM",
      realData: {
        currentPrice: current,
        maxPrice: current * 1.02,
        minPrice: current * 0.98
      }
    };
  }
  return null;
};

export const getRealMarketData = async (symbol: string): Promise<{ insight: AIInsight; sources: Array<{ title: string; uri: string }> }> => {
  // Acesso seguro para evitar ReferenceError: process is not defined
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : (window as any).API_KEY;
  
  if (!apiKey) {
    console.error("Chave de API não encontrada. Certifique-se de que a variável de ambiente API_KEY está configurada.");
    throw new Error("Configuração de API ausente.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    PESQUISA GOOGLE SEARCH: Qual a cotação atual, máxima e mínima de hoje para a ação ${symbol} na B3 Brasil?
    
    Responda APENAS com este JSON:
    {
      "analysis": "Sua análise aqui",
      "recommendation": "BUY", "SELL", "HOLD" ou "NEUTRAL",
      "riskLevel": "LOW", "MEDIUM" ou "HIGH",
      "realData": {
        "currentPrice": 0.00,
        "maxPrice": 0.00,
        "minPrice": 0.00
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
      throw new Error("Não foi possível processar a resposta da IA.");
    }

    const sources: Array<{ title: string; uri: string }> = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks && Array.isArray(chunks)) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || 'Google Finance / B3',
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
