'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  ArrowLeft,
  MoreVertical,
  Copy,
  RefreshCw,
  Bot,
  Menu,
  X,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { Button, Card, Toast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, type ChatSession } from '@/lib/chat';
import { debugSupabase } from '@/lib/debug-supabase';
import { useToast } from '@/hooks/useToast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  files?: Array<{
    name: string;
    type: string;
    url: string;
  }>;
}

export default function AIPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userSessions, setUserSessions] = useState<ChatSession[]>([]);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing session or create new one
  useEffect(() => {
    const loadOrCreateSession = async () => {
      if (!user) {
        console.log('No user found, skipping session load');
        return;
      }

      // Debug Supabase durumunu kontrol et
      console.log('🔍 Debugging Supabase connection...');
      await debugSupabase();

      setIsLoadingSession(true);

      try {
        if (sessionId) {
          console.log('Loading existing session:', sessionId);
          // Load existing session messages
          const messages = await chatService.getSessionMessages(sessionId);
          console.log('Loaded messages:', messages.length);

          const convertedMessages = messages.map(
            (msg): Message => ({
              id: msg.id,
              type: msg.role === 'user' ? 'user' : 'ai',
              content: msg.content,
              timestamp: new Date(msg.created_at),
              files: msg.attachments || [],
            }),
          );
          setMessages(convertedMessages);

          // Get session title from existing sessions
          const sessions = await chatService.getUserSessions();
          console.log('User sessions:', sessions.length);
          setUserSessions(sessions);

          const session = sessions.find((s) => s.id === sessionId);
          if (session) {
            console.log('Found existing session:', session.title);
            setSessionTitle(session.title);
            setCurrentSession(session);
          } else {
            console.log('Session not found in user sessions');
          }
        } else {
          console.log('No sessionId provided');
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadOrCreateSession();
  }, [sessionId, user]);

  const handleFileSelect = (files: FileList) => {
    console.log(
      '📁 Files selected:',
      Array.from(files).map((f) => f.name + ' (' + f.type + ')'),
    );

    const validFiles: File[] = [];
    const errors: string[] = [];
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp', // Images
      'application/pdf', // PDF
      'text/plain',
      'text/csv', // Text files
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
      'application/vnd.ms-excel', // XLSX
    ];

    Array.from(files).forEach((file) => {
      // Dosya boyutu kontrolü
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Dosya boyutu çok büyük (max 20MB)`);
        return;
      }

      // Dosya tipi kontrolü
      if (!supportedTypes.includes(file.type)) {
        errors.push(`${file.name}: Desteklenmeyen dosya tipi (${file.type})`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      console.error('❌ File validation errors:', errors);
      alert('Dosya hataları:\n' + errors.join('\n'));
    }

    console.log(
      '✅ Valid files:',
      validFiles.map((f) => f.name),
    );
    setAttachedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const generateSessionTitle = (message: string): string => {
    const cleanMessage = message.slice(0, 50).trim();
    if (cleanMessage.length < message.length) {
      return cleanMessage + '...';
    }
    return cleanMessage || 'Yeni Sohbet';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachedFiles.length === 0) return;
    if (!user) return;

    const messageContent = inputValue.trim();

    let session = currentSession;

    // Create new session if needed
    if (!session && messageContent) {
      console.log('Creating new session with title:', generateSessionTitle(messageContent));
      const title = generateSessionTitle(messageContent);
      session = await chatService.createSession(title);
      if (session) {
        console.log('Session created successfully:', session.id);
        setCurrentSession(session);
        setSessionTitle(session.title);
        // Update URL to include session ID
        const newUrl = `/ai?session=${session.id}`;
        window.history.replaceState(null, '', newUrl);
      } else {
        console.error('Failed to create session');
      }
    }

    if (!session) {
      console.error('Could not create or load session');
      console.error('Current user:', user);
      console.error('Message content:', messageContent);
      setIsLoading(false);
      return;
    }

    // Add user message to database
    const userDbMessage = await chatService.addMessage({
      session_id: session.id,
      role: 'user',
      content: messageContent,
      attachments: attachedFiles.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    });

    if (userDbMessage) {
      const userMessage: Message = {
        id: userDbMessage.id,
        type: 'user',
        content: messageContent,
        timestamp: new Date(userDbMessage.created_at),
        files: attachedFiles.map((file) => ({
          name: file.name,
          type: file.type,
          url: URL.createObjectURL(file),
        })),
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    setInputValue('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages
        .slice(-4) // Last 4 messages for context
        .map((msg) => `${msg.type === 'user' ? 'Öğrenci' : 'Sarai AI'}: ${msg.content}`)
        .join('\n\n');

      console.log('🔄 Calling Sarai AI API...');

      // Handle files - separate images and documents
      let imageBase64: string | null = null;
      let documentProcessingResult: string | null = null;
      const hasImage = attachedFiles.some((file) => file.type.startsWith('image/'));
      const hasDocument = attachedFiles.some((file) => !file.type.startsWith('image/'));

      // Handle image files
      if (hasImage) {
        const imageFile = attachedFiles.find((file) => file.type.startsWith('image/'));
        if (imageFile) {
          console.log('📸 Converting image to base64...');
          imageBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              const base64String = base64.split(',')[1];
              resolve(base64String);
            };
            reader.readAsDataURL(imageFile);
          });
        }
      }

      // Handle document files using server-side API
      if (hasDocument) {
        const documentFile = attachedFiles.find((file) => !file.type.startsWith('image/'));
        if (documentFile) {
          console.log('📄 Processing document with server-side API...', documentFile.name);
          setIsProcessingDocument(true);

          try {
            // Build conversation history for context
            const conversationHistory = messages
              .slice(-4)
              .map((msg) => `${msg.type === 'user' ? 'Öğrenci' : 'Sarai AI'}: ${msg.content}`)
              .join('\n\n');

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', documentFile);
            formData.append('userMessage', messageContent);
            formData.append('conversationHistory', conversationHistory);

            // Send to server-side API
            const docResponse = await fetch('/api/process-document', {
              method: 'POST',
              body: formData,
            });

            if (!docResponse.ok) {
              throw new Error(`Document API error: ${docResponse.status}`);
            }

            const docResult = await docResponse.json();

            if (docResult.success && docResult.response) {
              documentProcessingResult = docResult.response;
            } else {
              documentProcessingResult = `Belge işleme hatası: ${docResult.error || 'Bilinmeyen hata'}`;
            }
          } catch (error) {
            console.error('❌ Document processing error:', error);
            documentProcessingResult = `Belge işleme başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`;
          } finally {
            setIsProcessingDocument(false);
          }
        }
      }

      let aiResponse: string;

      // If document was processed, use the result directly
      if (hasDocument && documentProcessingResult) {
        aiResponse = documentProcessingResult;
        console.log('✅ Using document processing result');
      } else {
        // Otherwise, call the API for regular chat or image processing
        const apiResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageContent,
            conversationHistory: conversationHistory,
            imageBase64: imageBase64,
            hasImage: hasImage,
          }),
        });

        if (!apiResponse.ok) {
          throw new Error(`API error: ${apiResponse.status}`);
        }

        const responseData = await apiResponse.json();
        aiResponse = responseData.response;
        console.log('✅ AI response received from API');
      }

      // Add AI message to database
      const aiDbMessage = await chatService.addMessage({
        session_id: session.id,
        role: 'assistant',
        content: aiResponse,
      });

      if (aiDbMessage) {
        const aiMessage: Message = {
          id: aiDbMessage.id,
          type: 'ai',
          content: aiResponse,
          timestamp: new Date(aiDbMessage.created_at),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorDbMessage = await chatService.addMessage({
        session_id: session.id,
        role: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
      });

      if (errorDbMessage) {
        const errorMessage: Message = {
          id: errorDbMessage.id,
          type: 'ai',
          content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
          timestamp: new Date(errorDbMessage.created_at),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        showSuccess('Mesaj kopyalandı!');
      })
      .catch(() => {
        showError('Kopyalama başarısız');
      });
  };

  const createNewChat = () => {
    // Yeni chat oluştur
    setCurrentSession(null);
    setMessages([]);
    setSessionTitle('');
    setInputValue('');
    setAttachedFiles([]);
    setIsSidebarOpen(false);

    // URL'yi temizle
    window.history.replaceState(null, '', '/ai');
    showSuccess('Yeni sohbet başlatıldı!');
  };

  const switchToSession = (session: ChatSession) => {
    // Session'a geç
    setIsSidebarOpen(false);
    router.push(`/ai?session=${session.id}`);
  };

  const quickPrompts = [
    'Matematik integral konusunu anlatır mısın?',
    'Fizik kuvvet soruları için ipuçları ver',
    'YKS için çalışma planı oluştur',
    'Kimya mol kavramını açıkla',
  ];

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex">
      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? 'w-80' : 'w-16'} transition-all duration-300 ease-in-out bg-gray-900/95 backdrop-blur-sm border-r border-gray-800 relative`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 right-2 z-10 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>

        {isSidebarOpen ? (
          <>
            {/* Sidebar Header */}
            <div className="p-4 pt-14 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Sohbetler</h2>
            </div>

            {/* New Chat Button */}
            <div className="p-4 border-b border-gray-800">
              <Button
                variant="primary"
                size="sm"
                onClick={createNewChat}
                className="w-full justify-start"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Sohbet
              </Button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2">
              {userSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => switchToSession(session)}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-colors hover:bg-gray-800/50 ${
                    currentSession?.id === session.id ? 'bg-purple-600/20 border-purple-500/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{session.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(session.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="pt-16 p-2">
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={createNewChat}
                className="p-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                title="Yeni Sohbet"
              >
                <Plus className="w-4 h-4" />
              </button>
              {userSessions.slice(0, 8).map((session) => (
                <button
                  key={session.id}
                  onClick={() => switchToSession(session)}
                  className={`p-2 rounded-lg transition-colors ${
                    currentSession?.id === session.id
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'hover:bg-gray-800 text-gray-400'
                  }`}
                  title={session.title}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header - Sticky */}
        <header className="sticky top-0 z-30 border-b border-gray-800/50 bg-black/20 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">Sarai AI</h1>
                  <p className="text-sm text-gray-400">{sessionTitle || 'YKS Asistanınız'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Merhaba {user?.user_metadata?.full_name || 'Öğrenci'}! 👋
              </h2>
              <p className="text-gray-300 mb-8">
                Ben senin YKS yolculuğundaki AI asistanınım. Soru sor, fotoğraf yükle, PDF analiz et
                - her konuda yardımcı olmaya hazırım!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {quickPrompts.map((prompt, index) => (
                  <Card
                    key={index}
                    className="p-4 bg-white/5 border-gray-700 hover:bg-white/10 cursor-pointer transition-colors"
                    onClick={() => setInputValue(prompt)}
                  >
                    <p className="text-gray-300 text-sm">{prompt}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="mb-6">
              <div
                className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`max-w-2xl ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-2xl p-4 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white ml-12'
                        : 'bg-gray-800/50 text-gray-100'
                    }`}
                  >
                    {message.files && message.files.length > 0 && (
                      <div className="mb-3 flex gap-2">
                        {message.files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm bg-black/20 rounded-lg p-2"
                          >
                            {file.type.startsWith('image/') ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            <span>{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {message.type === 'ai' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyMessage(message.content)}
                            className="opacity-70 hover:opacity-100 p-1 h-auto"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-70 hover:opacity-100 p-1 h-auto"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">
                      {user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'O'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {(isLoading || isProcessingDocument) && (
            <div className="mb-6">
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-800/50 rounded-2xl p-4 max-w-2xl">
                  <div className="flex items-center gap-2 text-gray-300">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                    <span className="text-sm">
                      {isProcessingDocument ? 'PDF işleniyor...' : 'AI düşünüyor...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800">
        <div className="max-w-4xl mx-auto p-4">
          {attachedFiles.length > 0 && (
            <div className="mb-4 flex gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 text-sm text-gray-300"
                >
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span className="max-w-32 truncate">{file.name}</span>
                  <button
                    onClick={() => removeAttachedFile(index)}
                    className="text-red-400 hover:text-red-300 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('📸 Image button clicked');
                  imageInputRef.current?.click();
                }}
                className="text-gray-400 hover:text-white h-12 w-12 p-0"
                title="Resim ekle"
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('📎 File button clicked');
                  fileInputRef.current?.click();
                }}
                className="text-gray-400 hover:text-white h-12 w-12 p-0"
                title="Dosya ekle"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Sarai AI'ya soru sor... (Enter ile gönder)"
                className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 pr-12 resize-none min-h-[48px] max-h-32 border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none placeholder-gray-400"
                rows={1}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={
                  (!inputValue.trim() && attachedFiles.length === 0) ||
                  isLoading ||
                  isProcessingDocument
                }
                className="absolute right-2 bottom-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed h-8 w-8 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            AI yanıtları hata içerebilir. Önemli konularda doğrulama yapın.
          </p>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          console.log('📸 Image files selected:', e.target.files?.length);
          if (e.target.files) {
            handleFileSelect(e.target.files);
          }
        }}
        className="sr-only"
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
        onChange={(e) => {
          console.log('📎 Document files selected:', e.target.files?.length);
          if (e.target.files) {
            handleFileSelect(e.target.files);
          }
        }}
        className="sr-only"
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
