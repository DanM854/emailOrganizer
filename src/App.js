// src/App.js - Componente principal con enrutamiento
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/kanban" element={<KanbanBoard />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;