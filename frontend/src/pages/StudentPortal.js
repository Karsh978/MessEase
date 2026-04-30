import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loginStudent, fetchMenu, updateStudentProfile, API } from '../api';
import { 
  User, Calendar, CreditCard, Utensils, MapPin, 
  PhoneCall, Mail, Camera, Save, XCircle, LogOut, Loader2 
} from 'lucide-react';

const StudentPortal = () => {
  const { id } = useParams(); // Magic Link ID
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState(null);
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!id); 
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    address: '', emergencyContact: '', profilePic: '', email: ''
  });

  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];

  // 1. Magic Link Auto Login
  useEffect(() => {
    if (id) {
      const fetchDirect = async () => {
        try {
          const res = await API.get(`/students/portal-direct/${id}`);
          setupPortal(res.data);
        } catch (err) { setLoading(false); }
      };
      fetchDirect();
    }
  }, [id]);

  const setupPortal = async (portalData) => {
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

  // 2. Manual Login
  const handleLogin = async () => {
    if(!phone || !password) return alert("fill-up both phone no and pin!");
    try {
      setLoading(true);
      const res = await loginStudent({ phone, password });
      setupPortal(res.data);
    } catch (err) {
      setLoading(false);
      setError("Ghalat Number ya PIN!");
    }
  };

  // 3. Profile Update (With 300kb limit)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 300000) { 
        alert("image is to larger! please choose 300kb maxim (Passport size).");
        e.target.value = ""; return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setEditForm({ ...editForm, profilePic: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await updateStudentProfile(data.student._id, editForm);
      setData({ ...data, student: res.data });
      setIsEditing(false);
      alert("Profile updated successfully! ✨");
    } catch (err) { alert("Update failed!"); }
  };

  // --- RENDERING ---

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Loader2 size={40} className="spinning" color="#ff9800" />
      <style>{`.spinning { animation: rotate 1s linear infinite; } @keyframes rotate { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!data) return (
    <div style={{ padding: '40px 20px', maxWidth: '400px', margin: 'auto', textAlign: 'center' }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>Student Login</h2>
        <input type="text" placeholder="Phone" style={inputStyle} onChange={e => setPhone(e.target.value)} />
        <input type="password" placeholder="PIN" style={inputStyle} onChange={e => setPassword(e.target.value)} />
        <button onClick={handleLogin} style={btnStyle}>Login to Portal</button>
        {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '15px', maxWidth: '500px', margin: 'auto', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'Arial' }}>
      
      {/* 🍲 MENU CARD */}
      <div style={cardStyle('#fff', '2px solid #ff9800')}>
        <h4 style={{ margin: 0, color: '#e65100', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Utensils size={18} /> Aaj Khane Mein Kya Hai?
        </h4>
        <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>{menu ? menu.dish : "Menu jald hi update hoga!"}</p>
        <small style={{ color: '#666' }}>{menu?.ingredients || "Healthy & Fresh"}</small>
      </div>

      {/* 👤 PROFILE CARD */}
      <div style={cardStyle('#fff', '1px solid #ddd')}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <img src={data.student.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #333' }} />
            {!isEditing && <button onClick={() => setIsEditing(true)} style={editIconStyle}><Camera size={14}/></button>}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{data.student.name}</h3>
            <small style={{ color: '#666' }}>ID: {data.student.phone}</small>
          </div>
        </div>

        {isEditing ? (
          <div style={{ marginTop: '20px' }}>
            <label style={labelStyle}>Change Photo (Max 300kb)</label>
            <input type="file" onChange={handleImageChange} style={inputStyle} />
            <input style={inputStyle} value={editForm.email} placeholder="Email" onChange={e => setEditForm({...editForm, email:e.target.value})} />
            <input style={inputStyle} value={editForm.address} placeholder="Room No" onChange={e => setEditForm({...editForm, address:e.target.value})} />
            <input style={inputStyle} value={editForm.emergencyContact} placeholder="Emergency Contact" onChange={e => setEditForm({...editForm, emergencyContact:e.target.value})} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleUpdate} style={{ ...btnStyle, background: '#2e7d32' }}>Save</button>
              <button onClick={() => setIsEditing(false)} style={{ ...btnStyle, background: '#666' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '15px', fontSize: '14px' }}>
            <p style={infoRow}><Mail size={14}/> {data.student.email || 'No Email'}</p>
            <p style={infoRow}><MapPin size={14}/> {data.student.address || 'No Address'}</p>
            <p style={infoRow}><PhoneCall size={14}/> {data.student.emergencyContact || 'No Emergency Contact'}</p>
          </div>
        )}
      </div>

      {/* 💰 BILL CARD */}
      <div style={cardStyle('#333', 'none')}>
         <h4 style={{ color: '#ff9800', margin: 0 }}>Total Bill Due</h4>
         <h1 style={{ color: '#fff', fontSize: '32px', margin: '10px 0' }}>₹{data.student.totalDue}</h1>
         <p style={{ color: '#bbb', fontSize: '12px' }}>Samay par payment karein.</p>
      </div>

      {/* 📅 ATTENDANCE */}
      <div style={{ margin: '20px 0' }}>
         <Calendar size={18} /> <h3 style={{ display: 'inline', marginLeft: '10px' }}>Attendance History</h3>
         <div style={{ marginTop: '10px' }}>
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
      </div>

      <button onClick={() => window.location.replace('/my-portal')} style={{ width: '100%', padding: '12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>
        <LogOut size={18}/> Logout
      </button>

      {/* ── FOOTER ── */}
      <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '15px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', margin: '0' }}>Developed by <span style={{ color: '#ff9800', fontWeight: 'bold' }}>Jivan</span></p>
        <p style={{ fontSize: '12px', color: '#666' }}>📞 6267216334 | ✉ jivankarsh87@gmail.com</p>
      </div>

    </div>
  );
};

// Styles
const cardStyle = (bg, border) => ({ background: bg, border, padding: '20px', borderRadius: '15px', marginBottom: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' });
const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };
const labelStyle = { fontSize: '11px', color: '#888', textAlign: 'left', display: 'block' };
const btnStyle = { width: '100%', padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const editIconStyle = { position: 'absolute', bottom: 0, right: 0, background: '#ff9800', color: '#fff', border: 'none', borderRadius: '50%', padding: '6px' };
const infoRow = { display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' };
const historyItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fff', borderRadius: '10px', marginBottom: '8px' };
const mealTag = (bg, color) => ({ background: bg, color: color, padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' });

export default StudentPortal;