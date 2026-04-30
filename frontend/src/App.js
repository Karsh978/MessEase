import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';

// Pages Import
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Khata from './pages/Khata';
import SmartMenu from './pages/SmartMenu';
import StudentPortal from './pages/StudentPortal';

import { 
  LayoutDashboard, ClipboardCheck, BookOpen, 
  UtensilsCrossed, UserRound, LogOut, Lock 
} from 'lucide-react';

// --- Ek Naya Helper Component Banaya hai taaki Navigation check ho sake ---
function AppContent() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pin, setPin] = useState('');
  const location = useLocation(); // Ye line URL check karegi

  useEffect(() => {
    const savedPIN = localStorage.getItem('adminPIN');
    if (savedPIN === '9988') {
      setIsAdmin(true);
    }
  }, []);

  const handleAdminLogin = () => {
    if (pin === '9988') {
      setIsAdmin(true);
      localStorage.setItem('adminPIN', '9988');
    } else {
      alert("Ghalat PIN! Didi wala PIN dalein.");
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('adminPIN');
  };

  // ── FIX LOGIC: Agar URL mein 'my-portal' hai, toh Navbar chhupa do ──
  const isStudentPortal = location.pathname.includes('/my-portal');

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      
      {/* Navigation Bar - Sirf Admin ko dikhega AUR portal par nahi dikhega */}
      {isAdmin && !isStudentPortal && (
        <nav style={{ 
          background: '#1a1a1a', color: '#fff', padding: '10px 15px', 
          display: 'flex', gap: '20px', overflowX: 'auto',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)', position: 'sticky', top: 0, zIndex: 100, alignItems: 'center'
        }}>
          <Link to="/" style={navStyle}><LayoutDashboard size={18} /> Dash</Link>
          <Link to="/attendance" style={navStyle}><ClipboardCheck size={18} /> Attendance</Link>
          <Link to="/khata" style={navStyle}><BookOpen size={18} /> Khata</Link>
          <Link to="/menu" style={navStyle}><UtensilsCrossed size={18} /> Menu</Link>
          
          <button onClick={handleLogout} style={logoutBtnStyle}>
            <LogOut size={16} /> Logout
          </button>
        </nav>
      )}

      <div style={{ padding: isStudentPortal ? '0' : '15px' }}>
        <Routes>
          <Route path="/" element={
            isAdmin ? <Dashboard /> : (
              <div style={{ textAlign: 'center', marginTop: '80px' }}>
                <h1 style={{ color: '#333' }}>🍱 Didi's Mess</h1>
                <div style={loginBoxStyle}>
                  <Lock size={40} color="#333" style={{ marginBottom: '15px' }} />
                  <p style={{ fontWeight: 'bold' }}>Admin Access PIN:</p>
                  <input type="password" placeholder="Enter PIN" onChange={(e) => setPin(e.target.value)} style={inputStyle} />
                  <button onClick={handleAdminLogin} style={adminBtnStyle}>Login as Didi</button>
                  <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />
                  <p style={{ fontSize: '14px', color: '#666' }}>Are you a Student?</p>
                  <Link to="/my-portal">
                    <button style={studentBtnStyle}><UserRound size={18} /> Go to Student Portal</button>
                  </Link>
                </div>
              </div>
            )
          } />

          <Route path="/attendance" element={isAdmin ? <Attendance /> : <Navigate to="/" />} />
          <Route path="/khata" element={isAdmin ? <Khata /> : <Navigate to="/" />} />
          <Route path="/menu" element={isAdmin ? <SmartMenu /> : <Navigate to="/" />} />
          <Route path="/my-portal" element={<StudentPortal />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

// Root App Component
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

// Styles
const navStyle = { color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' };
const logoutBtnStyle = { marginLeft: 'auto', background: '#ff4d4d', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' };
const loginBoxStyle = { padding: '30px', background: '#fff', borderRadius: '15px', display: 'inline-block', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxWidth: '350px', width: '90%' };
const inputStyle = { padding: '12px', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px' };
const adminBtnStyle = { padding: '12px', width: '100%', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const studentBtnStyle = { padding: '12px', width: '100%', background: '#2196f3', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };