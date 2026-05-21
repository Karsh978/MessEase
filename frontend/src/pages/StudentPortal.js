import React, { useState, useEffect, useRef } from 'react';
import { loginStudent, fetchMenu, updateStudentProfile, fetchStudentData } from '../api';

import {
  Utensils, Mail, Camera, LogOut, CreditCard, Smartphone,
  ShieldCheck, PhoneCall, ExternalLink, PieChart, History,
  CheckCircle2, AlertCircle, MessageSquare, Calendar, X, Copy,
  Check, Bell, TrendingUp, Star, Info, ChevronRight, Wifi
} from 'lucide-react';

/* ─── Google Loader ─────────────────────────────────────────── */
const GoogleLoader = () => (
  <div style={ls.wrap}>
    <style>{`
      @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
      @keyframes cs{0%{stroke:#4285F4}25%{stroke:#EA4335}50%{stroke:#FBBC05}75%{stroke:#34A853}100%{stroke:#4285F4}}
      .gr{transform-origin:50px 50px;animation:spin 1s cubic-bezier(.4,0,.2,1) infinite,cs 3s linear infinite;
          fill:none;stroke-width:6;stroke-linecap:round;stroke-dasharray:120 60}
    `}</style>
    <svg width="72" height="72" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="6"/>
      <circle className="gr" cx="50" cy="50" r="38"/>
    </svg>
    <p style={ls.txt}>Loading your dashboard…</p>
  </div>
);
const ls = {
  wrap:{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
         minHeight:'100vh', background:'#f9fafb', gap:'20px' },
  txt: { color:'#6b7280', fontWeight:'600', fontFamily:'system-ui', fontSize:'14px', margin:0 }
};

