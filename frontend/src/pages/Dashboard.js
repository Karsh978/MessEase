import React, { useState, useEffect } from 'react';
import { UserPlus, BellRing, Download, MessageCircle } from 'lucide-react';
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
};

const Dashboard = () => {
  const [students, setStudents]     = useState([]);
  const [expenses, setExpenses]     = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts]         = useState([]);

  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState(''); 
  const [password, setPassword] = useState('1234');
  const [dailyRate, setDailyRate] = useState(100);

  // Month Selector States
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => { loadData(); getAlerts(); }, []);

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

  const sendWelcomeMessage = (student) => {
    const portalURL = "http://localhost:3000/my-portal";
    const msg = `Namaste ${student.name}! 🙏\nDidi's Mess mein aapka swagat hai. 🍱\n\nAb se aap apni roz ki attendance aur bill niche diye gaye link par live dekh sakte hain:\n🔗 Link: ${portalURL}\n\n📱 Login ID: ${student.phone}\n🔑 Aapka PIN: ${student.password || '1234'}\n\nKripya is link ko save kar lein. Dhanyawad! ✨`;
    window.open(`https://wa.me/${student.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleEmailReminder = async (student) => {
    if (!student.email) return alert("Email ID nahi mili!");
    try {
      await API.post('/students/send-email-reminder', {
        email: student.email,
        name: student.name,
        totalDue: student.totalDue
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
      doc.setFontSize(10);
      doc.text(`Student: ${student.name}`, 15, 30);
      doc.text(`Total Due: RS ${student.totalDue}`, 15, 40);

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
      setName(''); setPhone(''); setEmail(''); setPassword('1234');
      loadData(); getAlerts();
      alert("Student registered!");
    } catch (err) { alert("Registration failed!"); }
  };

  const handlePay = async (id) => {
    if (window.confirm("Payment receive ho gayi?")) {
      try { await payFees(id); loadData(); getAlerts(); }
      catch (err) { alert("Payment error!"); }
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Kya delete karna chahti hain?")) {
      try { await deleteStudent(id); loadData(); getAlerts(); }
      catch (err) { alert("Delete error!"); }
    }
  };

  // ── FIXED SMART CALCULATIONS ───────────────────────────────
  
  // 1. Pehle expenses ko filter karo (Selected Month & Year)
  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  // 2. Sirf Filtered Expenses ka total
  const totalExp = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // 3. Revenue (Current Udhari)
  const totalRevenue = students.reduce((sum, s) => sum + (s.totalDue || 0), 0);

  // 4. Final Net Profit Calculation
  const netProfit = totalRevenue - totalExp;

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Styles ──────────────────────────────────────────────────
  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${S.border}`, fontSize: 14, color: S.text, background: '#F8FAFF', outline: 'none', marginBottom: 10, boxSizing: 'border-box' };
  const ibtn = (variant) => {
    const map = { bill: { background: S.navyBg, color: S.navy }, link: { background: S.greenBg, color: S.green }, paid: { background: S.navy, color: S.white } };
    return { border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', ...map[variant] };
  };
  const selectStyle = { padding: '10px', borderRadius: '8px', border: `1px solid ${S.border}`, flex: 1, background: S.white, fontSize: '13px', fontWeight: '600', color: S.navy };

  return (
    <div style={{ background: S.pageBg, minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif", paddingBottom: 100 }}>

      {/* TOP BAR */}
      <div style={{ background: S.white, padding: '18px 16px 14px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: S.navy }}>Didi's Mess Dashboard</div>
        </div>
        {alerts.length > 0 && <BellRing size={20} color={S.navy} />}
      </div>

      {/* 📅 MONTH SELECTOR */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px', margin: '10px 12px', background: S.white, borderRadius: '12px', border: `1px solid ${S.border}` }}>
        <select value={viewMonth} onChange={(e) => setViewMonth(parseInt(e.target.value))} style={selectStyle}>
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={viewYear} onChange={(e) => setViewYear(parseInt(e.target.value))} style={selectStyle}>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 12px 14px' }}>
        <div style={{ background: S.white, borderRadius: 14, padding: '14px 10px', textAlign: 'center', borderLeft: `4px solid ${S.green}` }}>
          <div style={{ fontSize: 10, color: S.muted, textTransform: 'uppercase' }}>Udhari</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.green }}>₹{totalRevenue}</div>
        </div>
        <div style={{ background: S.white, borderRadius: 14, padding: '14px 10px', textAlign: 'center', borderLeft: `4px solid ${S.red}` }}>
          <div style={{ fontSize: 10, color: S.muted, textTransform: 'uppercase' }}>Expense ({months[viewMonth].slice(0,3)})</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.red }}>₹{totalExp}</div>
        </div>
        <div style={{ background: S.white, borderRadius: 14, padding: '14px 10px', textAlign: 'center', borderLeft: `4px solid ${S.navy}` }}>
          <div style={{ fontSize: 10, color: S.muted, textTransform: 'uppercase' }}>Net Profit</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: netProfit >= 0 ? S.green : S.red }}>₹{netProfit}</div>
        </div>
      </div>

      {/* ALERTS */}
      {alerts.length > 0 && (
        <div style={{ margin: '0 12px 14px', background: S.amberBg, borderRadius: 14, padding: '12px', border: `1px solid ${S.amberBorder}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.amber, marginBottom: 8 }}>Payment Overdue</div>
          {alerts.map(s => (
            <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', background: S.white, padding: '8px', borderRadius: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span>
              <button onClick={() => handleEmailReminder(s)} style={{ fontSize: 11, background: 'none', border: 'none', color: S.red, fontWeight: 700 }}>Alert Student</button>
            </div>
          ))}
        </div>
      )}

      {/* REGISTER FORM */}
      <div style={{ margin: '0 12px 14px', background: S.white, borderRadius: 16, padding: 16, border: `1px solid ${S.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}><UserPlus size={16} /> New Registration</div>
        <form onSubmit={handleAdd}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Student name" required style={inp} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" required style={inp} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email ID" style={inp} />
            <input 
      type="password"
      value={password} 
      onChange={(e) => setPassword(e.target.value)} 
      placeholder="Set PIN (e.g. 1234)" 
      required
      style={inputStyle}
    />
     <input 
      type="number"
      value={dailyRate} 
      onChange={(e) => setDailyRate(e.target.value)} 
      placeholder="Daily Rate (₹)" 
      style={inputStyle}
    />
          <button type="submit" style={{ width: '100%', padding: 12, background: S.navy, color: S.white, border: 'none', borderRadius: 10, fontWeight: 700 }}>Save Student</button>
        </form>
      </div>

      {/* SEARCH */}
      <div style={{ padding: '0 12px 15px' }}>
        <input type="text" placeholder="Search students..." style={{ ...inp, borderRadius: 25 }} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* STUDENT LIST */}
      <div style={{ padding: '0 12px' }}>
        {filteredStudents.map(s => (
          <div key={s._id} style={{ background: S.white, borderRadius: 16, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${S.border}`, borderLeft: `5px solid ${s.totalDue > 1500 ? S.red : S.green}` }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: S.navyBg, color: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{getInitials(s.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: S.muted }}>Due: ₹{s.totalDue}</div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={() => downloadBill(s)} style={ibtn('bill')}><Download size={14} /></button>
              <button onClick={() => sendWelcomeMessage(s)} style={ibtn('link')}>Link</button>
              <button onClick={() => handlePay(s._id)} style={ibtn('paid')}>Paid</button>
              <button onClick={() => handleDelete(s._id)} style={{ ...ibtn('paid'), background: S.red }}>X</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;