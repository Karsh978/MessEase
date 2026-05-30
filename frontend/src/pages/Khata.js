import React, { useState, useEffect } from 'react';
import { fetchExpenses, addExpense, API } from '../api';
import { PlusCircle, IndianRupee, ShoppingBag, Trash2, TrendingDown, Calendar, Hash } from 'lucide-react';

const Khata = () => {
  const [expenses, setExpenses]   = useState([]);
  const [item, setItem]           = useState('');
  const [amount, setAmount]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterMonth, setFilterMonth] = useState('all');

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await fetchExpenses();
      setExpenses(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!item.trim() || !amount) return;
    try {
      setAdding(true);
      await addExpense({ item: item.trim(), amount: parseFloat(amount) });
      setItem(''); setAmount('');
      loadExpenses();
    } catch (e) { alert('Add nahi hua!'); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yeh kharcha delete karna chahte ho?')) return;
    try {
      setDeletingId(id);
      await API.delete(`/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e._id !== id));
    } catch (e) { alert('Delete nahi hua!'); }
    finally { setDeletingId(null); }
  };

  // Month filter
  const months = [...new Set(expenses.map(e => {
    const d = new Date(e.date);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }))].sort((a,b) => b.localeCompare(a));

  const filtered = filterMonth === 'all'
    ? expenses
    : expenses.filter(e => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        return key === filterMonth;
      });

  const totalExpense  = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalAll      = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const fmtDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmtMonthLabel = (key) => {
    const [y, m] = key.split('-');
    return new Date(y, parseInt(m)-1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #0D0D0D;
          --surface:   #161616;
          --surface2:  #1E1E1E;
          --border:    #2A2A2A;
          --border2:   #333;
          --gold:      #D4A843;
          --gold-dim:  #A8822F;
          --gold-bg:   #1C1505;
          --gold-ring: #3D2E0A;
          --red:       #E05252;
          --red-bg:    #1A0A0A;
          --green:     #4CAF7D;
          --text:      #F0EDE8;
          --text2:     #999;
          --text3:     #555;
          --radius:    14px;
          --font:      'Sora', sans-serif;
          --serif:     'Instrument Serif', serif;
        }

        .kh-root {
          font-family: var(--font);
          background: var(--bg);
          min-height: 100vh;
          color: var(--text);
          padding: 0 0 60px;
        }

        /* ── HERO HEADER ── */
        .kh-hero {
          background: linear-gradient(135deg, #1A1200 0%, #0D0D0D 60%);
          border-bottom: 1px solid var(--border);
          padding: 24px 16px 20px;
          position: relative;
          overflow: hidden;
        }
        .kh-hero::before {
          content: '₹';
          position: absolute;
          right: -10px;
          top: -20px;
          font-family: var(--serif);
          font-size: 140px;
          color: var(--gold);
          opacity: 0.04;
          line-height: 1;
          pointer-events: none;
          user-select: none;
        }
        .kh-hero-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .kh-hero-icon {
          width: 42px; height: 42px;
          background: var(--gold-bg);
          border: 1px solid var(--gold-ring);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .kh-hero-title {
          font-family: var(--serif);
          font-size: 22px;
          font-style: italic;
          color: var(--text);
          line-height: 1.1;
        }
        .kh-hero-sub {
          font-size: 11px;
          color: var(--text3);
          margin-top: 2px;
          letter-spacing: 0.04em;
        }

        /* Stats row */
        .kh-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .kh-stat {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 10px;
          text-align: center;
        }
        .kh-stat-label {
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text3);
          margin-bottom: 5px;
        }
        .kh-stat-val {
          font-family: var(--serif);
          font-size: 18px;
          font-style: italic;
          color: var(--gold);
          line-height: 1;
        }
        .kh-stat-val.red { color: var(--red); }
        .kh-stat-val.green { color: var(--green); }

        /* ── CONTENT ── */
        .kh-content {
          padding: 16px;
          max-width: 700px;
          margin: 0 auto;
        }

        /* ── ADD FORM ── */
        .kh-form {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          margin-bottom: 20px;
        }
        .kh-form-head {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text3);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .kh-form-head::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .kh-form-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .kh-inp {
          font-family: var(--font);
          font-size: 14px;
          padding: 11px 14px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface2);
          color: var(--text);
          outline: none;
          transition: border-color 0.15s;
          min-width: 0;
        }
        .kh-inp:focus { border-color: var(--gold); }
        .kh-inp::placeholder { color: var(--text3); }
        .kh-inp-item { flex: 2 1 150px; width: 100%; }
        .kh-inp-amt  { flex: 1 1 100px; width: 100%; }
        .kh-inp-amt::-webkit-inner-spin-button { -webkit-appearance: none; }

        .kh-add-btn {
          font-family: var(--font);
          font-size: 13px;
          font-weight: 600;
          padding: 11px 18px;
          background: var(--gold);
          color: #0D0D0D;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex: 1 1 100%;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .kh-add-btn:hover  { background: #E8B84C; }
        .kh-add-btn:active { transform: scale(0.97); }
        .kh-add-btn:disabled { opacity: 0.5; cursor: wait; }
        @media (min-width: 400px) {
          .kh-add-btn { flex: 0 0 auto; }
        }

        /* ── FILTER ── */
        .kh-filter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 10px;
          flex-wrap: wrap;
        }
        .kh-filter-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text3);
        }
        .kh-filter-select {
          font-family: var(--font);
          font-size: 12px;
          font-weight: 500;
          padding: 7px 12px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          outline: none;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
        }
        .kh-filter-select:focus { border-color: var(--gold); }

        /* ── EXPENSE LIST ── */
        .kh-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .kh-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: border-color 0.15s, background 0.15s;
          animation: fadeIn 0.2s ease;
        }
        .kh-item:hover { border-color: var(--border2); background: var(--surface2); }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }

        .kh-item-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: var(--gold-bg);
          border: 1px solid var(--gold-ring);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: var(--gold);
        }

        .kh-item-info {
          flex: 1;
          min-width: 0;
        }
        .kh-item-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }
        .kh-item-date {
          font-size: 11px;
          color: var(--text3);
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .kh-item-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .kh-item-amt {
          font-family: var(--serif);
          font-size: 17px;
          font-style: italic;
          color: var(--gold);
          white-space: nowrap;
        }

        .kh-del-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text3);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .kh-del-btn:hover  { background: var(--red-bg); color: var(--red); border-color: var(--red); }
        .kh-del-btn:active { transform: scale(0.93); }
        .kh-del-btn:disabled { opacity: 0.4; cursor: wait; }

        /* ── EMPTY ── */
        .kh-empty {
          text-align: center;
          padding: 48px 20px;
          color: var(--text3);
        }
        .kh-empty-icon {
          font-size: 40px;
          margin-bottom: 10px;
          opacity: 0.3;
        }
        .kh-empty-text {
          font-size: 14px;
          font-style: italic;
          font-family: var(--serif);
        }

        /* ── TOTAL ROW at bottom ── */
        .kh-total-row {
          background: var(--gold-bg);
          border: 1px solid var(--gold-ring);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 14px;
        }
        .kh-total-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--gold-dim);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .kh-total-amt {
          font-family: var(--serif);
          font-size: 22px;
          font-style: italic;
          color: var(--gold);
        }

        /* ── LOADING ── */
        .kh-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 12px;
          color: var(--text3);
          font-size: 13px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .kh-spin {
          width: 32px; height: 32px;
          border: 2px solid var(--border);
          border-top-color: var(--gold);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* ── COUNT BADGE ── */
        .kh-count {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 600;
          color: var(--text3);
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 3px 8px;
        }
      `}</style>

      <div className="kh-root">

        {/* ── HERO ── */}
        <div className="kh-hero">
          <div className="kh-hero-top">
            <div className="kh-hero-icon">
              <IndianRupee size={20} color="#D4A843" />
            </div>
            <div>
              <div className="kh-hero-title">Digital Khata</div>
              <div className="kh-hero-sub">Roz ka kharcha track karo</div>
            </div>
          </div>

          {/* Stats */}
          <div className="kh-stats">
            <div className="kh-stat">
              <div className="kh-stat-label">Total Entries</div>
              <div className="kh-stat-val">{expenses.length}</div>
            </div>
            <div className="kh-stat">
              <div className="kh-stat-label">
                {filterMonth === 'all' ? 'Sab Kharcha' : 'Is Mahine'}
              </div>
              <div className="kh-stat-val red">₹{totalExpense.toLocaleString('en-IN')}</div>
            </div>
            <div className="kh-stat">
              <div className="kh-stat-label">Grand Total</div>
              <div className="kh-stat-val">₹{totalAll.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        <div className="kh-content">

          {/* ── ADD FORM ── */}
          <div className="kh-form">
            <div className="kh-form-head">Naya Kharcha</div>
            <form onSubmit={handleAdd}>
              <div className="kh-form-row">
                <input
                  className="kh-inp kh-inp-item"
                  value={item}
                  onChange={e => setItem(e.target.value)}
                  placeholder="Kya kharida? (e.g. Sabzi, Gas)"
                  required
                />
                <input
                  className="kh-inp kh-inp-amt"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="₹ Amount"
                  min="1"
                  required
                />
                <button className="kh-add-btn" type="submit" disabled={adding}>
                  {adding
                    ? <><div className="kh-spin" style={{width:14,height:14,borderWidth:2}} /> Saving...</>
                    : <><PlusCircle size={14} /> Save Kharcha</>
                  }
                </button>
              </div>
            </form>
          </div>

          {/* ── FILTER ROW ── */}
          <div className="kh-filter-row">
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div className="kh-filter-label">Kharche ki List</div>
              <div className="kh-count">
                <Hash size={9} /> {filtered.length}
              </div>
            </div>
            {months.length > 0 && (
              <select
                className="kh-filter-select"
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
              >
                <option value="all">Sab Mahine</option>
                {months.map(m => (
                  <option key={m} value={m}>{fmtMonthLabel(m)}</option>
                ))}
              </select>
            )}
          </div>

          {/* ── LIST ── */}
          {loading ? (
            <div className="kh-loading">
              <div className="kh-spin" />
              <span>Load ho raha hai...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="kh-empty">
              <div className="kh-empty-icon">📭</div>
              <div className="kh-empty-text">
                {filterMonth === 'all' ? 'Koi kharcha nahi mila' : 'Is mahine koi kharcha nahi'}
              </div>
            </div>
          ) : (
            <>
              <div className="kh-list">
                {filtered.map(exp => (
                  <div key={exp._id} className="kh-item">
                    <div className="kh-item-icon">
                      <ShoppingBag size={15} />
                    </div>
                    <div className="kh-item-info">
                      <div className="kh-item-name">{exp.item}</div>
                      <div className="kh-item-date">
                        <Calendar size={10} />
                        {fmtDate(exp.date)}
                      </div>
                    </div>
                    <div className="kh-item-right">
                      <div className="kh-item-amt">₹{(exp.amount || 0).toLocaleString('en-IN')}</div>
                      <button
                        className="kh-del-btn"
                        onClick={() => handleDelete(exp._id)}
                        disabled={deletingId === exp._id}
                        title="Delete karo"
                      >
                        {deletingId === exp._id
                          ? <div className="kh-spin" style={{width:12,height:12,borderWidth:2}} />
                          : <Trash2 size={13} />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div className="kh-total-row">
                <div className="kh-total-label">
                  <TrendingDown size={14} color="#A8822F" />
                  {filterMonth === 'all' ? 'Total Kharcha' : `${fmtMonthLabel(filterMonth)} Total`}
                </div>
                <div className="kh-total-amt">₹{totalExpense.toLocaleString('en-IN')}</div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default Khata;