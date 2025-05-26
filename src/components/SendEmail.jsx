import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './SendEmail.css';

const SendEmail = ({ initialData, onClose, threadId }) => {
  const { accessToken, user } = useAuth();
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  // Inicializar con datos para respuesta
  useEffect(() => {
    if (initialData) {
      setEmailData(initialData);
    } else {
      // Para nuevo correo, mostrar el email del usuario como remitente
      setEmailData(prev => ({ ...prev, from: user?.email || '' }));
    }
  }, [initialData, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setError('');
    
    try {
      const message = [
        `To: ${emailData.to}`,
        `Subject: ${emailData.subject}`,
        `From: ${user.email}`,
        threadId ? `References: ${threadId}` : '',
        '',
        emailData.body
      ].filter(line => line !== '').join('\r\n');

      const response = await fetch(
        'https://www.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            raw: btoa(message)
              .replace(/\+/g, '-')
              .replace(/\//g, '_'),
            ...(threadId && { threadId })
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error al enviar el correo');
      }

      alert('Correo enviado con éxito');
      if (onClose) onClose();
    } catch (err) {
      setError(err.message);
      console.error('Error sending email:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="send-email-overlay">
      <div className="send-email-container">
        <div className="send-email-header">
          <h2>{initialData ? 'Responder Correo' : 'Nuevo Correo'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>De:</label>
            <input
              type="text"
              value={user?.email || ''}
              readOnly
              className="read-only-input"
            />
          </div>
          
          <div className="form-group">
            <label>Para:</label>
            <input
              type="email"
              name="to"
              value={emailData.to}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Asunto:</label>
            <input
              type="text"
              name="subject"
              value={emailData.subject}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Mensaje:</label>
            <textarea
              name="body"
              value={emailData.body}
              onChange={handleChange}
              required
              rows="10"
            />
          </div>
          
          <div className="send-email-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isSending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="send-button"
              disabled={isSending}
            >
              {isSending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendEmail;