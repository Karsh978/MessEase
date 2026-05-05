import React, { useState, useEffect } from 'react';
import { loginStudent, fetchMenu, updateStudentProfile } from '../api';
import { 
  Utensils, MapPin, Mail, Camera, LogOut, CreditCard, Smartphone, 
  User, Calendar, ShieldCheck, PhoneCall, ExternalLink 
} from 'lucide-react';

// ✨ Clean Google-style Loader
const GoogleLoader = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '100vh', background: '#f8fafc',
    fontFamily: 'system-ui'
  }}>
    <style>{`
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes colorShift {
        0% { stroke: #4285F4; } 25% { stroke: #EA4335; }
        50% { stroke: #FBBC05; } 75% { stroke: #34A853; } 100% { stroke: #4285F4; }
      }
      .google-ring {
        transform-origin: 50px 50px;
        animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite, colorShift 3s linear infinite;
        fill: none; stroke-width: 6; stroke-linecap: round; stroke-dasharray: 120 60;
      }
    `}</style>
    <svg width="80" height="80" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="6"/>
      <circle className="google-ring" cx="50" cy="50" r="38"/>
    </svg>
    <p style={{ marginTop: '20px', color: '#64748b', fontWeight: '500' }}>Getting things ready...</p>
  </div>
);

