import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  return (
    <div className="bg-white border-t border-stone-200 p-4 sticky bottom-0 z-40 shadow-lg-top">
      <div className="max-w-3xl mx-auto relative">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-stone-50 border border-stone-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-amber-500/50 focus-within:border-amber-500 transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Faça uma pergunta sobre a Doutrina Católica..."
            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[24px] py-3 px-2 text-slate-800 placeholder-stone-400"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-lg flex-shrink-0 transition-all duration-200 
              ${input.trim() && !isLoading 
                ? 'bg-slate-900 text-amber-500 hover:bg-slate-800 shadow-md transform hover:-translate-y-0.5' 
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
        <p className="text-center text-[10px] text-stone-400 mt-2">
          O Veritas Catholica pode cometer erros. Verifique informações importantes nas fontes oficiais citadas.
        </p>
      </div>
    </div>
  );
};
