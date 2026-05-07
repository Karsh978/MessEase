import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchStudents, toggleMealAttendance, fetchAttendanceStatus, API } from '../api';
import {
  Sun, SunMedium, Moon, CheckCircle2, Loader2,
  Search, X, ChevronDown, Users, Filter, RotateCcw, Zap
} from 'lucide-react';

/* ─── Green is the ONLY "active" color everywhere ─── */
const GREEN      = '#16a34a';
const GREEN_DARK = '#15803d';
const GREEN_BG   = '#dcfce7';
const GREEN_RING = '#86efac';

const MEALS = [
  { key:'breakfast', short:'Morn',  price:25, Icon:Sun,       iconColor:'#f59e0b' },
  { key:'lunch',     short:'Noon',  price:50, Icon:SunMedium, iconColor:'#ef4444' },
  { key:'dinner',    short:'Night', price:50, Icon:Moon,      iconColor:'#8b5cf6' },
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

  /* ── theme ── */
  const t = {
    bg:     darkMode ? '#0f172a' : '#f1f5f9',
    card:   darkMode ? '#1e293b' : '#ffffff',
    text:   darkMode ? '#f1f5f9' : '#0f172a',
    sub:    darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    input:  darkMode ? '#1e293b' : '#ffffff',
  };

  /* ── meal button — GREEN when marked ── */
  const mealBtnStyle = (sid, key) => {
    const on = !!statusMap[sid]?.[key];
    return {
      flex: 1,
      padding: '12px 4px',
      borderRadius: '14px',
      border: on ? `2px solid ${GREEN_RING}` : `2px solid transparent`,
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '5px',
      background: on
        ? (darkMode ? '#14532d' : GREEN_BG)
        : (darkMode ? '#1e293b' : '#f8fafc'),
      boxShadow: on
        ? `0 4px 14px ${GREEN}33`
        : `0 1px 3px rgba(0,0,0,0.06)`,
      transition: 'all 0.15s cubic-bezier(.4,0,.2,1)',
      WebkitTapHighlightColor: 'transparent',
    };
  };

  /* global styles injected once */
  const globalStyles = `
    @keyframes spin { to { transform: rotate(360deg); } } html, body, #root { overflow-x: hidden !important; max-width: 100vw !important; } * { box-sizing: border-box; }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    input[type=date]::-webkit-calendar-picker-indicator { 
      filter: ${darkMode ? 'invert(1)' : 'none'};
    }
  `;

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', height:'100vh', gap:'15px', background:t.bg }}>
      <style>{globalStyles}</style>
      <Loader2 size={44} color={GREEN} style={{ animation:'spin 1s linear infinite' }}/>
      <p style={{ color:t.sub, fontWeight:'600', fontFamily:'system-ui' }}>Data load ho raha hai...</p>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:t.bg, fontFamily:'system-ui, -apple-system, sans-serif', transition:'background 0.3s', overflowX:'hidden', width:'100%', position:'relative' }}>
      <style>{globalStyles}</style>

      {/* ── max-width wrapper, full width on mobile ── */}
      <div style={{ maxWidth:'600px', margin:'0 auto', padding:'14px 12px 120px', width:'100%', overflowX:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
          <div>
            <h2 style={{ margin:0, fontSize:'20px', fontWeight:'800', color:t.text }}>🍱 Daily Meals</h2>
            <p style={{ margin:'3px 0 0', fontSize:'12px', color:t.sub }}>
              {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
            </p>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} style={{
            background:t.card, border:`1px solid ${t.border}`, padding:'9px',
            borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center',
            boxShadow:'0 2px 8px rgba(0,0,0,0.1)', flexShrink:0
          }}>
            {darkMode ? <Sun color="#f59e0b" size={18}/> : <Moon color="#475569" size={18}/>}
          </button>
        </div>

        {/* Stats — 3 equal columns */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'12px' }}>
          {MEALS.map(m => {
            const count = stats[m.key] || 0;
            const allDone = count === students.length && students.length > 0;
            return (
              <div key={m.key} style={{
                background: allDone ? (darkMode ? '#14532d' : GREEN_BG) : t.card,
                borderRadius:'12px', padding:'10px 6px',
                border:`1px solid ${allDone ? GREEN_RING : t.border}`,
                textAlign:'center'
              }}>
                <m.Icon size={15} color={allDone ? GREEN : m.iconColor}/>
                <div style={{ fontSize:'20px', fontWeight:'800', color: allDone ? GREEN : t.text, lineHeight:1.2 }}>{count}</div>
                <div style={{ fontSize:'10px', color: allDone ? GREEN_DARK : t.sub, fontWeight:'600' }}>/{students.length} {m.short}</div>
              </div>
            );
          })}
        </div>

        {/* Date picker */}
        <div style={{ background:t.card, borderRadius:'12px', padding:'11px 13px', marginBottom:'10px', border:`1px solid ${t.border}` }}>
          <label style={{ fontSize:'11px', fontWeight:'700', color:t.sub, display:'block', marginBottom:'5px' }}>📅 TARIKH</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{
            width:'100%', padding:'9px 10px', borderRadius:'10px', fontSize:'15px',
            background:t.input, color:t.text, border:`1px solid ${t.border}`, outline:'none'
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
              width:'100%', padding:'12px 38px',
              borderRadius:'12px', fontSize:'15px',
              background:t.card, color:t.text, border:`1px solid ${t.border}`,
              outline:'none', boxShadow:'0 2px 6px rgba(0,0,0,0.04)'
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position:'absolute', right:'11px', top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', color:t.sub,
              display:'flex', padding:'6px', touchAction:'manipulation'
            }}>
              <X size={15}/>
            </button>
          )}
        </div>

        {/* Filter + Bulk — wraps on small screens */}
        <div style={{ display:'flex', gap:'7px', marginBottom:'10px', flexWrap:'wrap', alignItems:'center' }}>

          {/* Filter */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowFilter(!showFilter)} style={{
              display:'flex', alignItems:'center', gap:'4px', padding:'9px 12px',
              background: filterMeal !== 'all' ? GREEN : t.card,
              color: filterMeal !== 'all' ? '#fff' : t.text,
              border:`1px solid ${filterMeal !== 'all' ? GREEN : t.border}`,
              borderRadius:'10px', cursor:'pointer', fontSize:'13px', fontWeight:'700',
              touchAction:'manipulation'
            }}>
              <Filter size={13}/> Filter <ChevronDown size={12}/>
            </button>
            {showFilter && (
              <>
                {/* backdrop */}
                <div onClick={() => setShowFilter(false)} style={{ position:'fixed', inset:0, zIndex:99 }}/>
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
                      width:'100%', padding:'12px 15px', border:'none', textAlign:'left', cursor:'pointer',
                      background: filterMeal === opt.val ? GREEN_BG : 'transparent',
                      color: filterMeal === opt.val ? GREEN_DARK : t.text,
                      fontSize:'13px', fontWeight: filterMeal === opt.val ? '700' : '400',
                      touchAction:'manipulation'
                    }}>{opt.label}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bulk mark buttons */}
          {MEALS.map(m => (
            <button key={m.key}
              onClick={() => (query || filterMeal !== 'all') ? markFiltered(m.key) : markAll(m.key)}
              disabled={!!bulkLoading}
              style={{
                display:'flex', alignItems:'center', gap:'4px', padding:'9px 11px',
                background: darkMode ? '#1e293b' : '#0f172a', color:'#fff',
                border:'none', borderRadius:'10px',
                cursor: bulkLoading ? 'wait' : 'pointer',
                fontSize:'12px', fontWeight:'700',
                opacity: bulkLoading ? 0.6 : 1,
                touchAction:'manipulation'
              }}
            >
              {(bulkLoading === m.key || bulkLoading === m.key+'_f')
                ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/>
                : <Zap size={12}/>
              }
              All {m.short}
            </button>
          ))}

          {/* Reset */}
          {(filterMeal !== 'all' || query) && (
            <button onClick={() => { setFilterMeal('all'); setQuery(''); }} style={{
              display:'flex', alignItems:'center', gap:'4px', padding:'9px 10px',
              background:'#fee2e2', color:'#ef4444',
              border:'none', borderRadius:'10px', cursor:'pointer',
              fontSize:'12px', fontWeight:'700', touchAction:'manipulation'
            }}>
              <RotateCcw size={12}/> Reset
            </button>
          )}
        </div>

        {/* Count row */}
        <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'10px' }}>
          <Users size={13} color={t.sub}/>
          <span style={{ fontSize:'12px', color:t.sub, fontWeight:'600' }}>
            {filtered.length} / {students.length} students
            {query && <span style={{ color:GREEN }}> · "{query}"</span>}
          </span>
        </div>

        {/* Message toast */}
        {message.text && (
          <div style={{
            padding:'10px 14px', borderRadius:'10px', marginBottom:'10px', textAlign:'center',
            background: message.ok ? GREEN_BG : '#fee2e2',
            color: message.ok ? GREEN_DARK : '#dc2626',
            fontWeight:'700', fontSize:'13px', border:`1px solid ${message.ok ? GREEN_RING : '#fca5a5'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && !loading && (
          <div style={{ textAlign:'center', padding:'50px 20px', color:t.sub }}>
            <Search size={36} style={{ opacity:0.2, marginBottom:'10px' }}/>
            <p style={{ fontWeight:'700', margin:'0 0 4px', color:t.text }}>Koi student nahi mila</p>
            <p style={{ fontSize:'13px', margin:0 }}>Search ya filter badlo</p>
          </div>
        )}

        {/* ── Student cards ── */}
        <div style={{ display:'grid', gap:'10px' }}>
          {filtered.map(s => {
            const ss = statusMap[s._id] || {};
            const markedCount = MEALS.filter(m => ss[m.key]).length;
            const allMarked = markedCount === 3;

            return (
              <div key={s._id} style={{
                background: t.card,
                borderRadius:'16px',
                padding:'13px',
                border:`1.5px solid ${allMarked ? GREEN_RING : t.border}`,
                boxShadow: allMarked
                  ? `0 4px 16px ${GREEN}22`
                  : '0 2px 6px rgba(0,0,0,0.04)',
                transition:'all 0.2s'
              }}>

                {/* Name row */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'11px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'9px', minWidth:0 }}>
                    {/* Avatar — green when all marked */}
                    <div style={{
                      width:'36px', height:'36px', borderRadius:'11px', flexShrink:0,
                      background: allMarked ? GREEN_BG : (darkMode ? '#273549' : '#f1f5f9'),
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight:'800', fontSize:'15px',
                      color: allMarked ? GREEN : t.sub,
                      border: allMarked ? `1.5px solid ${GREEN_RING}` : 'none'
                    }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:'700', fontSize:'15px', color:t.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize:'11px', color:t.sub }}>{s.phone}</div>
                    </div>
                  </div>

                  <div style={{ textAlign:'right', flexShrink:0, marginLeft:'8px' }}>
                    <div style={{ fontWeight:'800', fontSize:'15px', color: GREEN }}>₹{s.totalDue}</div>
                    <div style={{ fontSize:'10px', color: markedCount > 0 ? GREEN : t.sub, fontWeight:'600' }}>
                      {markedCount}/3 ✓
                    </div>
                  </div>
                </div>

                {/* Meal buttons — always 3 equal cols */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'7px' }}>
                  {MEALS.map(m => {
                    const on = !!ss[m.key];
                    return (
                      <button key={m.key}
                        onClick={() => toggleMeal(s._id, m.key)}
                        style={mealBtnStyle(s._id, m.key)}
                        onTouchStart={e => { e.currentTarget.style.transform='scale(0.93)'; }}
                        onTouchEnd={e => { e.currentTarget.style.transform='scale(1)'; }}
                        onMouseDown={e => { e.currentTarget.style.transform='scale(0.93)'; }}
                        onMouseUp={e => { e.currentTarget.style.transform='scale(1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; }}
                      >
                        {on
                          ? <CheckCircle2 size={22} color={GREEN}/>
                          : <m.Icon size={22} color={m.iconColor} style={{ opacity:0.45 }}/>
                        }
                        <span style={{
                          fontSize:'11px', fontWeight:'700', textAlign:'center',
                          color: on ? GREEN : t.sub, lineHeight:1.3
                        }}>
                          {m.short}<br/>
                          <span style={{ fontSize:'10px', opacity:0.75 }}>₹{m.price}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── Floating bottom quick-mark bar ── */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        background: darkMode ? '#1e293b' : '#0f172a',
        padding:'10px 16px 14px',
        display:'flex', gap:'8px', alignItems:'center', justifyContent:'center',
        boxShadow:'0 -4px 20px rgba(0,0,0,0.2)', zIndex:50,
        borderTop:`1px solid ${darkMode ? '#334155' : '#1e293b'}`
      }}>
        <span style={{ fontSize:'11px', color:'#475569', fontWeight:'700' }}>Quick Mark:</span>
        {MEALS.map(m => (
          <button key={m.key} onClick={() => markAll(m.key)} disabled={!!bulkLoading} style={{
            flex:1, maxWidth:'100px',
            padding:'9px 8px', borderRadius:'12px', border:'none',
            background: GREEN_BG, color: GREEN_DARK,
            fontWeight:'800', fontSize:'12px', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'4px',
            opacity: bulkLoading ? 0.6 : 1,
            touchAction:'manipulation'
          }}>
            <m.Icon size={12} color={GREEN}/> {m.short}
          </button>
        ))}
        <button onClick={loadData} style={{
          padding:'9px', borderRadius:'12px', border:'none',
          background:'#ffffff11', color:'#64748b', cursor:'pointer',
          display:'flex', touchAction:'manipulation'
        }}>
          <RotateCcw size={15} color="#64748b"/>
        </button>
      </div>

    </div>
  );
};

export default Attendance;