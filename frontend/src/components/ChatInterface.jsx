import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import { sendMessage } from '../services/api';
import './ChatInterface.css';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const exampleQueries = [
    { icon: '👥', text: 'What are the 10 most populous states?', tag: 'Population' },
    { icon: '💵', text: 'Which states have the highest median household income?', tag: 'Income' },
    { icon: '🎓', text: 'Which states have the most college graduates?', tag: 'Education' },
    { icon: '🏘️', text: 'Compare homeownership rates between states', tag: 'Housing' },
    { icon: '📉', text: 'Which states have the highest poverty rates?', tag: 'Poverty' },
    { icon: '🌎', text: 'What is the racial composition of California?', tag: 'Demographics' },
  ];

  const handleExampleClick = (query) => {
    setInput(query);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage, timestamp: new Date() }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const conversationHistory = newMessages
        .slice(-5)
        .map(msg => ({ role: msg.role, content: msg.content }));

      const response = await sendMessage(userMessage, conversationHistory);

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: response.response,
          sources: response.sources || [],
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error connecting to the database. Please try again.',
          sources: [],
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="site-header">
        <div className="header-left">
          <div className="logo-mark">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="12" height="12" fill="#F5A623" rx="1"/>
              <rect x="16" width="12" height="12" fill="#F5A623" rx="1" opacity="0.6"/>
              <rect y="16" width="12" height="12" fill="#F5A623" rx="1" opacity="0.6"/>
              <rect x="16" y="16" width="12" height="12" fill="#F5A623" rx="1" opacity="0.3"/>
            </svg>
          </div>
          <div>
            <div className="site-title">US Census Intelligence</div>
            <div className="site-subtitle">2019 American Community Survey · Powered by Snowflake</div>
          </div>
        </div>
        <div className="header-right">
          <span className="live-badge">
            <span className="live-dot"></span>
            Live Data
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content">
        {isEmpty ? (
          <div className="welcome-screen">
            <div className="welcome-hero">
              <div className="hero-eyebrow">Census Block Group Data · 330M+ Americans</div>
              <h1 className="hero-headline">
                Ask anything about<br />
                <span className="headline-accent">the US Population</span>
              </h1>
              <p className="hero-desc">
                Explore demographics, income, housing, education, and more across all 50 states — answered in seconds using real Census data.
              </p>
            </div>

            <div className="example-grid">
              <div className="example-grid-label">Try asking —</div>
              <div className="example-cards">
                {exampleQueries.map((ex, i) => (
                  <button
                    key={i}
                    className="example-card"
                    onClick={() => handleExampleClick(ex.text)}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <span className="example-tag">{ex.tag}</span>
                    <span className="example-icon">{ex.icon}</span>
                    <span className="example-text">{ex.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="data-stats">
              <div className="stat-item">
                <div className="stat-num">32</div>
                <div className="stat-label">Data Tables</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-num">8,328</div>
                <div className="stat-label">Data Columns</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-num">220K+</div>
                <div className="stat-label">Census Block Groups</div>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <div className="stat-num">2019</div>
                <div className="stat-label">ACS Survey Year</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="messages-panel">
            {messages.map((msg, i) => (
              <Message key={i} message={msg} />
            ))}
            {isLoading && (
              <div className="thinking-row">
                <div className="agent-avatar">AI</div>
                <div className="thinking-bubble">
                  <span className="thinking-label">Querying Snowflake</span>
                  <div className="thinking-dots">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input area */}
      <div className="input-zone">
        {!isEmpty && (
          <div className="quick-chips">
            {exampleQueries.slice(0, 3).map((ex, i) => (
              <button
                key={i}
                className="quick-chip"
                onClick={() => handleExampleClick(ex.text)}
                disabled={isLoading}
              >
                {ex.icon} {ex.text}
              </button>
            ))}
          </div>
        )}
        <div className="input-row">
          <div className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about US population, income, housing, education..."
              className="chat-input"
              disabled={isLoading}
              autoFocus
            />
            <button
              className={`send-btn ${input.trim() ? 'active' : ''}`}
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <span className="btn-spinner" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1L17 9L9 17M17 9H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <div className="input-hint">Press Enter to send</div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
