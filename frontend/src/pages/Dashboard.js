import React, { useState, useEffect } from 'react';
import { UserPlus, BellRing, Download, MessageCircle, Trash2, Loader2, Phone, Pencil, X, Check, FileText } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchStudents, fetchExpenses, payFees, addStudent, fetchAlerts, deleteStudent, API } from '../api';

const getInitials = (name = '') =>
  name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

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
  blue:        '#2196F3',
  blueBg:      '#E3F2FD',
  purple:      '#7C3AED',
  purpleBg:    '#F3EEFF',
};

const Dashboard = () => {
  const [students, setStudents]     = useState([]);
  const [expenses, setExpenses]     = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts]         = useState([]);
  const [loading, setLoading]       = useState(true);

  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('1234');
  const [dailyRate, setDailyRate] = useState(0);

  const [editStudent, setEditStudent]         = useState(null);
  const [editName, setEditName]               = useState('');
  const [editPhone, setEditPhone]             = useState('');
  const [editEmail, setEditEmail]             = useState('');
  const [editJoiningDate, setEditJoiningDate] = useState('');

  const today = new Date();
  const [viewMonth, setViewMonth]     = useState(today.getMonth());
  const [viewYear, setViewYear]       = useState(today.getFullYear());
  const [allDaysMode, setAllDaysMode] = useState(false);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
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

  const sendWelcomeMessage = (student) => {
    const portalURL = `https://mess-ease-fawn.vercel.app/my-portal/${student._id}`;
    const msg = `Namaste ${student.name}! 🙏\nDidi's Mess mein aapka swagat hai. 🍱\n\nAb se aap apni roz ki attendance aur bill niche diye gaye link par live dekh sakte hain:\n🔗 Link: ${portalURL}\n\n📱 Login ID: ${student.phone}\n🔑 Aapka PIN: ${student.password || '1234'}\n\nKripya is link ko save kar lein. Dhanyawad! ✨`;
    window.open(`https://wa.me/${student.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleEmailReminder = async (student) => {
    if (!student.email) return alert("email not found!");
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

  // ── FIX: downloadMonthlyReport was referenced but never defined ──
  const downloadMonthlyReport = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("DIDI'S MESS - MONTHLY REPORT", 15, 20);
      doc.setFontSize(11);
      doc.text(`Month: ${months[viewMonth]} ${viewYear}`, 15, 32);
      doc.text(`Total Udhari (Revenue): RS ${totalRevenue}`, 15, 42);
      doc.text(`Total Expenses: RS ${totalExp}`, 15, 52);
      doc.text(`Net Profit: RS ${netProfit}`, 15, 62);
      doc.text(`Total Students: ${students.length}`, 15, 72);

      // Student-wise dues table
      autoTable(doc, {
        startY: 82,
        head: [['#', 'Student Name', 'Phone', 'Total Due (₹)']],
        body: students.map((s, i) => [
          i + 1,
          s.name,
          s.phone || '-',
          s.totalDue || 0,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [27, 58, 107] },
      });

      // Expenses table
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 120;
      doc.setFontSize(13);
      doc.text("Expenses Breakdown", 15, finalY);
      autoTable(doc, {
        startY: finalY + 6,
        head: [['Date', 'Description', 'Amount (₹)']],
        body: filteredExpenses.map(e => [
          new Date(e.date).toLocaleDateString('en-IN'),
          e.description || '-',
          e.amount || 0,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [192, 57, 43] },
      });

      doc.save(`Monthly_Report_${months[viewMonth]}_${viewYear}.pdf`);
    } catch (err) {
      alert("Monthly Report PDF error!");
    }
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
    if (window.confirm("Kya delete karna chahti hain? Saara data khatam ho jayega.")) {
      try { await deleteStudent(id); loadData(); getAlerts(); }
      catch (err) { alert("Delete error!"); }
    }
  };

  const handleCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const openEdit = (s) => {
    setEditStudent(s);
    setEditName(s.name || '');
    setEditPhone(s.phone || '');
    setEditEmail(s.email || '');
    const jd = s.joiningDate || s.createdAt || '';
    setEditJoiningDate(jd ? new Date(jd).toISOString().split('T')[0] : '');
  };

  const handleEditSave = async () => {
    try {
      await API.put(`/students/${editStudent._id}`, {
        name: editName,
        phone: editPhone,
        email: editEmail,
        joiningDate: editJoiningDate,
      });
      setEditStudent(null);
      loadData();
      alert("Student updated!");
    } catch (err) { alert("Update failed!"); }
  };

  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  const totalExp     = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalRevenue = students.reduce((sum, s) => sum + (s.totalDue || 0), 0);
  const netProfit    = totalRevenue - totalExp;

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Backup ──────────────────────────────────────────────────
  const handleFullBackup = async () => {
    try {
      const res = await API.get('/admin/backup');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const a = document.createElement('a');
      a.setAttribute("href", dataStr);
      a.setAttribute("download", `DidiMess_Backup_${new Date().toLocaleDateString()}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      alert("✅ Backup Download Ho Gaya! Ise safe rakhein.");
    } catch (err) {
      alert("❌ Backup nahi ho paya. PIN check karein.");
    }
  };

  // ── Responsive style helpers ──────────────────────────────
  const isMobile = window.innerWidth <= 480;

  const inp = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1.5px solid ${S.border}`,
    fontSize: 16,
    color: S.text,
    background: '#F8FAFF',
    outline: 'none',
    marginBottom: 10,
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
  };

  const ibtn = (variant) => {
    const map = {
      bill:   { background: S.navyBg,   color: S.navy   },
      link:   { background: S.greenBg,  color: S.green  },
      paid:   { background: S.navy,     color: S.white  },
      call:   { background: S.blueBg,   color: S.blue   },
      edit:   { background: S.purpleBg, color: S.purple },
    };
    return {
      border: 'none',
      borderRadius: 8,
      fontSize: 11,
      fontWeight: 700,
      cursor: 'pointer',
      padding: isMobile ? '9px 9px' : '7px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 3,
      whiteSpace: 'nowrap',
      minWidth: 36,
      minHeight: 36,
      justifyContent: 'center',
      ...map[variant],
    };
  };

  const selectStyle = {
    padding: '10px',
    borderRadius: '8px',
    border: `1px solid ${S.border}`,
    flex: 1,
    background: S.white,
    fontSize: '13px',
    fontWeight: '600',
    color: S.navy,
    WebkitAppearance: 'none',
    appearance: 'none',
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: S.pageBg }}>
        <Loader2 size={50} color={S.navy} className="spinning-icon" />
        <p style={{ marginTop: 15, color: S.navy, fontWeight: 600, fontSize: 16 }}>Didi's Mess loading...</p>
        <style>{`
          .spinning-icon { animation: rotate 1s linear infinite; }
          @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ background: S.pageBg, minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif", paddingBottom: 100 }}>

      {/* ── GLOBAL RESPONSIVE CSS ── */}
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }

        input, select, textarea {
          font-size: 16px !important;
          -webkit-text-size-adjust: 100%;
        }

        .btn-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: flex-end;
          margin-top: 10px;
        }

        @media (max-width: 360px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .btn-row button {
            min-width: 34px !important;
            min-height: 34px !important;
            padding: 7px !important;
          }
        }

        .edit-modal-inner {
          max-height: 90vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        input[type="date"] {
          min-height: 44px;
        }

        button { -webkit-tap-highlight-color: transparent; }

        /* Topbar action buttons */
        .topbar-action {
          display: flex;
          align-items: center;
          gap: 4px;
          background: ${S.navyBg};
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          border: none;
          min-height: 36px;
        }
        .topbar-action span {
          font-size: 10px;
          font-weight: 700;
          color: ${S.navy};
        }
        @media (max-width: 360px) {
          .topbar-action span { display: none; }
          .topbar-action { padding: 6px 8px; }
        }
      `}</style>

      {/* EDIT MODAL */}
      {editStudent && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          <div className="edit-modal-inner" style={{
            background: S.white,
            borderRadius: 20,
            padding: 20,
            width: '100%',
            maxWidth: 420,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: S.navy, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pencil size={15} color={S.purple} /> Edit Student
              </div>
              <button
                onClick={() => setEditStudent(null)}
                style={{ border: 'none', background: S.redBg, color: S.red, borderRadius: 8, padding: 8, cursor: 'pointer', minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <input value={editName}  onChange={e => setEditName(e.target.value)}  placeholder="Student name"  style={inp} />
            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Phone number"  style={inp} />
            <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email ID"      style={inp} />

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: S.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>📅 Joining Date</label>
              <input
                type="date"
                value={editJoiningDate}
                onChange={e => setEditJoiningDate(e.target.value)}
                style={{ ...inp, marginBottom: 0 }}
              />
            </div>

            <button
              onClick={handleEditSave}
              style={{ width: '100%', padding: 14, background: S.purple, color: S.white, border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', marginTop: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 48 }}
            >
              <Check size={16} /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ── TOP BAR — FIX: all action buttons are now INSIDE the topbar ── */}
      <div style={{
        background: S.white,
        padding: '0 12px',
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        paddingBottom: '12px',
        borderBottom: `1px solid ${S.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: 700, color: S.navy, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          🍱 Didi's Mess
        </div>

        {/* Action buttons — all inside topbar now */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Backup */}
          <button className="topbar-action" onClick={handleFullBackup} title="Download Full Backup">
            <Download size={17} color={S.navy} />
            <span>BACKUP</span>
          </button>

          {/* Monthly Report */}
          <button className="topbar-action" onClick={downloadMonthlyReport} title="Monthly Report">
            <FileText size={17} color={S.navy} />
            <span>REPORT</span>
          </button>

          {/* Bell — only shown when there are alerts */}
          {alerts.length > 0 && <BellRing size={22} color="#ff9800" />}
        </div>
      </div>

      {/* MONTH SELECTOR */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px', margin: '10px 12px 0', background: S.white, borderRadius: '12px', border: `1px solid ${S.border}` }}>
        <select
          value={allDaysMode ? 'all' : viewMonth}
          onChange={(e) => {
            if (e.target.value === 'all') { setAllDaysMode(true); }
            else { setAllDaysMode(false); setViewMonth(parseInt(e.target.value)); }
          }}
          style={selectStyle}
        >
          <option value="all">📋 All Days</option>
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        {!allDaysMode && (
          <select value={viewYear} onChange={(e) => setViewYear(parseInt(e.target.value))} style={selectStyle}>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        )}
      </div>

      {/* ALL DAYS — Joining Dates Panel */}
      {allDaysMode && (
        <div style={{ margin: '10px 12px 0', background: S.white, borderRadius: 14, padding: '12px', border: `1px solid ${S.navyBorder}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.navy, marginBottom: 8 }}>📅 Students Joining Dates</div>
          {students.length === 0 && <div style={{ fontSize: 12, color: S.muted }}>Koi student nahi mila.</div>}
          {students.map(s => (
            <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', borderBottom: `1px solid ${S.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: S.text }}>{s.name}</span>
              <span style={{ fontSize: 12, color: S.muted }}>
                {s.joiningDate
                  ? new Date(s.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : s.createdAt
                  ? new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* STATS CARDS */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, padding: '10px 12px 14px' }}>
        <div style={{ background: S.white, borderRadius: 12, padding: '12px 5px', textAlign: 'center', borderLeft: `3px solid ${S.green}` }}>
          <div style={{ fontSize: 8, color: S.muted, textTransform: 'uppercase' }}>Udhari</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.green }}>₹{totalRevenue}</div>
        </div>
        <div style={{ background: S.white, borderRadius: 12, padding: '12px 5px', textAlign: 'center', borderLeft: `3px solid ${S.red}` }}>
          <div style={{ fontSize: 8, color: S.muted, textTransform: 'uppercase' }}>Expense</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.red }}>₹{totalExp}</div>
        </div>
        <div style={{ background: S.white, borderRadius: 12, padding: '12px 5px', textAlign: 'center', borderLeft: `3px solid ${S.navy}` }}>
          <div style={{ fontSize: 8, color: S.muted, textTransform: 'uppercase' }}>Profit</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: netProfit >= 0 ? S.green : S.red }}>₹{netProfit}</div>
        </div>
        <div style={{ background: S.white, borderRadius: 12, padding: '12px 5px', textAlign: 'center', borderLeft: `3px solid ${S.blue}` }}>
          <div style={{ fontSize: 8, color: S.muted, textTransform: 'uppercase' }}>Students</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.blue }}>{students.length}</div>
        </div>
      </div>

      {/* ALERTS */}
      {alerts.length > 0 && (
        <div style={{ margin: '0 12px 14px', background: S.amberBg, borderRadius: 14, padding: '12px', border: `1px solid ${S.amberBorder}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.amber, marginBottom: 8 }}>⚠️ Payment Alerts ({alerts.length})</div>
          {alerts.map(s => (
            <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: S.white, padding: '10px', borderRadius: 8, marginBottom: 5, gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                <span style={{ fontSize: 10, color: S.red }}>{s.daysPassed} Days Overdue</span>
              </div>
              <button
                onClick={() => handleEmailReminder(s)}
                style={{ fontSize: 11, background: S.red, border: 'none', color: S.white, fontWeight: 700, padding: '8px 10px', borderRadius: 5, whiteSpace: 'nowrap', minHeight: 36, cursor: 'pointer' }}
              >
                Alert Email
              </button>
            </div>
          ))}
        </div>
      )}

      {/* REGISTER FORM */}
      <div style={{ margin: '0 12px 14px', background: S.white, borderRadius: 16, padding: 16, border: `1px solid ${S.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserPlus size={16} color={S.navy}/> New Registration
        </div>
        <form onSubmit={handleAdd}>
          <input value={name}     onChange={e => setName(e.target.value)}     placeholder="Student name"              required style={inp} />
          <input value={phone}    onChange={e => setPhone(e.target.value)}    placeholder="Phone number (Login ID)"   required style={inp} />
          <input value={email}    onChange={e => setEmail(e.target.value)}    placeholder="Email ID (for alerts)"              style={inp} />
          <input type="password"
                 value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter Password (e.g. 1234)" required style={inp} />
          <button
            type="submit"
            style={{ width: '100%', padding: 14, background: S.navy, color: S.white, border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 15, minHeight: 48 }}
          >
            Register Student
          </button>
        </form>
      </div>

      {/* SEARCH */}
      <div style={{ padding: '0 12px 15px' }}>
        <input
          type="text"
          placeholder="🔍 Search students..."
          style={{ ...inp, borderRadius: 25, marginBottom: 0 }}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* STUDENT LIST */}
      <div style={{ padding: '0 12px' }}>
        {filteredStudents.length === 0 && (
          <div style={{ textAlign: 'center', color: S.muted, fontSize: 14, padding: '24px 0' }}>
            Koi student nahi mila 🔍
          </div>
        )}
        {filteredStudents.map(s => (
          <div key={s._id} style={{
            background: S.white,
            borderRadius: 16,
            padding: '12px 10px',
            marginBottom: 10,
            border: `1px solid ${S.border}`,
            borderLeft: `5px solid ${s.totalDue > 1500 ? S.red : S.green}`,
          }}>
            {/* Top row: avatar + name + bill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: S.navyBg, color: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {getInitials(s.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: s.totalDue > 0 ? S.red : S.green, fontWeight: 'bold' }}>Bill: ₹{s.totalDue}</div>
              </div>
            </div>

            {/* Button row */}
            <div className="btn-row">
              <button onClick={() => handleCall(s.phone)}   style={ibtn('call')} title="Call"><Phone   size={14}/></button>
              <button onClick={() => openEdit(s)}           style={ibtn('edit')} title="Edit"><Pencil  size={14}/></button>
              <button onClick={() => downloadBill(s)}       style={ibtn('bill')} title="Bill PDF"><Download size={14}/></button>
              <button onClick={() => sendWelcomeMessage(s)} style={ibtn('link')} title="WhatsApp"><MessageCircle size={14}/></button>
              <button onClick={() => handlePay(s._id)}      style={ibtn('paid')}>Paid</button>
              <button
                onClick={() => handleDelete(s._id)}
                style={{ border: 'none', background: S.redBg, color: S.red, borderRadius: 8, padding: 9, cursor: 'pointer', minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Delete"
              >
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Dashboard;