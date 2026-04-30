import React, { useState, useEffect } from 'react';
import { 
  UserPlus, BellRing, Download, MessageCircle, Trash2, 
  Loader2, Phone, Edit, X, Calendar, Search, FileText, CheckCircle 
} from 'lucide-react'; 
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchStudents, fetchExpenses, payFees, addStudent, fetchAlerts, deleteStudent, API } from '../api';

// ── HELPERS ──────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

// ── STYLE TOKENS (Original Design) ───────────────────────────
const S = {
  navy:        '#1B3A6B',
  navyBg:      '#EEF2FA',
  navyBorder:  '#C6D4ED',
  green:       '#1E7E4A',
  greenBg:     '#EAF5EF',
  red:         '#C0392B',
  redBg:       '#FDECEA',
  amber:       '#8B6200',
  amberBg:     '#FFF8E7',
  amberBorder: '#F5D78E',
  blue:        '#2196F3',
  blueBg:      '#E3F2FD',
  border:      '#E8ECF4',
  pageBg:      '#F0F4FF',
  white:       '#FFFFFF',
  text:        '#1A1A2E',
  muted:       '#8A95B0',
};

const Dashboard = () => {
  // ── STATES ──
  const [students, setStudents]     = useState([]);
  const [expenses, setExpenses]     = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay]   = useState(''); 
  const [alerts, setAlerts]         = useState([]);
  const [loading, setLoading]       = useState(true);

  // Form States
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [email, setEmail]           = useState(''); 
  const [password, setPassword]     = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState(null);

  // Month Selector States
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // ── DATA LOADING ──
  useEffect(() => { 
    initLoad();
  }, []);

  const initLoad = async () => {
    setLoading(true);
    await Promise.all([loadData(), getAlerts()]);
    setLoading(false);
  };

  const getAlerts = async () => {
    try { const res = await fetchAlerts(); setAlerts(res.data || []); }
    catch (err) { console.log("Alert error"); }
  };

  const loadData = async () => {
    try {
      const sRes = await fetchStudents();
      const eRes = await fetchExpenses();
      setStudents(sRes.data || []);
      setExpenses(eRes.data || []);
    } catch (err) { console.log("Data load error"); }
  };

  // ── CORE LOGIC ──
  const handleCall = (num) => {
    window.location.href = `tel:${num}`;
  };

  const sendWelcomeMessage = (student) => {
    const portalURL = `https://mess-ease-fawn.vercel.app/my-portal/${student._id}`; 
    const msg = `Namaste ${student.name}! 🙏\nDidi's Mess mein aapka swagat hai. 🍱\n\nAb se aap apni roz ki attendance aur bill niche diye gaye link par live dekh sakte hain:\n🔗 Link: ${portalURL}\n\n📱 Login ID: ${student.phone}\n🔑 PIN: ${student.password || 'N/A'}\n\nKripya is link ko save kar lein. Dhanyawad! ✨`;
    window.open(`https://wa.me/${student.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleEmailReminder = async (student) => {
    if (!student.email) return alert("Email not found!");
    try {
      await API.post('/students/send-email-reminder', {
        email: student.email, name: student.name, amount: student.totalDue
      });
      alert(`Email sent to ${student.name}!`);
    } catch (err) { alert("Email error!"); }
  };

  const downloadBill = async (student) => {
    try {
      const res = await API.get(`/students/bill-summary/${student._id}`);
      const data = res.data;
      const doc = new jsPDF();
      doc.setFontSize(22); doc.setTextColor(27, 58, 107);
      doc.text("DIDI'S MESS RECEIPT", 15, 20);
      doc.setFontSize(10); doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 28);
      
      doc.setFontSize(12); doc.setTextColor(0);
      doc.text(`Student: ${student.name}`, 15, 40);
      doc.text(`Contact: ${student.phone}`, 15, 46);
      doc.text(`Joining Date: ${new Date(student.joiningDate).toLocaleDateString()}`, 15, 52);

      autoTable(doc, {
        startY: 60,
        head: [['Meal Type', 'Days Count', 'Rate (₹)', 'Total Amount']],
        body: [
          ['Breakfast', data.breakfast || 0, '25', (data.breakfast || 0) * 25],
          ['Lunch',     data.lunch     || 0, '50', (data.lunch     || 0) * 50],
          ['Dinner',    data.dinner    || 0, '50', (data.dinner    || 0) * 50],
          [{ content: 'Grand Total Payable', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, `RS ${student.totalDue}`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [27, 58, 107] },
      });
      doc.save(`Bill_${student.name}.pdf`);
    } catch (err) { alert("PDF Error!"); }
  };

  const downloadMonthlyReport = () => {
    const doc = new jsPDF();
    doc.text(`Mess Monthly Report - ${months[viewMonth]} ${viewYear}`, 15, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Name', 'Phone', 'Joining Date', 'Pending Bill']],
      body: students.map(s => [s.name, s.phone, new Date(s.joiningDate).toLocaleDateString(), `Rs. ${s.totalDue}`]),
      headStyles: { fillColor: [27, 58, 107] }
    });
    doc.save(`Monthly_Report_${months[viewMonth]}.pdf`);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addStudent({ name, phone, email, password, joiningDate, dailyRate: 100 });
      setName(''); setPhone(''); setEmail(''); setPassword('');
      loadData(); getAlerts();
      alert("Student registered!");
    } catch (err) { alert("Registration failed!"); }
  };

  const handleEditSave = async () => {
    try {
      await API.put(`/students/update-profile/${editingStudent._id}`, editingStudent);
      setEditingStudent(null);
      loadData();
      alert("Details updated successfully!");
    } catch (err) { alert("Update error!"); }
  };

  const handlePay = async (id) => {
    if (window.confirm("Confirm Payment? This will reset the bill to zero.")) {
      try { await payFees(id); loadData(); getAlerts(); } catch (err) { alert("Error!"); }
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Kya delete karna chahti hain? Saara data khatam ho jayega.")) {
      try { await deleteStudent(id); loadData(); getAlerts(); } catch (err) { alert("Delete error!"); }
    }
  };

  // ── CALCULATIONS & FILTERS ──
  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  const totalExp = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalRevenue = students.reduce((sum, s) => sum + (s.totalDue || 0), 0);
  const netProfit = totalRevenue - totalExp;

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const joinDay = s.joiningDate ? new Date(s.joiningDate).getDate().toString() : '';
    const matchesDay = filterDay === '' || joinDay === filterDay;
    return matchesSearch && matchesDay;
  });

  // ── STYLES ──
  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${S.border}`, fontSize: 14, color: S.text, background: '#F8FAFF', outline: 'none', marginBottom: 10, boxSizing: 'border-box' };
  const ibtn = (variant) => {
    const map = { 
        bill: { background: S.navyBg, color: S.navy }, 
        link: { background: S.greenBg, color: S.green }, 
        paid: { background: S.navy, color: S.white },
        call: { background: S.blueBg, color: S.blue },
        edit: { background: '#f0f0f0', color: S.text }
    };
    return { border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', gap: 3, ...map[variant] };
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: S.pageBg }}>
      <Loader2 size={50} color={S.navy} className="spinning" />
      <p style={{ marginTop: 15, fontWeight: 600 }}>Didi's Mess Loading...</p>
      <style>{`.spinning { animation: rotate 1s linear infinite; } @keyframes rotate { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ background: S.pageBg, minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", paddingBottom: 100 }}>

      {/* TOP BAR */}
      <div style={{ background: S.white, padding: '18px 16px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: S.navy }}>Didi's Mess Dashboard</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <FileText size={20} color={S.navy} onClick={downloadMonthlyReport} style={{ cursor: 'pointer' }} title="Monthly Report" />
          {alerts.length > 0 && <BellRing size={20} color="#ff9800" />}
        </div>
      </div>

      {/* 📅 MONTH SELECTOR */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px', margin: '10px 12px', background: S.white, borderRadius: '12px', border: `1px solid ${S.border}` }}>
        <select value={viewMonth} onChange={(e) => setViewMonth(parseInt(e.target.value))} style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd', flex: 1, fontSize: 13 }}>
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={viewYear} onChange={(e) => setViewYear(parseInt(e.target.value))} style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd', flex: 1, fontSize: 13 }}>
          <option value="2025">2025</option><option value="2026">2026</option>
        </select>
      </div>

      {/* 📊 STATS CARDS (4 COLUMNS - NEW) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, padding: '0 12px 14px' }}>
        <div style={{ background: S.white, borderRadius: 12, padding: '12px 5px', textAlign: 'center', borderLeft: `3px solid ${S.green}` }}>
          <div style={{ fontSize: 8, color: S.muted }}>UDHARI</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.green }}>₹{totalRevenue}</div>
        </div>
        <div style={{ background: S.white, borderRadius: 12, padding: '12px 5px', textAlign: 'center', borderLeft: `3px solid ${S.red}` }}>
          <div style={{ fontSize: 8, color: S.muted }}>EXPENSE</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.red }}>₹{totalExp}</div>
        </div>
        <div style={{ background: S.white, borderRadius: 12, padding: '12px 5px', textAlign: 'center', borderLeft: `3px solid ${S.navy}` }}>
          <div style={{ fontSize: 8, color: S.muted }}>PROFIT</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: netProfit >= 0 ? S.green : S.red }}>₹{netProfit}</div>
        </div>
        <div style={{ background: S.white, borderRadius: 12, padding: '12px 5px', textAlign: 'center', borderLeft: `3px solid ${S.blue}` }}>
          <div style={{ fontSize: 8, color: S.muted }}>TOTAL</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.blue }}>{students.length}</div>
        </div>
      </div>

      {/* 🔔 ALERTS SECTION (Original) */}
      {alerts.length > 0 && (
        <div style={{ margin: '0 12px 14px', background: S.amberBg, borderRadius: 14, padding: '12px', border: `1px solid ${S.amberBorder}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.amber, marginBottom: 8 }}>⚠️ Payment Alerts ({alerts.length})</div>
          {alerts.map(s => (
            <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: S.white, padding: '10px', borderRadius: 8, marginBottom: 5 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>{s.name}</span>
                <span style={{ fontSize: 10, color: S.red }}>{s.daysPassed} Days Overdue</span>
              </div>
              <button onClick={() => handleEmailReminder(s)} style={{ fontSize: 11, background: S.red, border: 'none', color: S.white, fontWeight: 700, padding: '5px 10px', borderRadius: 5 }}>Alert Email</button>
            </div>
          ))}
        </div>
      )}

      {/* 📝 REGISTER FORM (Updated Placeholder & Removed Daily Rate) */}
      <div style={{ margin: '0 12px 14px', background: S.white, borderRadius: 16, padding: 16, border: `1px solid ${S.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><UserPlus size={16} color={S.navy}/> New Registration</div>
        <form onSubmit={handleAdd}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Student name" required style={inp} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number (Login ID)" required style={inp} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email ID (for alerts)" style={inp} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter Password (e.g. 1234)" required style={inp} />
          <div style={{ marginBottom: 5, fontSize: 11, color: S.muted }}>Joining Date:</div>
          <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} required style={inp} />
          <button type="submit" style={{ width: '100%', padding: 12, background: S.navy, color: S.white, border: 'none', borderRadius: 10, fontWeight: 700 }}>Register Student</button>
        </form>
      </div>

      {/* 🔍 SEARCH & DATE FILTER (NEW) */}
      <div style={{ padding: '0 12px 15px', display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 2 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: S.muted }} />
            <input type="text" placeholder="Search name..." style={{ ...inp, paddingLeft: 35, borderRadius: 25, marginBottom: 0 }} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select value={filterDay} onChange={e => setFilterDay(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 25, border: `1px solid ${S.border}`, fontSize: 12 }}>
            <option value="">All Days</option>
            {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1} Tarik</option>)}
        </select>
      </div>

      {/* 👥 STUDENT LIST (Original Design + Call/Edit Icons) */}
      <div style={{ padding: '0 12px' }}>
        {filteredStudents.map(s => (
          <div key={s._id} style={{ background: S.white, borderRadius: 16, padding: 14, marginBottom: 10, border: `1px solid ${S.border}`, borderLeft: `5px solid ${s.totalDue > 1500 ? S.red : S.navy}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: S.navyBg, color: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>{getInitials(s.name)}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: S.muted }}>Joined: {new Date(s.joiningDate).toLocaleDateString()}</div>
                    <div style={{ fontSize: 13, color: s.totalDue > 0 ? S.red : S.green, fontWeight: 'bold' }}>Bill: ₹{s.totalDue}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleCall(s.phone)} style={ibtn('call')} title="Call"><Phone size={14} /></button>
                    <button onClick={() => setEditingStudent(s)} style={ibtn('edit')} title="Edit"><Edit size={14} /></button>
                </div>
            </div>
            
            <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
              <button onClick={() => downloadBill(s)} style={ibtn('bill')}><Download size={14} /> Bill</button>
              <button onClick={() => sendWelcomeMessage(s)} style={ibtn('link')}><MessageCircle size={14} /> WhatsApp</button>
              <button onClick={() => handlePay(s._id)} style={ibtn('paid')}><CheckCircle size={14}/> Paid</button>
              <button onClick={() => handleDelete(s._id)} style={{ border: 'none', background: S.redBg, color: S.red, borderRadius: 8, padding: '7px 10px' }}><Trash2 size={15}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* ✏️ EDIT MODAL (NEW) */}
      {editingStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: S.white, width: '100%', maxWidth: 400, borderRadius: 20, padding: 22, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
              <b style={{ fontSize: 18, color: S.navy }}>Edit Student Info</b>
              <X onClick={() => setEditingStudent(null)} style={{ cursor: 'pointer' }} />
            </div>
            <label style={{ fontSize: 11, color: S.muted, marginLeft: 5 }}>Student Name:</label>
            <input value={editingStudent.name} style={inp} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} />
            
            <label style={{ fontSize: 11, color: S.muted, marginLeft: 5 }}>Password / PIN:</label>
            <input value={editingStudent.password} style={inp} onChange={e => setEditingStudent({...editingStudent, password: e.target.value})} />
            
            <label style={{ fontSize: 11, color: S.muted, marginLeft: 5 }}>Email ID:</label>
            <input value={editingStudent.email} style={inp} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} />
            
            <label style={{ fontSize: 11, color: S.muted, marginLeft: 5 }}>Joining Date:</label>
            <input type="date" value={editingStudent.joiningDate ? editingStudent.joiningDate.split('T')[0] : ''} style={inp} onChange={e => setEditingStudent({...editingStudent, joiningDate: e.target.value})} />
            
            <button onClick={handleEditSave} style={{ width: '100%', padding: 14, background: S.navy, color: S.white, border: 'none', borderRadius: 12, fontWeight: 700, marginTop: 10 }}>Save Update</button>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div style={{ marginTop: '40px', borderTop: `1px solid ${S.border}`, paddingTop: '20px', textAlign: 'center', paddingBottom: '30px' }}>
        <p style={{ fontSize: 13, color: S.muted, margin: 0 }}>Developed by <b style={{ color: S.navy }}>Jivan</b></p>
        <p style={{ fontSize: 12, color: S.muted }}>📞 6267216334 | ✉ jivankarsh87@gmail.com</p>
      </div>

    </div>
  );
};

export default Dashboard;