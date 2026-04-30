import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; 
import { loginStudent, fetchMenu, updateStudentProfile, API } from '../api';
import { 
  Calendar, Utensils, MapPin, 
  PhoneCall, Mail, Camera, Save, XCircle, LogOut, Loader2 
} from 'lucide-react';

const StudentPortal = () => {
  const { id } = useParams(); // URL parameter pakadne ke liye

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState(null);
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); 
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    address: '', emergencyContact: '', profilePic: '', email: ''
  });

  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];

  useEffect(() => {
    if (id) {
      handleDirectLogin(id);
    } else {
      setLoading(false); 
    }
  }, [id]);

  const handleDirectLogin = async (studentId) => {
    try {
      setLoading(true);
      const res = await API.get(`/students/portal-direct/${studentId}`);
      if(res.data) {
        setupData(res.data);
      }
    } catch (err) {
      setError("❌ Invalid Link: Ye student record nahi mila.");
      setLoading(false);
    }
  };

  const setupData = async (portalData) => {
    setData(portalData);
    setEditForm({
      address: portalData.student.address || '',
      emergencyContact: portalData.student.emergencyContact || '',
      profilePic: portalData.student.profilePic || '',
      email: portalData.student.email || ''
    });
    try {
      const menuRes = await fetchMenu();
      const todayMenu = menuRes.data.find(m => m.day === todayName);
      setMenu(todayMenu);
    } catch (mErr) { console.log("Menu error"); }
    setLoading(false);
  };

  const handleLogin = async () => {
    if(!phone || !password) return alert("Fill credentials!");
    try {
      setLoading(true);
      const res = await loginStudent({ phone, password });
      setupData(res.data);
    } catch (err) {
      setLoading(false);
      setError("❌ Ghalat Number ya PIN!");
    }
  };

  // --- 1. LOADING STATE ---
  if (loading) return (
    <div style={fullScreenCenter}>
      <Loader2 size={40} color="#ff9800" className="animate-spin" />
      <p style={{ marginTop: 10 }}>Loading Portal...</p>
    </div>
  );

  // --- 2. ERROR STATE (Link galat hone par) ---
  if (id && error && !data) return (
    <div style={fullScreenCenter}>
      <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>
        <button onClick={() => window.location.href='/login'} style={{ ...btnStyle, marginTop: '10px' }}>Go to Login</button>
      </div>
    </div>
  );

  // --- 3. LOGIN FORM (Sirf tab jab ID na ho URL mein) ---
  if (!id && !data) return (
    <div style={{ padding: '40px 20px', maxWidth: '400px', margin: 'auto' }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <h2>Student Login</h2>
        <input type="text" placeholder="Phone" style={inputStyle} onChange={(e) => setPhone(e.target.value)} />
        <input type="password" placeholder="PIN" style={inputStyle} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin} style={btnStyle}>Login</button>
        {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
      </div>
    </div>
  );

  // --- 4. STUDENT DASHBOARD (The Secure Part) ---
  return (
    <div style={{ padding: '15px', maxWidth: '500px', margin: 'auto', background: '#f4f7f6', minHeight: '100vh' }}>
      
      {/* MENU */}
      <div style={cardStyle('#fff', '2px solid #ff9800')}>
        <h4 style={{ margin: 0, color: '#e65100', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Utensils size={18} /> Aaj Ka Menu
        </h4>
        <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '8px 0' }}>{menu ? menu.dish : "Updating..."}</p>
      </div>

      {/* PROFILE (Isme sirf current student ka data hai) */}
      <div style={cardStyle('#fff', '1px solid #ddd')}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={data.student.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
              style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #333' }} 
            />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{data.student.name}</h3>
            <small>ID: {data.student.phone}</small>
          </div>
        </div>
        <div style={{ marginTop: '15px', fontSize: '14px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
           <p style={infoRow}><Mail size={14}/> {data.student.email || 'Email missing'}</p>
           <p style={infoRow}><MapPin size={14}/> {data.student.address || 'Room missing'}</p>
        </div>
      </div>

      {/* BILL */}
      <div style={cardStyle('#333', 'none')}>
         <p style={{ color: '#ff9800', margin: 0 }}>Total Due</p>
         <h1 style={{ color: '#fff', margin: '5px 0' }}>₹{data.student.totalDue}</h1>
      </div>

      {/* ATTENDANCE */}
      <div style={{ margin: '20px 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={18} /> <h3 style={{ margin: 0 }}>Attendance Record</h3>
      </div>

      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
        {data.attendance.map((h, i) => (
          <div key={i} style={historyItemStyle}>
             <span>{new Date(h.date).toLocaleDateString('en-GB')}</span>
             <div style={{ display: 'flex', gap: '5px' }}>
                {h.breakfast && <span style={mealTag('#fff3e0', '#ff9800')}>B</span>}
                {h.lunch && <span style={mealTag('#e8f5e9', '#2e7d32')}>L</span>}
                {h.dinner && <span style={mealTag('#e8eaf6', '#3f51b5')}>D</span>}
             </div>
          </div>
        ))}
      </div>

      {/* LOGOUT - URL clean karne ke liye */}
      <button onClick={() => window.location.href = '/login'} style={{ marginTop: '20px', width: '100%', padding: '12px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>
        Close Portal
      </button>

      <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '11px', opacity: 0.5 }}>
        EduTrack by Jivan
      </div>
    </div>
  );
};

// Styles
const fullScreenCenter = { height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f4f7f6', fontFamily: 'Arial' };
const cardStyle = (bg, border) => ({ background: bg, border, padding: '18px', borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' });
const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const historyItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: '#fff', borderRadius: '8px', marginBottom: '6px' };
const infoRow = { display: 'flex', alignItems: 'center', gap: '10px', margin: '5px 0' };
const mealTag = (bg, color) => ({ background: bg, color, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' });

export default StudentPortal;