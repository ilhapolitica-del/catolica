import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { User, Sparkles, ExternalLink, AlertCircle, Quote } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] lg:max-w-[70%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm
          ${isUser ? 'bg-stone-200 text-stone-600' : 'bg-slate-800 text-amber-500 border border-amber-600/30'}`}>
          {isUser ? <User size={20} /> : <Sparkles size={20} />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-5 py-4 rounded-2xl shadow-sm prose-content leading-relaxed text-sm md:text-base
            ${isUser 
              ? 'bg-slate-200 text-slate-900 rounded-tr-none' 
              : 'bg-white text-slate-800 border border-stone-200 rounded-tl-none'
            } ${message.isError ? 'border-red-300 bg-red-50 text-red-800' : ''}`}>
            
            {message.isError ? (
               <div className="flex items-center gap-2">
                 <AlertCircle size={18} />
                 <span>{message.text}</span>
               </div>
            ) : (
              <ReactMarkdown 
                components={{
                  strong: ({node, ...props}) => <span className="font-bold text-amber-700" {...props} />,
                  a: ({node, ...props}) => <a className="text-blue-700 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                  p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-3" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-3" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <div className="relative pl-5 py-2 my-4 border-l-4 border-amber-600 bg-amber-50/50 rounded-r-lg">
                      <Quote className="absolute top-2 left-1 w-3 h-3 text-amber-300 -ml-4 opacity-50" />
                      <blockquote className="italic text-stone-700 font-serif" {...props} />
                    </div>
                  ),
                }}
              >
                {message.text}
              </ReactMarkdown>
            )}
          </div>

          {/* Sources Section (Only for model responses with sources) */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-3 w-full bg-stone-100 border border-stone-200 rounded-lg p-3">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <ExternalLink size={12} /> Fontes & Referências
              </p>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-white border border-stone-300 text-blue-800 px-2 py-1 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors truncate max-w-xs flex items-center gap-1"
                    title={source.title}
                  >
                    <span className="truncate max-w-[150px]">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          <span className="text-[10px] text-stone-400 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};