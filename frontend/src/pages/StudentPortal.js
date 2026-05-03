import React, { useState } from 'react';
import { loginStudent, fetchMenu, updateStudentProfile, API } from '../api';
import { requestForToken } from '../firebase-config'; // ✅ Check karein ye file src mein hai
import { 
  Utensils, MapPin, Mail, Camera, LogOut, CreditCard, Smartphone, Loader2 
} from 'lucide-react';

// ✨ Google-style Loader
const GoogleLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f4f7f6' }}>
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      .ring { animation: spin 1s linear infinite; border: 4px solid #e8e8e8; border-top: 4px solid #4285F4; border-radius: 50%; width: 50px; height: 50px; }
    `}</style>
    <div className="ring"></div>
    <p style={{ marginTop: '15px', color: '#555', fontWeight: '500' }}>Opening Dashboard...</p>
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

  const [editForm, setEditForm] = useState({ address: '', emergencyContact: '', profilePic: '', email: '' });
  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];

  // --- LOGIN FUNCTION ---
  const handleLogin = async () => {
    if (!phone || !password) return alert("Phone aur PIN bharein!");
    
    setIsLoading(true);
    try {
      const res = await loginStudent({ phone, password });
      
      // 1. Dashboard ka data set karein
      setData(res.data);
      setEditForm({
        address: res.data.student.address || '',
        emergencyContact: res.data.student.emergencyContact || '',
        profilePic: res.data.student.profilePic || '',
        email: res.data.student.email || ''
      });

      // 2. Menu load karein
      try {
        const menuRes = await fetchMenu();
        const todayMenu = menuRes.data.find(m => m.day === todayName);
        setMenu(todayMenu);
      } catch (mErr) { console.log("Menu load failed"); }

      // 3. Loading band karein taaki dashboard dikh jaye
      setIsLoading(false);
      setError('');

      // 4. 🔥 BACKGROUND TOKEN LOGIC (Isse portal atgeka nahi)
      setTimeout(async () => {
        try {
          const token = await requestForToken();
          if (token) {
            await API.post('/students/save-fcm-token', { 
              studentId: res.data.student._id, 
              token: token 
            });
            console.log("FCM Token Saved!");
          }
        } catch (fcmErr) { console.log("Notification skip:", fcmErr.message); }
      }, 1000);

    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.msg || "Ghalat Number ya PIN!");
    }
  };

  const handlePayment = () => {
    const upiId = "6267216334@ybl"; 
    const upiUrl = `upi://pay?pa=${upiId}&pn=DidiMess&am=${data.student.totalDue}&cu=INR`;
    window.location.href = upiUrl;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 300000) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm({ ...editForm, profilePic: reader.result });
      reader.readAsDataURL(file);
    } else if (file) { alert("Image too large! Max 300kb"); }
  };

  const handleUpdate = async () => {
    try {
      const res = await updateStudentProfile(data.student._id, editForm);
      setData({ ...data, student: res.data });
      setIsEditing(false);
      alert("Profile updated! ✨");
    } catch (err) { alert("Update failed!"); }
  };

  if (isLoading) return <GoogleLoader />;

  if (!data) return (
    <div style={{ padding: '40px 20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', marginTop: '50px' }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
        <h2>Student Login</h2>
        <input type="text" placeholder="Phone Number" style={inputStyle} onChange={(e) => setPhone(e.target.value)} />
        <input type="password" placeholder="PIN" style={inputStyle} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin} style={btnStyle}>Login to Portal</button>
        {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '15px', maxWidth: '500px', margin: 'auto', background: '#f4f7f6', minHeight: '100vh' }}>
      
      {/* 🍲 MENU CARD */}
      <div style={cardStyle('#fff', '2px solid #ff9800')}>
        <h4 style={{ margin: 0, color: '#e65100', display: 'flex', alignItems: 'center', gap: '10px' }}><Utensils size={18} /> Aaj Khane Mein Kya Hai?</h4>
        <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>{menu ? menu.dish : "Menu update hoga!"}</p>
        <small>{menu?.ingredients || "Healthy & Fresh"}</small>
      </div>

      {/* 👤 PROFILE CARD */}
      <div style={cardStyle('#fff', '1px solid #ddd')}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <img src={data.student.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid #333', objectFit: 'cover' }} />
          <div><h3 style={{ margin: 0 }}>{data.student.name}</h3><small>ID: {data.student.phone}</small></div>
          {!isEditing && <button onClick={() => setIsEditing(true)} style={{border:'none', background:'none'}}><Camera size={18}/></button>}
        </div>
        {isEditing && (
          <div style={{ marginTop: '15px' }}>
            <input type="file" onChange={handleImageChange} style={inputStyle} />
            <input style={inputStyle} value={editForm.email} placeholder="Email" onChange={e => setEditForm({...editForm, email: e.target.value})} />
            <button onClick={handleUpdate} style={{ ...btnStyle, background: '#2e7d32' }}>Save</button>
          </div>
        )}
      </div>

      {/* 💰 BILL CARD */}
      <div style={cardStyle('#333', 'none')}>
         <h4 style={{ color: '#ff9800', margin: 0 }}>Total Bill Due</h4>
         <h1 style={{ color: '#fff', fontSize: '32px', margin: '10px 0' }}>₹{data.student.totalDue}</h1>
         {data.student.totalDue > 0 && (
           <button onClick={handlePayment} style={{ ...btnStyle, background: '#2196F3' }}><Smartphone size={18} /> Pay via PhonePe / GPay</button>
         )}
      </div>

      {/* 📅 HISTORY */}
      <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '20px' }}>
        {data.attendance.map((h, i) => (
          <div key={i} style={historyItemStyle}>
             <span>{new Date(h.date).toLocaleDateString('en-GB')}</span>
             <div style={{ display: 'flex', gap: '8px' }}>
                {h.breakfast && <span style={mealTag('#fff3e0', '#ff9800')}>B</span>}
                {h.lunch && <span style={mealTag('#e8f5e9', '#2e7d32')}>L</span>}
                {h.dinner && <span style={mealTag('#e8eaf6', '#3f51b5')}>D</span>}
             </div>
          </div>
        ))}
      </div>
      
      <button onClick={() => window.location.reload()} style={{ marginTop: '30px', width: '100%', padding: '12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Logout</button>
    </div>
  );
};

// Styles
const cardStyle = (bg, border) => ({ background: bg, border, padding: '20px', borderRadius: '15px', marginBottom: '15px' });
const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' };
const historyItemStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fff', borderRadius: '10px', marginBottom: '8px' };
const mealTag = (bg, color) => ({ background: bg, color: color, padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' });

export default StudentPortal;