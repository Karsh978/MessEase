import React, { useState, useEffect } from 'react';
import { fetchStudents, toggleMealAttendance, fetchAttendanceStatus, API } from '../api'; 
import { Sun, SunMedium, Moon, CheckCircle2, Loader2 } from 'lucide-react';

const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({}); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Refresh par theme na hate isliye localStorage check kar rahe hain
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' ? true : false;
  });

  // Jab bhi darkMode change ho, use save kar lo
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const sRes = await fetchStudents();
      const aRes = await fetchAttendanceStatus(date);
      setStudents(sRes.data);
      const map = {};
      if (aRes.data) {
        aRes.data.forEach(rec => {
          map[rec.studentId] = rec;
        });
      }
      setStatusMap(map);
    } catch (err) {
      console.error("Data load nahi hua");
    } finally {
      setLoading(false); 
    }
  };

  const toggleMeal = async (studentId, mealType) => {
    const price = mealType === 'breakfast' ? 25 : 50;
    const isRemoving = statusMap[studentId]?.[mealType];

    setStatusMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [mealType]: !prev[studentId]?.[mealType] }
    }));

    setStudents(prevStudents => 
      prevStudents.map(s => {
        if (s._id === studentId) {
          let newTotal = isRemoving ? (s.totalDue - price) : (s.totalDue + price);
          return { ...s, totalDue: Math.max(0, newTotal) };
        }
        return s;
      })
    );

    try {
      await toggleMealAttendance({ studentId, date, mealType });
    } catch (err) {
      loadData();
      setMessage("❌ Update nahi hua");
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const markAll = async (mealType) => {
    setMessage(`${mealType} marking...`);
    try {
      await API.post('/attendance/mark-all', { date: date, mealType: mealType });
      setMessage(`✅ Sabka ${mealType} mark ho gaya!`);
      loadData(); 
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage("❌ Error logic check karo.");
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Theme Styles
  const theme = {
    bg: darkMode ? '#000000' : '#f0f2f5',
    card: darkMode ? '#1c1c1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#1a1a1a',
    subText: darkMode ? '#a1a1a6' : '#666666',
    border: darkMode ? '#333' : '#ddd',
  };

  const allBtnStyle = {
    flex: 1,
    padding: '12px 5px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: '10px',
    color: '#fff',
    background: '#1a73e8',
    border: 'none',
    boxShadow: '0 4px 6px rgba(26,115,232,0.3)',
  };

  const getMealBtnStyle = (studentId, mealType) => {
    const isMarked = statusMap[studentId] && statusMap[studentId][mealType];
    return {
      background: isMarked ? (darkMode ? '#1e3a1f' : '#e8f5e9') : (darkMode ? '#2c2c2e' : '#f0f0f0'),
      border: isMarked ? `1px solid ${darkMode ? '#2e7d32' : '#a5d6a7'}` : '1px solid transparent',
      borderRadius: '12px',
      flex: 1,
      margin: '4px',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '15px 5px',
      transition: '0.2s all ease',
      transform: 'scale(1)',
    };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: theme.bg, color: theme.text }}>
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, transition: '0.3s' }}>
      <div style={{ maxWidth: '500px', margin: 'auto', padding: '15px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>🍱 Meal Tracker</h2>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            style={{ background: theme.card, border: 'none', padding: '10px', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', cursor: 'pointer' }}
          >
            {darkMode ? <Sun color="#ffcc00" size={20} /> : <Moon color="#3f51b5" size={20} />}
          </button>
        </div>

        {/* Date Selector Box */}
        <div style={{ background: theme.card, padding: '12px', borderRadius: '15px', marginBottom: '15px' }}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%', padding: '10px', border: 'none', background: 'transparent', color: theme.text, outline: 'none', fontSize: '16px' }}
          />
        </div>

        {/* Mobile Responsive Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button onClick={() => markAll('breakfast')} style={allBtnStyle}>All Morn</button>
          <button onClick={() => markAll('lunch')} style={allBtnStyle}>All Noon</button>
          <button onClick={() => markAll('dinner')} style={allBtnStyle}>All Night</button>
        </div>

        {message && <p style={{ textAlign: 'center', color: '#4caf50', fontWeight: 'bold' }}>{message}</p>}

        {/* Students List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {students.map(s => {
            const sStatus = statusMap[s._id] || {};
            return (
              <div key={s._id} style={{ background: theme.card, padding: '15px', borderRadius: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{s.name}</span>
                  <span style={{ color: '#4caf50', fontWeight: 'bold' }}>₹{s.totalDue}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button onClick={() => toggleMeal(s._id, 'breakfast')} style={getMealBtnStyle(s._id, 'breakfast')}>
                    {sStatus.breakfast ? <CheckCircle2 size={22} color="#4caf50" /> : <Sun size={22} color="#ff9800" />}
                    <span style={{ fontSize: '10px', marginTop: '5px' }}>Morn</span>
                  </button>
                  <button onClick={() => toggleMeal(s._id, 'lunch')} style={getMealBtnStyle(s._id, 'lunch')}>
                    {sStatus.lunch ? <CheckCircle2 size={22} color="#4caf50" /> : <SunMedium size={22} color="#f44336" />}
                    <span style={{ fontSize: '10px', marginTop: '5px' }}>Noon</span>
                  </button>
                  <button onClick={() => toggleMeal(s._id, 'dinner')} style={getMealBtnStyle(s._id, 'dinner')}>
                    {sStatus.dinner ? <CheckCircle2 size={22} color="#4caf50" /> : <Moon size={22} color="#3f51b5" />}
                    <span style={{ fontSize: '10px', marginTop: '5px' }}>Night</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: ${darkMode ? 'invert(1)' : 'none'};
        }
      `}</style>
    </div>
  );
};

export default Attendance;