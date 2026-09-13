'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';

interface ChatProps {
  messages: ChatMessage[];
  onSend: (content: string) => void;
  currentUserId: string;
}

const EMOJI_LIST = ['😀', '😂', '🥳', '😎', '🤔', '👍', '👎', '❤', '🔥', '🎮', '🏆', '💪', '🎉', '😅', '👀', '💀'];

export default function Chat({ messages, onSend, currentUserId }: ChatProps) {
  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
    setShowEmojis(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: Date) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="glass rounded-2xl flex flex-col h-[600px]">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-bold text-sm">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-8">
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.type === 'system' ? 'justify-center' : ''}`}
          >
            {msg.type === 'system' ? (
              <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full">
                {msg.content}
              </span>
            ) : (
              <>
                <img
                  src={msg.avatar}
                  alt={msg.username}
                  className="w-7 h-7 rounded-full bg-white/10 flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-xs font-medium ${
                        msg.userId === currentUserId ? 'text-primary-400' : 'text-slate-300'
                      }`}
                    >
                      {msg.username}
                    </span>
                    <span className="text-xs text-slate-600">{formatTime(msg.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-200 break-words">{msg.content}</p>
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showEmojis && (
        <div className="p-3 border-t border-white/10 bg-black/20">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setInput((prev) => prev + emoji);
                }}
                className="p-1.5 hover:bg-white/10 rounded transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400"
          >
            😊
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Type a message..."
            maxLength={200}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
