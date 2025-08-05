import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Message, Role } from './types';
import { sendMessageStream } from './services/geminiService';
import { SendIcon, BotIcon } from './components/icons';

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isBot = message.role === Role.BOT;
  return (
    <div className={`flex items-start gap-3 my-4 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && <BotIcon className="h-8 w-8 text-indigo-400 flex-shrink-0" />}
      <div
        className={`px-4 py-3 rounded-2xl max-w-lg break-words ${
          isBot
            ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
            : 'bg-indigo-500 text-white rounded-br-none'
        }`}
      >
        <p className="text-base whitespace-pre-wrap">{message.text}</p>
        <p className="text-xs mt-1 opacity-60 text-right">{message.timestamp}</p>
      </div>
    </div>
  );
};

const TypingIndicator: React.FC = () => (
    <div className="flex items-start gap-3 my-4 justify-start">
        <BotIcon className="h-8 w-8 text-indigo-400 flex-shrink-0" />
        <div className="px-4 py-3 rounded-2xl bg-white dark:bg-gray-700 rounded-tl-none flex items-center space-x-1">
            <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce"></span>
        </div>
    </div>
);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping]);

  useEffect(() => {
    const fetchInitialMessage = async () => {
        setIsBotTyping(true);
        const botMessageId = `bot-initial-${Date.now()}`;
        
        try {
            const stream = await sendMessageStream("Hello");
            let isFirstChunk = true;

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (isFirstChunk) {
                    setIsBotTyping(false);
                    isFirstChunk = false;
                    const newMessage: Message = {
                        id: botMessageId,
                        role: Role.BOT,
                        text: chunkText ?? "",
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    };
                    setMessages([newMessage]);
                } else {
                      setMessages(prev =>
                        prev.map(msg =>
                            msg.id === botMessageId ? { ...msg, text: msg.text + chunkText } : msg
                        )
                    );
                }
            }
            if (isFirstChunk) { // Handle cases with no response
                setIsBotTyping(false);
            }
        } catch (error) {
            console.error("Failed to fetch initial message:", error);
            setIsBotTyping(false);
            const errorMessage: Message = {
                id: botMessageId,
                role: Role.BOT,
                text: "I'm having a little trouble connecting right now. Please try again later.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages([errorMessage]);
        }
    };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchInitialMessage();
  }, []);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isBotTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: Role.USER,
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsBotTyping(true);
    const currentInput = input;
    setInput('');

    try {
        const stream = await sendMessageStream(currentInput);
        const botMessageId = `bot-${Date.now()}`;
        let isFirstChunk = true;

        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (isFirstChunk) {
                setIsBotTyping(false);
                isFirstChunk = false;
                const botMessage: Message = {
                    id: botMessageId,
                    role: Role.BOT,
                    text: chunkText ?? "",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                setMessages(prev => [...prev, botMessage]);
            } else {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === botMessageId ? { ...msg, text: msg.text + chunkText } : msg
                    )
                );
            }
        }
          if (isFirstChunk) { // Handle cases with no response
            setIsBotTyping(false);
        }

    } catch (error) {
        console.error("Error sending message:", error);
        setIsBotTyping(false);
        const errorMessage: Message = {
            id: `bot-error-${Date.now()}`,
            role: Role.BOT,
            text: "I'm sorry, I encountered an error. Could you please try rephrasing?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <header className="bg-white dark:bg-gray-800/50 backdrop-blur-sm shadow-sm p-4 text-center border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Zenith</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your AI Mental Wellness Companion</p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
            ))}
            {isBotTyping && <TypingIndicator />}
            <div ref={chatEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How are you feeling today?"
              disabled={isBotTyping}
              className="flex-1 p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
            />
            <button
              type="submit"
              disabled={isBotTyping || !input.trim()}
              className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Send message"
            >
              <SendIcon className="h-6 w-6" />
            </button>
          </form>
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3 px-4">
            Zenith is an AI companion and not a substitute for professional help. If you are in crisis, please contact emergency services.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
