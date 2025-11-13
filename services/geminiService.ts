import { GoogleGenAI } from "@google/genai";
import { GroundingSource } from "../types";

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Você é um teólogo católico especialista e assistente pastoral. Seu objetivo é fornecer respostas precisas, caridosas e fiéis baseadas na Doutrina da Igreja Católica.

Diretrizes:
1. **Fontes Confiáveis**: Baseie suas respostas estritamente no Magistério da Igreja, nas Sagradas Escrituras, no Catecismo da Igreja Católica (CIC), em documentos papais e conciliares, e em sites confiáveis como vatican.va.
2. **Clareza e Caridade**: Explique conceitos teológicos complexos de forma acessível, mas sem diluir a verdade. Mantenha um tom respeitoso e pastoral.
3. **Estrutura**: Use parágrafos claros. Se citar o Catecismo ou a Bíblia, forneça a referência (ex: CIC 1234, Jo 3, 16).
4. **Grounding**: Use a ferramenta de busca para verificar informações atuais ou encontrar referências específicas em documentos oficiais online.

Se a pergunta não for sobre a fé, moral ou doutrina católica, redirecione gentilmente o usuário para o tema apropriado, relacionando-o com a visão católica se possível, ou decline educadamente.
`;

export const sendMessageToGemini = async (
  prompt: string,
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<{ text: string; sources: GroundingSource[] }> => {
  try {
    // Convert internal history format to API format if needed, 
    // though for single turn or simple context, we might just send the current prompt 
    // with the googleSearch tool enabled. For full chat, we'd use ai.chats.create,
    // but here we will use generateContent to explicitly manage the tool call per request easily.
    
    // We construct a chat-like prompt by prepending history if needed, 
    // or we can use the chat interface. Let's use generateContent with tools for simplicity and control.
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Desculpe, não consegui formular uma resposta no momento.";
    
    // Extract grounding chunks (sources)
    const sources: GroundingSource[] = [];
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            uri: chunk.web.uri,
            title: chunk.web.title || chunk.web.uri,
          });
        }
      });
    }

    return { text, sources };

  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    throw error;
  }
};
