// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import AddAccountButton from './components/AddAccountButton';

function App() {
  return (
    <AuthProvider>
      <div style={{ padding: '2rem' }}>
        <h1>Email Organizer</h1>
        <AddAccountButton />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/kanban" element={<KanbanBoard />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
