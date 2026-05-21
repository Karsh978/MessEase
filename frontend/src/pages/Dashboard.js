import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus, BellRing, Download, MessageCircle, Trash2, Loader2,
  Phone, Pencil, X, Check, FileText, Send, ArrowUpDown,
  Navigation, Moon, Sun, ArrowUp, TrendingUp, AlertCircle
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchStudents, fetchExpenses, payFees, addStudent, fetchAlerts, deleteStudent, API } from '../api';

const getInitials = (name = '') =>
  name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

// ── Theme Palettes ────────────────────────────────────────
const LIGHT = {
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
  orange:      '#E65100',
  orangeBg:    '#FFF3E0',
  topbar:      '#FFFFFF',
  cardBg:      '#FFFFFF',
  inputBg:     '#F8FAFF',
  statBg:      '#FFFFFF',
};

const DARK = {
  navy:        '#93B4FF',
  navyBg:      '#1A2540',
  navyBorder:  '#2A3A5A',
  green:       '#4ADE80',
  greenBg:     '#0D2818',
  red:         '#FF6B6B',
  redBg:       '#2A0D0D',
  amber:       '#FCD34D',
  amberBg:     '#1F1500',
  amberBorder: '#4A3500',
  border:      '#1E2A40',
  pageBg:      '#0A0F1E',
  white:       '#0F1629',
  text:        '#E8EEFF',
  muted:       '#5A6A8A',
  blue:        '#60A5FA',
  blueBg:      '#0D1A2E',
  purple:      '#A78BFA',
  purpleBg:    '#1A0F2E',
  orange:      '#FB923C',
  orangeBg:    '#1F0D00',
  topbar:      '#0D1220',
  cardBg:      '#111827',
  inputBg:     '#0D1220',
  statBg:      '#111827',
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

  // Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('didi_dark') === 'true'; } catch { return false; }
  });
  const S = darkMode ? DARK : LIGHT;

  useEffect(() => {
    try { localStorage.setItem('didi_dark', darkMode); } catch {}
    document.body.style.background = S.pageBg;
    document.body.style.color = S.text;
  }, [darkMode]);

  // Edit Modal
  const [editStudent, setEditStudent]         = useState(null);
  const [editName, setEditName]               = useState('');
  const [editPhone, setEditPhone]             = useState('');
  const [editEmail, setEditEmail]             = useState('');
  const [editJoiningDate, setEditJoiningDate] = useState('');

  // Broadcast
  const [showBroadcast, setShowBroadcast]       = useState(false);
  const [mealMsg, setMealMsg]                   = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // Sort
  const [sortByJoining, setSortByJoining] = useState(false);

  // Jump to student
  const [showJumpMenu, setShowJumpMenu] = useState(false);
  const [jumpSearch, setJumpSearch]     = useState('');
  const studentRefs = useRef({});
  const jumpInputRef = useRef(null);

  // Scroll to top
  const [showScrollTop, setShowScrollTop] = useState(false);

  const today = new Date();
  const [viewMonth, setViewMonth]     = useState(today.getMonth());
  const [viewYear, setViewYear]       = useState(today.getFullYear());
  const [allDaysMode, setAllDaysMode] = useState(false);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const msgTemplates = [
    { label: 'Aaj ka Menu',   text: "Didi's Mess - Aaj ka Menu\n\nBreakfast: Poha + Chai\nLunch: Dal, Chawal, Sabzi, Roti\nDinner: Paneer + Roti + Dal\n\nSabko Namaste!" },
    { label: 'Payment Alert', text: "Didi's Mess - Payment Reminder\n\nKripya apna is mahine ka mess bill jald se jald jama karein.\n\nDhanyawad" },
    { label: 'Festival',      text: "Didi's Mess ki taraf se aap sabko dher saari shubhkamnayein!\n\nAaj special khana banaya hai. Zaroor aayein!" },
    { label: 'Closed',        text: "Didi's Mess - Notice\n\nKal mess band rahega. Kripya apna khana arrange kar lein.\n\nAssuvida ke liye khed hai." },
  ];

  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      await Promise.all([loadData(), getAlerts()]);
      setLoading(false);
    };
    initLoad();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!showJumpMenu) return;
    const handler = (e) => {
      if (!e.target.closest('.jump-menu-container') && !e.target.closest('.jump-fab-btn')) {
        setShowJumpMenu(false);
        setJumpSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showJumpMenu]);

  useEffect(() => {
    if (showJumpMenu && jumpInputRef.current) {
      setTimeout(() => jumpInputRef.current?.focus(), 100);
    }
  }, [showJumpMenu]);

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
    // 1. Aapka Portal Link (ID ke saath)
    const portalURL = `https://mess-ease-fawn.vercel.app/my-portal/${student._id}`; 
    
    // 2. Aapka WhatsApp Group Link
    const groupLink = "https://chat.whatsapp.com/J5TdPYwLKjJ5IAHtyJB0y6"; 

    const msg = `Namaste ${student.name}! 🙏
Didi's Mess mein aapka swagat hai. 🍱

Ab se aap apni roz ki attendance aur bill niche diye gaye link par click karke LIVE dekh sakte hain:
🔗 Link: ${portalURL}

📱 Login ID: ${student.phone}
🔑 PIN: ${student.password || '1234'}

⚠️ Zaroori updates aur chutti ki jankari ke liye hamara WhatsApp Group zaroor join karein:
📢 Group Link: ${groupLink}

Kripya is link ko save kar lein. Dhanyawad! ✨`;

    // WhatsApp par message bhejne ke liye
    window.open(`https://wa.me/${student.phone}?text=${encodeURIComponent(msg)}`, '_blank');
};

  const handleEmailReminder = async (student) => {
    if (!student.email) return alert("email not found!");
    try {
      await API.post('/students/send-email-reminder', { email: student.email, name: student.name, totalDue: student.totalDue });
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
      autoTable(doc, {
        startY: 82,
        head: [['#', 'Student Name', 'Phone', 'Total Due (INR)']],
        body: students.map((s, i) => [i + 1, s.name, s.phone || '-', s.totalDue || 0]),
        theme: 'grid',
        headStyles: { fillColor: [27, 58, 107] },
      });
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 120;
      doc.setFontSize(13);
      doc.text("Expenses Breakdown", 15, finalY);
      autoTable(doc, {
        startY: finalY + 6,
        head: [['Date', 'Description', 'Amount (INR)']],
        body: filteredExpenses.map(e => [
          new Date(e.date).toLocaleDateString('en-IN'),
          e.description || '-',
          e.amount || 0,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [192, 57, 43] },
      });
      doc.save(`Monthly_Report_${months[viewMonth]}_${viewYear}.pdf`);
    } catch (err) { alert("Monthly Report PDF error!"); }
  };

  const handleBroadcast = async () => {
    if (!mealMsg) return alert("Pehle message likhein ya template choose karein!");
    try {
      const res = await API.post('https://messease-95bo.onrender.com/api/admin/send-notification', {
        title: "Didi's Mess Alert",
        body: mealMsg
      });
      alert("Sent! " + res.data.msg);
    } catch (err) {
      alert("Notification failed. Backend check karein.");
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

  const handleCall = (phoneNumber) => { window.location.href = `tel:${phoneNumber}`; };

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
      setLoading(true);
      const res = await API.put(`/students/update-profile/${editStudent._id}`, {
        name: editName, phone: editPhone, email: editEmail, joiningDate: editJoiningDate,
      });
      if (res.data) {
        alert("Student details updated successfully!");
        setEditStudent(null);
        loadData();
      }
    } catch (err) {
      alert("Update fail ho gaya! Console check karein.");
    } finally { setLoading(false); }
  };

  const handleJumpTo = (studentId) => {
    const el = studentRefs.current[studentId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = `0 0 0 3px ${S.orange}, 0 4px 20px rgba(230,81,0,0.35)`;
      el.style.transition = 'box-shadow 0.3s ease';
      setTimeout(() => { el.style.boxShadow = ''; }, 2000);
    }
    setShowJumpMenu(false);
    setJumpSearch('');
  };

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
      alert("Backup Download Ho Gaya!");
    } catch (err) { alert("Backup nahi ho paya."); }
  };

  const formatJoiningDate = (student) => {
    const raw = student.joiningDate || student.createdAt;
    if (!raw) return 'N/A';
    return new Date(raw).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ── CHANGED: Day-based label instead of month-based ──
  const getJoiningDayLabel = (student) => {
    const raw = student.joiningDate || student.createdAt;
    if (!raw) return '';
    const day = new Date(raw).getDate();
    const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
    return `${day}${suffix} Tarikh`;
  };

  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  const totalExp     = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalRevenue = students.reduce((sum, s) => sum + (s.totalDue || 0), 0);
  const netProfit    = totalRevenue - totalExp;

  // ── CHANGED: Sort by day-of-month (getDate) instead of full date ──
  const filteredStudents = students
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (!sortByJoining) return 0;
      const dayA = new Date(a.joiningDate || a.createdAt || 0).getDate();
      const dayB = new Date(b.joiningDate || b.createdAt || 0).getDate();
      return dayA - dayB;
    });

  const jumpStudents = students.filter(s =>
    s.name.toLowerCase().includes(jumpSearch.toLowerCase()) ||
    (s.phone || '').includes(jumpSearch)
  );

  const highDueStudents = students.filter(s => s.totalDue > 1500).sort((a, b) => b.totalDue - a.totalDue);
  const paidCount   = students.filter(s => !s.totalDue || s.totalDue === 0).length;
  const unpaidCount = students.length - paidCount;
  const paidPercent = students.length ? Math.round((paidCount / students.length) * 100) : 0;

  // ── CHANGED: Group by day label ──
  let groupedDisplay = null;
  if (sortByJoining) {
    const groups = {};
    filteredStudents.forEach(s => {
      const key = getJoiningDayLabel(s) || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    groupedDisplay = Object.entries(groups);
  }

  const isMobile = window.innerWidth <= 480;

  const inp = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1.5px solid ${S.border}`,
    fontSize: 16,
    color: S.text,
    background: S.inputBg,
    outline: 'none',
    marginBottom: 10,
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
  };

  const ibtn = (variant) => {
    const map = {
      bill: { background: S.navyBg,   color: S.navy   },
      link: { background: S.greenBg,  color: S.green  },
      paid: { background: S.navy,     color: darkMode ? '#0A0F1E' : '#FFFFFF' },
      call: { background: S.blueBg,   color: S.blue   },
      edit: { background: S.purpleBg, color: S.purple },
    };
    return {
      border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700,
      cursor: 'pointer', padding: isMobile ? '9px 9px' : '7px 10px',
      display: 'flex', alignItems: 'center', gap: 3,
      whiteSpace: 'nowrap', minWidth: 36, minHeight: 36,
      justifyContent: 'center', ...map[variant],
    };
  };

  const selectStyle = {
    padding: '10px', borderRadius: '8px', border: `1px solid ${S.border}`,
    flex: 1, background: S.cardBg, fontSize: '13px', fontWeight: '600',
    color: S.navy, WebkitAppearance: 'none', appearance: 'none',
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: S.pageBg }}>
        <div style={{ width: 50, height: 50, border: `4px solid ${S.navyBg}`, borderTop: `4px solid ${S.navy}`, borderRadius: '50%', animation: 'rotate 1s linear infinite' }} />
        <p style={{ marginTop: 15, color: S.navy, fontWeight: 600, fontSize: 16 }}>Didi's Mess loading...</p>
        <style>{'@keyframes rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}</style>
      </div>
    );
  }

  return (
    <div
      className="dashboard-root"
      style={{ background: S.pageBg, minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif", paddingBottom: 130, transition: 'background 0.35s ease', color: S.text }}
    >
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; width: 100%; max-width: 100vw; overflow-x: hidden; }
        input, select, textarea { font-size: 16px !important; -webkit-text-size-adjust: 100%; max-width: 100%; }
        .dashboard-root { width: 100%; max-width: 100vw; overflow-x: hidden; }
        button { -webkit-tap-highlight-color: transparent; cursor: pointer; }

        .topbar {
          width: 100%; background: ${S.topbar};
          padding: 12px; padding-top: calc(12px + env(safe-area-inset-top));
          border-bottom: 1px solid ${S.border};
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          position: sticky; top: 0; z-index: 100;
          transition: background 0.35s ease, border-color 0.35s ease;
        }
        .topbar-title { font-size: 15px; font-weight: 700; color: ${S.navy}; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .topbar-actions { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
        .topbar-action { display: flex; align-items: center; gap: 4px; background: ${S.navyBg}; padding: 6px 10px; border-radius: 8px; border: none; min-height: 36px; }
        .topbar-action span { font-size: 10px; font-weight: 700; color: ${S.navy}; }
        .topbar-action-orange { background: ${S.orangeBg} !important; }
        .topbar-action-orange span { color: ${S.orange} !important; }

        .btn-row { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; margin-top: 10px; }
        .edit-modal-inner { max-height: 90vh; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        input[type="date"] { min-height: 44px; }

        .broadcast-panel { margin: 0 12px 14px; background: ${S.cardBg}; border-radius: 16px; padding: 16px; border: 1.5px solid ${S.orange}; animation: slideDown .25s ease; }
        .template-chip { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 20px; border: 1px solid ${S.border}; background: ${S.navyBg}; font-size: 11px; font-weight: 600; cursor: pointer; color: ${S.text}; white-space: nowrap; }
        .broadcast-send-btn { width: 100%; padding: 14px; background: linear-gradient(135deg,#E65100,#FF8F00); color: #fff; border: none; border-radius: 10px; font-weight: 700; font-size: 15px; min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 12px; }
        .broadcast-send-btn:disabled { opacity: .6; }

        .sort-banner { margin: 0 12px 10px; background: ${S.purpleBg}; border: 1.5px solid ${darkMode ? '#4C1D95' : '#C4B5FD'}; border-radius: 10px; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; animation: slideDown .2s ease; }
        .sort-banner-text { font-size: 11px; font-weight: 700; color: ${S.purple}; display: flex; align-items: center; gap: 5px; }
        .sort-clear-btn { border: 1px solid ${darkMode ? '#4C1D95' : '#C4B5FD'}; background: ${S.purpleBg}; color: ${S.purple}; border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 3px; }

        .month-group-header { display: flex; align-items: center; gap: 8px; margin: 12px 0 6px; }
        .month-group-label { font-size: 11px; font-weight: 800; color: ${S.purple}; background: ${S.purpleBg}; border: 1px solid ${darkMode ? '#4C1D95' : '#C4B5FD'}; border-radius: 20px; padding: 3px 10px; white-space: nowrap; }
        .month-group-line { flex: 1; height: 1px; background: ${darkMode ? '#4C1D95' : '#C4B5FD'}; opacity: .5; }

        .jump-fab { position: fixed; bottom: calc(24px + env(safe-area-inset-bottom)); right: 16px; z-index: 50; }
        .jump-fab-btn { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg,#1B3A6B,#2563EB); border: none; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(27,58,107,.4); transition: transform .15s; }
        .jump-fab-btn:active { transform: scale(.93); }
        .jump-count-badge { position: absolute; top: -4px; right: -4px; background: #E65100; color: white; font-size: 9px; font-weight: 800; border-radius: 10px; padding: 2px 5px; min-width: 18px; text-align: center; border: 2px solid ${S.pageBg}; }

        .jump-menu-container { position: fixed; bottom: calc(84px + env(safe-area-inset-bottom)); right: 12px; z-index: 51; width: min(300px,calc(100vw - 24px)); background: ${S.cardBg}; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,${darkMode ? '.5' : '.15'}); border: 1.5px solid ${S.navyBorder}; overflow: hidden; animation: jumpMenuIn .2s cubic-bezier(.34,1.56,.64,1); }
        @keyframes jumpMenuIn { from{opacity:0;transform:translateY(12px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        .jump-menu-header { padding: 10px 12px 8px; border-bottom: 1px solid ${S.border}; display: flex; align-items: center; justify-content: space-between; }
        .jump-menu-title { font-size: 12px; font-weight: 800; color: ${S.navy}; display: flex; align-items: center; gap: 5px; }
        .jump-search-wrap { padding: 8px 10px; border-bottom: 1px solid ${S.border}; }
        .jump-search-inp { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1.5px solid ${S.border}; font-size: 13px; background: ${S.inputBg}; outline: none; color: ${S.text}; box-sizing: border-box; }
        .jump-search-inp:focus { border-color: ${S.navy}; }
        .jump-list { max-height: 280px; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        .jump-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid ${S.border}; }
        .jump-item:active { background: ${S.navyBg}; }
        .jump-item-avatar { width: 32px; height: 32px; border-radius: 50%; background: ${S.navyBg}; color: ${S.navy}; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .jump-item-name { font-size: 13px; font-weight: 700; color: ${S.text}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .jump-item-sub { font-size: 10px; color: ${S.muted}; }
        .jump-empty { padding: 20px; text-align: center; font-size: 13px; color: ${S.muted}; }

        .scroll-top-btn { position: fixed; bottom: calc(24px + env(safe-area-inset-bottom)); left: 16px; z-index: 50; width: 44px; height: 44px; border-radius: 50%; background: ${S.cardBg}; border: 1.5px solid ${S.border}; color: ${S.navy}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 12px rgba(0,0,0,${darkMode ? '.4' : '.1'}); transition: transform .2s; }
        .scroll-top-btn:active { transform: scale(.9); }

        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .spinning { animation: rotate 1s linear infinite; }

        @media (max-width: 380px) {
          .topbar-action span { display: none; }
          .topbar-action { padding: 6px 8px; }
        }
      `}</style>

      {/* ── EDIT MODAL ── */}
      {editStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="edit-modal-inner" style={{ background: S.cardBg, borderRadius: 20, padding: 20, width: '100%', maxWidth: 420, border: `1px solid ${S.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: S.navy, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pencil size={15} color={S.purple} /> Edit Student
              </div>
              <button onClick={() => setEditStudent(null)} style={{ border: 'none', background: S.redBg, color: S.red, borderRadius: 8, padding: 8, minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <input value={editName}  onChange={e => setEditName(e.target.value)}  placeholder="Student name"  style={inp} />
            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Phone number"  style={inp} />
            <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email ID"      style={inp} />
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: S.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Joining Date</label>
              <input type="date" value={editJoiningDate} onChange={e => setEditJoiningDate(e.target.value)} style={{ ...inp, marginBottom: 0 }} />
            </div>
            <button onClick={handleEditSave} style={{ width: '100%', padding: 14, background: S.purple, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, marginTop: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 48 }}>
              <Check size={16} /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div className="topbar">
        <div className="topbar-title">Didi's Mess</div>
        <div className="topbar-actions">

          {/* DARK MODE TOGGLE */}
          <button
            onClick={() => setDarkMode(prev => !prev)}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
            style={{
              border: 'none',
              background: darkMode ? '#1E293B' : '#E8ECF4',
              borderRadius: 20,
              padding: 3,
              display: 'flex',
              alignItems: 'center',
              width: 58,
              height: 32,
              position: 'relative',
              transition: 'background 0.35s ease',
              flexShrink: 0,
            }}
          >
            <span style={{ position: 'absolute', left: 7, fontSize: 11, opacity: darkMode ? 0 : 1, transition: 'opacity 0.3s' }}>
              <Sun size={12} color="#1B3A6B" />
            </span>
            <span style={{ position: 'absolute', right: 7, fontSize: 11, opacity: darkMode ? 1 : 0, transition: 'opacity 0.3s' }}>
              <Moon size={12} color="#93B4FF" />
            </span>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: darkMode ? '#93B4FF' : '#1B3A6B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.35s',
              transform: `translateX(${darkMode ? '26px' : '0px'})`,
              zIndex: 1,
            }}>
              {darkMode ? <Moon size={13} color="#0A0F1E" /> : <Sun size={13} color="#FFFFFF" />}
            </div>
          </button>

          <button className="topbar-action topbar-action-orange" onClick={() => setShowBroadcast(prev => !prev)}>
            <Send size={17} color={S.orange} /><span>NOTIFY</span>
          </button>
          <button className="topbar-action" onClick={handleFullBackup}>
            <Download size={17} color={S.navy} /><span>BACKUP</span>
          </button>
          <button className="topbar-action" onClick={downloadMonthlyReport}>
            <FileText size={17} color={S.navy} /><span>REPORT</span>
          </button>
          {alerts.length > 0 && <BellRing size={22} color="#ff9800" />}
        </div>
      </div>

      {/* ── BROADCAST PANEL ── */}
      {showBroadcast && (
        <div className="broadcast-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: S.orange, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Send size={15} color={S.orange} /> Broadcast Notification
            </div>
            <button onClick={() => { setShowBroadcast(false); setMealMsg(''); }} style={{ border: 'none', background: S.redBg, color: S.red, borderRadius: 8, padding: 8, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: S.muted, fontWeight: 600, marginBottom: 6 }}>Quick Templates:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {msgTemplates.map((t, i) => (
                <button key={i} className="template-chip" onClick={() => setMealMsg(t.text)}>{t.label}</button>
              ))}
            </div>
          </div>
          <textarea
            value={mealMsg} onChange={e => setMealMsg(e.target.value)}
            placeholder="Yahan apna message likhein..." rows={5}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${mealMsg ? S.orange : S.border}`, fontSize: 14, color: S.text, background: S.inputBg, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .2s' }}
          />
          <div style={{ fontSize: 10, color: S.muted, textAlign: 'right', marginTop: 3 }}>{mealMsg.length} characters</div>
          <button className="broadcast-send-btn" onClick={handleBroadcast} disabled={broadcastLoading || !mealMsg.trim()}>
            {broadcastLoading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'rotate 1s linear infinite' }} /> Sending...</>
              : <><Send size={16} /> Sabko Notification Bhejo ({students.length} students)</>
            }
          </button>
        </div>
      )}

      {/* ── MONTH SELECTOR ── */}
      <div style={{ display: 'flex', gap: 8, padding: 12, margin: '10px 12px 0', background: S.cardBg, borderRadius: 12, border: `1px solid ${S.border}` }}>
        <select value={allDaysMode ? 'all' : viewMonth} onChange={e => { if (e.target.value === 'all') setAllDaysMode(true); else { setAllDaysMode(false); setViewMonth(parseInt(e.target.value)); } }} style={selectStyle}>
          <option value="all">All Days</option>
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        {!allDaysMode && (
          <select value={viewYear} onChange={e => setViewYear(parseInt(e.target.value))} style={selectStyle}>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        )}
      </div>

      {/* ── ALL DAYS Panel ── */}
      {allDaysMode && (
        <div style={{ margin: '10px 12px 0', background: S.cardBg, borderRadius: 14, padding: 12, border: `1px solid ${S.navyBorder}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.navy, marginBottom: 8 }}>Students Joining Dates</div>
          {students.length === 0 && <div style={{ fontSize: 12, color: S.muted }}>Koi student nahi mila.</div>}
          {students.map(s => (
            <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', borderBottom: `1px solid ${S.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: S.text }}>{s.name}</span>
              <span style={{ fontSize: 12, color: S.muted }}>{formatJoiningDate(s)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── STATS CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: '10px 12px 6px' }}>
        {[
          { label: 'Udhari',   value: `${totalRevenue}`, color: S.green },
          { label: 'Expense',  value: `${totalExp}`,     color: S.red   },
          { label: 'Profit',   value: `${netProfit}`,    color: netProfit >= 0 ? S.green : S.red },
          { label: 'Students', value: `${students.length}`, color: S.blue  },
        ].map((card, i) => (
          <div key={i} style={{ background: S.statBg, borderRadius: 12, padding: '12px 5px', textAlign: 'center', borderLeft: `3px solid ${card.color}`, transition: 'background 0.35s' }}>
            <div style={{ fontSize: 8, color: S.muted, textTransform: 'uppercase', marginBottom: 3 }}>{card.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: card.color }}>{i < 3 ? `Rs ${card.value}` : card.value}</div>
          </div>
        ))}
      </div>

      {/* ── ADVANCED: Payment Progress Bar ── */}
      <div style={{ margin: '6px 12px 0', background: S.cardBg, borderRadius: 12, padding: '10px 12px', border: `1px solid ${S.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.text, display: 'flex', alignItems: 'center', gap: 5 }}>
            <TrendingUp size={12} color={S.green} /> Payment Status
          </div>
          <div style={{ fontSize: 10, color: S.muted, fontWeight: 600 }}>
            {paidCount} Clear / {unpaidCount} Pending
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 10, background: S.border, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${paidPercent}%`, background: `linear-gradient(90deg,${S.green},#34D399)`, borderRadius: 10, transition: 'width .6s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 9, color: S.green, fontWeight: 700 }}>Clear {paidPercent}%</span>
          <span style={{ fontSize: 9, color: S.red,   fontWeight: 700 }}>Pending {100 - paidPercent}%</span>
        </div>
      </div>

      {/* ── ADVANCED: High Due Alert Chips ── */}
      {highDueStudents.length > 0 && (
        <div style={{ margin: '6px 12px 0', background: S.redBg, borderRadius: 14, padding: 12, border: `1.5px solid ${darkMode ? '#4A1515' : '#FFCDD2'}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.red, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertCircle size={13} color={S.red} /> Zyada Udhari ({highDueStudents.length}) — Rs 1500+
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {highDueStudents.slice(0, 5).map(s => (
              <div key={s._id} onClick={() => handleJumpTo(s._id)} style={{ background: S.cardBg, border: `1px solid ${darkMode ? '#4A1515' : '#FFCDD2'}`, borderRadius: 20, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                <span style={{ color: S.text }}>{s.name.split(' ')[0]}</span>
                <span style={{ color: S.red }}>Rs {s.totalDue}</span>
              </div>
            ))}
            {highDueStudents.length > 5 && (
              <div style={{ background: S.cardBg, borderRadius: 20, padding: '5px 10px', fontSize: 11, color: S.muted, fontWeight: 700 }}>+{highDueStudents.length - 5} more</div>
            )}
          </div>
        </div>
      )}

      {/* ── ALERTS ── */}
      {alerts.length > 0 && (
        <div style={{ margin: '6px 12px 0', background: S.amberBg, borderRadius: 14, padding: 12, border: `1px solid ${S.amberBorder}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.amber, marginBottom: 8 }}>Payment Alerts ({alerts.length})</div>
          {alerts.map(s => (
            <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: S.cardBg, padding: 10, borderRadius: 8, marginBottom: 5, gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: S.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                <span style={{ fontSize: 10, color: S.red }}>{s.daysPassed} Days Overdue</span>
              </div>
              <button onClick={() => handleEmailReminder(s)} style={{ fontSize: 11, background: S.red, border: 'none', color: '#fff', fontWeight: 700, padding: '8px 10px', borderRadius: 5, whiteSpace: 'nowrap', minHeight: 36 }}>
                Alert Email
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── REGISTER FORM ── */}
      <div style={{ margin: '8px 12px 14px', background: S.cardBg, borderRadius: 16, padding: 16, border: `1px solid ${S.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: S.text }}>
          <UserPlus size={16} color={S.navy} /> New Registration
        </div>
        <form onSubmit={handleAdd}>
          <input value={name}     onChange={e => setName(e.target.value)}     placeholder="Student name"            required style={inp} />
          <input value={phone}    onChange={e => setPhone(e.target.value)}    placeholder="Phone number (Login ID)" required style={inp} />
          <input value={email}    onChange={e => setEmail(e.target.value)}    placeholder="Email ID (for alerts)"            style={inp} />
          <input type="password"  value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter Password (e.g. 1234)" required style={inp} />
          <button type="submit" style={{ width: '100%', padding: 14, background: S.navy, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, minHeight: 48 }}>
            Register Student
          </button>
        </form>
      </div>

      {/* ── SEARCH + SORT ROW ── */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search students..."
          style={{ ...inp, borderRadius: 25, marginBottom: 0, flex: 1 }}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button
          onClick={() => setSortByJoining(prev => !prev)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '10px 12px',
            border: `1.5px solid ${sortByJoining ? S.purple : S.border}`,
            borderRadius: 25,
            background: sortByJoining ? S.purpleBg : S.cardBg,
            color: sortByJoining ? S.purple : S.muted,
            fontWeight: 700, fontSize: 11,
            whiteSpace: 'nowrap', minHeight: 44, flexShrink: 0,
            transition: 'all .15s ease',
          }}
        >
          <ArrowUpDown size={14} />
          {sortByJoining ? 'Sorted' : 'Sort'}
        </button>
      </div>

      {/* ── CHANGED: Sort banner text updated ── */}
      {sortByJoining && (
        <div className="sort-banner">
          <div className="sort-banner-text">
            <ArrowUpDown size={13} /> Tarikh ke hisaab se sort kiya (1 se 31)
          </div>
          <button className="sort-clear-btn" onClick={() => setSortByJoining(false)}>
            <X size={10} /> Hatao
          </button>
        </div>
      )}

      {/* ── STUDENT LIST ── */}
      <div style={{ padding: '0 12px' }}>
        {filteredStudents.length === 0 && (
          <div style={{ textAlign: 'center', color: S.muted, fontSize: 14, padding: '24px 0' }}>Koi student nahi mila</div>
        )}

        {/* ── CHANGED: groupedDisplay now uses getJoiningDayLabel ── */}
        {sortByJoining && groupedDisplay && groupedDisplay.map(([dayLabel, groupStudents]) => (
          <div key={dayLabel}>
            <div className="month-group-header">
              <div className="month-group-line" />
              <div className="month-group-label">{dayLabel}</div>
              <div className="month-group-line" />
            </div>
            {groupStudents.map(s => (
              <StudentCard key={s._id} s={s} studentRefs={studentRefs} formatJoiningDate={formatJoiningDate}
                S={S} isMobile={isMobile} ibtn={ibtn} handleCall={handleCall} openEdit={openEdit}
                downloadBill={downloadBill} sendWelcomeMessage={sendWelcomeMessage}
                handlePay={handlePay} handleDelete={handleDelete} />
            ))}
          </div>
        ))}

        {!sortByJoining && filteredStudents.map(s => (
          <StudentCard key={s._id} s={s} studentRefs={studentRefs} formatJoiningDate={formatJoiningDate}
            S={S} isMobile={isMobile} ibtn={ibtn} handleCall={handleCall} openEdit={openEdit}
            downloadBill={downloadBill} sendWelcomeMessage={sendWelcomeMessage}
            handlePay={handlePay} handleDelete={handleDelete} />
        ))}
      </div>

      {/* ── JUMP MENU ── */}
      {showJumpMenu && (
        <div className="jump-menu-container">
          <div className="jump-menu-header">
            <div className="jump-menu-title"><Navigation size={13} color={S.navy} /> Student dhundho</div>
            <button onClick={() => { setShowJumpMenu(false); setJumpSearch(''); }} style={{ border: 'none', background: S.redBg, color: S.red, borderRadius: 6, padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
              <X size={13} />
            </button>
          </div>
          <div className="jump-search-wrap">
            <input ref={jumpInputRef} className="jump-search-inp" placeholder="Naam ya phone se search..." value={jumpSearch} onChange={e => setJumpSearch(e.target.value)} />
          </div>
          <div className="jump-list">
            {jumpStudents.length === 0 && <div className="jump-empty">Koi student nahi mila</div>}
            {jumpStudents.map(s => (
              <div key={s._id} className="jump-item" onClick={() => handleJumpTo(s._id)}>
                <div className="jump-item-avatar">{getInitials(s.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="jump-item-name">{s.name}</div>
                  <div className="jump-item-sub">{formatJoiningDate(s)}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, color: s.totalDue > 0 ? S.red : S.green }}>Rs {s.totalDue}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FLOATING JUMP BUTTON ── */}
      <div className="jump-fab">
        <div style={{ position: 'relative' }}>
          <button className="jump-fab-btn" onClick={() => setShowJumpMenu(prev => !prev)} title="Kisi bhi student par seedha jaao">
            <Navigation size={22} />
          </button>
          <div className="jump-count-badge">{students.length}</div>
        </div>
      </div>

      {/* ── SCROLL TO TOP ── */}
      {showScrollTop && (
        <button className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="Upar jaao">
          <ArrowUp size={18} color={S.navy} />
        </button>
      )}

    </div>
  );
};

// ── StudentCard ───────────────────────────────────────────
const StudentCard = ({ s, studentRefs, formatJoiningDate, S, isMobile, ibtn, handleCall, openEdit, downloadBill, sendWelcomeMessage, handlePay, handleDelete }) => {
  const initials = (name = '') => name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      ref={el => { studentRefs.current[s._id] = el; }}
      style={{ background: S.cardBg, borderRadius: 16, padding: '12px 10px', marginBottom: 10, border: `1px solid ${S.border}`, borderLeft: `5px solid ${s.totalDue > 1500 ? S.red : S.green}`, transition: 'box-shadow 0.3s ease, background 0.35s ease' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: S.navyBg, color: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
          {initials(s.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: S.text }}>{s.name}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2, marginBottom: 2, background: S.navyBg, color: S.navy, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, border: `1px solid ${S.navyBorder}` }}>
            {formatJoiningDate(s)}
          </div>
          <div style={{ fontSize: 12, color: s.totalDue > 0 ? S.red : S.green, fontWeight: 'bold' }}>Bill: Rs {s.totalDue}</div>
        </div>
      </div>
      <div className="btn-row">
        <button onClick={() => handleCall(s.phone)}   style={ibtn('call')} title="Call">   <Phone         size={14} /></button>
        <button onClick={() => openEdit(s)}           style={ibtn('edit')} title="Edit">   <Pencil        size={14} /></button>
        <button onClick={() => downloadBill(s)}       style={ibtn('bill')} title="Bill PDF"><Download      size={14} /></button>
        <button onClick={() => sendWelcomeMessage(s)} style={ibtn('link')} title="WhatsApp"><MessageCircle size={14} /></button>
        <button onClick={() => handlePay(s._id)}      style={ibtn('paid')}>Paid</button>
        <button onClick={() => handleDelete(s._id)} style={{ border: 'none', background: S.redBg, color: S.red, borderRadius: 8, padding: 9, minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;