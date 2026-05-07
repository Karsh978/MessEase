import React, { useState, useEffect } from 'react';
import { loginStudent, fetchMenu, updateStudentProfile } from '../api';
import {
  Utensils, Mail, Camera, LogOut, CreditCard, Smartphone,
  ShieldCheck, PhoneCall, ExternalLink, PieChart, History,
  CheckCircle2, AlertCircle, MessageSquare, Calendar, X, Copy, Check
} from 'lucide-react';

const GoogleLoader = () => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f8fafc' }}>
    <style>{`
      @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      @keyframes colorShift {
        0%{stroke:#4285F4} 25%{stroke:#EA4335} 50%{stroke:#FBBC05} 75%{stroke:#34A853} 100%{stroke:#4285F4}
      }
      .google-ring {
        transform-origin:50px 50px;
        animation:spin 1s cubic-bezier(0.4,0,0.2,1) infinite, colorShift 3s linear infinite;
        fill:none; stroke-width:6; stroke-linecap:round; stroke-dasharray:120 60;
      }
    `}</style>
    <svg width="80" height="80" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="6"/>
      <circle className="google-ring" cx="50" cy="50" r="38"/>
    </svg>
    <p style={{ marginTop:'20px', color:'#64748b', fontWeight:'600', fontFamily:'system-ui' }}>Syncing Dashboard...</p>
  </div>
);

