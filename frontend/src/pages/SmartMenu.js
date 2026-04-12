import React, { useState, useEffect } from 'react';
import { fetchMenu, updateMenu } from '../api';
import { Utensils, ShoppingBasket, Calendar, Pencil, X, Check } from 'lucide-react';

const SmartMenu = () => {
  const [menu, setMenu] = useState([]);
  const [editingDay, setEditingDay] = useState(null);
  const [newDish, setNewDish] = useState({ dish: '', ingredients: '' });

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Aaj ka aur kal ka din nikalne ka logic
  const todayIndex = new Date().getDay();
  const tomorrowIndex = (todayIndex + 1) % 7;
  const tomorrowDay = days[tomorrowIndex];

  useEffect(() => { loadMenu(); }, []);

  const loadMenu = async () => {
    const { data } = await fetchMenu();
    setMenu(data);
  };

  const handleUpdate = async (day) => {
    await updateMenu({ day, ...newDish });
    setEditingDay(null);
    loadMenu();
  };

  // Kal ke liye shopping list nikalna
  const tomorrowMenu = menu.find(m => m.day === tomorrowDay);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap');

        .sm-wrap {
          font-family: 'DM Sans', sans-serif;
          padding: 20px 16px 32px;
          max-width: 520px;
          margin: 0 auto;
          color: #1a1a1a;
        }

        /* ── Header ── */
        .sm-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .sm-header-icon {
          width: 42px; height: 42px;
          background: #0F6E56;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .sm-header-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 600;
          line-height: 1.2;
          color: #111;
          margin: 0;
        }
        .sm-header-sub {
          font-size: 12px;
          color: #888;
          margin: 2px 0 0;
        }

        /* ── Tomorrow Card ── */
        .sm-tomorrow {
          background: #E1F5EE;
          border: 1.5px solid #5DCAA5;
          border-radius: 14px;
          padding: 16px 18px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        .sm-tomorrow::after {
          content: '';
          position: absolute;
          top: -20px; right: -20px;
          width: 90px; height: 90px;
          border-radius: 50%;
          background: #9FE1CB;
          opacity: 0.35;
          pointer-events: none;
        }
        .sm-tomorrow-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #0F6E56;
          margin-bottom: 8px;
        }
        .sm-tomorrow-dish {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: #085041;
          margin-bottom: 10px;
          line-height: 1.3;
        }
        .sm-tomorrow-ing-label {
          font-size: 11px;
          font-weight: 500;
          color: #0F6E56;
          margin-bottom: 6px;
        }
        .sm-tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .sm-tag {
          background: #fff;
          border: 1px solid #5DCAA5;
          color: #085041;
          font-size: 11px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 20px;
        }
        .sm-not-set {
          font-size: 13px;
          color: #5a7a6e;
          font-style: italic;
          margin: 4px 0 0;
        }

        /* ── Section label ── */
        .sm-section-label {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: #999;
          margin-bottom: 10px;
        }

        /* ── Day Grid ── */
        .sm-grid {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .sm-day-card {
          background: #fff;
          border: 0.5px solid #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .sm-day-card:hover {
          border-color: #b0b0b0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .sm-day-card.today {
          border: 1.5px solid #1D9E75;
          background: #f4fdf9;
        }

        .sm-day-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
        }

        .sm-day-dot {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: #f2f2f2;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
          font-weight: 500;
          color: #888;
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }
        .sm-day-card.today .sm-day-dot {
          background: #1D9E75;
          color: #fff;
        }

        .sm-day-info { flex: 1; min-width: 0; }
        .sm-day-name {
          font-size: 13px;
          font-weight: 500;
          color: #111;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }
        .sm-today-pill {
          font-size: 9px;
          font-weight: 500;
          background: #9FE1CB;
          color: #085041;
          padding: 2px 7px;
          border-radius: 10px;
          letter-spacing: 0.04em;
        }
        .sm-day-dish {
          font-size: 12px;
          color: #777;
          display: flex;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sm-day-dish.empty { color: #bbb; font-style: italic; }

        .sm-edit-btn {
          background: none;
          border: 0.5px solid #ddd;
          color: #888;
          font-size: 11px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          padding: 4px 11px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          transition: all 0.12s;
        }
        .sm-edit-btn:hover {
          background: #f5f5f5;
          color: #333;
          border-color: #bbb;
        }

        /* ── Edit Form ── */
        .sm-edit-form {
          padding: 10px 14px 12px;
          border-top: 0.5px solid #eee;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .sm-edit-form input {
          width: 100%;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          padding: 7px 11px;
          border: 0.5px solid #ddd;
          border-radius: 7px;
          background: #fff;
          color: #111;
          outline: none;
          transition: border-color 0.12s;
        }
        .sm-edit-form input:focus { border-color: #1D9E75; }
        .sm-edit-form input::placeholder { color: #bbb; }

        .sm-save-btn {
          align-self: flex-end;
          background: #0F6E56;
          color: #fff;
          border: none;
          font-size: 12px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          padding: 6px 18px;
          border-radius: 7px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: background 0.12s;
        }
        .sm-save-btn:hover { background: #085041; }
      `}</style>

      <div className="sm-wrap">

        {/* Header */}
        <div className="sm-header">
          <div className="sm-header-icon">
            <Calendar size={20} />
          </div>
          <div>
            <p className="sm-header-title">Smart Menu</p>
            <p className="sm-header-sub">Weekly planner & shopping helper</p>
          </div>
        </div>

        {/* 1. TOMORROW'S ALERT (Special Help for Didi) */}
        <div className="sm-tomorrow">
          <div className="sm-tomorrow-label">
            <ShoppingBasket size={12} />
            Kal ki Taiyari — {tomorrowDay}
          </div>
          {tomorrowMenu ? (
            <>
              <div className="sm-tomorrow-dish">{tomorrowMenu.dish}</div>
              <div className="sm-tomorrow-ing-label">Market se kya lana hai</div>
              <div className="sm-tag-row">
                {tomorrowMenu.ingredients.split(',').map((ing, i) => (
                  <span key={i} className="sm-tag">{ing.trim()}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="sm-not-set">Kal ka menu set nahi hai.</p>
          )}
        </div>

        {/* 2. WEEKLY PLANNER */}
        <div className="sm-section-label">Hafte ka menu</div>
        <div className="sm-grid">
          {days.map((day, i) => {
            const dayData = menu.find(m => m.day === day);
            const isToday = i === todayIndex;
            return (
              <div key={day} className={`sm-day-card${isToday ? ' today' : ''}`}>
                <div className="sm-day-row">
                  <div className="sm-day-dot">{dayShort[i]}</div>
                  <div className="sm-day-info">
                    <div className="sm-day-name">
                      {day}
                      {isToday && <span className="sm-today-pill">Aaj</span>}
                    </div>
                    <div className={`sm-day-dish${dayData ? '' : ' empty'}`}>
                      <Utensils size={11} />
                      {dayData ? dayData.dish : 'Not set'}
                    </div>
                  </div>
                  <button
                    className="sm-edit-btn"
                    onClick={() => setEditingDay(editingDay === day ? null : day)}
                  >
                    {editingDay === day ? <X size={11} /> : <Pencil size={11} />}
                    {editingDay === day ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {editingDay === day && (
                  <div className="sm-edit-form">
                    <input
                      placeholder="Dish ka naam"
                      defaultValue={dayData?.dish || ''}
                      onChange={(e) => setNewDish({ ...newDish, dish: e.target.value })}
                    />
                    <input
                      placeholder="Ingredients (eg. Aloo, Paneer, Pyaaz)"
                      defaultValue={dayData?.ingredients || ''}
                      onChange={(e) => setNewDish({ ...newDish, ingredients: e.target.value })}
                    />
                    <button className="sm-save-btn" onClick={() => handleUpdate(day)}>
                      <Check size={12} /> Save
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
};

export default SmartMenu;