
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function optimizeReportText(text: string, type: 'historico' | 'produtividade'): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Melhore o seguinte texto de ${type} policial, tornando-o mais formal, direto e técnico no padrão da PMMG. Mantenha os fatos mas use terminologia militar adequada: \n\n${text}`,
      config: {
        systemInstruction: "Você é um assistente especializado em redação de boletins de ocorrência militares. Seu tom deve ser formal, imparcial e técnico.",
      }
    });
    return response.text || text;
  } catch (error) {
    console.error("Erro ao otimizar texto:", error);
    return text;
  }
}
