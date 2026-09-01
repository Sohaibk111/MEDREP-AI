import React, { useState } from 'react';
import { X, Bot, Send, Sparkles, Loader2 } from 'lucide-react';
import { sendAIChatQuery } from '../services/api';

interface AITerritoryChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export const AITerritoryChatModal: React.FC<AITerritoryChatModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hello! I am your MedRep AI Field Assistant. Ask me anything regarding your Rawalpindi/Islamabad doctors, OPD timings, EvoCheck CGM evidence, route planning, or objection rebuttals.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'Who should I visit in PWD today?',
    'How do I handle Dr. Jamal’s price objection?',
    'Give me today’s 3 highest priority calls',
    'Compare EvoCheck with FreeStyle Libre'
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const newMsgs: Message[] = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMsgs);
    if (!queryText) setInput('');

    try {
      setLoading(true);
      const res = await sendAIChatQuery(textToSend);
      if (res.success && res.text) {
        setMessages([...newMsgs, { role: 'assistant', text: res.text }]);
      } else {
        setMessages([...newMsgs, { role: 'assistant', text: 'Unable to retrieve answer. Please verify network connection.' }]);
      }
    } catch (err: any) {
      setMessages([...newMsgs, { role: 'assistant', text: `Error: ${err.message || 'Could not query assistant'}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0ea5e9] rounded-lg flex items-center justify-center text-white font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">
                AI Territory Intelligence Assistant
              </h3>
              <p className="text-xs text-[#64748b]">
                Real-time answers grounded in your Doctor CRM & EvoCheck Clinical Data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#f1f5f9] flex items-center justify-center text-[#64748b] hover:text-[#0f172a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#f8fafc]">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#0f172a] text-white rounded-br-none'
                    : 'bg-white border border-[#e2e8f0] text-[#1e293b] rounded-bl-none shadow-xs whitespace-pre-wrap'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-[#94a3b8] mt-1 px-1">
                {m.role === 'user' ? 'You' : 'MedRep AI'}
              </span>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#64748b] bg-white p-3 rounded-xl border border-[#e2e8f0] w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0ea5e9]" />
              <span>Analyzing CRM context...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Chips */}
        <div className="px-5 py-2.5 bg-white border-t border-[#e2e8f0] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] font-medium bg-[#f1f5f9] hover:bg-sky-50 hover:text-[#0ea5e9] hover:border-sky-200 border border-[#e2e8f0] text-[#475569] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-white border-t border-[#e2e8f0] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything (e.g. 'Show me doctors in Saidpur Road with A priority')..."
            className="flex-1 text-xs text-[#0f172a] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0ea5e9]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-[#0ea5e9] hover:bg-sky-600 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
