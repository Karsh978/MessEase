import React, { useState, useEffect } from 'react';
// Dhyaan dein: Apne api.js ka naam check karein, agar 'API' capital hai toh wahi likhein
import { loginStudent, fetchMenu, updateStudentProfile } from '../api'; 
import { 
  Utensils, MapPin, Mail, Camera, LogOut, CreditCard, Smartphone, 
  ShieldCheck, PhoneCall, ExternalLink, PieChart, History, 
  CheckCircle2, AlertCircle, MessageSquare, Calendar
} from 'lucide-react';

const GoogleLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
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
    <p style={{ marginTop: '20px', color: '#64748b', fontWeight: '600', fontFamily: 'system-ui' }}>Syncing Dashboard...</p>
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
      try {
        const parsed = JSON.parse(savedData);
        setData(parsed);
        setEditForm({
          address: parsed.student?.address || '',
          emergencyContact: parsed.student?.emergencyContact || '',
          profilePic: parsed.student?.profilePic || '',
          email: parsed.student?.email || ''
        });
        // Menu load logic inside useEffect to avoid missing dependency warnings
        const loadMenu = async () => {
          try {
            const menuRes = await fetchMenu();
            const todayMenu = menuRes.data.find(m => m.day === todayName);
            setMenu(todayMenu);
          } catch (err) { console.error("Menu load error"); }
        };
        loadMenu();
      } catch (e) {
        localStorage.removeItem('studentPortalData');
      }
    }
  }, [todayName]);

  const handleLogin = async () => {
    if (!phone || !password) return alert("Phone and PIN are required!");
    setIsLoading(true);
    setError('');
    try {
      const res = await loginStudent({ phone, password });
      localStorage.setItem('studentPortalData', JSON.stringify(res.data));
      setData(res.data);
      setEditForm({
        address: res.data.student?.address || '',
        emergencyContact: res.data.student?.emergencyContact || '',
        profilePic: res.data.student?.profilePic || '',
        email: res.data.student?.email || ''
      });
      
      const menuRes = await fetchMenu();
      const todayMenu = menuRes.data.find(m => m.day === todayName);
      setMenu(todayMenu);
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed! Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('studentPortalData');
      setData(null);
    }
  };

  const handlePayment = () => {
    const upiId = "9669168716@ybl";
    const amount = data?.student?.totalDue || 0;
    window.location.href = `upi://pay?pa=${upiId}&pn=Didi%20Mess&am=${amount}&cu=INR`;
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
    <div style={styles.loginContainer}>
      <div style={styles.loginBox}>
        <div style={styles.logoBadge}><ShieldCheck size={30} color="#4F46E5"/></div>
        <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>Didi Mess Portal</h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Secured Student Access</p>
        <input type="text" placeholder="Phone Number" style={styles.inputStyle} onChange={(e) => setPhone(e.target.value)} />
        <input type="password" placeholder="4-Digit PIN" style={styles.inputStyle} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin} style={styles.btnStylePrimary}>Sign In</button>
        {error && <p style={{ color: '#ef4444', marginTop: '15px', fontSize: '14px' }}>{error}</p>}
      </div>
    </div>
  );

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.headerRow}>
         <div style={styles.statusTag}><CheckCircle2 size={14}/> Verified</div>
         <div style={{...styles.statusTag, background: '#fffbeb', color: '#b45309'}}><AlertCircle size={14}/> Due: 01 June</div>
      </div>

      <div style={styles.cardMain}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={styles.cardTitle}><Utensils size={18} /> Today's Meal</h4>
          <span style={styles.dateBadge}>{todayName}</span>
        </div>
        <p style={styles.dishName}>{menu ? menu.dish : "Updating Menu..."}</p>
        <div style={styles.servingInfo}><History size={14}/> Standard Mess Cycle</div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.smallStats('#eff6ff', '#1e40af')}>
          <PieChart size={16}/>
          <p style={styles.statsLabel}>Last Month</p>
          <h4 style={{ margin: 0 }}>₹{data.student?.lastMonthBill || '1850'}</h4>
        </div>
        <div style={styles.smallStats('#f0fdf4', '#166534')}>
          <Calendar size={16}/>
          <p style={styles.statsLabel}>This Month</p>
          <h4 style={{ margin: 0 }}>{data.attendance?.length || 0} Meals</h4>
        </div>
      </div>

      <div style={styles.cardStandard}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <img src={data.student?.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                 style={styles.profileImg} alt="user" />
            <button onClick={() => setIsEditing(true)} style={styles.editBtn}><Camera size={10} color="white"/></button>
          </div>
          <div>
            <h3 style={styles.userName}>{data.student?.name}</h3>
            <p style={styles.userMeta}>ID: {data.student?.phone}</p>
          </div>
        </div>
        {isEditing && (
          <div style={styles.editSection}>
            <input style={styles.inputStyle} value={editForm.email} placeholder="Email" onChange={e => setEditForm({...editForm, email: e.target.value})} />
            <input style={styles.inputStyle} value={editForm.address} placeholder="Address" onChange={e => setEditForm({...editForm, address: e.target.value})} />
            <button onClick={handleUpdate} style={styles.btnStylePrimary}>Update</button>
            <button onClick={() => setIsEditing(false)} style={{...styles.btnStyleSecondary, marginTop: '8px'}}>Cancel</button>
          </div>
        )}
      </div>

      <div style={styles.paymentCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
            <span>Total Outstanding</span><CreditCard size={18}/>
          </div>
          <h1 style={styles.billAmount}>₹{data.student?.totalDue}</h1>
          <button onClick={handlePayment} style={styles.payBtn}><Smartphone size={18} /> Pay via UPI</button>
      </div>

      <h4 style={styles.sectionHeader}>Attendance History</h4>
      <div style={styles.historyContainer}>
        {data.attendance?.slice(0, 5).map((h, i) => (
          <div key={i} style={styles.historyItem}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>{new Date(h.date).toLocaleDateString('en-GB')}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Entry Logged</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {h.breakfast && <span style={styles.mealTag('#fef3c7', '#d97706')}>B</span>}
                {h.lunch && <span style={styles.mealTag('#dcfce7', '#16a34a')}>L</span>}
                {h.dinner && <span style={styles.mealTag('#e0e7ff', '#4f46e5')}>D</span>}
              </div>
          </div>
        ))}
      </div>

      <div style={styles.supportBox}>
         <p style={{fontSize: '12px', color: '#0c4a6e', marginBottom: '10px'}}>Facing issues? Contact support.</p>
         <a href="https://wa.me/6267216334" style={styles.supportBtn}><MessageSquare size={16}/> WhatsApp Didi</a>
      </div>
      
      <button onClick={handleLogout} style={styles.logoutBtn}><LogOut size={16}/> Logout</button>

      <footer style={styles.footer}>
        <div style={styles.footerLine}></div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0' }}>
            <a href="tel:6267216334" style={styles.footerLink}><PhoneCall size={18}/></a>
            <a href="mailto:jivankarsh87@gmail.com" style={styles.footerLink}><Mail size={18}/></a>
            <a href="https://github.com/jivankarsh" style={styles.footerLink}><ExternalLink size={18}/></a>
        </div>
        <p style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>Didi Mess Solutions</p>
        <p style={{ fontSize: '11px', color: '#64748b' }}>Developed by Jivan Karsh</p>
        <div style={styles.footerBottom}>
            <span>v2.4.0</span>
            <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
              <div style={styles.statusDot}></div><span>Secure</span>
            </div>
        </div>
      </footer>
    </div>
  );
};

