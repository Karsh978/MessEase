import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // URL ID ke liye
import { loginStudent, fetchMenu, updateStudentProfile, API } from '../api';
import { 
  User, Calendar, CreditCard, Utensils, MapPin, 
  PhoneCall, Mail, Camera, Save, XCircle, LogOut, Loader2 
} from 'lucide-react';

const StudentPortal = () => {
  const { id } = useParams(); // Magic Link ID pakadne ke liye

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState(null);
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!id); // Agar ID hai toh loading true
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    address: '', emergencyContact: '', profilePic: '', email: ''
  });

  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];

  // --- AUTO LOGIN LOGIC (Magic Link) ---
  useEffect(() => {
    if (id) {
      autoLogin(id);
    }
  }, [id]);

  const autoLogin = async (studentId) => {
    try {
      const res = await API.get(`/students/portal-direct/${studentId}`);
      setupPortalData(res.data);
    } catch (err) {
      console.log("Magic link failed, showing login form");
      setLoading(false);
    }
  };

  const setupPortalData = async (portalData) => {
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
    } catch (mErr) { console.log("Menu load failed"); }
    
    setLoading(false);
  };

  // --- MANUAL LOGIN (Purana Feature) ---
  const handleLogin = async () => {
    if(!phone || !password) return alert("fill-up both phone no and pin!");
    try {
      setLoading(true);
      const res = await loginStudent({ phone, password });
      setupPortalData(res.data);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.msg || "Ghalat Number ya PIN!");
    }
  };

  // --- PROFILE UPDATE LOGIC (Purana Feature) ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 300000) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm({ ...editForm, profilePic: reader.result });
      reader.readAsDataURL(file);
    } else { alert("Image too large!"); }
  };

  const handleUpdate = async () => {
    try {
      const res = await updateStudentProfile(data.student._id, editForm);
      setData({ ...data, student: res.data });
      setIsEditing(false);
      alert("Profile updated! ✨");
    } catch (err) { alert("Update failed!"); }
  };

  // 1. Loading UI
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Loader2 size={40} className="animate-spin" color="#ff9800" />
      <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // 2. Login Form (Sirf tab dikhega jab data na ho)
  if (!data) return (
    <div style={{ padding: '40px 20px', maxWidth: '400px', margin: 'auto', textAlign: 'center' }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
        <h2>Student Portal</h2>
        <input type="text" placeholder="Phone Number" style={inputStyle} onChange={(e) => setPhone(e.target.value)} />
        <input type="password" placeholder="PIN" style={inputStyle} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin} style={btnStyle}>Login</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );

  // 3. STUDENT DASHBOARD (Purana UI as it is)
  return (
    <div style={{ padding: '15px', maxWidth: '500px', margin: 'auto', background: '#f4f7f6', minHeight: '100vh' }}>
      
      {/* MENU CARD */}
      <div style={cardStyle('#fff', '2px solid #ff9800')}>
        <h4 style={{ margin: 0, color: '#e65100', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Utensils size={18} /> Aaj Khane Mein Kya Hai?
        </h4>
        <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>{menu ? menu.dish : "Menu update ho raha hai..."}</p>
        <small>{menu?.ingredients || "Healthy & Fresh"}</small>
      </div>

      {/* PROFILE CARD */}
      <div style={cardStyle('#fff', '1px solid #ddd')}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={data.student.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} 
            />
            {!isEditing && <button onClick={() => setIsEditing(true)} style={editIconStyle}><Camera size={14}/></button>}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{data.student.name}</h3>
            <small>ID: {data.student.phone}</small>
          </div>
        </div>

        {isEditing ? (
          <div style={{ marginTop: '15px' }}>
             <input type="file" onChange={handleImageChange} style={inputStyle} />
             <input value={editForm.email} placeholder="Email" style={inputStyle} onChange={e => setEditForm({...editForm, email:e.target.value})} />
             <input value={editForm.address} placeholder="Address" style={inputStyle} onChange={e => setEditForm({...editForm, address:e.target.value})} />
             <button onClick={handleUpdate} style={{ ...btnStyle, background: '#2e7d32' }}>Save</button>
             <button onClick={() => setIsEditing(false)} style={{ ...btnStyle, background: '#666', marginTop: '5px' }}>Cancel</button>
          </div>
        ) : (
          <div style={{ marginTop: '15px', fontSize: '14px' }}>
            <p><Mail size={14}/> {data.student.email}</p>
            <p><MapPin size={14}/> {data.student.address}</p>
          </div>
        )}
      </div>

      {/* BILL CARD */}
      <div style={cardStyle('#333', 'none')}>
         <h4 style={{ color: '#ff9800', margin: 0 }}>Bill Due</h4>
         <h1 style={{ color: '#fff', fontSize: '32px' }}>₹{data.student.totalDue}</h1>
      </div>

      {/* ATTENDANCE HISTORY */}
      <div style={{ margin: '20px 0' }}>
         <Calendar size={18} /> <strong>Attendance Record</strong>
         <div style={{ marginTop: '10px' }}>
           {data.attendance.map((h, i) => (
             <div key={i} style={historyItemStyle}>
                <span>{new Date(h.date).toLocaleDateString('en-GB')}</span>
                <div>
                   {h.breakfast && <span style={mealTag('#fff3e0', '#ff9800')}>B</span>}
                   {h.lunch && <span style={mealTag('#e8f5e9', '#2e7d32')}>L</span>}
                   {h.dinner && <span style={mealTag('#e8eaf6', '#3f51b5')}>D</span>}
                </div>
             </div>
           ))}
         </div>
      </div>
      
      <button onClick={() => window.location.replace('/my-portal')} style={{ width: '100%', padding: '12px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '10px' }}>
        <LogOut size={18}/> Logout
      </button>

      {/* FOOTER */}
      <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#888' }}>
        Developed by Jivan | 6267216334
      </div>
    </div>
  );
};

// Styles (Aapke original styles)
const cardStyle = (bg, border) => ({ background: bg, border, padding: '20px', borderRadius: '15px', marginBottom: '15px' });
const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd' };
const btnStyle = { width: '100%', padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' };
const historyItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff', borderRadius: '10px', marginBottom: '5px' };
const mealTag = (bg, color) => ({ background: bg, color: color, padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginLeft: '3px', fontWeight: 'bold' });
const editIconStyle = { position: 'absolute', bottom: 0, right: 0, background: '#ff9800', border: 'none', borderRadius: '50%', padding: '5px' };

export default StudentPortal;