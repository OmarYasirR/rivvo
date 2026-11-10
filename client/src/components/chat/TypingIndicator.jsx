import React from 'react';

const TypingIndicator = () => (
  <div className="typing-indicator">
    <span></span><span></span><span></span>
    <style>{`
      .typing-indicator { display: flex; gap: 4px; padding: 8px; }
      .typing-indicator span {
        width: 6px; height: 6px; border-radius: 50%; background: #8B5CF6;
        animation: bounce 1.2s infinite;
      }
      .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
      .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
    `}</style>
  </div>
);

export default TypingIndicator;
