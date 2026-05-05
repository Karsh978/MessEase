import React, { useState, useEffect } from 'react';
import { 
  UserPlus, BellRing, Download, MessageCircle, Trash2, 
  Loader2, Phone, Pencil, X, Check, FileText, Zap, Send 
} from 'lucide-react'; 
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchStudents, fetchExpenses, payFees, addStudent, fetchAlerts, deleteStudent, API } from '../api';

const getInitials = (name = '') =>
  name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const S = {
  navy: '#1B3A6B', navyBg: '#EEF2FA', green: '#1E7E4A', red: '#C0392B', redBg: '#FDECEA', 
  amber: '#8B6200', amberBg: '#FFF8E7', blue: '#2196F3', blueBg: '#E3F2FD', 
  purple: '#7C3AED', purpleBg: '#F3EEFF', border: '#E8ECF4', white: '#FFFFFF', text: '#1A1A2E', muted: '#8A95B0',
};

const Dashboard = () => {
  const [students, setStudents]     = useState([]);
  const [expenses, setExpenses]     = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [mealMsg, setMealMessage]   = useState('');

  // ── FORM STATES ──
  const [name, setName] = useState(''); 
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('1234');

  // ── EDIT MODAL STATES (FIXED) ──
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState({
    _id: '', name: '', phone: '', email: '', password: '', joiningDate: ''
  });

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  useEffect(() => { initLoad(); }, []);
  const initLoad = async () => { setLoading(true); await Promise.all([loadData(), getAlerts()]); setLoading(false); };
  const loadData = async () => { try { const sRes = await fetchStudents(); const eRes = await fetchExpenses(); setStudents(sRes.data || []); setExpenses(eRes.data || []); } catch (err) { } };
  const getAlerts = async () => { try { const res = await fetchAlerts(); setAlerts(res.data || []); } catch (err) { } };

  // ── EDIT LOGIC (FIXED) ──
  const openEdit = (s) => {
    setEditingStudent({
      _id: s._id,
      name: s.name || '',
      phone: s.phone || '',
      email: s.email || '',
      password: s.password || '',
      joiningDate: s.joiningDate ? s.joiningDate.split('T')[0] : ''
    });
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    try {
      setLoading(true);
      // Backend route: /api/students/update-profile/:id
      await API.put(`/students/update-profile/${editingStudent._id}`, editingStudent);
      
      alert("✅ Student details updated!");
      setEditModalOpen(false);
      loadData(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("❌ Update failed! Check console.");
    } finally {
      setLoading(false);
    }
  };

  // ── ACTIONS ──
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addStudent({ name, phone, email, password, dailyRate: 100 });
      setName(''); setPhone(''); setPassword('1234');
      loadData(); alert("Registered!");
    } catch (err) { alert("Failed"); }
  };

  const handlePay = async (id) => { if (window.confirm("Confirm Payment?")) { await payFees(id); loadData(); } };
  const handleDelete = async (id) => { if (window.confirm("Delete Student?")) { await deleteStudent(id); loadData(); } };

  const totalRevenue = students.reduce((sum, s) => sum + (s.totalDue || 0), 0);
  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${S.border}`, fontSize: 15, color: S.text, background: '#F8FAFF', outline: 'none', marginBottom: 10, boxSizing: 'border-box' };
  const ibtn = (v) => { const m = { bill: {bg:S.navyBg, c:S.navy}, link: {bg:S.greenBg, c:S.green}, paid: {bg:S.navy, c:'#fff'}, call: {bg:S.blueBg, c:S.blue}, edit: {bg:S.purpleBg, c:S.purple} }; return { border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '9px', display: 'flex', alignItems: 'center', gap: 3, background: m[v].bg, color: m[v].c }; };

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader2 size={50} className="animate-spin" color={S.navy} /></div>;

  return (
    <div style={{ background: S.pageBg, minHeight: '100vh', paddingBottom: 100 }}>
      <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* TOP BAR */}
      <div style={{ background: S.white, padding: '16px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: S.navy }}>Didi's Dashboard</div>
        <div style={{ display: 'flex', gap: 15 }}>
            <FileText size={20} color={S.navy} style={{ cursor: 'pointer' }} />
            {alerts.length > 0 && <BellRing size={20} color="#ff9800" />}
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, padding: '12px 12px' }}>
        <div style={{ background: S.white, borderRadius: 12, padding: 10, textAlign: 'center', borderBottom: `3px solid ${S.green}` }}><div style={{fontSize: 8}}>UDHARI</div><div style={{fontSize: 12, fontWeight: 700}}>₹{totalRevenue}</div></div>
        <div style={{ background: S.white, borderRadius: 12, padding: 10, textAlign: 'center', borderBottom: `3px solid ${S.red}` }}><div style={{fontSize: 8}}>ALERTS</div><div style={{fontSize: 12, fontWeight: 700}}>{alerts.length}</div></div>
        <div style={{ background: S.white, borderRadius: 12, padding: 10, textAlign: 'center', borderBottom: `3px solid ${S.navy}` }}><div style={{fontSize: 8}}>MONTH</div><div style={{fontSize: 12, fontWeight: 700}}>{months[viewMonth].slice(0,3)}</div></div>
        <div style={{ background: S.white, borderRadius: 12, padding: 10, textAlign: 'center', borderBottom: `3px solid ${S.blue}` }}><div style={{fontSize: 8}}>TOTAL</div><div style={{fontSize: 12, fontWeight: 700}}>{students.length}</div></div>
      </div>

      {/* SEARCH */}
      <div style={{ padding: '0 12px 15px' }}><input type="text" placeholder="🔍 Search students..." style={{ ...inp, borderRadius: 25, marginBottom: 0 }} onChange={e => setSearchTerm(e.target.value)} /></div>

      {/* STUDENT LIST */}
      <div style={{ padding: '0 12px' }}>
        {filteredStudents.map(s => (
          <div key={s._id} style={{ background: S.white, borderRadius: 16, padding: 14, marginBottom: 10, border: `1px solid ${S.border}`, borderLeft: `5px solid ${s.totalDue > 1500 ? S.red : S.green}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: S.navyBg, color: S.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow:'hidden' }}>
                {s.profilePic ? <img src={s.profilePic} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/> : getInitials(s.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: s.totalDue > 0 ? S.red : S.green }}>Bill: ₹{s.totalDue}</div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => window.location.href=`tel:${s.phone}`} style={ibtn('call')}><Phone size={14}/></button>
                <button onClick={() => openEdit(s)} style={ibtn('edit')}><Pencil size={14}/></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
              <button onClick={() => handlePay(s._id)} style={ibtn('paid')}>Paid</button>
              <button onClick={() => handleDelete(s._id)} style={{ border: 'none', background: S.redBg, color: S.red, borderRadius: 8, padding: 8 }}><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* REGISTER FORM */}
      <div style={{ margin: '15px 12px', background: S.white, borderRadius: 16, padding: 16, border: `1px solid ${S.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}><UserPlus size={16}/> New Registration</div>
        <form onSubmit={handleAdd}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Student name" required style={inp} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" required style={inp} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter PIN (e.g. 1234)" required style={inp} />
          <button type="submit" style={{ width: '100%', padding: 12, background: S.navy, color: S.white, border: 'none', borderRadius: 10, fontWeight: 700 }}>Register Student</button>
        </form>
      </div>

      {/* ✏️ EDIT MODAL (FIXED) */}
      {editModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: S.white, borderRadius: 20, padding: 20, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems:'center' }}>
              <b style={{color: S.navy}}>Edit Student Details</b>
              <X size={20} onClick={() => setEditModalOpen(false)} style={{ cursor: 'pointer' }} />
            </div>
            
            <label style={{fontSize: 11, color: S.muted}}>Full Name</label>
            <input value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} style={inp} />
            
            <label style={{fontSize: 11, color: S.muted}}>Phone (Login ID)</label>
            <input value={editingStudent.phone} onChange={e => setEditingStudent({...editingStudent, phone: e.target.value})} style={inp} />
            
            <label style={{fontSize: 11, color: S.muted}}>Email</label>
            <input value={editingStudent.email} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} style={inp} />
            
            <label style={{fontSize: 11, color: S.muted}}>Joining Date</label>
            <input type="date" value={editingStudent.joiningDate} onChange={e => setEditingStudent({...editingStudent, joiningDate: e.target.value})} style={inp} />
            
            <button onClick={handleEditSave} style={{ width: '100%', padding: 14, background: S.purple, color: S.white, border: 'none', borderRadius: 10, fontWeight: 700, marginTop: 10 }}>
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;