// Styles organized in an object for cleaner code
const styles = {
  pageWrapper: { padding: '15px', maxWidth: '480px', margin: 'auto', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui' },
  loginContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f1f5f9' },
  loginBox: { background: '#fff', padding: '30px', borderRadius: '28px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', width: '90%', maxWidth: '360px' },
  logoBadge: { width: '60px', height: '60px', background: '#e0e7ff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' },
  inputStyle: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' },
  btnStylePrimary: { width: '100%', padding: '14px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
  btnStyleSecondary: { width: '100%', padding: '12px', background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '600' },
  headerRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  statusTag: { fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#166534', padding: '5px 12px', borderRadius: '20px', fontWeight: '600' },
  cardMain: { background: '#fff', padding: '18px', borderRadius: '20px', marginBottom: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
  cardTitle: { margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
  dateBadge: { background: '#fffbeb', color: '#b45309', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' },
  dishName: { fontSize: '22px', fontWeight: '800', margin: '15px 0 5px 0', color: '#1e293b' },
  servingInfo: { display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '12px' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' },
  smallStats: (bg, color) => ({ background: bg, color, padding: '15px', borderRadius: '18px' }),
  statsLabel: { margin: '5px 0 0 0', fontSize: '11px', opacity: 0.8 },
  cardStandard: { background: '#fff', padding: '18px', borderRadius: '20px', marginBottom: '15px', border: '1px solid #f1f5f9' },
  profileImg: { width: '60px', height: '60px', borderRadius: '15px', objectFit: 'cover' },
  editBtn: { position: 'absolute', bottom: '-5px', right: '-5px', background: '#1e293b', border: '2px solid #fff', borderRadius: '50%', padding: '6px' },
  userName: { margin: 0, color: '#0f172a', fontSize: '16px' },
  userMeta: { margin: 0, fontSize: '12px', color: '#64748b' },
  editSection: { marginTop: '15px', background: '#f8fafc', padding: '12px', borderRadius: '12px' },
  paymentCard: { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '25px', borderRadius: '24px', marginBottom: '20px', color: '#fff' },
  billAmount: { color: '#fff', fontSize: '34px', margin: '10px 0', fontWeight: '800' },
  payBtn: { width: '100%', padding: '14px', background: '#fff', color: '#4f46e5', border: 'none', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  sectionHeader: { color: '#475569', fontSize: '14px', fontWeight: '700', margin: '0 0 10px 0' },
  historyContainer: { maxHeight: '180px', overflowY: 'auto', marginBottom: '20px' },
  historyItem: { display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fff', borderRadius: '15px', marginBottom: '8px', border: '1px solid #f1f5f9' },
  mealTag: (bg, color) => ({ background: bg, color, padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }),
  supportBox: { background: '#f0f9ff', border: '1px solid #bae6fd', textAlign: 'center', padding: '15px', borderRadius: '20px', marginBottom: '15px' },
  supportBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25d366', color: '#fff', textDecoration: 'none', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' },
  logoutBtn: { width: '100%', padding: '12px', background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  footer: { textAlign: 'center', marginTop: '30px', paddingBottom: '20px' },
  footerLine: { height: '1px', background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)' },
  footerLink: { padding: '12px', background: '#fff', borderRadius: '12px', color: '#1e293b', display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  footerBottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', fontSize: '10px', color: '#94a3b8', padding: '0 5px' },
  statusDot: { width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }
};

export default StudentPortal;