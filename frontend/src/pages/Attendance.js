import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchStudents, toggleMealAttendance, fetchAttendanceStatus, API } from '../api';
import {
  Sun, SunMedium, Moon, CheckCircle2, Loader2,
  Search, X, ChevronDown, Users, Filter, RotateCcw, Zap
} from 'lucide-react';

const MEALS = [
  { key:'breakfast', short:'Morn',  price:25, Icon:Sun,       color:'#f59e0b' },
  { key:'lunch',     short:'Noon',  price:50, Icon:SunMedium, color:'#ef4444' },
  { key:'dinner',    short:'Night', price:50, Icon:Moon,      color:'#6366f1' },
];

const Attendance = () => {
  const [students,    setStudents]    = useState([]);
  const [statusMap,   setStatusMap]   = useState({});
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0]);
  const [message,     setMessage]     = useState({ text:'', ok:true });
  const [loading,     setLoading]     = useState(false);
  const [darkMode,    setDarkMode]    = useState(false);
  const [query,       setQuery]       = useState('');
  const [filterMeal,  setFilterMeal]  = useState('all');
  const [showFilter,  setShowFilter]  = useState(false);
  const [bulkLoading, setBulkLoading] = useState('');
  const searchRef = useRef(null);

  useEffect(() => { loadData(); }, [date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([fetchStudents(), fetchAttendanceStatus(date)]);
      setStudents(sRes.data);
      const map = {};
      (aRes.data || []).forEach(r => { map[r.studentId] = r; });
      setStatusMap(map);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const flash = (text, ok = true) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage({ text:'', ok:true }), 3000);
  };

  const toggleMeal = async (studentId, mealType) => {
    const price    = mealType === 'breakfast' ? 25 : 50;
    const removing = !!statusMap[studentId]?.[mealType];
    setStatusMap(p => ({ ...p, [studentId]: { ...p[studentId], [mealType]: !p[studentId]?.[mealType] } }));
    setStudents(p => p.map(s => s._id === studentId
      ? { ...s, totalDue: Math.max(0, s.totalDue + (removing ? -price : price)) } : s));
    try {
      await toggleMealAttendance({ studentId, date, mealType });
    } catch {
      loadData();
      flash('❌ Update nahi hua, dobara try karo', false);
    }
  };

  const markAll = async (mealType) => {
    setBulkLoading(mealType);
    try {
      await API.post('/attendance/mark-all', { date, mealType });
      flash(`✅ Sabka ${mealType} mark ho gaya!`);
      loadData();
    } catch { flash('❌ Nahi ho paya.', false); }
    finally { setBulkLoading(''); }
  };

  const markFiltered = async (mealType) => {
    const targets = filtered.filter(s => !statusMap[s._id]?.[mealType]);
    if (!targets.length) { flash('Sab already marked hain!'); return; }
    setBulkLoading(mealType + '_f');
    try {
      await Promise.all(targets.map(s => toggleMealAttendance({ studentId: s._id, date, mealType })));
      flash(`✅ ${targets.length} students ka ${mealType} mark hua!`);
      loadData();
    } catch { flash('❌ Kuch error hua', false); }
    finally { setBulkLoading(''); }
  };

  const filtered = useMemo(() => {
    let list = students;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || String(s.phone || '').includes(q));
    }
    if (filterMeal !== 'all') {
      const [meal, state] = filterMeal.split('_');
      list = list.filter(s => state === 'marked' ? !!statusMap[s._id]?.[meal] : !statusMap[s._id]?.[meal]);
    }
    return list;
  }, [students, query, filterMeal, statusMap]);

  const stats = useMemo(() => {
    const o = {};
    MEALS.forEach(m => { o[m.key] = students.filter(s => !!statusMap[s._id]?.[m.key]).length; });
    return o;
  }, [students, statusMap]);

  const t = {
    bg:     darkMode ? '#0f172a' : '#f1f5f9',
    card:   darkMode ? '#1e293b' : '#ffffff',
    text:   darkMode ? '#f1f5f9' : '#0f172a',
    sub:    darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    input:  darkMode ? '#1e293b' : '#ffffff',
  };

  const mealBtnStyle = (sid, key, color) => {
    const on = !!statusMap[sid]?.[key];
    return {
      flex:1, padding:'14px 4px', borderRadius:'14px', border:'none', cursor:'pointer',
      display:'flex', flexDirection:'column', alignItems:'center', gap:'5px',
      background: on ? (darkMode ? color+'22' : color+'14') : (darkMode ? '#1e293b' : '#f8fafc'),
      boxShadow: on
        ? `0 0 0 2px ${color}55, 0 4px 12px ${color}22`
        : `0 1px 3px rgba(0,0,0,0.06)`,
      transition:'all 0.15s',
    };
  };

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', height:'100vh', gap:'15px', background:t.bg }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Loader2 size={44} color="#6366f1" style={{ animation:'spin 1s linear infinite' }}/>
      <p style={{ color:t.sub, fontWeight:'600', fontFamily:'system-ui' }}>Data load ho raha hai...</p>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:t.bg, fontFamily:'system-ui', transition:'background 0.3s' }}>
      <div style={{ maxWidth:'620px', margin:'auto', padding:'16px 14px 110px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <div>
            <h2 style={{ margin:0, fontSize:'22px', fontWeight:'800', color:t.text }}>🍱 Daily Meals</h2>
            <p style={{ margin:'2px 0 0', fontSize:'12px', color:t.sub }}>
              {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
            </p>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} style={{
            background:t.card, border:`1px solid ${t.border}`, padding:'10px',
            borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center',
            boxShadow:'0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {darkMode ? <Sun color="#f59e0b" size={20}/> : <Moon color="#6366f1" size={20}/>}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'14px' }}>
          {MEALS.map(m => (
            <div key={m.key} style={{
              background:t.card, borderRadius:'14px', padding:'12px 8px',
              border:`1px solid ${t.border}`, textAlign:'center'
            }}>
              <m.Icon size={16} color={m.color}/>
              <div style={{ fontSize:'22px', fontWeight:'800', color:t.text, lineHeight:1.2 }}>{stats[m.key]}</div>
              <div style={{ fontSize:'10px', color:t.sub, fontWeight:'600' }}>/{students.length} {m.short}</div>
            </div>
          ))}
        </div>

        {/* Date */}
        <div style={{ background:t.card, borderRadius:'14px', padding:'12px 14px', marginBottom:'10px', border:`1px solid ${t.border}` }}>
          <label style={{ fontSize:'11px', fontWeight:'700', color:t.sub, display:'block', marginBottom:'5px' }}>📅 TARIKH</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{
            width:'100%', padding:'9px 12px', borderRadius:'10px', fontSize:'14px',
            background:t.input, color:t.text, border:`1px solid ${t.border}`,
            boxSizing:'border-box', outline:'none'
          }}/>
        </div>

        {/* Search */}
        <div style={{ position:'relative', marginBottom:'10px' }}>
          <Search size={15} color={t.sub} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
          <input
            ref={searchRef}
            type="text"
            placeholder="Naam ya number se dhundho..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width:'100%', padding:'12px 38px 12px 38px', borderRadius:'12px', fontSize:'14px',
              background:t.card, color:t.text, border:`1px solid ${t.border}`,
              boxSizing:'border-box', outline:'none', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position:'absolute', right:'11px', top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', color:t.sub, display:'flex', padding:'4px'
            }}>
              <X size={15}/>
            </button>
          )}
        </div>

        {/* Filter + Bulk row */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap', alignItems:'center' }}>

          {/* Filter dropdown */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowFilter(!showFilter)} style={{
              display:'flex', alignItems:'center', gap:'5px', padding:'9px 13px',
              background: filterMeal !== 'all' ? '#6366f1' : t.card,
              color: filterMeal !== 'all' ? '#fff' : t.text,
              border:`1px solid ${filterMeal !== 'all' ? '#6366f1' : t.border}`,
              borderRadius:'10px', cursor:'pointer', fontSize:'12px', fontWeight:'700'
            }}>
              <Filter size={13}/> Filter <ChevronDown size={12}/>
            </button>
            {showFilter && (
              <div style={{
                position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:200,
                background:t.card, border:`1px solid ${t.border}`, borderRadius:'14px',
                boxShadow:'0 10px 30px rgba(0,0,0,0.15)', minWidth:'195px', overflow:'hidden'
              }}>
                {[
                  { val:'all',               label:'🔘 Sabhi students' },
                  { val:'breakfast_unmarked',label:'☀️ Morning nahi laga' },
                  { val:'lunch_unmarked',    label:'🌤 Noon nahi laga' },
                  { val:'dinner_unmarked',   label:'🌙 Night nahi laga' },
                  { val:'breakfast_marked',  label:'✅ Morning laga hua' },
                  { val:'lunch_marked',      label:'✅ Noon laga hua' },
                  { val:'dinner_marked',     label:'✅ Night laga hua' },
                ].map(opt => (
                  <button key={opt.val} onClick={() => { setFilterMeal(opt.val); setShowFilter(false); }} style={{
                    width:'100%', padding:'11px 15px', border:'none', textAlign:'left', cursor:'pointer',
                    background: filterMeal === opt.val ? '#6366f122' : 'transparent',
                    color: filterMeal === opt.val ? '#6366f1' : t.text,
                    fontSize:'13px', fontWeight: filterMeal === opt.val ? '700' : '400'
                  }}>{opt.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Bulk buttons */}
          {MEALS.map(m => (
            <button key={m.key}
              onClick={() => (query || filterMeal !== 'all') ? markFiltered(m.key) : markAll(m.key)}
              disabled={!!bulkLoading}
              style={{
                display:'flex', alignItems:'center', gap:'5px', padding:'9px 12px',
                background:'#0f172a', color:'#fff', border:'none', borderRadius:'10px',
                cursor: bulkLoading ? 'wait':'pointer', fontSize:'12px', fontWeight:'700',
                opacity: bulkLoading ? 0.6 : 1
              }}
            >
              {bulkLoading === m.key || bulkLoading === m.key+'_f'
                ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/>
                : <Zap size={12}/>
              }
              All {m.short}
            </button>
          ))}

          {/* Reset */}
          {(filterMeal !== 'all' || query) && (
            <button onClick={() => { setFilterMeal('all'); setQuery(''); }} style={{
              display:'flex', alignItems:'center', gap:'4px', padding:'9px 11px',
              background:'#fee2e2', color:'#ef4444', border:'none',
              borderRadius:'10px', cursor:'pointer', fontSize:'12px', fontWeight:'700'
            }}>
              <RotateCcw size={12}/> Reset
            </button>
          )}
        </div>

        {/* Count */}
        <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'10px' }}>
          <Users size={13} color={t.sub}/>
          <span style={{ fontSize:'12px', color:t.sub, fontWeight:'600' }}>
            {filtered.length} / {students.length} students
            {query && ` · "${query}"`}
          </span>
        </div>

        {/* Message */}
        {message.text && (
          <div style={{
            padding:'10px 14px', borderRadius:'10px', marginBottom:'10px', textAlign:'center',
            background: message.ok ? '#dcfce7' : '#fee2e2',
            color: message.ok ? '#16a34a' : '#dc2626',
            fontWeight:'700', fontSize:'13px'
          }}>
            {message.text}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && !loading && (
          <div style={{ textAlign:'center', padding:'50px 20px', color:t.sub }}>
            <Search size={40} style={{ opacity:0.25, marginBottom:'12px' }}/>
            <p style={{ fontWeight:'700', margin:'0 0 4px' }}>Koi student nahi mila</p>
            <p style={{ fontSize:'13px', margin:0 }}>Search ya filter badlo</p>
          </div>
        )}

        {/* Student cards */}
        <div style={{ display:'grid', gap:'10px' }}>
          {filtered.map(s => {
            const ss = statusMap[s._id] || {};
            const markedCount = MEALS.filter(m => ss[m.key]).length;
            return (
              <div key={s._id} style={{
                background:t.card, borderRadius:'18px', padding:'15px',
                border:`1px solid ${t.border}`, boxShadow:'0 2px 8px rgba(0,0,0,0.04)'
              }}>
                {/* Name row */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{
                      width:'38px', height:'38px', borderRadius:'12px', flexShrink:0,
                      background:'#6366f122', display:'flex', alignItems:'center',
                      justifyContent:'center', fontWeight:'800', fontSize:'16px', color:'#6366f1'
                    }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:'700', fontSize:'15px', color:t.text }}>{s.name}</div>
                      <div style={{ fontSize:'11px', color:t.sub }}>{s.phone}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:'800', fontSize:'15px', color:'#22c55e' }}>₹{s.totalDue}</div>
                    <div style={{ fontSize:'10px', color:t.sub }}>{markedCount}/3 meals</div>
                  </div>
                </div>

                {/* Meal buttons */}
                <div style={{ display:'flex', gap:'8px' }}>
                  {MEALS.map(m => (
                    <button key={m.key}
                      onClick={() => toggleMeal(s._id, m.key)}
                      style={mealBtnStyle(s._id, m.key, m.color)}
                      onTouchStart={e => { e.currentTarget.style.transform='scale(0.94)'; }}
                      onTouchEnd={e => { e.currentTarget.style.transform='scale(1)'; }}
                      onMouseDown={e => { e.currentTarget.style.transform='scale(0.94)'; }}
                      onMouseUp={e => { e.currentTarget.style.transform='scale(1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; }}
                    >
                      {ss[m.key]
                        ? <CheckCircle2 size={24} color={m.color}/>
                        : <m.Icon size={24} color={m.color} style={{ opacity:0.4 }}/>
                      }
                      <span style={{ fontSize:'11px', fontWeight:'700', color: ss[m.key] ? m.color : t.sub, textAlign:'center' }}>
                        {m.short}<br/>
                        <span style={{ fontSize:'10px', opacity:0.7 }}>₹{m.price}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Floating bottom bar */}
      <div style={{
        position:'fixed', bottom:'16px', left:'50%', transform:'translateX(-50%)',
        background: darkMode ? '#1e293b' : '#0f172a',
        borderRadius:'20px', padding:'10px 16px',
        display:'flex', gap:'8px', alignItems:'center',
        boxShadow:'0 8px 32px rgba(0,0,0,0.3)', zIndex:50,
        border: `1px solid ${darkMode ? '#334155' : '#1e293b'}`
      }}>
        <span style={{ fontSize:'11px', color:'#475569', fontWeight:'700', marginRight:'2px' }}>Quick:</span>
        {MEALS.map(m => (
          <button key={m.key} onClick={() => markAll(m.key)} disabled={!!bulkLoading} style={{
            padding:'8px 13px', borderRadius:'12px', border:'none',
            background: m.color+'22', color: m.color,
            fontWeight:'800', fontSize:'12px', cursor:'pointer',
            display:'flex', alignItems:'center', gap:'5px',
            opacity: bulkLoading ? 0.6 : 1
          }}>
            <m.Icon size={12}/> {m.short}
          </button>
        ))}
        <button onClick={loadData} style={{
          padding:'8px', borderRadius:'12px', border:'none',
          background:'#ffffff11', color:'#64748b', cursor:'pointer', display:'flex'
        }}>
          <RotateCcw size={14}/>
        </button>
      </div>
    </div>
  );
};

export default Attendance;