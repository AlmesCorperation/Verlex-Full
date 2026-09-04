import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  myPlayerId: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, myPlayerId }) => {
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Press '/' or 'Enter' shortcut to focus chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        setIsExpanded(true);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div
      className={`roblox-chat-box select-none ${
        isFocused || isExpanded ? 'opacity-100' : 'opacity-70 hover:opacity-100'
      }`}
    >
      {/* Header Bar */}
      <div className="roblox-chat-header">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span>Chat Console</span>
          <span className="text-[9px] text-neutral-400 font-normal">(Press / to chat)</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 hover:bg-neutral-700 rounded text-neutral-300 transition"
        >
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Message Log */}
      {isExpanded && (
        <div className="h-40 overflow-y-auto p-2 space-y-1 text-xs custom-scrollbar bg-neutral-950/90">
          {messages.length === 0 && (
            <div className="text-neutral-500 text-[11px] italic text-center py-4">
              No chat messages yet. Type `/e sit`, `/e dance`, or `/help`!
            </div>
          )}
          {messages.map((m) => {
            const isMe = m.senderId === myPlayerId;
            if (m.isSystem) {
              return (
                <div key={m.id} className="text-amber-300 text-[11px] font-semibold italic">
                  ℹ️ {m.text}
                </div>
              );
            }
            return (
              <div key={m.id} className="leading-tight break-words">
                <span
                  className={`font-extrabold mr-1.5 ${
                    isMe ? 'text-emerald-400' : 'text-sky-300'
                  }`}
                >
                  [{m.senderName}]:
                </span>
                <span className="text-white">{m.text}</span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center p-1.5 bg-[#181b21] border-t border-neutral-800">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type message or /e dance..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              inputRef.current?.blur();
            }
          }}
          className="roblox-chat-input flex-1"
        />
        <button
          type="submit"
          className="roblox-btn roblox-btn-blue p-1.5 ml-1 text-xs"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