const StudentPortal = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState(null);
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    address: '', emergencyContact: '', profilePic: '', email: ''
  });

  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];

  // ✅ Auto-login on Refresh
  useEffect(() => {
    const savedData = localStorage.getItem('studentPortalData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setData(parsed);
      setEditForm({
        address: parsed.student.address || '',
        emergencyContact: parsed.student.emergencyContact || '',
        profilePic: parsed.student.profilePic || '',
        email: parsed.student.email || ''
      });
      loadMenu();
    }
  }, []);

  const loadMenu = async () => {
    try {
      const menuRes = await fetchMenu();
      const todayMenu = menuRes.data.find(m => m.day === todayName);
      setMenu(todayMenu);
    } catch (err) { console.log("Menu load error"); }
  };

  const handleLogin = async () => {
    if (!phone || !password) return alert("Phone and PIN are required!");
    
    setIsLoading(true);
    setError(''); // Clear previous errors

    try {
      const res = await loginStudent({ phone, password });
      
      // Data ko save karein
      localStorage.setItem('studentPortalData', JSON.stringify(res.data));
      setData(res.data);
      
      setEditForm({
        address: res.data.student.address || '',
        emergencyContact: res.data.student.emergencyContact || '',
        profilePic: res.data.student.profilePic || '',
        email: res.data.student.email || ''
      });

      await loadMenu();
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed! Check credentials.");
    } finally {
      setIsLoading(false); // Ye line dashboard show karegi
    }
  };

  const handleLogout = () => {
    if (window.confirm("Logout karna chahte hain?")) {
      localStorage.removeItem('studentPortalData');
      setData(null);
    }
  };

  const handlePayment = () => {
    const upiId = "9669168716@ybl";
    const amount = data.student.totalDue;
    const upiUrl = `upi://pay?pa=${upiId}&pn=Didi%20Mess&am=${amount}&cu=INR`;
    window.location.href = upiUrl;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 300000) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm({ ...editForm, profilePic: reader.result });
      reader.readAsDataURL(file);
    } else if (file) { alert("Max 300kb allowed!"); }
  };

  const handleUpdate = async () => {
    try {
      await updateStudentProfile(data.student._id, editForm);
      const updatedData = { ...data, student: { ...data.student, ...editForm } };
      localStorage.setItem('studentPortalData', JSON.stringify(updatedData));
      setData(updatedData);
      setIsEditing(false);
      alert("Profile updated! ✨");
    } catch (err) { alert("Update failed!"); }
  };

  if (isLoading) return <GoogleLoader />;

  // --- LOGIN VIEW ---
  if (!data) return (
    <div style={loginContainer}>
      <div style={loginBox}>
        <div style={logoBadge}><ShieldCheck size={30} color="#4F46E5"/></div>
        <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>Student Login</h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Welcome back to Didi Mess</p>
        
        <input type="text" placeholder="Phone Number" style={inputStyle} 
               onChange={(e) => setPhone(e.target.value)} />
               
        <input type="password" placeholder="4-Digit PIN" style={inputStyle} 
               onChange={(e) => setPassword(e.target.value)} />
               
        <button onClick={handleLogin} style={btnStylePrimary}>Login Now</button>
        
        {error && <p style={{ color: '#ef4444', marginTop: '15px', fontSize: '14px' }}>{error}</p>}
      </div>
    </div>
  );

  // --- DASHBOARD VIEW ---
  return (
    <div style={{ padding: '15px', maxWidth: '480px', margin: 'auto', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui' }}>
      
      {/* 🍲 MENU CARD */}
      <div style={cardStyle('#ffffff', 'none', '0 4px 20px rgba(0,0,0,0.05)')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils size={18} /> Today's Menu
          </h4>
          <span style={dateBadge}>{todayName}</span>
        </div>
        <p style={{ fontSize: '20px', fontWeight: '800', margin: '15px 0 5px 0', color: '#1e293b' }}>
          {menu ? menu.dish : "Loading today's meal..."}
        </p>
        <p style={{ color: '#64748b', fontSize: '13px' }}>{menu?.ingredients || "Standard Healthy Diet"}</p>
      </div>

      {/* 👤 PROFILE CARD */}
      <div style={cardStyle('#ffffff', '1px solid #f1f5f9')}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <img src={data.student.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                 style={{ width: '70px', height: '70px', borderRadius: '18px', border: '3px solid #f8fafc', objectFit: 'cover' }} />
            <button onClick={() => setIsEditing(true)} style={editIconStyle}><Camera size={12} color="white"/></button>
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a' }}>{data.student.name}</h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Student ID: {data.student.phone}</span>
          </div>
        </div>

        {isEditing ? (
          <div style={{ marginTop: '20px', padding: '10px', background: '#f8fafc', borderRadius: '12px' }}>
            <input type="file" onChange={handleImageChange} style={{...inputStyle, background: '#fff'}} />
            <input style={inputStyle} value={editForm.email} placeholder="Email" onChange={e => setEditForm({...editForm, email: e.target.value})} />
            <input style={inputStyle} value={editForm.address} placeholder="Address" onChange={e => setEditForm({...editForm, address: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleUpdate} style={btnStylePrimary}>Save</button>
              <button onClick={() => setIsEditing(false)} style={btnStyleSecondary}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
            <div style={infoRow}><Mail size={14} /> {data.student.email || "No email added"}</div>
            <div style={infoRow}><MapPin size={14} /> {data.student.address || "No address added"}</div>
          </div>
        )}
      </div>

      {/* 💰 BILL CARD */}
      <div style={paymentCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#cbd5e1', fontSize: '13px' }}>Current Bill Due</span>
            <CreditCard size={18} color="#94a3b8"/>
          </div>
          <h1 style={{ color: '#fff', fontSize: '32px', margin: '10px 0', fontWeight: '800' }}>₹{data.student.totalDue}</h1>
          <button onClick={handlePayment} style={payBtn}>
            <Smartphone size={18} /> Quick Pay via UPI
          </button>
      </div>

      {/* 📅 ATTENDANCE */}
      <h4 style={{ color: '#475569', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>Recent Attendance</h4>
      <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
        {data.attendance.map((h, i) => (
          <div key={i} style={historyItemStyle}>
              <span style={{ fontWeight: '600', fontSize: '13px' }}>{new Date(h.date).toLocaleDateString('en-GB')}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {h.breakfast && <span style={mealTag('#fef3c7', '#d97706')}>B</span>}
                {h.lunch && <span style={mealTag('#dcfce7', '#16a34a')}>L</span>}
                {h.dinner && <span style={mealTag('#e0e7ff', '#4f46e5')}>D</span>}
              </div>
          </div>
        ))}
      </div>
      
      <button onClick={handleLogout} style={logoutBtn}><LogOut size={16}/> Logout Account</button>

      {/* 📱 MODERN FOOTER */}
      <footer style={footerStyle}>
        <div style={footerLine}></div>
        <div style={{ padding: '25px 0' }}>
          <p style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>Didi Mess Portal</p>
          <div style={footerLinks}>
            <a href="tel:6267216334" style={footerIconLink}><PhoneCall size={16}/></a>
            <a href="mailto:jivankarsh87@gmail.com" style={footerIconLink}><Mail size={16}/></a>
            <a href="#" style={footerIconLink}><ExternalLink size={16}/></a>
          </div>
          <div style={footerBottom}>
            <span>Design by Jivan</span>
            <div style={statusDot}></div>
            <span>System Secure</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- STYLES (Keep existing or slightly improved) ---
const loginContainer = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f1f5f9' };
const loginBox = { background: '#fff', padding: '35px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', width: '90%', maxWidth: '360px' };
const logoBadge = { width: '55px', height: '55px', background: '#e0e7ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' };
const cardStyle = (bg, border, shadow) => ({ background: bg, border, padding: '20px', borderRadius: '20px', marginBottom: '15px', boxShadow: shadow || 'none' });
const paymentCard = { background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '25px', borderRadius: '24px', marginBottom: '25px', color: '#fff' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' };
const btnStylePrimary = { width: '100%', padding: '12px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const btnStyleSecondary = { width: '100%', padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const payBtn = { width: '100%', padding: '12px', background: '#fff', color: '#1e293b', border: 'none', borderRadius: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' };
const logoutBtn = { width: '100%', padding: '12px', background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const dateBadge = { background: '#fffbeb', color: '#b45309', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' };
const editIconStyle = { position: 'absolute', bottom: '0', right: '0', background: '#4F46E5', border: '2px solid #fff', borderRadius: '50%', padding: '5px' };
const infoRow = { display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', color: '#64748b', fontSize: '13px' };
const historyItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fff', borderRadius: '10px', marginBottom: '8px', border: '1px solid #f1f5f9' };
const mealTag = (bg, color) => ({ background: bg, color: color, padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: '800' });
const footerStyle = { textAlign: 'center', marginTop: '30px' };
const footerLine = { height: '1px', background: '#e2e8f0' };
const footerLinks = { display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px' };
const footerIconLink = { padding: '8px', background: '#fff', borderRadius: '50%', color: '#64748b', display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const footerBottom = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '15px', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' };
const statusDot = { width: '5px', height: '5px', background: '#22c55e', borderRadius: '50%' };

export default StudentPortal;