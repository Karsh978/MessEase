import React, { useState, useEffect } from 'react';
import { UserPlus, BellRing, Download, MessageCircle, Trash2, Loader2, Phone, Edit, X, Calendar } from 'lucide-react'; 
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchStudents, fetchExpenses, payFees, addStudent, fetchAlerts, deleteStudent, API } from '../api';

const S = {
  navy: '#1B3A6B', navyBg: '#EEF2FA', green: '#1E7E4A', greenBg: '#EAF5EF',
  red: '#C0392B', redBg: '#FDECEA', amber: '#8B6200', amberBg: '#FFF8E7',
  border: '#E8ECF4', pageBg: '#F0F4FF', white: '#FFFFFF', text: '#1A1A2E',
  muted: '#8A95B0', blue: '#2196F3', blueBg: '#E3F2FD'
};

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState(''); // Grouping by Day
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Registration States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('1234');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit States
  const [editingStudent, setEditingStudent] = useState(null);

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  useEffect(() => {
    loadData();
    getAlerts();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const sRes = await fetchStudents();
      const eRes = await fetchExpenses();
      setStudents(sRes.data || []);
      setExpenses(eRes.data || []);
    } catch (err) { console.log("Load error"); }
    setLoading(false);
  };

  const getAlerts = async () => {
    try { const res = await fetchAlerts(); setAlerts(res.data || []); } catch (err) { }
  };

  // --- EDIT FUNCTIONS ---
  const handleEditClick = (s) => {
    setEditingStudent({ ...s, joiningDate: s.joiningDate ? s.joiningDate.split('T')[0] : '' });
  };

  const handleSaveEdit = async () => {
    try {
      await API.put(`/students/update-profile/${editingStudent._id}`, editingStudent);
      alert("Student updated!");
      setEditingStudent(null);
      loadData();
    } catch (err) { alert("Update failed"); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addStudent({ name, phone, email, password, joiningDate, dailyRate: 0 });
      setName(''); setPhone(''); setEmail(''); setPassword('1234');
      loadData(); alert("Registered!");
    } catch (err) { alert("Failed!"); }
  };

  // --- ACTIONS ---
  const handleCall = (num) => window.location.href = `tel:${num}`;
  const handlePay = async (id) => { if (window.confirm("Payment receive ho gayi?")) { await payFees(id); loadData(); } };
  const handleDelete = async (id) => { if (window.confirm("Delete student?")) { await deleteStudent(id); loadData(); } };

  // ── FILTERING LOGIC ────────────────────────────────
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Grouping logic: Get Day from joiningDate (e.g., "01")
    const joinDay = s.joiningDate ? new Date(s.joiningDate).getDate().toString() : '';
    const matchesDay = filterDay === '' || joinDay === filterDay;

    return matchesSearch && matchesDay;
  });

  const totalRevenue = students.reduce((sum, s) => sum + (s.totalDue || 0), 0);

  const inp = { width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${S.border}`, marginBottom: 10, boxSizing: 'border-box' };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '100px' }}><Loader2 className="animate-spin" /></div>;

  return (
    <div style={{ background: S.pageBg, minHeight: '100vh', paddingBottom: 100 }}>
      {/* HEADER */}
      <div style={{ background: S.white, padding: '15px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between' }}>
        <b style={{ color: S.navy }}>Didi's Mess Dashboard</b>
        <div style={{ background: S.blue, color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>Total: {students.length}</div>
      </div>

      {/* 📊 STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 12 }}>
        <div style={{ background: S.white, padding: 10, borderRadius: 10, textAlign: 'center' }}>
            <small style={{ color: S.muted }}>UDHARI</small><br /><b>₹{totalRevenue}</b>
        </div>
        <div style={{ background: S.white, padding: 10, borderRadius: 10, textAlign: 'center' }}>
            <small style={{ color: S.muted }}>ALERTS</small><br /><b>{alerts.length}</b>
        </div>
        <div style={{ background: S.white, padding: 10, borderRadius: 10, textAlign: 'center' }}>
            <small style={{ color: S.muted }}>JOINING TODAY</small><br />
            <b>{students.filter(s => new Date(s.joiningDate).getDate() === today.getDate()).length}</b>
        </div>
      </div>

      {/* 🔍 SEARCH & GROUPING FILTER */}
      <div style={{ padding: '0 12px', display: 'flex', gap: 8, marginBottom: 10 }}>
        <input placeholder="🔍 Search name..." style={{ ...inp, borderRadius: 25, flex: 2, marginBottom: 0 }} onChange={e => setSearchTerm(e.target.value)} />
        
        <select 
          style={{ ...inp, borderRadius: 25, flex: 1, marginBottom: 0, fontSize: 12 }}
          value={filterDay}
          onChange={e => setFilterDay(e.target.value)}
        >
          <option value="">All Days</option>
          {[...Array(31)].map((_, i) => (
            <option key={i+1} value={i+1}>{i+1} Tarik</option>
          ))}
        </select>
      </div>

      {/* STUDENT LIST */}
      <div style={{ padding: '0 12px' }}>
        {filteredStudents.map(s => (
          <div key={s._id} style={{ background: S.white, borderRadius: 15, padding: 12, marginBottom: 10, borderLeft: `5px solid ${S.navy}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <b>{s.name}</b>
                <div style={{ fontSize: 11, color: S.muted }}>Join: {new Date(s.joiningDate).toLocaleDateString()}</div>
                <div style={{ fontSize: 13, color: S.red, fontWeight: 'bold' }}>Bill: ₹{s.totalDue}</div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => handleCall(s.phone)} style={{ padding: 8, border: 'none', borderRadius: 8, background: S.blueBg, color: S.blue }}><Phone size={14}/></button>
                <button onClick={() => handleEditClick(s)} style={{ padding: 8, border: 'none', borderRadius: 8, background: '#eee' }}><Edit size={14}/></button>
                <button onClick={() => handleDelete(s._id)} style={{ padding: 8, border: 'none', borderRadius: 8, background: S.redBg, color: S.red }}><Trash2 size={14}/></button>
              </div>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 5 }}>
                <button onClick={() => handlePay(s._id)} style={{ flex: 1, padding: 8, background: S.navy, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}>Pay Bill</button>
            </div>
          </div>
        ))}
      </div>

      {/* REGISTER FORM */}
      <div style={{ margin: '15px 12px', background: S.white, borderRadius: 15, padding: 15 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 10 }}><UserPlus size={16}/> New Student</div>
        <form onSubmit={handleAdd}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required style={inp} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" required style={inp} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={inp} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter Password (e.g. 1234)" style={inp} />
          <label style={{ fontSize: 11, color: S.muted }}>Joining Date:</label>
          <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} style={inp} />
          <button type="submit" style={{ width: '100%', padding: 12, background: S.navy, color: '#fff', border: 'none', borderRadius: 10 }}>Register</button>
        </form>
      </div>

      {/* --- EDIT MODAL --- */}
      {editingStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: '90%', maxWidth: '400px', padding: 20, borderRadius: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
              <b>Edit Student</b>
              <X onClick={() => setEditingStudent(null)} style={{ cursor: 'pointer' }}/>
            </div>
            <input value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} placeholder="Name" style={inp} />
            <input value={editingStudent.email} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} placeholder="Email" style={inp} />
            <input value={editingStudent.password} onChange={e => setEditingStudent({...editingStudent, password: e.target.value})} placeholder="Password" style={inp} />
            <label style={{ fontSize: 11 }}>Joining Date:</label>
            <input type="date" value={editingStudent.joiningDate} onChange={e => setEditingStudent({...editingStudent, joiningDate: e.target.value})} style={inp} />
            <button onClick={handleSaveEdit} style={{ width: '100%', padding: 12, background: S.green, color: '#fff', border: 'none', borderRadius: 10 }}>Update Student</button>
          </div>
        </div>
      )}

      <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Dashboard;