/* ─── Main Component ─────────────────────────────────────────── */
const StudentPortal = () => {
  const [phone,       setPhone]       = useState('');
  const [password,    setPassword]    = useState('');
  const [data,        setData]        = useState(null);
  const [menu,        setMenu]        = useState(null);
  const [error,       setError]       = useState('');
  const [isEditing,   setIsEditing]   = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [showPayModal,setShowPayModal]= useState(false);
  const [copied,      setCopied]      = useState(false);
  const [activeTab,   setActiveTab]   = useState('home'); // home | attendance | profile
  const [notification,setNotification]= useState(null);
  const [editForm,    setEditForm]    = useState({ address:'', emergencyContact:'', profilePic:'', email:'' });

  // Ref to hold latest data for refresh without stale closure issues
  const dataRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const todayName = DAYS[new Date().getDay()];
  const todayDate = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

  /* ── Background refresh: pull latest attendance + data every 30s ── */
  const startAutoRefresh = (studentId, token) => {
    // Clear any existing interval first
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);

    refreshIntervalRef.current = setInterval(async () => {
      try {
        // fetchStudentData fetches fresh student + attendance from server
        // If your API has a different endpoint, adjust accordingly
        const res = await fetchStudentData(studentId, token);
        if (res?.data) {
          const current = dataRef.current;
          const merged = { ...current, ...res.data };
          dataRef.current = merged;
          localStorage.setItem('studentPortalData', JSON.stringify(merged));
          setData({ ...merged }); // force re-render
        }
      } catch (e) {
        // Silent fail — don't disrupt UX on background refresh error
        console.warn('Background refresh failed:', e);
      }
    }, 30000); // every 30 seconds
  };

  /* cleanup on unmount */
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  /* load saved session */
  useEffect(() => {
    const saved = localStorage.getItem('studentPortalData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dataRef.current = parsed;
        setData(parsed);
        setEditForm({
          address:          parsed.student?.address          || '',
          emergencyContact: parsed.student?.emergencyContact || '',
          profilePic:       parsed.student?.profilePic       || '',
          email:            parsed.student?.email            || ''
        });
        (async () => {
          try {
            const menuRes = await fetchMenu();
            setMenu(menuRes.data.find(m => m.day === todayName));
          } catch (e) { console.error(e); }
        })();
        // Start background refresh using saved session token
        if (parsed.student?._id && parsed.token) {
          startAutoRefresh(parsed.student._id, parsed.token);
        }
      } catch { localStorage.removeItem('studentPortalData'); }
    }
  }, [todayName]);

  /* login */
  const handleLogin = async () => {
    if (!phone || !password) return alert('Phone and PIN are required!');
    setIsLoading(true); setError('');
    try {
      const res = await loginStudent({ phone, password });
      dataRef.current = res.data;
      localStorage.setItem('studentPortalData', JSON.stringify(res.data));
      setData(res.data);
      setEditForm({
        address:          res.data.student?.address          || '',
        emergencyContact: res.data.student?.emergencyContact || '',
        profilePic:       res.data.student?.profilePic       || '',
        email:            res.data.student?.email            || ''
      });
      const menuRes = await fetchMenu();
      setMenu(menuRes.data.find(m => m.day === todayName));
      // Start background refresh after fresh login
      if (res.data.student?._id && res.data.token) {
        startAutoRefresh(res.data.student._id, res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed! Please check credentials.');
    } finally { setIsLoading(false); }
  };

  /* logout */
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      localStorage.removeItem('studentPortalData');
      dataRef.current = null;
      setData(null);
    }
  };

  /* profile update */
  const handleUpdate = async () => {
    try {
      await updateStudentProfile(data.student._id, editForm);
      const updated = { ...data, student: { ...data.student, ...editForm } };
      dataRef.current = updated;
      localStorage.setItem('studentPortalData', JSON.stringify(updated));
      setData(updated);
      setIsEditing(false);
      showNotif('Profile updated successfully ✨', 'success');
    } catch { showNotif('Update failed. Try again.', 'error'); }
  };

  /* notification helper */
  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  /* UPI constants */
  const upiId     = '9669168716@ybl';
  const amount    = data?.student?.totalDue || 0;
  const upiString = `upi://pay?pa=${upiId}&pn=Didi%20Mess&am=${amount}&cu=INR`;
  const qrUrl     = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiString)}`;

  /* ── Due date: joiningDate ka same day, next month ── */
  const calcDueDate = (joiningDate) => {
    if (!joiningDate) return 'N/A';
    const joined = new Date(joiningDate);
    const day    = joined.getDate();
    const now    = new Date();
    let dueMonth = now.getMonth() + 1;
    let dueYear  = now.getFullYear();
    if (dueMonth > 11) { dueMonth = 0; dueYear += 1; }
    const due = new Date(dueYear, dueMonth, day);
    return due.toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
  };
  const dueDateStr = calcDueDate(data?.student?.joiningDate);

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  /* ── last month bill logic ─────────────────────────────── */
  const lastMonthBill = data?.student?.lastMonthBill;
  const hasLastMonthData = lastMonthBill && lastMonthBill > 0;

  /* ── attendance stats ──────────────────────────────────── */
  const attendanceList = data?.attendance || [];

  const thisMonthMeals = attendanceList.filter(h => {
    const d = new Date(h.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const mealCount = (list, type) => list.filter(h => h[type]).length;

  /* ── Build full day-wise calendar for current month ──────── */
  const buildMonthCalendar = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    // joiningDate: only show days from joining onwards if same month/year
    const joining = data?.student?.joiningDate ? new Date(data.student.joiningDate) : null;

    // Map attendance by date string "YYYY-MM-DD"
    const attendMap = {};
    attendanceList.forEach(h => {
      const d = new Date(h.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      attendMap[key] = h;
    });

    const days = [];
    for (let day = 1; day <= today; day++) {
      const date = new Date(year, month, day);
      // Skip days before joining date if joined this month/year
      if (joining) {
        const joiningMidnight = new Date(joining.getFullYear(), joining.getMonth(), joining.getDate());
        const dateMidnight    = new Date(year, month, day);
        if (
          joining.getFullYear() === year &&
          joining.getMonth() === month &&
          dateMidnight < joiningMidnight
        ) continue;
      }
      const key = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const record = attendMap[key] || null;
      const hasMeal = record && (record.breakfast || record.lunch || record.dinner);
      days.push({ day, date, key, record, hasMeal });
    }
    return days;
  };

  const monthCalendar = buildMonthCalendar();
  const missingDays   = monthCalendar.filter(d => !d.hasMeal);

  /* ─────────────────────────────────────────────────────────── */
  if (isLoading) return <GoogleLoader />;

  /* ══ LOGIN SCREEN ══════════════════════════════════════════ */
  if (!data) return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <div style={S.loginLogo}><ShieldCheck size={28} color="#4F46E5"/></div>
        <h2 style={S.loginTitle}>Apna mess</h2>
        <p style={S.loginSub}>Student Portal · Secure Access</p>

        <input
          type="tel" placeholder="Phone Number" style={S.inp}
          value={phone} onChange={e => setPhone(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <input
          type="password" placeholder="4-Digit PIN" style={S.inp}
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <button type="button" onClick={handleLogin} style={S.btnPrimary}>Sign In</button>

        {error && (
          <div style={S.errBox}>
            <AlertCircle size={14}/> {error}
          </div>
        )}

        <div style={S.loginFooter}>
          <PhoneCall size={12}/> Need help? Call 6267216334
        </div>
      </div>
    </div>
  );

  /* ══ DASHBOARD ══════════════════════════════════════════════ */
  return (
    <div style={S.page}>

      {/* ── Toast Notification ── */}
      {notification && (
        <div style={{
          ...S.toast,
          background: notification.type === 'success' ? '#059669' : '#dc2626'
        }}>
          {notification.type === 'success' ? <Check size={14}/> : <AlertCircle size={14}/>}
          {notification.msg}
        </div>
      )}

      {/* ══ PAY MODAL ══════════════════════════════════════════ */}
      {showPayModal && (
        <div style={S.overlay} onClick={() => setShowPayModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>

            <div style={S.modalHandle}/>

            <button type="button" onClick={() => setShowPayModal(false)} style={S.closeBtn}>
              <X size={16}/>
            </button>

            <h3 style={S.modalTitle}>Pay ₹{amount}</h3>
            <p style={S.modalSub}>Didi Mess · UPI</p>

            {/* QR Code */}
            <div style={S.qrBox}>
              <img src={qrUrl} alt="QR" style={S.qrImg}/>
            </div>

            {/* Amount chip */}
            <div style={S.amountChip}>₹{amount} · Didi Mess</div>

            {/* UPI ID copy */}
            <div style={S.upiRow}>
              <Smartphone size={14} color="#4f46e5" style={{ flexShrink:0 }}/>
              <span style={S.upiTxt}>{upiId}</span>
              <button type="button" onClick={handleCopy} style={{
                ...S.copyBtn,
                background: copied ? '#dcfce7' : '#ede9fe',
                color:      copied ? '#16a34a' : '#4f46e5',
              }}>
                {copied
                  ? <><Check size={11}/> Copied</>
                  : <><Copy size={11}/> Copy</>
                }
              </button>
            </div>

            <button type="button" onClick={() => setShowPayModal(false)} style={S.doneBtn}>
              Done ✓
            </button>
          </div>
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════ */}

      {/* ── Top Bar ── */}
      <div style={S.topBar}>
        <div>
          <p style={S.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} 👋</p>
          <h3 style={S.greetName}>{data.student?.name?.split(' ')[0] || 'Student'}</h3>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <div style={S.verifiedPill}><CheckCircle2 size={12}/> Verified</div>
          <button type="button" onClick={handleLogout} style={S.iconBtn}>
            <LogOut size={16} color="#ef4444"/>
          </button>
        </div>
      </div>

      {/* ── Due Alert ── */}
      <div style={S.dueAlert}>
        <AlertCircle size={14} color="#b45309"/>
        <span style={{ fontSize:'12px', color:'#92400e', fontWeight:'600' }}>Payment due: {dueDateStr}</span>
        <button type="button" onClick={() => setShowPayModal(true)} style={S.duePayBtn}>Pay Now</button>
      </div>

      {/* ── Tab Nav ── */}
      <div style={S.tabBar}>
        {['home','attendance','profile'].map(tab => (
          <button key={tab} type="button"
            onClick={() => setActiveTab(tab)}
            style={{ ...S.tab, ...(activeTab === tab ? S.tabActive : {}) }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ═══════════════════ HOME TAB ═════════════════════════ */}
      {activeTab === 'home' && (
        <>
          {/* Today's Meal */}
          <div style={S.mealCard}>
            <div style={S.mealCardTop}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={S.mealIcon}><Utensils size={16} color="#f59e0b"/></div>
                <span style={S.mealLabel}>Today's Meal</span>
              </div>
              <span style={S.dayBadge}>{todayName}</span>
            </div>
            <p style={S.dishName}>{menu ? menu.dish : 'Menu updating…'}</p>
            <div style={S.mealMeta}>
              <History size={12}/> Standard Mess Cycle &nbsp;·&nbsp; {todayDate}
            </div>
          </div>

          {/* Stats Grid */}
          <div style={S.statsGrid}>
            <div style={S.statCard('#eff6ff','#1e40af')}>
              <PieChart size={16}/>
              <p style={S.statLabel}>Last Month</p>
              {hasLastMonthData
                ? <h4 style={S.statVal}>₹{lastMonthBill}</h4>
                : <p style={S.statNA}>Available after<br/>1st month</p>
              }
            </div>
            <div style={S.statCard('#f0fdf4','#166534')}>
              <Calendar size={16}/>
              <p style={S.statLabel}>This Month</p>
              <h4 style={S.statVal}>{thisMonthMeals.length} Meals</h4>
            </div>
            <div style={S.statCard('#fdf4ff','#7e22ce')}>
              <TrendingUp size={16}/>
              <p style={S.statLabel}>Breakfast</p>
              <h4 style={S.statVal}>{mealCount(thisMonthMeals,'breakfast')}</h4>
            </div>
            <div style={S.statCard('#fff7ed','#c2410c')}>
              <Star size={16}/>
              <p style={S.statLabel}>Dinner</p>
              <h4 style={S.statVal}>{mealCount(thisMonthMeals,'dinner')}</h4>
            </div>
          </div>

          {/* Payment Card */}
          <div style={S.payCard}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', opacity:0.85 }}>
              <span style={{ fontSize:'13px', fontWeight:'600' }}>Total Outstanding</span>
              <CreditCard size={18}/>
            </div>
            <h1 style={S.billAmt}>₹{amount}</h1>
            <button type="button" onClick={() => setShowPayModal(true)} style={S.payBtn}>
              <Smartphone size={16}/> Pay via UPI
            </button>
          </div>

          {/* Recent Attendance */}
          <div style={S.section}>
            <div style={S.sectionHead}>
              <span style={S.sectionTitle}>Recent Meals</span>
              <button type="button" onClick={() => setActiveTab('attendance')} style={S.seeAll}>
                See all <ChevronRight size={12}/>
              </button>
            </div>
            {attendanceList.slice(0,4).map((h,i) => (
              <div key={i} style={S.histItem}>
                <div>
                  <div style={{ fontWeight:'600', fontSize:'13px', color:'#1e293b' }}>
                    {new Date(h.date).toLocaleDateString('en-GB',{ day:'2-digit', month:'short', year:'numeric' })}
                  </div>
                  <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>Entry logged</div>
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  {h.breakfast && <span style={S.mealTag('#fef3c7','#d97706')}>B</span>}
                  {h.lunch     && <span style={S.mealTag('#dcfce7','#16a34a')}>L</span>}
                  {h.dinner    && <span style={S.mealTag('#e0e7ff','#4f46e5')}>D</span>}
                </div>
              </div>
            ))}
            {attendanceList.length === 0 && (
              <div style={S.emptyState}>No attendance records yet.</div>
            )}
          </div>

          {/* Support */}
          <div style={S.supportBox}>
            <p style={{ fontSize:'12px', color:'#0c4a6e', margin:'0 0 10px 0', fontWeight:'600' }}>
              Need help? We're here for you.
            </p>
            <a href="https://wa.me/6267216334" style={S.waBtn}>
              <MessageSquare size={15}/> WhatsApp Support
            </a>
          </div>
        </>
      )}

      {/* ═══════════════════ ATTENDANCE TAB ══════════════════ */}
      {activeTab === 'attendance' && (
        <>
          {/* Monthly Summary */}
          <div style={S.attendSummary}>
            <div style={S.attendStat}>
              <h3 style={{ margin:0, fontSize:'24px', fontWeight:'800', color:'#1e293b' }}>
                {thisMonthMeals.length}
              </h3>
              <p style={{ margin:0, fontSize:'11px', color:'#64748b' }}>Total Meals</p>
            </div>
            <div style={S.attendDivider}/>
            <div style={S.attendStat}>
              <h3 style={{ margin:0, fontSize:'24px', fontWeight:'800', color:'#f59e0b' }}>
                {mealCount(thisMonthMeals,'breakfast')}
              </h3>
              <p style={{ margin:0, fontSize:'11px', color:'#64748b' }}>Breakfast</p>
            </div>
            <div style={S.attendDivider}/>
            <div style={S.attendStat}>
              <h3 style={{ margin:0, fontSize:'24px', fontWeight:'800', color:'#16a34a' }}>
                {mealCount(thisMonthMeals,'lunch')}
              </h3>
              <p style={{ margin:0, fontSize:'11px', color:'#64748b' }}>Lunch</p>
            </div>
            <div style={S.attendDivider}/>
            <div style={S.attendStat}>
              <h3 style={{ margin:0, fontSize:'24px', fontWeight:'800', color:'#4f46e5' }}>
                {mealCount(thisMonthMeals,'dinner')}
              </h3>
              <p style={{ margin:0, fontSize:'11px', color:'#64748b' }}>Dinner</p>
            </div>
          </div>

          {/* ── Day-wise Full History (present + missing) ── */}
          <div style={S.section}>
            <p style={S.sectionTitle}>Day-wise History (This Month)</p>
            <div style={{ maxHeight:'500px', overflowY:'auto' }}>
              {monthCalendar.length > 0
                ? [...monthCalendar].reverse().map((item, i) => {
                    const { day, date, record, hasMeal } = item;
                    const dateStr = date.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
                    const dayName = DAYS[date.getDay()];

                    if (!hasMeal) {
                      /* ── Missing Day ── */
                      return (
                        <div key={i} style={S.histItemMissing}>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <div style={S.missingIcon}>✕</div>
                            <div>
                              <div style={{ fontWeight:'600', fontSize:'13px', color:'#dc2626' }}>
                                {dateStr}
                              </div>
                              <div style={{ fontSize:'11px', color:'#fca5a5', marginTop:'2px' }}>
                                {dayName} · No meals recorded
                              </div>
                            </div>
                          </div>
                          <span style={S.missingBadge}>Missing</span>
                        </div>
                      );
                    }

                    /* ── Present Day ── */
                    return (
                      <div key={i} style={S.histItem}>
                        <div>
                          <div style={{ fontWeight:'600', fontSize:'13px', color:'#1e293b' }}>
                            {dateStr}
                          </div>
                          <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>
                            {dayName} · {[record?.breakfast && 'Breakfast', record?.lunch && 'Lunch', record?.dinner && 'Dinner']
                              .filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:'5px' }}>
                          {record?.breakfast && <span style={S.mealTag('#fef3c7','#d97706')}>B</span>}
                          {record?.lunch     && <span style={S.mealTag('#dcfce7','#16a34a')}>L</span>}
                          {record?.dinner    && <span style={S.mealTag('#e0e7ff','#4f46e5')}>D</span>}
                        </div>
                      </div>
                    );
                  })
                : <div style={S.emptyState}>No records yet for this month.</div>
              }
            </div>
          </div>

          {/* ── Missing Days Summary ── */}
          {missingDays.length > 0 && (
            <div style={S.missingSummaryBox}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                <AlertCircle size={14} color="#dc2626"/>
                <span style={{ fontSize:'13px', fontWeight:'700', color:'#dc2626' }}>
                  {missingDays.length} Missing Day{missingDays.length > 1 ? 's' : ''} This Month
                </span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {missingDays.map((d,i) => (
                  <span key={i} style={S.missingDayChip}>
                    {d.date.toLocaleDateString('en-GB',{ day:'2-digit', month:'short' })}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Full Attendance History (all months) ── */}
          <div style={S.section}>
            <p style={S.sectionTitle}>All Records</p>
            <div style={{ maxHeight:'300px', overflowY:'auto' }}>
              {attendanceList.length > 0
                ? attendanceList.map((h,i) => (
                  <div key={i} style={S.histItem}>
                    <div>
                      <div style={{ fontWeight:'600', fontSize:'13px', color:'#1e293b' }}>
                        {new Date(h.date).toLocaleDateString('en-GB',{ day:'2-digit', month:'short', year:'numeric' })}
                      </div>
                      <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>
                        {[h.breakfast && 'Breakfast', h.lunch && 'Lunch', h.dinner && 'Dinner']
                          .filter(Boolean).join(' · ') || 'No meals'}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'5px' }}>
                      {h.breakfast && <span style={S.mealTag('#fef3c7','#d97706')}>B</span>}
                      {h.lunch     && <span style={S.mealTag('#dcfce7','#16a34a')}>L</span>}
                      {h.dinner    && <span style={S.mealTag('#e0e7ff','#4f46e5')}>D</span>}
                    </div>
                  </div>
                ))
                : <div style={S.emptyState}>No attendance records yet.</div>
              }
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════ PROFILE TAB ═════════════════════ */}
      {activeTab === 'profile' && (
        <>
          <div style={S.profileCard}>
            <div style={{ position:'relative', width:'fit-content', margin:'0 auto 16px auto' }}>
              <img
                src={data.student?.profilePic || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                style={S.profileImg} alt="profile"
              />
              <button type="button" onClick={() => setIsEditing(true)} style={S.camBtn}>
                <Camera size={11} color="#fff"/>
              </button>
            </div>
            <h3 style={{ margin:'0 0 4px 0', fontSize:'18px', fontWeight:'800', color:'#1e293b', textAlign:'center' }}>
              {data.student?.name}
            </h3>
            <p style={{ margin:0, fontSize:'12px', color:'#64748b', textAlign:'center' }}>
              ID: {data.student?.phone}
            </p>
          </div>

          {/* Info Rows */}
          <div style={S.infoCard}>
            {[
              { label:'Email', value: data.student?.email || '—' },
              { label:'Address', value: data.student?.address || '—' },
              { label:'Emergency Contact', value: data.student?.emergencyContact || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={S.infoRow}>
                <span style={S.infoLabel}>{label}</span>
                <span style={S.infoVal}>{value}</span>
              </div>
            ))}
          </div>

          {!isEditing && (
            <button type="button" onClick={() => setIsEditing(true)} style={S.editProfileBtn}>
              Edit Profile
            </button>
          )}

          {isEditing && (
            <div style={S.editCard}>
              <p style={S.sectionTitle}>Edit Details</p>
              {[
                { key:'email',            ph:'Email address',     type:'email' },
                { key:'address',          ph:'Home address',      type:'text'  },
                { key:'emergencyContact', ph:'Emergency contact', type:'tel'   },
                { key:'profilePic',       ph:'Profile photo URL', type:'url'   },
              ].map(({ key, ph, type }) => (
                <input key={key} type={type} placeholder={ph} style={S.inp}
                  value={editForm[key]}
                  onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                />
              ))}
              <button type="button" onClick={handleUpdate} style={S.btnPrimary}>Save Changes</button>
              <button type="button" onClick={() => setIsEditing(false)}
                style={{ ...S.btnSecondary, marginTop:'8px' }}>Cancel</button>
            </div>
          )}

          {/* Logout */}
          <button type="button" onClick={handleLogout} style={S.logoutBtn}>
            <LogOut size={15}/> Logout
          </button>
        </>
      )}

      {/* ── Footer ── */}
      <footer style={S.footer}>
        <div style={S.footerDivider}/>
        <p style={S.footerBrand}>Apna mess</p>
        <p style={S.footerDev}>Developed by <strong>Jivan Karsh</strong></p>
        <div style={S.footerLinks}>
          <a href="tel:6267216334"            style={S.footerLink} title="Call us"><PhoneCall size={16}/></a>
          <a href="mailto:jivankarsh87@gmail.com" style={S.footerLink} title="Email us"><Mail size={16}/></a>
          <a href="https://wa.me/6267216334"  style={S.footerLink} title="WhatsApp"><MessageSquare size={16}/></a>
          <a href="https://github.com/jivankarsh" style={S.footerLink} target="_blank" rel="noopener noreferrer" title="GitHub"><ExternalLink size={16}/></a>
        </div>
        <div style={S.footerMeta}>
          <span>v2.9.0</span>
          <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
            <div style={S.dot}/> Secure
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
            <Wifi size={10}/> Live
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ─── Styles ─────────────────────────────────────────────────── */
const S = {
  /* page */
  page:     { padding:'16px', maxWidth:'480px', margin:'0 auto', background:'#f8fafc',
               minHeight:'100vh', fontFamily:"'Segoe UI', system-ui, sans-serif", boxSizing:'border-box' },

  /* toast */
  toast:    { position:'fixed', top:'16px', left:'50%', transform:'translateX(-50%)',
               display:'flex', alignItems:'center', gap:'8px', padding:'10px 18px',
               borderRadius:'20px', color:'#fff', fontSize:'13px', fontWeight:'600',
               zIndex:10000, boxShadow:'0 4px 20px rgba(0,0,0,0.15)', whiteSpace:'nowrap' },

  /* login */
  loginWrap: { display:'flex', alignItems:'center', justifyContent:'center',
               minHeight:'100vh', background:'#f1f5f9', padding:'20px', boxSizing:'border-box' },
  loginCard: { background:'#fff', padding:'32px 24px', borderRadius:'28px',
               boxShadow:'0 10px 40px rgba(0,0,0,0.08)', textAlign:'center',
               width:'100%', maxWidth:'360px', boxSizing:'border-box' },
  loginLogo: { width:'56px', height:'56px', background:'#e0e7ff', borderRadius:'18px',
               display:'flex', alignItems:'center', justifyContent:'center',
               margin:'0 auto 18px auto' },
  loginTitle:{ margin:'0 0 6px 0', fontSize:'22px', fontWeight:'800', color:'#1e293b' },
  loginSub:  { margin:'0 0 24px 0', fontSize:'13px', color:'#64748b' },
  loginFooter:{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
                marginTop:'20px', fontSize:'11px', color:'#94a3b8' },
  errBox:    { display:'flex', alignItems:'center', gap:'6px', justifyContent:'center',
               color:'#ef4444', marginTop:'14px', fontSize:'13px',
               background:'#fef2f2', padding:'10px', borderRadius:'10px' },

  /* inputs / buttons */
  inp:       { width:'100%', padding:'13px 14px', marginBottom:'10px', borderRadius:'12px',
               border:'1.5px solid #e2e8f0', outline:'none', boxSizing:'border-box',
               fontSize:'14px', background:'#f9fafb', transition:'border-color .2s',
               display:'block' },
  btnPrimary:{ width:'100%', padding:'14px', background:'#1e293b', color:'#fff',
               border:'none', borderRadius:'12px', fontWeight:'700', cursor:'pointer',
               fontSize:'14px', display:'block' },
  btnSecondary:{ width:'100%', padding:'12px', background:'#fff', color:'#475569',
                 border:'1.5px solid #e2e8f0', borderRadius:'12px', fontWeight:'600',
                 cursor:'pointer', display:'block' },

  /* top bar */
  topBar:   { display:'flex', justifyContent:'space-between', alignItems:'center',
               marginBottom:'14px' },
  greeting: { margin:'0 0 2px 0', fontSize:'12px', color:'#64748b' },
  greetName:{ margin:0, fontSize:'20px', fontWeight:'800', color:'#1e293b' },
  verifiedPill:{ fontSize:'11px', display:'flex', alignItems:'center', gap:'4px',
                  background:'#f0fdf4', color:'#166534', padding:'5px 10px',
                  borderRadius:'20px', fontWeight:'700' },
  iconBtn:  { background:'#fff', border:'1.5px solid #fee2e2', borderRadius:'12px',
               padding:'8px', cursor:'pointer', display:'flex', alignItems:'center' },

  /* due alert */
  dueAlert: { display:'flex', alignItems:'center', gap:'8px', background:'#fffbeb',
               border:'1.5px solid #fde68a', borderRadius:'14px', padding:'10px 14px',
               marginBottom:'14px' },
  duePayBtn:{ marginLeft:'auto', background:'#f59e0b', color:'#fff', border:'none',
               borderRadius:'8px', padding:'5px 12px', fontSize:'11px', fontWeight:'800',
               cursor:'pointer' },

  /* tab bar */
  tabBar:   { display:'flex', background:'#f1f5f9', borderRadius:'14px',
               padding:'4px', marginBottom:'16px', gap:'4px' },
  tab:      { flex:1, padding:'9px', border:'none', background:'transparent',
               borderRadius:'10px', fontWeight:'600', fontSize:'13px', color:'#64748b',
               cursor:'pointer', transition:'all .2s' },
  tabActive:{ background:'#fff', color:'#1e293b', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' },

  /* meal card */
  mealCard: { background:'#fff', padding:'18px', borderRadius:'20px', marginBottom:'14px',
               boxShadow:'0 4px 20px rgba(0,0,0,0.05)' },
  mealCardTop:{ display:'flex', justifyContent:'space-between', alignItems:'center',
                marginBottom:'10px' },
  mealIcon: { width:'32px', height:'32px', background:'#fffbeb', borderRadius:'10px',
               display:'flex', alignItems:'center', justifyContent:'center' },
  mealLabel:{ fontSize:'13px', fontWeight:'700', color:'#92400e' },
  dayBadge: { background:'#fffbeb', color:'#b45309', padding:'4px 10px',
               borderRadius:'8px', fontSize:'11px', fontWeight:'800' },
  dishName: { fontSize:'22px', fontWeight:'800', margin:'0 0 8px 0', color:'#1e293b' },
  mealMeta: { display:'flex', alignItems:'center', gap:'5px', color:'#94a3b8', fontSize:'11px' },

  /* stats */
  statsGrid:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' },
  statCard: (bg,color) => ({
    background:bg, color, padding:'16px', borderRadius:'18px',
    display:'flex', flexDirection:'column', gap:'4px'
  }),
  statLabel:{ margin:'4px 0 0 0', fontSize:'11px', opacity:0.75, fontWeight:'600' },
  statVal:  { margin:'2px 0 0 0', fontSize:'20px', fontWeight:'800' },
  statNA:   { margin:'4px 0 0 0', fontSize:'10px', lineHeight:'1.4', fontWeight:'600', opacity:0.7 },

  /* pay card */
  payCard:  { background:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
               padding:'24px', borderRadius:'24px', marginBottom:'20px', color:'#fff' },
  billAmt:  { color:'#fff', fontSize:'36px', margin:'10px 0 0 0', fontWeight:'800', letterSpacing:'-1px' },
  payBtn:   { width:'100%', padding:'14px', background:'#fff', color:'#4f46e5',
               border:'none', borderRadius:'12px', fontWeight:'800',
               display:'flex', alignItems:'center', justifyContent:'center',
               gap:'8px', cursor:'pointer', marginTop:'16px', fontSize:'14px' },

  /* section */
  section:  { marginBottom:'16px' },
  sectionHead:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' },
  sectionTitle:{ fontSize:'14px', fontWeight:'700', color:'#475569', marginBottom:'10px' },
  seeAll:   { display:'flex', alignItems:'center', gap:'2px', background:'none', border:'none',
               color:'#4f46e5', fontSize:'12px', fontWeight:'600', cursor:'pointer' },
  histItem: { display:'flex', justifyContent:'space-between', alignItems:'center',
               padding:'13px 14px', background:'#fff', borderRadius:'14px', marginBottom:'8px',
               border:'1px solid #f1f5f9' },

  /* missing day styles */
  histItemMissing: { display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'13px 14px', background:'#fff5f5', borderRadius:'14px', marginBottom:'8px',
                      border:'1.5px solid #fecaca' },
  missingIcon:     { width:'28px', height:'28px', background:'#fee2e2', borderRadius:'8px',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'13px', fontWeight:'900', color:'#dc2626', flexShrink:0 },
  missingBadge:    { background:'#fee2e2', color:'#dc2626', padding:'4px 10px',
                      borderRadius:'8px', fontSize:'10px', fontWeight:'900' },

  /* missing days summary box */
  missingSummaryBox:{ background:'#fff5f5', border:'1.5px solid #fecaca', borderRadius:'16px',
                       padding:'14px 16px', marginBottom:'16px' },
  missingDayChip:  { background:'#fee2e2', color:'#dc2626', padding:'4px 10px',
                      borderRadius:'8px', fontSize:'11px', fontWeight:'700' },

  mealTag:  (bg,color) => ({
    background:bg, color, padding:'3px 8px', borderRadius:'6px', fontSize:'10px', fontWeight:'900'
  }),
  emptyState:{ textAlign:'center', color:'#94a3b8', fontSize:'13px', padding:'30px' },

  /* support */
  supportBox:{ background:'#f0f9ff', border:'1.5px solid #bae6fd', textAlign:'center',
               padding:'16px', borderRadius:'20px', marginBottom:'16px' },
  waBtn:    { display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
               background:'#25d366', color:'#fff', textDecoration:'none',
               padding:'11px', borderRadius:'12px', fontSize:'13px', fontWeight:'700' },

  /* attendance tab */
  attendSummary:{ background:'#fff', borderRadius:'20px', padding:'20px',
                   display:'flex', justifyContent:'space-around', alignItems:'center',
                   marginBottom:'16px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)' },
  attendStat:   { textAlign:'center' },
  attendDivider:{ width:'1px', height:'40px', background:'#f1f5f9' },

  /* profile tab */
  profileCard:{ background:'#fff', borderRadius:'24px', padding:'24px',
                 marginBottom:'14px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)' },
  profileImg: { width:'80px', height:'80px', borderRadius:'20px', objectFit:'cover',
                display:'block' },
  camBtn:     { position:'absolute', bottom:'-6px', right:'-6px', background:'#1e293b',
                border:'2px solid #fff', borderRadius:'50%', padding:'7px',
                cursor:'pointer', display:'flex', alignItems:'center' },
  infoCard:   { background:'#fff', borderRadius:'20px', padding:'6px 16px',
                marginBottom:'14px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)' },
  infoRow:    { display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'12px 0', borderBottom:'1px solid #f8fafc' },
  infoLabel:  { fontSize:'12px', color:'#64748b', fontWeight:'600' },
  infoVal:    { fontSize:'13px', color:'#1e293b', fontWeight:'700', maxWidth:'60%',
                textAlign:'right', wordBreak:'break-word' },
  editProfileBtn:{ width:'100%', padding:'14px', background:'#ede9fe', color:'#4f46e5',
                    border:'none', borderRadius:'12px', fontWeight:'700', cursor:'pointer',
                    fontSize:'14px', marginBottom:'12px' },
  editCard:   { background:'#fff', borderRadius:'20px', padding:'18px',
                marginBottom:'14px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)' },
  logoutBtn:  { width:'100%', padding:'13px', background:'#fff', color:'#ef4444',
                border:'1.5px solid #fee2e2', borderRadius:'12px', fontWeight:'700',
                display:'flex', alignItems:'center', justifyContent:'center',
                gap:'8px', cursor:'pointer', marginBottom:'20px' },

  /* modal */
  overlay:    { position:'fixed', inset:0, background:'rgba(15,23,42,0.6)',
                display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:9999 },
  modal:      { background:'#fff', width:'100%', maxWidth:'480px',
                borderRadius:'28px 28px 0 0', padding:'24px 20px 44px',
                position:'relative', textAlign:'center',
                maxHeight:'92vh', overflowY:'auto' },
  modalHandle:{ width:'40px', height:'4px', background:'#e2e8f0', borderRadius:'99px',
                margin:'0 auto 20px auto' },
  closeBtn:   { position:'absolute', top:'16px', right:'16px', background:'#f1f5f9',
                border:'none', borderRadius:'50%', width:'32px', height:'32px',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', color:'#475569' },
  modalTitle: { margin:'0 0 4px 0', fontSize:'20px', color:'#1e293b', fontWeight:'800' },
  modalSub:   { margin:'0 0 18px 0', fontSize:'12px', color:'#64748b' },

  qrBox:      { display:'flex', justifyContent:'center', background:'#f8fafc',
                borderRadius:'16px', padding:'16px', marginBottom:'14px' },
  qrImg:      { width:'200px', height:'200px', borderRadius:'8px', display:'block' },

  amountChip: { display:'inline-block', background:'#ede9fe', color:'#4f46e5',
                padding:'7px 20px', borderRadius:'20px', fontSize:'14px',
                fontWeight:'800', marginBottom:'14px' },

  upiRow:     { display:'flex', alignItems:'center', gap:'10px', background:'#f8fafc',
                padding:'12px 14px', borderRadius:'14px', marginBottom:'10px', textAlign:'left' },
  upiTxt:     { fontSize:'13px', fontWeight:'700', color:'#1e293b', flex:1 },
  copyBtn:    { padding:'7px 12px', borderRadius:'10px', border:'none', fontSize:'12px',
                fontWeight:'700', cursor:'pointer', flexShrink:0,
                display:'flex', alignItems:'center', gap:'4px' },
  doneBtn:    { width:'100%', padding:'14px', background:'#1e293b', color:'#fff',
                border:'none', borderRadius:'14px', fontWeight:'800',
                cursor:'pointer', fontSize:'15px', marginTop:'14px' },

  /* footer */
  footer:       { textAlign:'center', marginTop:'20px', paddingBottom:'20px' },
  footerDivider:{ height:'1px', background:'linear-gradient(90deg,transparent,#e2e8f0,transparent)', marginBottom:'20px' },
  footerBrand:  { margin:'0 0 4px 0', fontWeight:'800', fontSize:'14px', color:'#1e293b' },
  footerDev:    { margin:'0 0 16px 0', fontSize:'12px', color:'#64748b' },
  footerLinks:  { display:'flex', justifyContent:'center', gap:'10px', marginBottom:'16px' },
  footerLink:   { padding:'12px', background:'#fff', borderRadius:'12px',
                  color:'#1e293b', display:'flex', textDecoration:'none',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  footerMeta:   { display:'flex', alignItems:'center', justifyContent:'space-between',
                  fontSize:'10px', color:'#94a3b8', padding:'0 4px' },
  dot:          { width:'6px', height:'6px', background:'#22c55e', borderRadius:'50%' },
};

export default StudentPortal;