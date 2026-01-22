
import { GoogleGenAI } from "@google/genai";

// Proteção para evitar erro de página branca se a API KEY não estiver definida
const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export async function optimizeReportText(text: string, type: 'historico' | 'produtividade'): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("API_KEY não configurada no Netlify. IA desativada.");
    return text;
  }

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
