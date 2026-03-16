import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function ChatPanel({ documentText }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hi! I've analyzed your document. Ask me anything about it!" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const chatHistory = messages.slice(1).concat(userMsg);
            console.log("Sending chat request...", { messages: chatHistory, textLength: documentText?.length });
            const res = await axios.post('http://localhost:5000/chat', {
                documentText,
                messages: chatHistory
            });

            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            console.error("Chat API Error:", err.response?.data || err.message);
            const status = err.response?.status;
            const msg = err.response?.data?.error || "Is the backend running?";
            setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I ran into an error (${status || 'Network'}): ${msg}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <header style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="#7c3aed" />
                    <h3 style={titleStyle}>Document AI</h3>
                </div>
            </header>

            <div style={chatBodyStyle} ref={scrollRef}>
                {messages.map((msg, i) => (
                    <div key={i} style={msgWrapperStyle(msg.role === 'user')}>
                        <div style={avatarStyle(msg.role === 'user')}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div style={bubbleStyle(msg.role === 'user')}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div style={msgWrapperStyle(false)}>
                        <div style={avatarStyle(false)}><Bot size={14} /></div>
                        <div style={{ ...bubbleStyle(false), display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Loader2 size={14} className="animate-spin" />
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            <div style={inputAreaStyle}>
                <div style={inputWrapperStyle}>
                    <input
                        type="text"
                        placeholder="Ask a question..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        style={inputStyle}
                    />
                    <button onClick={handleSend} style={sendBtnStyle} disabled={!input.trim() || loading}>
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

const containerStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-primary)',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid var(--border-glass)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
};

const headerStyle = {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-glass)',
    background: 'var(--bg-glass)'
};

const titleStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0
};

const chatBodyStyle = {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
};

const msgWrapperStyle = (isUser) => ({
    display: 'flex',
    flexDirection: isUser ? 'row-reverse' : 'row',
    gap: '10px',
    alignItems: 'flex-start',
    animation: 'fade-in 0.3s ease-out'
});

const avatarStyle = (isUser) => ({
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: isUser ? 'var(--text-primary)' : 'var(--bg-glass)',
    color: isUser ? 'var(--bg-primary)' : 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
});

const bubbleStyle = (isUser) => ({
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
    background: isUser ? 'var(--text-primary)' : 'var(--bg-glass)',
    color: isUser ? 'var(--bg-primary)' : 'var(--text-primary)',
    fontSize: '14px',
    lineHeight: '1.5',
    boxShadow: isUser ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
    border: isUser ? 'none' : '1px solid var(--border-glass)'
});

const inputAreaStyle = {
    padding: '16px',
    borderTop: '1px solid var(--border-glass)',
    background: 'var(--bg-primary)'
};

const inputWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-glass)',
    borderRadius: '12px',
    padding: '4px 4px 4px 12px',
    transition: 'all 0.2s'
};

const inputStyle = {
    flex: 1,
    border: 'none',
    background: 'none',
    outline: 'none',
    fontSize: '14px',
    color: 'var(--text-primary)',
    padding: '8px 0'
};

const sendBtnStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'var(--text-primary)',
    color: 'var(--bg-primary)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    opacity: 0.9
};
