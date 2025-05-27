import React from 'react';
import { useAuth } from '../context/AuthContext';


export default function AddAccountButton() {
  const { handleGetGmailAccess, loading } = useAuth();

  return (
    <button onClick={handleGetGmailAccess} disabled={loading}>
      {loading ? 'Cargando...' : 'Agregar cuenta de Google'}
    </button>
  );
}
