// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './App.css';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BlogPage from './pages/BlogPage.tsx';
import VerifyPage from './pages/VerifyPage.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BlogPage />} />
        <Route path="/verify/:token" element={<VerifyPage />} />
        <Route path="/reset/:token" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);