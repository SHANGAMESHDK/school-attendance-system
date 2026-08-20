import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Settings from './components/Settings';
import Register from './components/Register';
import { SerialProvider } from './context/SerialContext';

function App() {
  return (
    <Router>
      <SerialProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-background text-slate-200">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </div>
          </main>
        </div>
      </SerialProvider>
    </Router>
  );
}

export default App;