const StudentPortal = () => {
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [data, setData]         = useState(null);
  const [menu, setMenu]         = useState(null);
  const [error, setError]       = useState('');
  const [isEditing, setIsEditing]       = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [copied, setCopied]     = useState(false);

  const [editForm, setEditForm] = useState({
    address:'', emergencyContact:'', profilePic:'', email:''
  });

  const todayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];

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
        const loadMenu = async () => {
          try {
            const menuRes = await fetchMenu();
            setMenu(menuRes.data.find(m => m.day === todayName));
          } catch (e) { console.error(e); }
        };
        loadMenu();
      } catch (e) { localStorage.removeItem('studentPortalData'); }
    }
  }, [todayName]);

  const handleLogin = async () => {
    if (!phone || !password) return alert("Phone and PIN are required!");
    setIsLoading(true); setError('');
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
      setMenu(menuRes.data.find(m => m.day === todayName));
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed! Please check credentials.");
    } finally { setIsLoading(false); }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('studentPortalData');
      setData(null);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateStudentProfile(data.student._id, editForm);
      const updatedData = { ...data, student: { ...data.student, ...editForm } };
      localStorage.setItem('studentPortalData', JSON.stringify(updatedData));
      setData(updatedData);
      setIsEditing(false);
      alert("Profile updated! ✨");
    } catch (e) { alert("Update failed!"); }
  };

  const upiId  = '9669168716@ybl';
  const amount = data?.student?.totalDue || 0;
  const upiParams = `pa=${upiId}&pn=Didi%20Mess&am=${amount}&cu=INR`;

  // ── These links open the installed app directly on Android & iOS ──
  // gpay uses a special https link that Android intercepts
  const payLinks = {
    gpay:    `https://gpay.app.goo.gl/pay?${upiParams}`,
    phonepe: `https://phon.pe/ru_MESS?${upiParams}`,     // PhonePe web redirect
    paytm:   `https://paytm.me/DIDIMESS?${upiParams}`,   // Paytm web redirect

    // True native intents — most reliable on Android Chrome
    gpayIntent:    `intent://pay?${upiParams}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,
    phonepeIntent: `intent://pay?${upiParams}#Intent;scheme=upi;package=com.phonepe.app;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.phonepe.app;end`,
    paytmIntent:   `intent://pay?${upiParams}#Intent;scheme=paytm;package=net.one97.paytm;end`,
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?${upiParams}`)}`;
  const phonePeUrl = 'https://phon.pe/pay?pa=' + upiId + '&pn=Didi%20Mess&am=' + amount + '&cu=INR';

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (isLoading) return <GoogleLoader />;

  if (!data) return (
    <div style={s.loginContainer}>
      <div style={s.loginBox}>
        <div style={s.logoBadge}><ShieldCheck size={30} color="#4F46E5"/></div>
        <h2 style={{ color:'#1e293b', marginBottom:'8px' }}>Didi Mess Portal</h2>
        <p style={{ fontSize:'13px', color:'#64748b', marginBottom:'24px' }}>Secured Student Access</p>
        <input type="text" placeholder="Phone Number" style={s.input} onChange={e => setPhone(e.target.value)}/>
        <input type="password" placeholder="4-Digit PIN" style={s.input} onChange={e => setPassword(e.target.value)}/>
        <button type="button" onClick={handleLogin} style={s.btnPrimary}>Sign In</button>
        {error && <p style={{ color:'#ef4444', marginTop:'15px', fontSize:'14px' }}>{error}</p>}
      </div>
    </div>
  );

  return (
    <div style={s.page}>

      {/* ══════════ PAY MODAL ══════════ */}
      {showPayModal && (
        <div style={s.overlay} onClick={() => setShowPayModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>

            <button type="button" onClick={() => setShowPayModal(false)} style={s.closeBtn}>
              <X size={18}/>
            </button>

            <h3 style={s.modalTitle}>Pay ₹{amount}</h3>
            <p style={s.modalSub}>Didi Mess · UPI Payment</p>

            {/* ── App buttons — intent:// links, most reliable ── */}
            <p style={s.secLabel}>App se pay karo (recommended):</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'8px' }}>

              {/* Google Pay */}
              <a href={payLinks.gpayIntent} style={s.appBtn('#fff','#1a73e8','1.5px solid #dadde1')}>
                <span style={s.appIcon}>G</span>
                <span style={{ flex:1, fontWeight:'800', fontSize:'15px' }}>Google Pay</span>
                <span style={s.arrow}>→</span>
              </a>

              {/* PhonePe */}
              <a href={phonePeUrl} style={s.appBtn('#5f259f','#fff','none')}>
                <span style={{...s.appIcon, background:'rgba(255,255,255,0.2)', color:'#fff'}}>P</span>
                <span style={{ flex:1, fontWeight:'800', fontSize:'15px' }}>PhonePe</span>
                <span style={s.arrow}>→</span>
              </a>

              {/* Paytm */}
              <a href={payLinks.paytmIntent} style={s.appBtn('#00baf2','#fff','none')}>
                <span style={{...s.appIcon, background:'rgba(255,255,255,0.2)', color:'#fff'}}>P</span>
                <span style={{ flex:1, fontWeight:'800', fontSize:'15px' }}>Paytm</span>
                <span style={s.arrow}>→</span>
              </a>
            </div>

            {/* divider */}
            <div style={s.divRow}>
              <div style={s.divLine}/><span style={s.divTxt}>ya manually</span><div style={s.divLine}/>
            </div>

            {/* UPI ID copy */}
            <div style={s.upiRow}>
              <Smartphone size={15} color="#4f46e5" style={{ flexShrink:0 }}/>
              <span style={s.upiText}>{upiId}</span>
              <button type="button" onClick={handleCopy} style={{
                ...s.copyBtn,
                background: copied ? '#dcfce7' : '#ede9fe',
                color:      copied ? '#16a34a' : '#4f46e5',
              }}>
                {copied ? <><Check size={12}/>&nbsp;Copied!</> : <><Copy size={12}/>&nbsp;Copy</>}
              </button>
            </div>

            {/* step guide */}
            <div style={s.tipBox}>
              <p style={{ margin:'0 0 4px 0', fontWeight:'700', fontSize:'12px', color:'#92400e' }}>📋 Manual steps:</p>
              <p style={{ margin:0, fontSize:'11px', color:'#92400e', lineHeight:'1.7' }}>
                1. UPI ID copy karo ↑<br/>
                2. GPay / PhonePe / Paytm open karo<br/>
                3. "Pay to UPI ID" → paste karo → ₹{amount} enter karo
              </p>
            </div>

            {/* Desktop QR */}
            <details style={{ marginTop:'12px', textAlign:'left' }}>
              <summary style={{ fontSize:'12px', color:'#64748b', cursor:'pointer', userSelect:'none' }}>
                💻 Laptop pe scan karo (QR Code)
              </summary>
              <div style={s.qrBox}>
                <img src={qrUrl} alt="UPI QR" style={{ width:180, height:180, borderRadius:10 }}/>
              </div>
            </details>

            <button type="button" onClick={() => setShowPayModal(false)} style={s.doneBtn}>
              Done ✓
            </button>
          </div>
        </div>
      )}
      {/* ══════════════════════════════ */}

      <div style={s.headerRow}>
        <div style={s.statusTag}><CheckCircle2 size={14}/> Verified</div>
        <div style={{...s.statusTag, background:'#fffbeb', color:'#b45309'}}><AlertCircle size={14}/> Due: 01 June</div>
      </div>

      <div style={s.cardMain}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h4 style={s.cardTitle}><Utensils size={18}/> Today's Meal</h4>
          <span style={s.dateBadge}>{todayName}</span>
        </div>
        <p style={s.dishName}>{menu ? menu.dish : "Updating Menu..."}</p>
        <div style={s.servingInfo}><History size={14}/> Standard Mess Cycle</div>
      </div>

      <div style={s.statsGrid}>
        <div style={s.statBlue}>
          <PieChart size={16}/>
          <p style={s.statsLabel}>Last Month</p>
          <h4 style={{ margin:0 }}>₹{data.student?.lastMonthBill || '1850'}</h4>
        </div>
        <div style={s.statGreen}>
          <Calendar size={16}/>
          <p style={s.statsLabel}>This Month</p>
          <h4 style={{ margin:0 }}>{data.attendance?.length || 0} Meals</h4>
        </div>
      </div>

      <div style={s.cardStandard}>
        <div style={{ display:'flex', gap:'15px', alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <img
              src={data.student?.profilePic || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
              style={s.profileImg} alt="user"
            />
            <button type="button" onClick={() => setIsEditing(true)} style={s.editBtn}>
              <Camera size={10} color="white"/>
            </button>
          </div>
          <div>
            <h3 style={s.userName}>{data.student?.name}</h3>
            <p style={s.userMeta}>ID: {data.student?.phone}</p>
          </div>
        </div>
        {isEditing && (
          <div style={s.editSection}>
            <input style={s.input} value={editForm.email} placeholder="Email"
              onChange={e => setEditForm({...editForm, email:e.target.value})}/>
            <input style={s.input} value={editForm.address} placeholder="Address"
              onChange={e => setEditForm({...editForm, address:e.target.value})}/>
            <button type="button" onClick={handleUpdate} style={s.btnPrimary}>Update</button>
            <button type="button" onClick={() => setIsEditing(false)}
              style={{...s.btnSecondary, marginTop:'8px'}}>Cancel</button>
          </div>
        )}
      </div>

      <div style={s.payCard}>
        <div style={{ display:'flex', justifyContent:'space-between', opacity:0.8 }}>
          <span>Total Outstanding</span><CreditCard size={18}/>
        </div>
        <h1 style={s.billAmount}>₹{amount}</h1>
        <button type="button" onClick={() => setShowPayModal(true)} style={s.payBtn}>
          <Smartphone size={18}/> Pay via UPI
        </button>
      </div>

      <h4 style={s.sectionHeader}>Attendance History</h4>
      <div style={s.historyBox}>
        {data.attendance?.slice(0,5).map((h,i) => (
          <div key={i} style={s.historyItem}>
            <div>
              <div style={{ fontWeight:'600', fontSize:'13px' }}>{new Date(h.date).toLocaleDateString('en-GB')}</div>
              <div style={{ fontSize:'10px', color:'#94a3b8' }}>Entry Logged</div>
            </div>
            <div style={{ display:'flex', gap:'6px' }}>
              {h.breakfast && <span style={s.mealTag('#fef3c7','#d97706')}>B</span>}
              {h.lunch     && <span style={s.mealTag('#dcfce7','#16a34a')}>L</span>}
              {h.dinner    && <span style={s.mealTag('#e0e7ff','#4f46e5')}>D</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={s.supportBox}>
        <p style={{ fontSize:'12px', color:'#0c4a6e', marginBottom:'10px' }}>Facing issues? Contact support.</p>
        <a href="https://wa.me/6267216334" style={s.supportBtn}><MessageSquare size={16}/> WhatsApp Didi</a>
      </div>

      <button type="button" onClick={handleLogout} style={s.logoutBtn}>
        <LogOut size={16}/> Logout
      </button>

      <footer style={s.footer}>
        <div style={s.footerLine}></div>
        <div style={{ display:'flex', justifyContent:'center', gap:'20px', margin:'20px 0' }}>
          <a href="tel:6267216334" style={s.footerLink}><PhoneCall size={18}/></a>
          <a href="mailto:jivankarsh87@gmail.com" style={s.footerLink}><Mail size={18}/></a>
          <a href="https://github.com/jivankarsh" style={s.footerLink}><ExternalLink size={18}/></a>
        </div>
        <p style={{ fontWeight:'800', fontSize:'14px', color:'#1e293b' }}>Didi Mess Solutions</p>
        <p style={{ fontSize:'11px', color:'#64748b' }}>Developed by Jivan Karsh</p>
        <div style={s.footerBottom}>
          <span>v2.7.0</span>
          <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
            <div style={s.statusDot}></div><span>Secure</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const s = {
  page:          { padding:'15px', maxWidth:'480px', margin:'auto', background:'#f8fafc', minHeight:'100vh', fontFamily:'system-ui' },
  loginContainer:{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f1f5f9' },
  loginBox:      { background:'#fff', padding:'30px', borderRadius:'28px', boxShadow:'0 10px 25px rgba(0,0,0,0.05)', textAlign:'center', width:'90%', maxWidth:'360px' },
  logoBadge:     { width:'60px', height:'60px', background:'#e0e7ff', borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px auto' },
  input:         { width:'100%', padding:'12px', marginBottom:'10px', borderRadius:'12px', border:'1px solid #e2e8f0', outline:'none', boxSizing:'border-box', fontSize:'14px' },
  btnPrimary:    { width:'100%', padding:'14px', background:'#1e293b', color:'#fff', border:'none', borderRadius:'12px', fontWeight:'700', cursor:'pointer', fontSize:'14px' },
  btnSecondary:  { width:'100%', padding:'12px', background:'#fff', color:'#475569', border:'1px solid #e2e8f0', borderRadius:'12px', fontWeight:'600', cursor:'pointer' },
  headerRow:     { display:'flex', justifyContent:'space-between', marginBottom:'15px' },
  statusTag:     { fontSize:'11px', display:'flex', alignItems:'center', gap:'5px', background:'#f0fdf4', color:'#166534', padding:'5px 12px', borderRadius:'20px', fontWeight:'600' },
  cardMain:      { background:'#fff', padding:'18px', borderRadius:'20px', marginBottom:'15px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)' },
  cardTitle:     { margin:0, color:'#f59e0b', display:'flex', alignItems:'center', gap:'8px', fontSize:'14px' },
  dateBadge:     { background:'#fffbeb', color:'#b45309', padding:'4px 10px', borderRadius:'8px', fontSize:'11px', fontWeight:'800' },
  dishName:      { fontSize:'22px', fontWeight:'800', margin:'15px 0 5px 0', color:'#1e293b' },
  servingInfo:   { display:'flex', alignItems:'center', gap:'5px', color:'#64748b', fontSize:'12px' },
  statsGrid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'15px' },
  statBlue:      { background:'#eff6ff', color:'#1e40af', padding:'15px', borderRadius:'18px' },
  statGreen:     { background:'#f0fdf4', color:'#166534', padding:'15px', borderRadius:'18px' },
  statsLabel:    { margin:'5px 0 0 0', fontSize:'11px', opacity:0.8 },
  cardStandard:  { background:'#fff', padding:'18px', borderRadius:'20px', marginBottom:'15px', border:'1px solid #f1f5f9' },
  profileImg:    { width:'60px', height:'60px', borderRadius:'15px', objectFit:'cover' },
  editBtn:       { position:'absolute', bottom:'-5px', right:'-5px', background:'#1e293b', border:'2px solid #fff', borderRadius:'50%', padding:'6px', cursor:'pointer' },
  userName:      { margin:0, color:'#0f172a', fontSize:'16px' },
  userMeta:      { margin:0, fontSize:'12px', color:'#64748b' },
  editSection:   { marginTop:'15px', background:'#f8fafc', padding:'12px', borderRadius:'12px' },
  payCard:       { background:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)', padding:'25px', borderRadius:'24px', marginBottom:'20px', color:'#fff' },
  billAmount:    { color:'#fff', fontSize:'34px', margin:'10px 0', fontWeight:'800' },
  payBtn:        { width:'100%', padding:'14px', background:'#fff', color:'#4f46e5', border:'none', borderRadius:'12px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', cursor:'pointer', marginTop:'15px', fontSize:'14px' },
  sectionHeader: { color:'#475569', fontSize:'14px', fontWeight:'700', margin:'0 0 10px 0' },
  historyBox:    { maxHeight:'180px', overflowY:'auto', marginBottom:'20px' },
  historyItem:   { display:'flex', justifyContent:'space-between', padding:'12px', background:'#fff', borderRadius:'15px', marginBottom:'8px', border:'1px solid #f1f5f9' },
  mealTag:       (bg,color) => ({ background:bg, color, padding:'2px 8px', borderRadius:'6px', fontSize:'10px', fontWeight:'900' }),
  supportBox:    { background:'#f0f9ff', border:'1px solid #bae6fd', textAlign:'center', padding:'15px', borderRadius:'20px', marginBottom:'15px' },
  supportBtn:    { display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'#25d366', color:'#fff', textDecoration:'none', padding:'10px', borderRadius:'12px', fontSize:'13px', fontWeight:'700' },
  logoutBtn:     { width:'100%', padding:'12px', background:'#fff', color:'#ef4444', border:'1px solid #fee2e2', borderRadius:'12px', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', cursor:'pointer' },
  footer:        { textAlign:'center', marginTop:'30px', paddingBottom:'20px' },
  footerLine:    { height:'1px', background:'linear-gradient(90deg,transparent,#e2e8f0,transparent)' },
  footerLink:    { padding:'12px', background:'#fff', borderRadius:'12px', color:'#1e293b', display:'flex', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
  footerBottom:  { display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'20px', fontSize:'10px', color:'#94a3b8', padding:'0 5px' },
  statusDot:     { width:'6px', height:'6px', background:'#22c55e', borderRadius:'50%' },

  /* modal */
  overlay:   { position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:9999 },
  modal:     { background:'#fff', width:'100%', maxWidth:'480px', borderRadius:'28px 28px 0 0', padding:'28px 20px 40px', position:'relative', textAlign:'center', maxHeight:'92vh', overflowY:'auto' },
  closeBtn:  { position:'absolute', top:'16px', right:'16px', background:'#f1f5f9', border:'none', borderRadius:'50%', width:'34px', height:'34px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#475569' },
  modalTitle:{ margin:'0 0 4px 0', fontSize:'20px', color:'#1e293b', fontWeight:'800' },
  modalSub:  { margin:'0 0 16px 0', fontSize:'12px', color:'#64748b' },
  secLabel:  { fontSize:'12px', color:'#475569', textAlign:'left', marginBottom:'10px', fontWeight:'700' },
  appBtn:    (bg, color, border) => ({
    display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px',
    borderRadius:'14px', background:bg, border, color,
    textDecoration:'none', cursor:'pointer', width:'100%', boxSizing:'border-box'
  }),
  appIcon:   { width:'32px', height:'32px', borderRadius:'8px', background:'#e8f0fe', color:'#1a73e8', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', fontSize:'16px', flexShrink:0 },
  arrow:     { fontSize:'18px', opacity:0.5 },
  divRow:    { display:'flex', alignItems:'center', gap:'10px', margin:'16px 0' },
  divLine:   { flex:1, height:'1px', background:'#e2e8f0' },
  divTxt:    { fontSize:'11px', color:'#94a3b8', whiteSpace:'nowrap' },
  upiRow:    { display:'flex', alignItems:'center', gap:'10px', background:'#f8fafc', padding:'12px 14px', borderRadius:'14px', marginBottom:'10px', textAlign:'left' },
  upiText:   { fontSize:'13px', fontWeight:'700', color:'#1e293b', flex:1 },
  copyBtn:   { padding:'7px 12px', borderRadius:'10px', border:'none', fontSize:'12px', fontWeight:'700', cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center' },
  tipBox:    { background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'12px', padding:'12px 14px', textAlign:'left', marginBottom:'4px' },
  qrBox:     { display:'flex', justifyContent:'center', background:'#f8fafc', borderRadius:'16px', padding:'16px', marginTop:'12px' },
  doneBtn:   { width:'100%', padding:'14px', background:'#1e293b', color:'#fff', border:'none', borderRadius:'14px', fontWeight:'800', cursor:'pointer', fontSize:'15px', marginTop:'16px' },
};

export default StudentPortal;