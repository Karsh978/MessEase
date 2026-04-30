import React, { useState, useEffect } from 'react';
import { UserPlus, BellRing, Download, MessageCircle, Trash2, Loader2, Phone } from 'lucide-react'; // Phone icon add kiya
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchStudents, fetchExpenses, payFees, addStudent, fetchAlerts, deleteStudent, API } from '../api';

// ── helpers ──────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

// ── style tokens ─────────────────────────────────────────────
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
  border:      '#E8ECF4',
  pageBg:      '#F0F4FF',
  white:       '#FFFFFF',
  text:        '#1A1A2E',
  muted:       '#8A95B0',
  blue:        '#2196F3', // Call ke liye blue color
  blueBg:      '#E3F2FD'
};

const Dashboard = () => {
  const [students, setStudents]     = useState([]);
  const [expenses, setExpenses]     = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts]         = useState([]);
  const [loading, setLoading]       = useState(true);

  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState(''); 
  const [password, setPassword] = useState('1234');
  const [dailyRate, setDailyRate] = useState(100); 

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => { 
    const initLoad = async () => {
      setLoading(true);
      await Promise.all([loadData(), getAlerts()]);
      setLoading(false);
    };
    initLoad();
  }, []);

  const getAlerts = async () => {
    try { const res = await fetchAlerts(); setAlerts(res.data || []); }
    catch (err) { console.log("Alert fetch error"); }
  };

  const loadData = async () => {
    try {
      const sRes = await fetchStudents();
      const eRes = await fetchExpenses();
      setStudents(sRes.data || []);
      setExpenses(eRes.data || []);
    } catch (err) { console.log("Data load error"); }
  };

  // Calling Function
  const handleCall = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const sendWelcomeMessage = (student) => {
    const portalURL = `https://mess-ease-fawn.vercel.app/my-portal/${student._id}`; 
    const msg = `Namaste ${student.name}! 🙏\nDidi's Mess mein aapka swagat hai. 🍱\n\nAb se aap apni roz ki attendance aur bill niche diye gaye link par live dekh sakte hain:\n🔗 Link: ${portalURL}\n\nKripya is link ko save kar lein. Dhanyawad! ✨`;
    window.open(`https://wa.me/${student.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleEmailReminder = async (student) => {
    if (!student.email) return alert("email not found!");
    try {
      await API.post('/students/send-email-reminder', {
        email: student.email, name: student.name, totalDue: student.totalDue
      });
      alert(`Email sent to ${student.name}!`);
    } catch (err) { alert("Email error!"); }
  };

  const downloadBill = async (student) => {
    try {
      const res = await API.get(`/students/bill-summary/${student._id}`);
      const data = res.data;
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("DIDI'S MESS RECEIPT", 15, 20);
      autoTable(doc, {
        startY: 50,
        head: [['Meal', 'Days', 'Rate', 'Total']],
        body: [
          ['Breakfast', data.breakfast || 0, '25', (data.breakfast || 0) * 25],
          ['Lunch',     data.lunch     || 0, '50', (data.lunch     || 0) * 50],
          ['Dinner',    data.dinner    || 0, '50', (data.dinner    || 0) * 50],
          [{ content: 'Grand Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, student.totalDue],
        ],
        theme: 'grid',
        headStyles: { fillColor: [27, 58, 107] },
      });
      doc.save(`Bill_${student.name}.pdf`);
    } catch (err) { alert("PDF Error!"); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addStudent({ name, phone, email, password, dailyRate });
      setName(''); setPhone(''); setEmail(''); setPassword('1234'); setDailyRate(100);
      loadData(); getAlerts();
      alert("Student registered!");
    } catch (err) { alert("Registration failed!"); }
  };

  const handlePay = async (id) => {
    if (window.confirm("Payment receive ho gayi? bill zero ho jayega.")) {
      try { await payFees(id); loadData(); getAlerts(); }
      catch (err) { alert("Payment error!"); }
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete karna chahti hain?")) {
      try { await deleteStudent(id); loadData(); getAlerts(); }
      catch (err) { alert("Delete error!"); }
    }
  };

  // ── SMART CALCULATIONS ───────────────────────────────
  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  const totalExp = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalRevenue = students.reduce((sum, s) => sum + (s.totalDue || 0), 0);
  const netProfit = totalRevenue - totalExp;

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Styles ──────────────────────────────────────────────────
  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${S.border}`, fontSize: 14, color: S.text, background: '#F8FAFF', outline: 'none', marginBottom: 10, boxSizing: 'border-box' };
  
  const ibtn = (variant) => {
    const map = { 
        bill: { background: S.navyBg, color: S.navy }, 
        link: { background: S.greenBg, color: S.green }, 
        paid: { background: S.navy, color: S.white },
        call: { background: S.blueBg, color: S.blue } // Call button style
    };
    return { border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 3, ...map[variant] };
  };
  
  const selectStyle = { padding: '10px', borderRadius: '8px', border: `1px solid ${S.border}`, flex: 1, background: S.white, fontSize: '13px', fontWeight: '600', color: S.navy };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: S.pageBg }}>
        <Loader2 size={50} color={S.navy} className="spinning-icon" />
        <p style={{ marginTop: 15, color: S.navy, fontWeight: 600 }}>Didi's Mess loading...</p>
        <style>{`.spinning-icon { animation: rotate 1s linear infinite; } @keyframes rotate { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: S.pageBg, minHeight: '100vh', paddingBottom: 100 }}>

      {/* TOP BAR */}
      <div style={{ background: S.white, padding: '18px 16px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: S.navy }}>Didi's Mess Dashboard</div>
        {alerts.length > 0 && <BellRing size={20} color="#ff9800" />}
      </div>

      {/* STATS CARDS (AB 4 CARDS HAIN) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, padding: '12px' }}>
        <div style={{ background: S.white, borderRadius: 12, padding: '10px 5px', textAlign: 'center', borderBottom: `3px solid ${S.green}` }}>
          <div style={{ fontSize: 8, color: S.muted }}>UDHARI</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.green }}>₹{totalRevenue}</div>
        </div>
        <div style={{ background: S.white, borderRadius: 12, padding: '10px 5px', textAlign: 'center', borderBottom: `3px solid ${S.red}` }}>
          <div style={{ fontSize: 8, color: S.muted }}>EXPENSE</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.red }}>₹{totalExp}</div>
        </div>
        <div style={{ background: S.white, borderRadius: 12, padding: '10px 5px', textAlign: 'center', borderBottom: `3px solid ${S.navy}` }}>
          <div style={{ fontSize: 8, color: S.muted }}>PROFIT</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: netProfit >= 0 ? S.green : S.red }}>₹{netProfit}</div>
        </div>
        {/* 🔥 TOTAL STUDENTS CARD */}
        <div style={{ background: S.white, borderRadius: 12, padding: '10px 5px', textAlign: 'center', borderBottom: `3px solid ${S.blue}` }}>
          <div style={{ fontSize: 8, color: S.muted }}>STUDENTS</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.blue }}>{students.length}</div>
        </div>
      </div>

      {/* SEARCH */}
      <div style={{ padding: '0 12px 10px' }}>
        <input type="text" placeholder="🔍 Search students..." style={{ ...inp, borderRadius: 25 }} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* STUDENT LIST */}
      <div style={{ padding: '0 12px' }}>
        {filteredStudents.map(s => (
          <div key={s._id} style={{ background: S.white, borderRadius: 16, padding: '12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${S.border}` }}>
            <div style={{ width: 35, height: 35, borderRadius: '50%', background: S.navyBg, color: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{getInitials(s.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: s.totalDue > 0 ? S.red : S.green }}>₹{s.totalDue}</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {/* 🔥 CALL BUTTON */}
              <button onClick={() => handleCall(s.phone)} style={ibtn('call')}><Phone size={14} /></button>
              
              <button onClick={() => downloadBill(s)} style={ibtn('bill')}><Download size={14} /></button>
              <button onClick={() => sendWelcomeMessage(s)} style={ibtn('link')}><MessageCircle size={14} /></button>
              <button onClick={() => handlePay(s._id)} style={ibtn('paid')}>Paid</button>
              <button onClick={() => handleDelete(s._id)} style={{ border: 'none', background: S.redBg, color: S.red, borderRadius: 8, padding: 7 }}><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
      
      {/* REGISTER FORM... (Rest of the code remains same) */}
    </div>
  );
};

export default Dashboard;