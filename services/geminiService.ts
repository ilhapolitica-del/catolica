import { GoogleGenAI } from "@google/genai";
import { GroundingSource } from "../types";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
Você é um teólogo católico especialista e assistente pastoral. Seu objetivo é fornecer respostas precisas, caridosas e fiéis baseadas na Doutrina da Igreja Católica.

Diretrizes:
1. **Fontes Confiáveis**: Baseie suas respostas estritamente no Magistério da Igreja, nas Sagradas Escrituras, no Catecismo da Igreja Católica (CIC), em documentos papais e conciliares, e em sites confiáveis como vatican.va.
2. **Clareza e Caridade**: Explique conceitos teológicos complexos de forma acessível, mas sem diluir a verdade. Mantenha um tom respeitoso e pastoral.
3. **Estrutura**: Use parágrafos claros. Se citar o Catecismo ou a Bíblia, forneça a referência (ex: CIC 1234, Jo 3, 16).

Se a pergunta não for sobre a fé, moral ou doutrina católica, redirecione gentilmente o usuário para o tema apropriado, relacionando-o com a visão católica se possível, ou decline educadamente.
`;

// Função para buscar no Google usando SerpAPI
const searchGoogle = async (query: string): Promise<GroundingSource[]> => {
  try {
    const serpApiKey = process.env.SERP_API_KEY;
    if (!serpApiKey) {
      console.warn("SERP_API_KEY não configurada, retornando sem fontes");
      return [];
    }

    const response = await fetch("https://serpapi.com/search", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then(r => r.json()).then((data: any) => {
      if (data.organic_results) {
        return data.organic_results.slice(0, 5).map((result: any) => ({
          uri: result.link,
          title: result.title
        }));
      }
      return [];
    }).catch(() => []);

    return response;
  } catch (error) {
    console.error("Erro ao buscar no Google:", error);
    return [];
  }
};

export const sendMessageToGemini = async (
  prompt: string,
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<{ text: string; sources: GroundingSource[] }> => {
  try {
    if (!apiKey) {
      throw new Error("A chave de API não está configurada (API_KEY missing). Configure as variáveis de ambiente no seu provedor de hospedagem.");
    }

    // Buscar fontes no Google em paralelo
    const sourcesPromise = searchGoogle(prompt + " doutrina católica");

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const text = response.text || "Desculpe, não consegui formular uma resposta no momento.";
    
    // Obter as fontes da busca do Google
    const sources = await sourcesPromise;

    return { text, sources };
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    throw error;
  }
};
