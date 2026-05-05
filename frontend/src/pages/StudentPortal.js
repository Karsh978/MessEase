import React, { useState, useEffect } from 'react';
import { loginStudent, fetchMenu, updateStudentProfile } from '../api';
import { 
  Utensils, MapPin, Mail, Camera, LogOut, CreditCard, Smartphone, 
  ShieldCheck, PhoneCall, ExternalLink, PieChart, History, 
  CheckCircle2, AlertCircle, MessageSquare
} from 'lucide-react';

const GoogleLoader = () => (
  <div style={loaderContainer}>
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
    <p style={{ marginTop: '20px', color: '#64748b', fontWeight: '600' }}>Building your dashboard...</p>
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
    setError('');
    try {
      const res = await loginStudent({ phone, password });
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
      setError(err.response?.data?.msg || "Login failed!");
    } finally {
      setIsLoading(false);
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
    const upiUrl = `upi://pay?pa=${upiId}&pn=Didi%20Mess&am=${data.student.totalDue}&cu=INR`;
    window.location.href = upiUrl;
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

  if (!data) return (
    <div style={loginContainer}>
      <div style={loginBox}>
        <div style={logoBadge}><ShieldCheck size={30} color="#4F46E5"/></div>
        <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>Didi Mess Portal</h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Secured Student Access</p>
        <input type="text" placeholder="Phone Number" style={inputStyle} onChange={(e) => setPhone(e.target.value)} />
        <input type="password" placeholder="4-Digit PIN" style={inputStyle} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin} style={btnStylePrimary}>Sign In</button>
        {error && <p style={{ color: '#ef4444', marginTop: '15px', fontSize: '14px' }}>{error}</p>}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '15px', maxWidth: '480px', margin: 'auto', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui' }}>
      
      {/* 🍲 QUICK STATUS HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
         <div style={statusTag}><CheckCircle2 size={14}/> Profile Verified</div>
         <div style={{...statusTag, background: '#fffbeb', color: '#b45309'}}><AlertCircle size={14}/> Next Bill: June 01</div>
      </div>

      {/* 🍲 TODAY'S MENU */}
      <div style={cardStyle('#ffffff', 'none', '0 4px 20px rgba(0,0,0,0.05)')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Utensils size={18} /> Today's Meal
          </h4>
          <span style={dateBadge}>{todayName}</span>
        </div>
        <p style={{ fontSize: '22px', fontWeight: '800', margin: '15px 0 5px 0', color: '#1e293b' }}>
          {menu ? menu.dish : "Mess is closed!"}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '13px' }}>
          <History size={14}/> Serving: Breakfast, Lunch, Dinner
        </div>
      </div>

      {/* 📊 ANALYTICS CARDS (NEW FEATURE) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
        <div style={smallStatsCard('#eff6ff', '#1e40af')}>
          <PieChart size={16}/>
          <p style={{ margin: '5px 0 0 0', fontSize: '11px' }}>Last Month Expense</p>
          <h4 style={{ margin: 0 }}>₹{data.student.lastMonthBill || '1850'}</h4>
        </div>
        <div style={smallStatsCard('#f0fdf4', '#166534')}>
          <Calendar size={16}/>
          <p style={{ margin: '5px 0 0 0', fontSize: '11px' }}>Meals This Month</p>
          <h4 style={{ margin: 0 }}>{data.attendance.length} Meals</h4>
        </div>
      </div>

      {/* 👤 PROFILE & EDIT */}
      <div style={cardStyle('#ffffff', '1px solid #f1f5f9')}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <img src={data.student.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                 style={{ width: '60px', height: '60px', borderRadius: '15px', objectFit: 'cover' }} alt="profile" />
            <button onClick={() => setIsEditing(true)} style={editIconStyle}><Camera size={10} color="white"/></button>
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px' }}>{data.student.name}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Software Dev | ID: {data.student.phone.slice(-4)}</p>
          </div>
        </div>

        {isEditing && (
          <div style={{ marginTop: '15px', background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
            <input style={inputStyle} value={editForm.email} placeholder="Email" onChange={e => setEditForm({...editForm, email: e.target.value})} />
            <input style={inputStyle} value={editForm.address} placeholder="Address" onChange={e => setEditForm({...editForm, address: e.target.value})} />
            <button onClick={handleUpdate} style={btnStylePrimary}>Update Profile</button>
            <button onClick={() => setIsEditing(false)} style={{...btnStyleSecondary, marginTop: '5px'}}>Cancel</button>
          </div>
        )}
      </div>

      {/* 💰 BILLING SECTION */}
      <div style={paymentCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
            <span style={{ fontSize: '13px' }}>Current Outstanding</span>
            <CreditCard size={18}/>
          </div>
          <h1 style={{ color: '#fff', fontSize: '34px', margin: '10px 0', fontWeight: '800' }}>₹{data.student.totalDue}</h1>
          <button onClick={handlePayment} style={payBtn}>
            <Smartphone size={18} /> Pay Balance via UPI
          </button>
          <p style={{ fontSize: '10px', marginTop: '10px', textAlign: 'center', opacity: 0.7 }}>Secure payment via NPCI Interface</p>
      </div>

      {/* 📅 ATTENDANCE LOG */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ color: '#475569', fontSize: '14px', fontWeight: '700', margin: 0 }}>Attendance Log</h4>
        <button style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '12px', fontWeight: '600' }}>View All</button>
      </div>
      
      <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '20px', borderRadius: '12px' }}>
        {data.attendance.slice(0, 5).map((h, i) => (
          <div key={i} style={historyItemStyle}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>{new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Verified Entry</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {h.breakfast && <span style={mealTag('#fef3c7', '#d97706')}>B</span>}
                {h.lunch && <span style={mealTag('#dcfce7', '#16a34a')}>L</span>}
                {h.dinner && <span style={mealTag('#e0e7ff', '#4f46e5')}>D</span>}
              </div>
          </div>
        ))}
      </div>

      {/* 💬 SUPPORT SECTION (NEW FEATURE) */}
      <div style={{...cardStyle('#f0f9ff', '1px solid #bae6fd'), textAlign: 'center', padding: '15px'}}>
         <h5 style={{margin: '0 0 5px 0', color: '#0369a1'}}>Need Help with Bill?</h5>
         <p style={{fontSize: '11px', color: '#0c4a6e', marginBottom: '10px'}}>Contact Didi for any menu or payment issues.</p>
         <a href="https://wa.me/6267216334" style={supportBtn}>
            <MessageSquare size={16}/> Chat with Didi on WhatsApp
         </a>
      </div>
      
      <button onClick={handleLogout} style={logoutBtn}><LogOut size={16}/> Logout Account</button>

      {/* 📱 MNC STYLE FOOTER */}
      <footer style={footerStyle}>
        <div style={footerLine}></div>
        <div style={{ padding: '25px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginBottom: '15px' }}>
            <a href="tel:6267216334" style={footerIconLink}><PhoneCall size={18}/></a>
            <a href="mailto:jivankarsh87@gmail.com" style={footerIconLink}><Mail size={18}/></a>
            <a href="https://github.com/jivankarsh" style={footerIconLink}><ExternalLink size={18}/></a>
          </div>
          <p style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b', letterSpacing: '0.5px' }}>Didi Mess Solutions</p>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '5px' }}>Designed & Engineered by <b>Jivan Karsh</b></p>
          
          <div style={footerBottom}>
            <span style={{background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px'}}>v2.4.0-stable</span>
            <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
              <div style={statusDot}></div>
              <span style={{fontSize: '9px'}}>System Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- STYLES ---
const loaderContainer = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' };
const loginContainer = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f1f5f9' };
const loginBox = { background: '#fff', padding: '40px 30px', borderRadius: '28px', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', textAlign: 'center', width: '90%', maxWidth: '380px' };
const logoBadge = { width: '65px', height: '65px', background: '#e0e7ff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' };
const cardStyle = (bg, border, shadow) => ({ background: bg, border, padding: '18px', borderRadius: '20px', marginBottom: '15px', boxShadow: shadow || 'none' });
const paymentCard = { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '25px', borderRadius: '24px', marginBottom: '20px', color: '#fff', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' };
const inputStyle = { width: '100%', padding: '14px', marginBottom: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' };
const btnStylePrimary = { width: '100%', padding: '14px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: '0.3s' };
const btnStyleSecondary = { width: '100%', padding: '12px', background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '600' };
const payBtn = { width: '100%', padding: '14px', background: '#fff', color: '#4f46e5', border: 'none', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' };
const logoutBtn = { width: '100%', padding: '14px', background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' };
const statusTag = { fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#166534', padding: '5px 12px', borderRadius: '20px', fontWeight: '600' };
const smallStatsCard = (bg, color) => ({ background: bg, color: color, padding: '15px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '2px' });
const dateBadge = { background: '#fffbeb', color: '#b45309', padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' };
const editIconStyle = { position: 'absolute', bottom: '-5px', right: '-5px', background: '#1e293b', border: '2px solid #fff', borderRadius: '50%', padding: '6px' };
const historyItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#fff', borderRadius: '15px', marginBottom: '8px', border: '1px solid #f1f5f9' };
const mealTag = (bg, color) => ({ background: bg, color: color, padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '900' });
const supportBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25d366', color: '#fff', textDecoration: 'none', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' };
const footerStyle = { textAlign: 'center', marginTop: '30px', paddingBottom: '20px' };
const footerLine = { height: '1px', background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)' };
const footerLinks = { display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px' };
const footerIconLink = { padding: '12px', background: '#fff', borderRadius: '15px', color: '#1e293b', display: 'flex', boxShadow: '0 4px 6px rgba(0,0,0,0.03)' };
const footerBottom = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '25px', fontSize: '10px', color: '#94a3b8', padding: '0 10px' };
const statusDot = { width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 5px #22c55e' };

export default StudentPortal;