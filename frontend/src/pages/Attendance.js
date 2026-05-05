import React, { useState, useEffect } from 'react';
import { fetchStudents, toggleMealAttendance, fetchAttendanceStatus, API } from '../api'; 
import { Sun, SunMedium, Moon, CheckCircle2, Loader2, Lightbulb, LightbulbOff } from 'lucide-react';

const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({}); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(false);

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
      [studentId]: {
        ...prev[studentId],
        [mealType]: !prev[studentId]?.[mealType]
      }
    }));

    setStudents(prevStudents => 
      prevStudents.map(s => {
        if (s._id === studentId) {
          let newTotal = isRemoving 
            ? (s.totalDue - price) 
            : (s.totalDue + price);
          return { ...s, totalDue: Math.max(0, newTotal) };
        }
        return s;
      })
    );

    try {
      await toggleMealAttendance({ studentId, date, mealType });
    } catch (err) {
      loadData();
      setMessage("❌ Update nahi hua, dobara try karo");
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const markAll = async (mealType) => {
    setMessage(`${mealType} sab ke liye mark ho raha hai...`);
    try {
      await API.post('/attendance/mark-all', { date: date, mealType: mealType });
      setMessage(`✅ Sabka ${mealType} mark ho gaya!`);
      loadData(); 
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage("❌ Nahi ho paya. Backend terminal check karo.");
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // --- Dynamic Styles Based on Dark Mode ---
  const theme = {
    bg: darkMode ? '#121212' : '#f4f4f9',
    card: darkMode ? '#1e1e1e' : '#fff',
    text: darkMode ? '#ffffff' : '#333',
    subText: darkMode ? '#bbb' : '#666',
    border: darkMode ? '#333' : '#ddd',
    inputBg: darkMode ? '#2d2d2d' : '#fff'
  };

  const allBtnStyle = {
    flex: 1,
    padding: '11px 8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '8px',
    color: '#fff',
    background: '#1a73e8',
    border: 'none',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 6px rgba(26,115,232,0.4)',
    transition: 'all 0.1s',
    letterSpacing: '0.2px',
  };

  const getMealBtnStyle = (studentId, mealType) => {
    const isMarked = statusMap[studentId] && statusMap[studentId][mealType];
    return {
      background: isMarked ? (darkMode ? '#1b5e20' : '#c8e6c9') : (darkMode ? '#2d2d2d' : '#f9f9f9'),
      border: 'none',
      borderRadius: '12px',
      flex: 1,
      margin: '0 5px',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '18px 8px',
      boxShadow: isMarked
        ? `0 5px 0 ${darkMode ? '#0d3d0f' : '#388e3c'}, 0 6px 10px rgba(0,0,0,0.3)`
        : `0 5px 0 ${darkMode ? '#000' : '#bbb'}, 0 6px 10px rgba(0,0,0,0.1)`,
      transition: 'box-shadow 0.08s, transform 0.08s',
    };
  };

  const handleMealMouseDown = (e) => {
    e.currentTarget.style.transform = 'translateY(3px)';
    e.currentTarget.style.boxShadow = 'none';
  };

  const handleMealMouseUp = (e, studentId, mealType) => {
    const isMarked = statusMap[studentId] && statusMap[studentId][mealType];
    e.currentTarget.style.boxShadow = isMarked
      ? `0 5px 0 ${darkMode ? '#0d3d0f' : '#388e3c'}, 0 6px 10px rgba(0,0,0,0.3)`
      : `0 5px 0 ${darkMode ? '#000' : '#bbb'}, 0 6px 10px rgba(0,0,0,0.1)`;
    e.currentTarget.style.transform = 'translateY(0)';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '15px', background: theme.bg }}>
        <Loader2 size={50} color="#1a73e8" className="animate-spin" />
        <p style={{ color: theme.subText, fontWeight: '500' }}>Data load ho raha hai...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, transition: '0.3s' }}>
      <div style={{ padding: '10px', maxWidth: '600px', margin: 'auto', paddingBottom: '80px', color: theme.text }}>
        
        {/* Header with Dark Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>🍱 Daily Meals</h2>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            style={{ 
              background: theme.card, border: `1px solid ${theme.border}`, 
              padding: '8px', borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            {darkMode ? <Sun color="#ffcc00" size={24} /> : <Moon color="#3f51b5" size={24} />}
          </button>
        </div>

        {/* Date Selector */}
        <div style={{ background: theme.card, padding: '15px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <label style={{ fontSize: '14px', color: theme.subText }}>Tarikh Chunein:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ 
              width: '100%', padding: '10px', marginTop: '5px', 
              background: theme.inputBg, color: theme.text,
              border: `1px solid ${theme.border}`, borderRadius: '5px', boxSizing: 'border-box' 
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
          <button onClick={() => markAll('breakfast')} style={allBtnStyle}>☀ All Morn</button>
          <button onClick={() => markAll('lunch')} style={allBtnStyle}>🌤 All Noon</button>
          <button onClick={() => markAll('dinner')} style={allBtnStyle}>🌙 All Night</button>
        </div>

        {message && (
          <div style={{ textAlign: 'center', color: message.includes('❌') ? '#ff5252' : '#4caf50', fontWeight: 'bold', marginBottom: '10px' }}>
            {message}
          </div>
        )}

        {/* Student List */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {students.map(s => {
            const sStatus = statusMap[s._id] || {};
            return (
              <div key={s._id} style={{ background: theme.card, padding: '15px', borderRadius: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                  <strong style={{ fontSize: '16px' }}>{s.name}</strong>
                  <span style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '14px' }}>Bill: ₹{s.totalDue}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <button
                    onClick={() => toggleMeal(s._id, 'breakfast')}
                    style={getMealBtnStyle(s._id, 'breakfast')}
                    onMouseDown={handleMealMouseDown}
                    onMouseUp={(e) => handleMealMouseUp(e, s._id, 'breakfast')}
                    onMouseLeave={(e) => handleMealMouseUp(e, s._id, 'breakfast')}
                  >
                    {sStatus.breakfast ? <CheckCircle2 size={26} color="#4caf50" /> : <Sun size={26} color="#ff9800" />}
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: sStatus.breakfast ? '#4caf50' : theme.subText }}>Morn (25)</span>
                  </button>

                  <button
                    onClick={() => toggleMeal(s._id, 'lunch')}
                    style={getMealBtnStyle(s._id, 'lunch')}
                    onMouseDown={handleMealMouseDown}
                    onMouseUp={(e) => handleMealMouseUp(e, s._id, 'lunch')}
                    onMouseLeave={(e) => handleMealMouseUp(e, s._id, 'lunch')}
                  >
                    {sStatus.lunch ? <CheckCircle2 size={26} color="#4caf50" /> : <SunMedium size={26} color="#f44336" />}
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: sStatus.lunch ? '#4caf50' : theme.subText }}>Noon (50)</span>
                  </button>

                  <button
                    onClick={() => toggleMeal(s._id, 'dinner')}
                    style={getMealBtnStyle(s._id, 'dinner')}
                    onMouseDown={handleMealMouseDown}
                    onMouseUp={(e) => handleMealMouseUp(e, s._id, 'dinner')}
                    onMouseLeave={(e) => handleMealMouseUp(e, s._id, 'dinner')}
                  >
                    {sStatus.dinner ? <CheckCircle2 size={26} color="#4caf50" /> : <Moon size={26} color="#3f51b5" />}
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: sStatus.dinner ? '#4caf50' : theme.subText }}>Night (50)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Attendance;