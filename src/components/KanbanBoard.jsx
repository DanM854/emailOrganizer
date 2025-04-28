// src/components/KanbanBoard.js - Componente completo para el tablero Kanban
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/KanbanBoard.css';

function KanbanBoard() {
  const {
    isSignedIn,
    user,
    accessToken,
    loading,
    error,
    kanbanColumns,
    moveEmailToColumn,
    removeEmailFromKanban,
    createKanbanColumn,
    deleteKanbanColumn,
    handleGetGmailAccess,
    renderSignInButton,
    handleSignOut
  } = useAuth();

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [draggedEmail, setDraggedEmail] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);

  // Mostrar detalles del correo
  const handleEmailClick = (email) => {
    setSelectedEmail(email);
  };

  // Cerrar detalles del correo
  const handleCloseEmail = () => {
    setSelectedEmail(null);
  };

  // Manejar inicio de arrastre
  const handleDragStart = (email, columnId) => {
    setDraggedEmail(email);
    setDraggedColumn(columnId);
  };

  // Manejar soltar email en una columna
  const handleDrop = (targetColumnId) => {
    if (draggedEmail && draggedColumn && draggedColumn !== targetColumnId) {
      moveEmailToColumn(draggedEmail.id, draggedColumn, targetColumnId);
    }
    setDraggedEmail(null);
    setDraggedColumn(null);
  };

  // Permitir soltar
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Crear nueva columna
  const handleCreateColumn = () => {
    if (newColumnName.trim()) {
      const columnId = newColumnName.toLowerCase().replace(/\s+/g, '-');
      createKanbanColumn(columnId, newColumnName);
      setNewColumnName('');
    }
  };

  // Renderizar el botón de inicio de sesión cuando esté disponible
  useEffect(() => {
    if (!loading && !isSignedIn && !error) {
      setTimeout(() => {
        renderSignInButton('kanban-signin-button');
      }, 1000);
    }
  }, [loading, isSignedIn, error, renderSignInButton]);

  return (
    <div className="kanban-container">
      <header className="app-header">
        <h1>Tablero Kanban de Gmail</h1>
        
        {isSignedIn && (
          <div className="nav-links">
            <Link to="/" className="nav-link">Bandeja de entrada</Link>
            <Link to="/kanban" className="nav-link active">Tablero Kanban</Link>
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
            <p>Por favor, inicia sesión con Google para ver tu tablero Kanban</p>
            <div id="kanban-signin-button"></div>
          </div>
        )}

        {!loading && !error && isSignedIn && user && (
          <>
            {!accessToken ? (
              <div className="center-content">
                <p>Necesitas acceder a Gmail para usar el tablero Kanban</p>
                <button onClick={handleGetGmailAccess} className="gmail-button">
                  Acceder a mis correos de Gmail
                </button>
              </div>
            ) : (
              <div className="kanban-board">
                <div className="kanban-header">
                  <div className="user-profile-mini">
                    <img 
                      src={user.picture} 
                      alt="Foto de perfil" 
                      className="profile-picture-small" 
                    />
                    <span>{user.name}</span>
                  </div>

                  <div className="new-column-form">
                    <input
                      type="text"
                      placeholder="Nueva columna..."
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      className="new-column-input"
                    />
                    <button 
                      onClick={handleCreateColumn}
                      className="create-column-button"
                      disabled={!newColumnName.trim()}
                    >
                      Crear columna
                    </button>
                  </div>

                  <button onClick={handleSignOut} className="signout-button-mini">
                    Cerrar sesión
                  </button>
                </div>

                <div className="kanban-columns">
                  {Object.entries(kanbanColumns).map(([columnId, column]) => (
                    <div 
                      key={columnId}
                      className="kanban-column"
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(columnId)}
                    >
                      <div className="column-header">
                        <h3>{column.title}</h3>
                        {!['porHacer', 'enProceso', 'completado'].includes(columnId) && (
                          <button 
                            onClick={() => deleteKanbanColumn(columnId)}
                            className="delete-column-button"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      
                      <div className="email-cards">
                        {column.emails.length === 0 ? (
                          <p className="empty-column">No hay correos en esta columna</p>
                        ) : (
                          column.emails.map(email => (
                            <div 
                              key={email.id} 
                              className="kanban-card"
                              draggable
                              onDragStart={() => handleDragStart(email, columnId)}
                            >
                              <div className="card-header">
                                <h4 className="card-subject">{email.subject}</h4>
                                <button 
                                  className="remove-card-button"
                                  onClick={() => removeEmailFromKanban(email.id)}
                                >
                                  ×
                                </button>
                              </div>
                              <div className="card-sender">{email.from}</div>
                              <div className="card-date">{email.date}</div>
                              <div className="card-snippet">{email.snippet}</div>
                              <button 
                                className="view-email-button"
                                onClick={() => handleEmailClick(email)}
                              >
                                Ver correo
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {selectedEmail && (
          <div className="email-view-overlay">
            <div className="email-view">
              <div className="email-view-header">
                <h2>{selectedEmail.subject}</h2>
                <button className="close-button" onClick={handleCloseEmail}>×</button>
              </div>
              
              <div className="email-view-metadata">
                <div className="email-view-from">
                  <strong>De:</strong> {selectedEmail.from}
                </div>
                <div className="email-view-date">
                  <strong>Fecha:</strong> {selectedEmail.date}
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

export default KanbanBoard;