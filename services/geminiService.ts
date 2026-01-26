
import { GoogleGenAI } from "@google/genai";
import { AIInsight } from "../types";

/**
 * Tenta extrair dados estruturados de uma resposta que pode conter texto e JSON misturados.
 */
const flexibleExtract = (text: string, symbol: string): AIInsight | null => {
  try {
    // 1. Tenta encontrar um bloco JSON puro
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.realData && typeof parsed.realData.currentPrice === 'number') {
        return parsed as AIInsight;
      }
    }
  } catch (e) {
    console.warn("Falha no parse inicial de JSON, tentando extração por Regex...");
  }

  // 2. Fallback: Extração via Regex se o modelo retornar texto corrido
  // Procura por padrões como "R$ 25,50" ou "25.50"
  const findPrice = (regex: RegExp) => {
    const match = text.match(regex);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    return 0;
  };

  const currentPrice = findPrice(/preço atual.*?(\d+[.,]\d+)/i) || findPrice(/cotação.*?(\d+[.,]\d+)/i);
  const max60 = findPrice(/máximo.*?(\d+[.,]\d+)/i) || findPrice(/máxima.*?(\d+[.,]\d+)/i);
  const min60 = findPrice(/mínimo.*?(\d+[.,]\d+)/i) || findPrice(/mínima.*?(\d+[.,]\d+)/i);

  if (currentPrice > 0) {
    return {
      analysis: text.split('\n')[0].substring(0, 200) + "...", // Pega a primeira linha como análise
      recommendation: text.toUpperCase().includes("COMPRA") ? "BUY" : 
                      text.toUpperCase().includes("VENDA") ? "SELL" : "HOLD",
      riskLevel: "MEDIUM",
      realData: {
        currentPrice,
        maxPrice: max60 || currentPrice * 1.05,
        minPrice: min60 || currentPrice * 0.95
      }
    };
  }

  return null;
};

export const getRealMarketData = async (symbol: string): Promise<{ insight: AIInsight; sources: Array<{ title: string; uri: string }> }> => {
  // Nota: Certifique-se de que a variável API_KEY está definida no Netlify (Site Settings > Environment variables)
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("ERRO: API_KEY não encontrada. Verifique as variáveis de ambiente no Netlify.");
    throw new Error("Configuração de API ausente.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    PESQUISA OBRIGATÓRIA NO GOOGLE SEARCH:
    Encontre os valores REAIS de hoje para a ação ${symbol} na B3 Brasil.
    
    Retorne EXATAMENTE este formato JSON, sem conversas:
    {
      "analysis": "Breve análise do ticker",
      "recommendation": "BUY", "SELL", "HOLD" ou "NEUTRAL",
      "riskLevel": "LOW", "MEDIUM" ou "HIGH",
      "realData": {
        "currentPrice": 0.00,
        "maxPrice": 0.00,
        "minPrice": 0.00
      }
    }
    Se não encontrar o valor exato da máxima de 60 dias, use a máxima das últimas 24h.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Menor temperatura para respostas mais determinísticas
      },
    });

    const responseText = response.text || '';
    console.log("Resposta bruta do Gemini:", responseText); // Útil para depurar no console do navegador

    const insight = flexibleExtract(responseText, symbol);
    
    if (!insight) {
      throw new Error("Não foi possível extrair dados válidos da resposta.");
    }

    const sources: Array<{ title: string; uri: string }> = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks && Array.isArray(chunks)) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || 'Ver dados no Google Finance',
            uri: chunk.web.uri
          });
        }
      });
    }

    return { insight, sources };
  } catch (error) {
    console.error("Erro na camada de serviço Gemini:", error);
    throw error;
  }
};
