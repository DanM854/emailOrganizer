const GmailService = {
    // List Gmail messages
    listMessages: async () => {
      try {
        // Fetch messages with labels 'INBOX' and max results 20
        const response = await window.gapi.client.gmail.users.messages.list({
          userId: 'me',
          labelIds: ['INBOX'],
          maxResults: 10
        });
  
        const messages = response.result.messages || [];
        
        // Fetch details for each message
        const emailPromises = messages.map(async (message) => {
          return await GmailService.getMessage(message.id);
        });
  
        return await Promise.all(emailPromises);
      } catch (error) {
        console.error('Error listing messages:', error);
        throw error;
      }
    },
  
    // Get a specific message with full details
    getMessage: async (messageId) => {
      try {
        const response = await window.gapi.client.gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full'
        });
  
        const message = response.result;
        const headers = message.payload.headers;
  
        // Extract email details from headers
        const subject = headers.find(header => header.name === 'Subject')?.value || '';
        const from = headers.find(header => header.name === 'From')?.value || '';
        const to = headers.find(header => header.name === 'To')?.value || '';
        const date = headers.find(header => header.name === 'Date')?.value || '';
  
        // Extract email body (HTML and plain text)
        let bodyHtml = '';
        let bodyText = '';
  
        // Process parts to find body content
        const processParts = (parts) => {
          if (!parts) return;
          
          parts.forEach(part => {
            if (part.mimeType === 'text/html' && part.body.data) {
              bodyHtml = GmailService.decodeMessageBody(part.body.data);
            } else if (part.mimeType === 'text/plain' && part.body.data) {
              bodyText = GmailService.decodeMessageBody(part.body.data);
            }
            
            // Process nested parts if any
            if (part.parts) {
              processParts(part.parts);
            }
          });
        };
  
        // Handle both multipart and single part messages
        if (message.payload.parts) {
          processParts(message.payload.parts);
        } else if (message.payload.body && message.payload.body.data) {
          // For single part messages
          if (message.payload.mimeType === 'text/html') {
            bodyHtml = GmailService.decodeMessageBody(message.payload.body.data);
          } else {
            bodyText = GmailService.decodeMessageBody(message.payload.body.data);
          }
        }
  
        return {
          id: message.id,
          threadId: message.threadId,
          snippet: message.snippet || '',
          subject,
          from,
          to,
          date,
          bodyHtml,
          bodyText,
          labelIds: message.labelIds || []
        };
      } catch (error) {
        console.error('Error getting message:', error);
        throw error;
      }
    },
  
    // Decode base64 encoded message body
    decodeMessageBody: (encodedBody) => {
      // Replace URL-safe characters
      const base64 = encodedBody.replace(/-/g, '+').replace(/_/g, '/');
      
      try {
        // Decode and convert to UTF-8 string
        return decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      } catch (error) {
        console.error('Error decoding message body:', error);
        return '';
      }
    }
  };
  
  export default GmailService;