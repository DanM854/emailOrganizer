import React from 'react';
import './EmailView.css';

function EmailView({ email, onClose, onReply, onAddToKanban }) {
  /**
   * Formatea una fecha recibida de la API de Gmail
   * @param {string} dateString - Fecha en formato RFC 2822 o ISO 8601
   * @returns {string} Fecha formateada
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';

    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida recibida:', dateString);
        return 'Fecha inválida';
      }

      return date.toLocaleString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };

  /**
   * Extrae la dirección de email del campo "From"
   * @param {string} from - Cadena con formato "Nombre <email@dominio.com>"
   * @returns {string} Dirección de email
   */
  const extractEmail = (from) => {
    if (!from) return '';
    const match = from.match(/<([^>]+)>/);
    return match ? match[1] : from;
  };

  /**
   * Maneja el evento de responder al correo
   */
  const handleReply = () => {
    if (!email || !onReply) return;
    
    const replyData = {
      to: extractEmail(email.from),
      subject: email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || '(Sin asunto)'}`,
      body: `\n\n-------- Mensaje original --------\n` +
            `De: ${email.from || 'Desconocido'}\n` +
            `Fecha: ${formatDate(email.date)}\n` +
            `Asunto: ${email.subject || '(Sin asunto)'}\n\n` +
            `${email.body || email.snippet || 'No hay contenido disponible'}`
    };
    
    onReply(replyData);
  };

  /**
   * Maneja el evento de añadir al Kanban
   */
  const handleAddToKanban = () => {
    if (!email || !onAddToKanban) return;
    onAddToKanban(email);
  };

  // Si no hay email seleccionado
  if (!email) {
    return (
      <div className="email-view-overlay">
        <div className="email-view">
          <div className="email-view-header">
            <h2>No hay correo seleccionado</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="email-view-body">
            <p>Selecciona un correo para ver su contenido</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="email-view-overlay">
      <div className="email-view">
        <div className="email-view-header">
          <h2>{email.subject || '(Sin asunto)'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="email-view-metadata">
          <div className="email-view-from">
            <strong>De:</strong> {email.from || 'Desconocido'}
          </div>
          <div className="email-view-to">
            <strong>Para:</strong> {email.to || 'No especificado'}
          </div>
          <div className="email-view-date">
            <strong>Fecha:</strong> {formatDate(email.date)}
          </div>
        </div>
        
        <div className="email-view-body">
          {email.bodyHtml ? (
            <div 
              className="email-html-content" 
              dangerouslySetInnerHTML={{ __html: email.bodyHtml }} 
            />
          ) : (
            <pre className="email-text-content">
              {email.body || email.snippet || 'No hay contenido disponible'}
            </pre>
          )}
        </div>
        
        <div className="email-view-actions">
          <button 
            className="email-action-button reply"
            onClick={handleReply}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 9V5L3 12L10 19V14.9C15 14.9 18.5 16.5 21 20C20 15 17 10 10 9Z" fill="currentColor"/>
            </svg>
            Responder
          </button>
          <button 
            className="email-action-button add-to-kanban"
            onClick={handleAddToKanban}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
            </svg>
            Añadir al Kanban
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailView;