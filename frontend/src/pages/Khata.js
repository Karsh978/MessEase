import React, { useState, useEffect } from 'react';
import { fetchExpenses, addExpense } from '../api';
import { PlusCircle, IndianRupee, ShoppingBag } from 'lucide-react';

const Khata = () => {
  const [expenses, setExpenses] = useState([]);
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    const { data } = await fetchExpenses();
    setExpenses(data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    await addExpense({ item, amount });
    setItem(''); setAmount('');
    loadExpenses();
  };

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .kh-wrap {
          font-family: 'DM Sans', sans-serif;
          padding: clamp(12px, 4vw, 28px) clamp(12px, 4vw, 24px) 40px;
          max-width: 700px;
          margin: 0 auto;
          color: #1a1a1a;
          min-height: 100vh;
        }

        /* Header */
        .kh-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: clamp(16px, 4vw, 24px);
        }
        .kh-header-icon {
          width: clamp(36px, 8vw, 44px);
          height: clamp(36px, 8vw, 44px);
          background: #B45309;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .kh-header-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(17px, 4vw, 22px);
          font-weight: 600;
          color: #111;
          margin: 0;
          line-height: 1.2;
        }
        .kh-header-sub {
          font-size: clamp(11px, 2.5vw, 13px);
          color: #999;
          margin: 2px 0 0;
        }

        /* Total Card */
        .kh-total {
          background: #FEF3C7;
          border: 1.5px solid #F59E0B;
          border-radius: 14px;
          padding: clamp(12px, 3vw, 16px) clamp(14px, 4vw, 20px);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .kh-total-label {
          font-size: clamp(10px, 2.5vw, 12px);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #92400E;
        }
        .kh-total-amount {
          font-family: 'Playfair Display', serif;
          font-size: clamp(20px, 5vw, 26px);
          font-weight: 600;
          color: #78350F;
        }

        /* Add Form */
        .kh-form-card {
          background: #fff;
          border: 0.5px solid #e0e0e0;
          border-radius: 12px;
          padding: clamp(12px, 3vw, 16px);
          margin-bottom: 20px;
        }
        .kh-form-label {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #999;
          margin-bottom: 10px;
        }
        .kh-form-row {
          display: flex;
          gap: 8px;
          align-items: stretch;
          flex-wrap: wrap;
        }
        .kh-form-row input {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(13px, 3vw, 14px);
          padding: 9px 12px;
          border: 0.5px solid #ddd;
          border-radius: 8px;
          background: #fafafa;
          color: #111;
          outline: none;
          min-width: 0;
          width: 100%;
          transition: border-color 0.12s;
        }
        .kh-form-row input:focus { border-color: #F59E0B; background: #fff; }
        .kh-form-row input::placeholder { color: #bbb; }

        .kh-input-item { flex: 2 1 140px; }
        .kh-input-amt  { flex: 1 1 90px; }

        .kh-add-btn {
          background: #B45309;
          color: #fff;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(12px, 2.5vw, 13px);
          font-weight: 500;
          padding: 9px 16px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          white-space: nowrap;
          flex: 1 1 100%;
          transition: background 0.12s;
        }
        @media (min-width: 420px) {
          .kh-add-btn { flex: 0 0 auto; }
        }
        .kh-add-btn:hover { background: #92400E; }

        /* Section label */
        .kh-section-label {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: #999;
          margin-bottom: 10px;
        }

        /* Desktop Table */
        .kh-table-wrap {
          background: #fff;
          border: 0.5px solid #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .kh-table {
          width: 100%;
          min-width: 280px;
          border-collapse: collapse;
          font-size: clamp(12px, 2.8vw, 13px);
        }
        .kh-table thead tr {
          background: #fafafa;
          border-bottom: 0.5px solid #e8e8e8;
        }
        .kh-table thead th {
          text-align: left;
          font-size: clamp(10px, 2.2vw, 11px);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #999;
          padding: clamp(8px, 2vw, 11px) clamp(10px, 3vw, 14px);
          white-space: nowrap;
        }
        .kh-table tbody tr {
          border-bottom: 0.5px solid #f0f0f0;
          transition: background 0.1s;
        }
        .kh-table tbody tr:last-child { border-bottom: none; }
        .kh-table tbody tr:hover { background: #fffbf5; }
        .kh-table tbody td {
          padding: clamp(9px, 2vw, 11px) clamp(10px, 3vw, 14px);
          color: #333;
          vertical-align: middle;
        }
        .td-date { color: #aaa; font-size: clamp(11px, 2.2vw, 12px); white-space: nowrap; }
        .td-item { font-weight: 500; color: #111; word-break: break-word; }
        .td-item-inner { display: flex; align-items: center; gap: 6px; }
        .td-amt { font-family: 'Playfair Display', serif; font-weight: 500; color: #B45309; text-align: right; white-space: nowrap; }
        .kh-empty { text-align: center; padding: 28px; color: #ccc; font-size: 13px; font-style: italic; }

        /* Mobile: hide table, show cards */
        .kh-card-list { display: none; }

        @media (max-width: 480px) {
          .kh-table-wrap { display: none; }
          .kh-card-list  { display: flex; flex-direction: column; gap: 7px; }
          .kh-exp-card {
            background: #fff;
            border: 0.5px solid #e8e8e8;
            border-radius: 10px;
            padding: 11px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .kh-exp-icon {
            width: 32px; height: 32px;
            border-radius: 8px;
            background: #FEF3C7;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            color: #B45309;
          }
          .kh-exp-info { flex: 1; min-width: 0; }
          .kh-exp-name {
            font-size: 13px; font-weight: 500; color: #111;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .kh-exp-date { font-size: 11px; color: #aaa; margin-top: 2px; }
          .kh-exp-amt {
            font-family: 'Playfair Display', serif;
            font-size: 15px; font-weight: 600; color: #B45309; flex-shrink: 0;
          }
          .kh-empty-card { text-align: center; padding: 28px; color: #ccc; font-size: 13px; font-style: italic; }
        }
      `}</style>

      <div className="kh-wrap">

        {/* Header */}
        <div className="kh-header">
          <div className="kh-header-icon">
            <IndianRupee size={20} />
          </div>
          <div>
            <p className="kh-header-title">Digital Khata</p>
            <p className="kh-header-sub">Roz ka kharcha track karo</p>
          </div>
        </div>

        {/* Total */}
        <div className="kh-total">
          <div className="kh-total-label">Total Kharcha</div>
          <div className="kh-total-amount">₹{totalExpense}</div>
        </div>

        {/* Add Form */}
        <div className="kh-form-card">
          <div className="kh-form-label">Naya Kharcha Add Karo</div>
          <form onSubmit={handleAdd}>
            <div className="kh-form-row">
              <input
                className="kh-input-item"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="Kya kharida?"
                required
              />
              <input
                className="kh-input-amt"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₹ Amount"
                required
              />
              <button type="submit" className="kh-add-btn">
                <PlusCircle size={13} /> Save Kharcha
              </button>
            </div>
          </form>
        </div>

        {/* Section label */}
        <div className="kh-section-label">Kharche ki List</div>

        {/* Desktop — Table */}
        <div className="kh-table-wrap">
          <table className="kh-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={3} className="kh-empty">Koi kharcha nahi mila</td></tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp._id}>
                    <td className="td-date">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="td-item">
                      <div className="td-item-inner">
                        <ShoppingBag size={11} style={{ color: '#F59E0B', flexShrink: 0 }} />
                        {exp.item}
                      </div>
                    </td>
                    <td className="td-amt">₹{exp.amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile — Cards */}
        <div className="kh-card-list">
          {expenses.length === 0 ? (
            <div className="kh-empty-card">Koi kharcha nahi mila</div>
          ) : (
            expenses.map(exp => (
              <div key={exp._id} className="kh-exp-card">
                <div className="kh-exp-icon">
                  <ShoppingBag size={14} />
                </div>
                <div className="kh-exp-info">
                  <div className="kh-exp-name">{exp.item}</div>
                  <div className="kh-exp-date">{new Date(exp.date).toLocaleDateString()}</div>
                </div>
                <div className="kh-exp-amt">₹{exp.amount}</div>
              </div>
            ))
          )}
        </div>

      </div>
    </>
  );
};

export default Khata;