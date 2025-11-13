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

// Fontes católicas confiáveis que sempre retornamos
const RELIABLE_CATHOLIC_SOURCES: GroundingSource[] = [
  {
    uri: "https://www.vatican.va/archive/catechism_po/index_po.html",
    title: "Catecismo da Igreja Católica - Versão Official"
  },
  {
    uri: "https://www.vatican.va/content/vatican/pt.html",
    title: "Site Oficial do Vaticano"
  },
  {
    uri: "https://www.vatican.va/archive/bible/nova_vulgata/documents/nova-vulgata_index_po.html",
    title: "Bíblia Sagrada - Nova Vulgata do Vaticano"
  },
  {
    uri: "https://www.cnbb.org.br",
    title: "Conferência Nacional dos Bispos do Brasil (CNBB)"
  },
  {
    uri: "https://www.catholic.com",
    title: "Apologetics Institute - Catholic Resources"
  }
];

// Função para buscar fontes católicas confiáveis
const getCatholicSources = async (prompt: string): Promise<GroundingSource[]> => {
  try {
    // Sempre retorna as fontes católicas de confiança
    const sources = [...RELIABLE_CATHOLIC_SOURCES];
    
    // Tenta buscar em DuckDuckGo Instant Answer (sem API key necessária)
    try {
      const encodedQuery = encodeURIComponent(`${prompt} site:vatican.va OR site:catholic.com OR site:catolicismo.com.br`);
      const ddgResponse = await fetch(
        `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_redirect=1`,
        { method: 'GET', headers: { 'Accept': 'application/json' } }
      ).then(r => r.json()).catch(() => ({}));
      
      // DuckDuckGo retorna ResultsObjects com Icon.URL, Title, FirstURL
      if (ddgResponse.Results && Array.isArray(ddgResponse.Results)) {
        ddgResponse.Results.slice(0, 3).forEach((result: any) => {
          if (result.FirstURL && result.Title) {
            // Verifica se não é duplicata
            if (!sources.find(s => s.uri === result.FirstURL)) {
              sources.push({
                uri: result.FirstURL,
                title: result.Title
              });
            }
          }
        });
      }
    } catch (err) {
      // Se DuckDuckGo falhar, apenas retorna as fontes de confiança
      console.warn("DuckDuckGo search failed, using reliable sources only", err);
    }
    
    return sources;
  } catch (error) {
    console.error("Erro ao buscar fontes católicas:", error);
    // Sempre retorna as fontes de confiança como fallback
    return RELIABLE_CATHOLIC_SOURCES;
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
    
    // Buscar fontes católicas confiáveis em paralelo
    const sourcesPromise = getCatholicSources(prompt);
    
    // Preparar o conteúdo com histórico
    const contents = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));
    
    // Adicionar a pergunta atual
    contents.push({
      role: 'user' as const,
      parts: [{ text: prompt }]
    });
    
    // Fazer a chamada para generateContent
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      systemInstruction: SYSTEM_INSTRUCTION
    });
    
    // Extrair o texto da resposta
    const text = response.text() || "Desculpe, não consegui formular uma resposta no momento.";
    
    // Obter as fontes católicas
    const sources = await sourcesPromise;
    
    return { text, sources };
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    throw error;
  }
};
