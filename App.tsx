import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Message } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { Info, Loader2 } from 'lucide-react';

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'model',
  text: 'Salve Maria! Eu sou o Veritas, seu assistente de doutrina católica. Posso ajudar com dúvidas sobre o Catecismo, documentos da Igreja, história dos santos ou liturgia. Como posso ajudar você hoje?',
  timestamp: Date.now(),
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Prepare history for context (limit to last 10 messages to save tokens/complexity if needed, 
      // but Gemini handles large context well. We send text only).
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      
      const response = await sendMessageToGemini(text, history);
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        sources: response.sources,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Perdoe-me, ocorreu um erro ao consultar as fontes. Por favor, tente novamente em alguns instantes.",
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-stone-100 text-slate-800 font-sans">
      <Header />
      
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 py-8">
          
          {messages.length === 1 && (
            <div className="bg-white/60 border border-amber-200 rounded-xl p-6 mb-8 text-center shadow-sm backdrop-blur-sm">
              <h2 className="font-serif text-xl text-amber-700 mb-2 font-semibold">Exemplos de Perguntas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {[
                  "O que é a Transubstanciação?",
                  "Quais são os Dogmas Marianos?",
                  "Resumo da Encíclica Rerum Novarum",
                  "Por que confessar com um padre?"
                ].map((q, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    disabled={isLoading}
                    className="text-sm bg-white border border-stone-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 py-3 px-4 rounded-lg transition-all text-left shadow-sm"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex w-full mb-6 justify-start">
               <div className="flex max-w-[80%] gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 text-amber-500">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                  <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none shadow-sm border border-stone-200 flex items-center">
                    <span className="text-stone-500 text-sm animate-pulse">Consultando documentos da Igreja...</span>
                  </div>
               </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}