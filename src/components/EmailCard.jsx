import React from 'react';
import './EmailCard.css';

function EmailCard({ email, onClick }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="email-card" onClick={onClick}>
      <div className="email-header">
        <h3 className="email-subject">{email.subject || '(No Subject)'}</h3>
        <span className="email-date">{formatDate(email.date)}</span>
      </div>
      <div className="email-sender">{email.from}</div>
      <div className="email-snippet">{email.snippet}</div>
    </div>
  );
}

export default EmailCard;

