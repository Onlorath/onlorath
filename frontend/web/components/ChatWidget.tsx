'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../lib/api';
import { MessageSquare, X, Send, Plus, Trash2, Bot, User, Loader2, MessageCircle } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [isSystemBusy, setIsSystemBusy] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations list when widget is open
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  // Load messages whenever conversation selection changes
  useEffect(() => {
    if (currentConvId) {
      loadMessages(currentConvId);
    } else {
      setMessages([]);
    }
  }, [currentConvId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const checkHeaders = (headers: any) => {
    if (headers) {
      setIsSystemBusy(headers['x-chat-system-busy'] === 'true');
      setIsQuotaExceeded(headers['x-chat-quota-exceeded'] === 'true');
    }
  };

  const loadConversations = async () => {
    setIsConversationsLoading(true);
    try {
      const res = await chatAPI.listConversations();
      setConversations(res.data);
      checkHeaders(res.headers);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsConversationsLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await chatAPI.getMessages(convId);
      setMessages(res.data);
      checkHeaders(res.headers);
      const userMsgCount = res.data.filter((m: any) => m.role === 'user').length;
      setIsQuotaExceeded(userMsgCount >= 5);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Optimistically add user message to list
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await chatAPI.sendMessage({
        conversation_id: currentConvId || undefined,
        message: messageText,
      });

      const { conversation_id, reply, title } = res.data;
      checkHeaders(res.headers);

      // Add model response message
      const tempModelMsg: Message = {
        id: Math.random().toString(),
        role: 'model',
        content: reply,
        created_at: new Date().toISOString(),
      };
      
      const newMessages = [...messages, tempUserMsg, tempModelMsg];
      setMessages(newMessages);

      const userMsgCount = newMessages.filter((m) => m.role === 'user').length;
      if (userMsgCount >= 5) {
        setIsQuotaExceeded(true);
      }

      // If it's a new conversation, update current ID and refresh list
      if (!currentConvId) {
        setCurrentConvId(conversation_id);
        loadConversations();
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      checkHeaders(err.response?.headers);
      
      const errorMessage = err.response?.data?.error || err.message || 'Could not reach chatbot service.';
      // Show error in chat
      const tempErrorMsg: Message = {
        id: Math.random().toString(),
        role: 'model',
        content: `Error: ${errorMessage}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempErrorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    setShowHistory(false);
    setIsQuotaExceeded(false);
    setIsSystemBusy(false);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bu konuşmayı silmek istediğinize emin misiniz?')) return;

    try {
      await chatAPI.deleteConversation(convId);
      if (currentConvId === convId) {
        setCurrentConvId(null);
        setMessages([]);
      }
      loadConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };


  return (
    <div className="fixed left-6 bottom-6 z-50 flex flex-col items-start font-sans">
      {/* Chat Window Panel */}
      <div className={`mb-4 w-[360px] md:w-[400px] h-[520px] bg-[#0b0f19]/90 border border-white/10 rounded-2xl shadow-2xl flex flex-col backdrop-blur-xl overflow-hidden transition-all duration-300 origin-bottom-left transform ${
        isOpen 
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
      }`}>
          {/* Header */}
          <div className="p-4 border-b border-white/5 bg-[#0e1424]/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              <div>
                <h3 className="font-bold text-white text-sm">Onlorath Chatbot</h3>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* New Chat Button */}
              <button
                onClick={handleNewChat}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                title="Yeni Konuşma"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Conversations History Toggle */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-1.5 rounded-lg text-slate-300 hover:text-white transition-colors ${
                  showHistory ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 hover:bg-white/10'
                }`}
                title="Geçmiş Konuşmalar"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {/* Close Widget */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Context Wrapper */}
          <div className="flex-grow flex relative overflow-hidden">
            {/* Conversations Sidebar (History Panel) */}
            {showHistory && (
              <div className="absolute inset-0 z-20 bg-[#070b14] border-r border-white/5 w-2/3 flex flex-col animate-fade-in-right">
                <div className="p-3 border-b border-white/5 flex items-center justify-between bg-[#0b0f19]">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider font-mono">KONUŞMALAR</span>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-1">
                  {isConversationsLoading ? (
                    <div className="flex items-center justify-center h-20 text-slate-500 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Yükleniyor...
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-slate-500 text-[11px] text-center mt-6 font-mono">Geçmiş bulunamadı.</div>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => {
                          setCurrentConvId(conv.id);
                          setShowHistory(false);
                        }}
                        className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs font-mono transition-all ${
                          currentConvId === conv.id
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <span className="truncate pr-2">{conv.title}</span>
                        <button
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Messages Panel */}
            <div className="flex-grow flex flex-col bg-[#05080e]/40 p-4 overflow-y-auto space-y-4 max-h-[380px]">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <Bot className="w-8 h-8 text-cyan-500/50 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">Merhaba {user ? user.email.split('@')[0] : 'Ziyaretçi'}!</p>
                  <p className="text-xs text-slate-500 max-w-[240px]">
                    Onlorath API ve sistemleri hakkında konuşmaya başlamak için aşağıya bir mesaj yazın.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-2.5 max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 p-1.5 rounded-lg border ${
                        msg.role === 'user'
                          ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                          : 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400'
                      }`}
                    >
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    {/* Content */}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 text-slate-200 rounded-tr-none'
                          : 'bg-[#0f1526]/80 border border-white/5 text-slate-300 rounded-tl-none'
                      }`}
                    >
                      {renderMessageContent(msg.content)}
                    </div>
                  </div>
                ))
              )}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex items-start space-x-2.5 max-w-[80%]">
                  <div className="flex-shrink-0 p-1.5 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-[#0f1526]/80 border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Footer Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-[#080c14] flex flex-col space-y-2">
            {isSystemBusy ? (
              <div className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 text-center font-mono">
                Şu anda yoğunluk var o yüzden kullanılamıyor.
              </div>
            ) : isQuotaExceeded ? (
              <div className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 text-center font-mono">
                Sohbet kotanız (5 mesaj) dolmuştur. Yusuf'a ulaşmak için lütfen iletişim formunu kullanın.
              </div>
            ) : null}
            <div className="flex items-center space-x-2 w-full">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isSystemBusy || isQuotaExceeded ? "Sohbet devre dışı..." : "Gemini'ye sorun..."}
                className="flex-grow p-2 bg-[#0e1424]/60 border border-white/5 hover:border-white/10 focus:border-cyan-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all disabled:opacity-55"
                disabled={isLoading || isSystemBusy || isQuotaExceeded}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading || isSystemBusy || isQuotaExceeded}
                className={`p-2 rounded-xl text-white transition-all ${
                  !inputMessage.trim() || isLoading || isSystemBusy || isQuotaExceeded
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 shadow-md shadow-cyan-500/10'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

      {/* Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative group"
        title="Onloraht Chatbot"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5 animate-pulse" />}
        
        {/* Hover label */}
        {!isOpen && (
          <span className="absolute left-14 bg-slate-900 border border-white/10 text-white text-[10px] font-mono py-1 px-2.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-xl">
            Sisteme Sorun
          </span>
        )}
      </button>
    </div>
  );
}

const renderMessageContent = (content: string) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    const linkText = match[1];
    const linkUrl = match[2];

    if (linkUrl.startsWith('/')) {
      parts.push(
        <a
          key={match.index}
          href={linkUrl}
          className="text-cyan-400 hover:text-cyan-300 underline font-semibold transition-colors"
        >
          {linkText}
        </a>
      );
    } else {
      parts.push(
        <a
          key={match.index}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline font-semibold transition-colors"
        >
          {linkText}
        </a>
      );
    }

    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}
