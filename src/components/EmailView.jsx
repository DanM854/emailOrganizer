// components/EmailView.jsx - Full email view component
import React from 'react';
import './EmailView.css';

function EmailView({ email, onClose }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="email-view-overlay">
      <div className="email-view">
        <div className="email-view-header">
          <h2>{email.subject || '(No Subject)'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="email-view-metadata">
          <div className="email-view-from">
            <strong>From:</strong> {email.from}
          </div>
          <div className="email-view-to">
            <strong>To:</strong> {email.to}
          </div>
          <div className="email-view-date">
            <strong>Date:</strong> {formatDate(email.date)}
          </div>
        </div>
        
        <div 
          className="email-view-body"
          dangerouslySetInnerHTML={{ __html: email.bodyHtml || email.bodyText }}
        />
      </div>
    </div>
  );
}

export default EmailView;