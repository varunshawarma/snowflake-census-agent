import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Message.css';

function Message({ message }) {
  const isUser = message.role === 'user';

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className={`msg-row ${isUser ? 'user' : 'assistant'}`}>
      <div className="msg-avatar">
        {isUser ? 'You' : 'AI'}
      </div>
      <div className="msg-body">
        <div className="msg-meta">
          <span className="msg-name">{isUser ? 'You' : 'Census Agent'}</span>
          <span className="msg-time">{formatTime(message.timestamp)}</span>
        </div>
        <div className={`msg-bubble ${isUser ? 'user' : 'assistant'}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default Message;
