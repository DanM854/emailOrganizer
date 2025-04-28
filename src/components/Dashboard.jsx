// src/components/Dashboard.js - Componente para la vista principal
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  
  const [selectedLabel, setSelectedLabel] = useState('INBOX');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailsLoading, setEmailsLoading] = useState(false);
  
  const navigate = useNavigate();

  // Renderizar el botón de inicio de sesión cuando esté disponible
  useEffect(() => {
    if (!loading && !isSignedIn && !error) {
      setTimeout(() => {
        renderSignInButton('google-signin-button');
      }, 1000);
    }
  }, [loading, isSignedIn, error, renderSignInButton]);

  // Cambiar etiqueta seleccionada
  const handleLabelChange = (labelId) => {
    setSelectedLabel(labelId);
    setEmailsLoading(true);
    fetchGmailMessages(labelId).finally(() => {
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

  return (
    <div className="dashboard-container">
      <header className="app-header">
        <h1>Gmail Dashboard</h1>
        
        {isSignedIn && (
          <div className="nav-links">
            <Link to="/" className="nav-link active">Bandeja de entrada</Link>
            <Link to="/kanban" className="nav-link">Tablero Kanban</Link>
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
                  <h3>Etiquetas</h3>
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
                
                <h3>Correos de {translateLabelName(labels.find(l => l.id === selectedLabel)?.name || selectedLabel)}</h3>
                
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
          <div className="email-view-overlay">
            <div className="email-view">
              <div className="email-view-header">
                <h2>{selectedEmail.subject}</h2>
                <div className="email-view-actions">
                  <button 
                    className="email-action-button add-to-kanban"
                    onClick={() => {
                      handleAddToKanban(selectedEmail);
                      handleCloseEmail();
                    }}
                  >
                    Añadir al Kanban
                  </button>
                  <button className="close-button" onClick={handleCloseEmail}>×</button>
                </div>
              </div>
              
              <div className="email-view-metadata">
                <div className="email-view-from">
                  <strong>De:</strong> {selectedEmail.from}
                </div>
                <div className="email-view-date">
                  <strong>Fecha:</strong> {selectedEmail.date}
                </div>
                <div className="email-view-labels">
                  <strong>Etiquetas:</strong> {selectedEmail.labelIds.map(id => {
                    const label = labels.find(l => l.id === id);
                    return label ? translateLabelName(label.name) : id;
                  }).join(', ')}
                </div>
              </div>
              
              <div className="email-view-body">
                {selectedEmail.body.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;