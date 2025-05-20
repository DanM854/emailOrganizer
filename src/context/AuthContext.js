import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState([]);
  const [emails, setEmails] = useState([]);
  const [kanbanColumns, setKanbanColumns] = useState({
    porHacer: { title: 'Por hacer', emails: [] },
    enProceso: { title: 'En proceso', emails: [] },
    completado: { title: 'Completado', emails: [] },
  });

  // Cargar el script de Google Identity Services
  useEffect(() => {
    const loadGoogleScript = () => {
      console.log('Cargando Google Identity Services...');
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = 'google-gsi';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Identity Services cargado correctamente');
        // También cargar la biblioteca de API de Google
        loadGapiScript();
      };
      
      script.onerror = (e) => {
        console.error('Error al cargar Google Identity Services:', e);
        setError('No se pudo cargar la API de Google. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      };
      
      document.body.appendChild(script);
    };

    // Cargar la biblioteca de Google API
    const loadGapiScript = () => {
      console.log('Cargando Google API Client...');
      
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.id = 'google-api';
      
      script.onload = () => {
        console.log('Google API Client cargado correctamente');
        initializeGoogleAuth();
      };
      
      script.onerror = (e) => {
        console.error('Error al cargar Google API Client:', e);
        setError('No se pudo cargar la API de Google. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      };
      
      document.body.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  // Inicializar la autenticación de Google
  const initializeGoogleAuth = () => {
    if (!window.google || !window.google.accounts) {
      setError('Google Identity Services no está disponible');
      setLoading(false);
      return;
    }

    console.log('Inicializando Google Identity Services...');
    
    try {
      // Inicializar la API de Google (gapi)
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: 'AIzaSyB6BPedeA_xrO2GpaYYZUPslVF5SkNyKNg',
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest']
          });
          console.log('Google API Client inicializado correctamente');
          
          // Ahora inicializar Google Identity Services
          window.google.accounts.id.initialize({
            client_id: '22260196508-asg31vdoanf2j3q9797sce0pqj6dvl0g.apps.googleusercontent.com',
            callback: handleGoogleCallback,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          
          setLoading(false);
        } catch (error) {
          console.error('Error al inicializar Google API Client:', error);
          setError(`Error al inicializar: ${error.message || 'Error desconocido'}`);
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Error al cargar GAPI client:', error);
      setError(`Error al inicializar la autenticación: ${error.message || 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Manejar la respuesta de autenticación de Google
  const handleGoogleCallback = (response) => {
    console.log('Respuesta de Google Identity Services recibida');
    
    if (response.credential) {
      // Decodificar el token JWT para obtener la información del usuario
      const decodedToken = parseJwt(response.credential);
      
      setUser(decodedToken);
      setIsSignedIn(true);
      
      console.log('Usuario autenticado correctamente:', decodedToken);
    } else {
      setIsSignedIn(false);
      setUser(null);
      setError('No se pudo obtener las credenciales del usuario');
    }
  };

  // Función auxiliar para decodificar el token JWT
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error al analizar el token JWT:', error);
      return null;
    }
  };

  // Solicitar acceso a Gmail
  const handleGetGmailAccess = () => {
    setLoading(true);
    
    window.google.accounts.oauth2.initTokenClient({
      client_id: '22260196508-asg31vdoanf2j3q9797sce0pqj6dvl0g.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify',
      prompt: 'consent',
      callback: (tokenResponse) => {
        console.log('Token de acceso obtenido correctamente');
        
        if (tokenResponse && tokenResponse.access_token) {
          setAccessToken(tokenResponse.access_token);
          
          // Establecer el token en el cliente gapi para hacer solicitudes a Gmail
          window.gapi.client.setToken({
            access_token: tokenResponse.access_token
          });
          
          // Obtener las etiquetas de Gmail primero
          fetchGmailLabels();
        } else {
          setLoading(false);
          setError('No se pudo obtener el token de acceso para Gmail');
        }
      },
      error_callback: (error) => {
        console.error('Error al obtener token:', error);
        setLoading(false);
        setError(`Error al obtener acceso a Gmail: ${error.message || 'Error desconocido'}`);
      }
    }).requestAccessToken();
  };

  // Obtener etiquetas de Gmail
  const fetchGmailLabels = async () => {
    try {
      console.log('Obteniendo etiquetas de Gmail...');
      
      const response = await window.gapi.client.gmail.users.labels.list({
        userId: 'me'
      });
      
      const labelsData = response.result.labels || [];
      setLabels(labelsData);
      
      console.log('Etiquetas de Gmail obtenidas:', labelsData);
      
      // Después de obtener las etiquetas, obtener mensajes de la bandeja de entrada
      fetchGmailMessages('INBOX');
    } catch (error) {
      console.error('Error al obtener etiquetas de Gmail:', error);
      setLoading(false);
      setError(`Error al obtener etiquetas: ${error.message || 'Error desconocido'}`);
    }
  };

  // Obtener mensajes de Gmail por etiqueta
  const fetchGmailMessages = async (labelId = 'INBOX') => {
    try {
      console.log(`Obteniendo mensajes de Gmail con etiqueta: ${labelId}`);
      setLoading(true);
      
      const response = await window.gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults: 20,
        labelIds: [labelId]
      });
      
      const messages = response.result.messages || [];
      
      // Si no hay mensajes
      if (messages.length === 0) {
        setEmails([]);
        setLoading(false);
        return;
      }
      
      // Obtener detalles de cada mensaje
      const messageDetailsPromises = messages.map(async (message) => {
        const detailResponse = await window.gapi.client.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
        
        return processEmailMessage(detailResponse.result);
      });
      
      const emailDetails = await Promise.all(messageDetailsPromises);
      setEmails(emailDetails);
      setLoading(false);
      
      console.log('Mensajes de Gmail obtenidos:', emailDetails);
    } catch (error) {
      console.error('Error al obtener mensajes de Gmail:', error);
      setLoading(false);
      setError(`Error al obtener correos: ${error.message || 'Error desconocido'}`);
    }
  };

  // Procesar mensaje de correo electrónico
  const processEmailMessage = (message) => {
    const headers = message.payload.headers;
    
    // Extraer detalles del mensaje
    const subject = headers.find(header => header.name === 'Subject')?.value || '(Sin asunto)';
    const from = headers.find(header => header.name === 'From')?.value || '';
    const date = new Date(headers.find(header => header.name === 'Date')?.value || '').toLocaleString();
    
    // Extraer el cuerpo del mensaje
    let body = '';
    
    const getBodyFromParts = (parts) => {
      if (!parts) return '';
      
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body && part.body.data) {
          body = decodeBase64Url(part.body.data);
          break;
        } else if (part.parts) {
          getBodyFromParts(part.parts);
        }
      }
    };
    
    if (message.payload.body && message.payload.body.data) {
      body = decodeBase64Url(message.payload.body.data);
    } else if (message.payload.parts) {
      getBodyFromParts(message.payload.parts);
    }
    
    return {
      id: message.id,
      threadId: message.threadId,
      subject,
      from,
      date,
      snippet: message.snippet,
      body,
      labelIds: message.labelIds || []
    };
  };

  // Decodificar datos en formato base64url
  const decodeBase64Url = (data) => {
    try {
      // Reemplazar caracteres para convertir de base64url a base64
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      
      // Decodificar y convertir a texto
      return decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (error) {
      console.error('Error al decodificar texto:', error);
      return '';
    }
  };

  // Renderizar el botón de inicio de sesión
  const renderSignInButton = (containerId) => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      // Renderizar el botón de inicio de sesión de Google
      window.google.accounts.id.renderButton(
        document.getElementById(containerId),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 250
        }
      );
      
      // También mostrar el one-tap prompt
      window.google.accounts.id.prompt();
    }
  };

  // Cerrar sesión
  const handleSignOut = () => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
      
      // Limpiar el estado
      setIsSignedIn(false);
      setUser(null);
      setAccessToken(null);
      setEmails([]);
      setLabels([]);
      
      console.log('Sesión cerrada correctamente');
    }
  };

  // Mover un correo entre columnas del tablero Kanban
  const moveEmailToColumn = (emailId, sourceColumn, targetColumn) => {
    setKanbanColumns(prevState => {
      // Crear copias de las columnas para no mutar el estado directamente
      const updatedColumns = { ...prevState };
      
      // Encontrar el correo en la columna de origen
      const emailIndex = updatedColumns[sourceColumn].emails.findIndex(email => email.id === emailId);
      
      if (emailIndex !== -1) {
        // Obtener el correo
        const email = updatedColumns[sourceColumn].emails[emailIndex];
        
        // Remover el correo de la columna de origen
        updatedColumns[sourceColumn].emails = updatedColumns[sourceColumn].emails.filter(email => email.id !== emailId);
        
        // Añadir el correo a la columna de destino
        updatedColumns[targetColumn].emails = [...updatedColumns[targetColumn].emails, email];
      }
      
      return updatedColumns;
    });
  };

  // Añadir correo al tablero Kanban
  const addEmailToKanban = (email, column = 'porHacer') => {
    setKanbanColumns(prevState => {
      // Verificar si el correo ya existe en alguna columna
      for (const col in prevState) {
        const exists = prevState[col].emails.some(e => e.id === email.id);
        if (exists) {
          return prevState; // No hacer nada si ya existe
        }
      }
      
      // Añadir el correo a la columna especificada
      const updatedColumns = { ...prevState };
      updatedColumns[column].emails = [...updatedColumns[column].emails, email];
      return updatedColumns;
    });
  };

  // Remover correo del tablero Kanban
  const removeEmailFromKanban = (emailId) => {
    setKanbanColumns(prevState => {
      const updatedColumns = { ...prevState };
      
      // Buscar y eliminar el correo de todas las columnas
      for (const column in updatedColumns) {
        updatedColumns[column].emails = updatedColumns[column].emails.filter(email => email.id !== emailId);
      }
      
      return updatedColumns;
    });
  };

  // Crear una nueva columna personalizada
  const createKanbanColumn = (columnId, title) => {
    setKanbanColumns(prevState => ({
      ...prevState,
      [columnId]: { title, emails: [] }
    }));
  };

  // Eliminar una columna personalizada
  const deleteKanbanColumn = (columnId) => {
    // No permitir eliminar las columnas predeterminadas
    if (['porHacer', 'enProceso', 'completado'].includes(columnId)) {
      return;
    }
    
    setKanbanColumns(prevState => {
      const { [columnId]: deletedColumn, ...restColumns } = prevState;
      
      // Mover los correos de la columna eliminada a "Por hacer"
      if (deletedColumn && deletedColumn.emails.length > 0) {
        restColumns.porHacer.emails = [
          ...restColumns.porHacer.emails,
          ...deletedColumn.emails
        ];
      }
      
      return restColumns;
    });
  };

  // Traducir nombres de etiquetas comunes
  const translateLabelName = (name) => {
    const translations = {
      'INBOX': 'Recibidos',
      'SENT': 'Enviados',
      'DRAFT': 'Borradores',
      'TRASH': 'Papelera',
      'SPAM': 'Spam',
      'IMPORTANT': 'Importante',
      'STARRED': 'Destacados',
      'UNREAD': 'No leídos',
      'CATEGORY_PERSONAL': 'Personal',
      'CATEGORY_SOCIAL': 'Social',
      'CATEGORY_PROMOTIONS': 'Promociones',
      'CATEGORY_UPDATES': 'Actualizaciones',
      'CATEGORY_FORUMS': 'Foros'
    };
    
    return translations[name] || name;
  };

  const value = {
    isSignedIn,
    user,
    accessToken,
    error,
    loading,
    labels,
    emails,
    kanbanColumns,
    handleGetGmailAccess,
    fetchGmailMessages,
    renderSignInButton,
    handleSignOut,
    moveEmailToColumn,
    addEmailToKanban,
    removeEmailFromKanban,
    createKanbanColumn,
    deleteKanbanColumn,
    translateLabelName,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
