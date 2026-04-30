import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; 
import { loginStudent, fetchMenu, updateStudentProfile, API } from '../api';
import { 
  User, Calendar, CreditCard, Utensils, MapPin, 
  PhoneCall, Mail, Camera, Save, XCircle, LogOut, Loader2 
} from 'lucide-react';

const StudentPortal = () => {
  const { id } = useParams(); // URL se ID pakadna

  // Login & Data States
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState(null);
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); 
  const [isEditing, setIsEditing] = useState(false);

  // Edit Form States
  const [editForm, setEditForm] = useState({
    address: '', 
    emergencyContact: '', 
    profilePic: '', 
    email: ''
  });

  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];

  // 1. Auto-fetch logic jab link me ID ho
  useEffect(() => {
    if (id) {
      handleDirectLogin(id);
    } else {
      setLoading(false); // ID nahi hai toh manual login dikhao
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
      console.log("Direct login failed");
      setError("❌ Link purana hai ya galat hai.");
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
    } catch (mErr) { 
      console.log("Menu load failed"); 
    }
    
    setLoading(false);
  };

  const handleLogin = async () => {
    if(!phone || !password) return alert("Phone aur PIN bharein!");
    try {
      setLoading(true);
      const res = await loginStudent({ phone, password });
      setupData(res.data);
      setError('');
    } catch (err) {
      setLoading(false);
      setError("❌ Ghalat Number ya PIN!");
    }
  };

  // 2. Image Selection Logic
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 300000) { 
        alert("Image size bahut bada hai! Max 300kb allowed hai.");
        e.target.value = ""; 
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, profilePic: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // 3. Profile Update Function
  const handleUpdate = async () => {
    try {
      const res = await updateStudentProfile(data.student._id, editForm);
      setData({ ...data, student: res.data });
      setIsEditing(false);
      alert("Profile updated successfully! ✨");
    } catch (err) {
      alert("Update failed! Please try again.");
    }
  };

  // --- LOADING SCREEN ---
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f4f7f6' }}>
      <Loader2 size={50} color="#ff9800" className="animate-spin" />
      <p style={{ marginTop: 15, fontWeight: 'bold' }}>Data Load Ho Raha Hai...</p>
      <style>{`.animate-spin { animation: rotate 1s linear infinite; } @keyframes rotate { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // --- LOGIN FORM ---
  if (!id && !data) return (
    <div style={{ padding: '40px 20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', fontFamily: 'Arial' }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>Student Login</h2>
        <input type="text" placeholder="Phone Number" style={inputStyle} onChange={(e) => setPhone(e.target.value)} />
        <input type="password" placeholder="PIN" style={inputStyle} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin} style={btnStyle}>Login to Portal</button>
        {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
      </div>
    </div>
  );

  // --- ERROR SCREEN ---
  if (id && !data && error) return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>
       <h3 style={{ color: 'red' }}>{error}</h3>
       <button onClick={() => window.location.href='/my-portal'} style={btnStyle}>Manual Login Karein</button>
    </div>
  );

  // --- DASHBOARD ---
  return (
    <div style={{ padding: '15px', maxWidth: '500px', margin: 'auto', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'Arial' }}>
      
      {/* 🍲 MENU CARD */}
      <div style={cardStyle('#fff', '2px solid #ff9800')}>
        <h4 style={{ margin: 0, color: '#e65100', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Utensils size={18} /> Aaj Khane Mein Kya Hai?
        </h4>
        <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>{menu ? menu.dish : "Menu update ho raha hai..."}</p>
        <small style={{ color: '#666' }}>{menu?.ingredients || "Healthy & Fresh"}</small>
      </div>

      {/* 👤 PROFILE CARD */}
      <div style={cardStyle('#fff', '1px solid #ddd')}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={(isEditing ? editForm.profilePic : data.student.profilePic) || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
              alt="Profile"
              style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #333', objectFit: 'cover' }} 
            />
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} style={editIconStyle}><Camera size={14}/></button>
            )}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{data.student.name}</h3>
            <small style={{ color: '#666' }}>ID: {data.student.phone}</small>
          </div>
        </div>

        {isEditing ? (
          <div style={{ marginTop: '20px', background: '#f9f9f9', padding: '15px', borderRadius: '10px' }}>
            <label style={labelStyle}>Change Photo (Max 300kb)</label>
            <input type="file" accept="image/*" onChange={handleImageChange} style={inputStyle} />
            
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} value={editForm.email} onChange={e => setEditForm({...editForm, email:e.target.value})} />
            
            <label style={labelStyle}>Address (Room No)</label>
            <input style={inputStyle} value={editForm.address} onChange={e => setEditForm({...editForm, address:e.target.value})} />
            
            <label style={labelStyle}>Emergency Contact</label>
            <input style={inputStyle} value={editForm.emergencyContact} onChange={e => setEditForm({...editForm, emergencyContact:e.target.value})} />
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleUpdate} style={{ ...btnStyle, background: '#2e7d32', flex: 1 }}><Save size={16}/> Save</button>
              <button onClick={() => setIsEditing(false)} style={{ ...btnStyle, background: '#666', flex: 1 }}><XCircle size={16}/> Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#444', borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <p style={infoRow}><Mail size={14} color="#666"/> {data.student.email || 'Email set karein'}</p>
            <p style={infoRow}><MapPin size={14} color="#666"/> {data.student.address || 'Address set karein'}</p>
            <p style={infoRow}><PhoneCall size={14} color="#666"/> {data.student.emergencyContact || 'Emergency Contact'}</p>
          </div>
        )}
      </div>

      {/* 💰 BILL CARD */}
      <div style={cardStyle('#333', 'none')}>
         <h4 style={{ color: '#ff9800', margin: 0 }}>Aapka Total Bill</h4>
         <h1 style={{ color: '#fff', margin: '10px 0', fontSize: '32px' }}>₹{data.student.totalDue}</h1>
         <p style={{ color: '#bbb', fontSize: '12px', margin: 0 }}>Kripya samay par payment karein. Shukriya!</p>
      </div>

      {/* 📅 ATTENDANCE HISTORY */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0 10px' }}>
        <Calendar size={18} /> <h3 style={{ margin: 0 }}>Attendance Record</h3>
      </div>

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {data.attendance.map((h, i) => (
          <div key={i} style={historyItemStyle}>
             <span style={{ fontSize: '14px' }}>{new Date(h.date).toLocaleDateString('en-GB')}</span>
             <div style={{ display: 'flex', gap: '8px' }}>
                {h.breakfast && <span style={mealTag('#fff3e0', '#ff9800')}>B</span>}
                {h.lunch && <span style={mealTag('#e8f5e9', '#2e7d32')}>L</span>}
                {h.dinner && <span style={mealTag('#e8eaf6', '#3f51b5')}>D</span>}
             </div>
          </div>
        ))}
      </div>
      
      <button onClick={() => window.location.replace('/my-portal')} style={{ marginTop: '30px', width: '100%', padding: '12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
        <LogOut size={18}/> Logout
      </button>

      {/* Footer */}
      <div style={{ marginTop: '30px', textAlign: 'center', opacity: 0.6, fontSize: '12px', paddingBottom: '20px' }}>
        Developed by Jivan | 📞 6267216334 | © {new Date().getFullYear()}
      </div>
    </div>
  );
};

// Styles
const cardStyle = (bg, border) => ({ background: bg, border, padding: '20px', borderRadius: '15px', marginBottom: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' });
const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };
const labelStyle = { fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px', textAlign: 'left' };
const btnStyle = { width: '100%', padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const editIconStyle = { position: 'absolute', bottom: 0, right: 0, background: '#ff9800', color: '#fff', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' };
const historyItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px 15px', background: '#fff', borderRadius: '10px', marginBottom: '8px' };
const infoRow = { display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' };
const mealTag = (bg, color) => ({ background: bg, color: color, padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' });

export default StudentPortal;