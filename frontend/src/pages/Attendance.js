import React, { useState, useEffect } from 'react';
import { fetchStudents, toggleMealAttendance, fetchAttendanceStatus, API } from '../api'; 
import { Sun, SunMedium, Moon, CheckCircle2 } from 'lucide-react';


const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({}); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
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
    }
  };

  const toggleMeal = async (studentId, mealType) => {
    try {
      await toggleMealAttendance({ studentId, date, mealType });
      setMessage("Hisaab update ho gaya!");
      loadData(); 
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      alert("Error updating attendance");
    }
  };

const markAll = async (mealType) => {
  if(window.confirm(`Kya sabka ${mealType} mark kar dein?`)) {
    try {
      
      await API.post('/attendance/mark-all', { date: date, mealType: mealType });
      alert("Success!");
      loadData();
    } catch (err) {
      alert("Nahi ho paya. Backend terminal check karo.");
    }
  }
};

  // Button Styles
  const allBtnStyle = { 
    flex: 1, 
    padding: '8px', 
    background: '#333', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '5px', 
    fontSize: '12px',
    cursor: 'pointer'
  };

  const getBtnStyle = (studentId, mealType) => {
    const isMarked = statusMap[studentId] && statusMap[studentId][mealType];
    return {
      background: isMarked ? '#e8f5e9' : '#f9f9f9', 
      border: isMarked ? '2px solid #4caf50' : '1px solid #ddd',
      padding: '12px 5px',
      borderRadius: '10px',
      flex: 1,
      margin: '0 5px',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '5px',
      transition: '0.3s'
    };
  };

  return (
    <div style={{ padding: '10px', maxWidth: '600px', margin: 'auto', paddingBottom: '80px' }}>
      <h2 style={{ textAlign: 'center' }}>🍱 Daily Meals Tracker</h2>
      
      {/* Date Selection Box */}
      <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <label style={{fontSize: '14px', color: '#666'}}>Tarikh Chunein:</label>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '5px', boxSizing: 'border-box' }} 
        />
      </div>

      {/* Bulk Mark Section */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
        <button onClick={() => markAll('breakfast')} style={allBtnStyle}>All Morn</button>
        <button onClick={() => markAll('lunch')} style={allBtnStyle}>All Noon</button>
        <button onClick={() => markAll('dinner')} style={allBtnStyle}>All Night</button>
      </div>

      {message && <div style={{textAlign: 'center', color: 'green', fontWeight: 'bold', marginBottom: '10px'}}>{message}</div>}

      <div style={{ display: 'grid', gap: '12px' }}>
        {students.map(s => {
          const sStatus = statusMap[s._id] || {};
          return (
            <div key={s._id} style={{ background: '#fff', padding: '15px', borderRadius: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                <strong>{s.name}</strong>
                <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '14px' }}>Bill: ₹{s.totalDue}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                {/* Breakfast */}
                <button onClick={() => toggleMeal(s._id, 'breakfast')} style={getBtnStyle(s._id, 'breakfast')}>
                  {sStatus.breakfast ? <CheckCircle2 size={20} color="green" /> : <Sun size={20} color="#ff9800" />}
                  <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Morn</span>
                </button>

                {/* Lunch */}
                <button onClick={() => toggleMeal(s._id, 'lunch')} style={getBtnStyle(s._id, 'lunch')}>
                  {sStatus.lunch ? <CheckCircle2 size={20} color="green" /> : <SunMedium size={20} color="#f44336" />}
                  <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Noon</span>
                </button>

                {/* Dinner */}
                <button onClick={() => toggleMeal(s._id, 'dinner')} style={getBtnStyle(s._id, 'dinner')}>
                  {sStatus.dinner ? <CheckCircle2 size={20} color="green" /> : <Moon size={20} color="#3f51b5" />}
                  <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Night</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Attendance;