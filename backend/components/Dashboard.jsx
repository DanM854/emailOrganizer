import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmailView from './EmailView';
import SendEmail from './SendEmail';
import '../styles/Dashboard.css';

function Dashboard() {
  const {
    isSignedIn,
    user,
    accessToken,
    error,
    loading,
    labels,
    emails,
    handleGetGmailAccess,
    fetchGmailMessages,
    renderSignInButton,
    handleSignOut,
    translateLabelName,
    addEmailToKanban,
    setError
  } = useAuth();
  
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [emailToSend, setEmailToSend] = useState(null);
  const [allEmails, setAllEmails] = useState([]);
  
  const navigate = useNavigate();

  // Renderizar el botón de inicio de sesión cuando esté disponible
  useEffect(() => {
    if (!loading && !isSignedIn && !error) {
      setTimeout(() => {
        renderSignInButton('google-signin-button');
      }, 1000);
    }
  }, [loading, isSignedIn, error, renderSignInButton]);

  // Al obtener acceso, guardar todos los correos
  useEffect(() => {
    if (emails.length > 0 && selectedLabel === null) {
      setAllEmails(emails);
    }
  }, [emails, selectedLabel]);

  // Cambiar etiqueta seleccionada
  const handleLabelChange = (labelId) => {
    if (selectedLabel === labelId) {
      setSelectedLabel(null);
      setEmailsLoading(true);
      fetchGmailMessages('INBOX').finally(() => {
        setEmailsLoading(false);
      });
    } else {
      setSelectedLabel(labelId);
      setEmailsLoading(true);
      fetchGmailMessages(labelId).finally(() => {
        setEmailsLoading(false);
      });
    }
  };

  // Quitar selección de etiqueta
  const handleRemoveFilter = () => {
    setSelectedLabel(null);
    setEmailsLoading(true);
    fetchGmailMessages('INBOX').finally(() => {
      setEmailsLoading(false);
    });
  };

  // Ver detalles del correo
  const handleEmailClick = (email) => {
    setSelectedEmail(email);
  };

  // Cerrar vista de correo
  const handleCloseEmail = () => {
    setSelectedEmail(null);
  };

  // Añadir al tablero Kanban
  const handleAddToKanban = (email) => {
    addEmailToKanban(email);
    setError(null);
    navigate('/kanban');
  };

  // Manejar respuesta a correo
  const handleReply = (replyData) => {
    setSelectedEmail(null);
    setEmailToSend({
      initialData: replyData,
      threadId: selectedEmail?.threadId
    });
    setShowSendEmail(true);
  };

  return (
    <div className="dashboard-container">
      <header className="app-header">
        <h1>Gmail Dashboard</h1>
        
        {isSignedIn && (
          <div className="nav-links">
            <Link to="/" className="nav-link active">Bandeja de entrada</Link>
            <Link to="/kanban" className="nav-link">Tablero Kanban</Link>
            <button 
              onClick={() => {
                setShowSendEmail(true);
                setEmailToSend(null);
              }}
              className="nav-link send-email-button"
            >
              Nuevo Correo
            </button>
          </div>
        )}
      </header>

      <main className="app-content">
        {error && (
          <div className="error-message">
            <h3>Error:</h3>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="retry-button"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="loading">
            <p>Cargando la aplicación...</p>
          </div>
        )}

        {!loading && !error && !isSignedIn && (
          <div className="signin-container">
            <p>Por favor, inicia sesión con Google para ver tus correos de Gmail</p>
            <div id="google-signin-button"></div>
          </div>
        )}

        {!loading && !error && isSignedIn && user && (
          <div className="dashboard">
            <div className="user-profile">
              <img 
                src={user.picture} 
                alt="Foto de perfil" 
                className="profile-picture" 
              />
              <div className="user-info">
                <h2>¡Bienvenido, {user.name}!</h2>
                <p>{user.email}</p>
              </div>
            </div>
            
            {!accessToken ? (
              <button onClick={handleGetGmailAccess} className="gmail-button">
                Acceder a mis correos de Gmail
              </button>
            ) : (
              <div className="email-container">
                <div className="labels-container">
                  <div className="labels-header">
                    <h3>Etiquetas</h3>
                    {selectedLabel && (
                      <button 
                        className="remove-filter-button"
                        onClick={handleRemoveFilter}
                      >
                        Quitar filtro
                      </button>
                    )}
                  </div>
                  <div className="labels-list">
                    {labels.map(label => (
                      <button
                        key={label.id}
                        className={`label-button ${selectedLabel === label.id ? 'active' : ''}`}
                        onClick={() => handleLabelChange(label.id)}
                      >
                        {translateLabelName(label.name)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="emails-header">
                  <h3>
                    {selectedLabel 
                      ? `Correos de ${translateLabelName(labels.find(l => l.id === selectedLabel)?.name || selectedLabel)}`
                      : 'Todos los correos'
                    }
                  </h3>
                </div>
                
                {emailsLoading ? (
                  <p>Cargando correos...</p>
                ) : emails.length === 0 ? (
                  <p>No se encontraron correos en esta etiqueta</p>
                ) : (
                  <div className="emails-list">
                    {emails.map(email => (
                      <div key={email.id} className="email-card">
                        <div className="email-header">
                          <h4 className="email-subject">{email.subject}</h4>
                          <span className="email-date">{email.date}</span>
                        </div>
                        <div className="email-sender">{email.from}</div>
                        <div className="email-snippet">{email.snippet}</div>
                        <div className="email-actions">
                          <button 
                            className="email-action-button view" 
                            onClick={() => handleEmailClick(email)}
                          >
                            Ver
                          </button>
                          <button 
                            className="email-action-button add-to-kanban"
                            onClick={() => handleAddToKanban(email)}
                          >
                            Añadir al Kanban
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <button onClick={handleSignOut} className="signout-button">
              Cerrar sesión
            </button>
          </div>
        )}

        {selectedEmail && (
          <EmailView 
            email={selectedEmail} 
            onClose={handleCloseEmail}
            onReply={handleReply}
          />
        )}

        {showSendEmail && (
          <SendEmail
            {...emailToSend}
            onClose={() => {
              setShowSendEmail(false);
              setEmailToSend(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default Dashboard;