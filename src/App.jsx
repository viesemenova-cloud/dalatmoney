import { useState, useMemo, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc, setDoc } from "firebase/firestore";

// ── FIREBASE ──
const firebaseConfig = {
  apiKey: "AIzaSyDMcHuSHCXiZ9Dz9m8g6B97qojhQGXRGt0",
  authDomain: "dalatmoney-116b5.firebaseapp.com",
  projectId: "dalatmoney-116b5",
  storageBucket: "dalatmoney-116b5.firebasestorage.app",
  messagingSenderId: "1036706418283",
  appId: "1:1036706418283:web:e41bdc0763975a4e7a2b2e",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const APP_NAME = "Далат Мани";

const FAMILIES = {
  artem_natasha: { id: "artem_natasha", name: "Артём & Наташа", color: "#5B9BF8", bg: "#5B9BF822" },
  nastya_roma:   { id: "nastya_roma",   name: "Настя & Рома",   color: "#4ECDC4", bg: "#4ECDC422" },
};

const USERS = [
  { id: "artem",  name: "Артём",  family: "artem_natasha", emoji: "👨" },
  { id: "natasha",name: "Наташа", family: "artem_natasha", emoji: "👩" },
  { id: "nastya", name: "Настя",  family: "nastya_roma",   emoji: "👩" },
  { id: "roma",   name: "Рома",   family: "nastya_roma",   emoji: "👨" },
];

const CURRENCIES = [
  { id: "vnd", symbol: "₫",    name: "Донги" },
  { id: "rub", symbol: "₽",    name: "Рубли" },
  { id: "usd", symbol: "USDT", name: "USDT"  },
];

const DEFAULT_CATEGORIES = ["Аренда","Продукты","Кафе","Развлечения","Работа","Другое"];

const DEMO_EXPENSES = [];
const DEMO_SETTLEMENTS = [];

function formatMoney(n, currencyId) {
  const c = CURRENCIES.find(c => c.id === currencyId);
  if (!c) return String(n);
  if (currencyId === "vnd") return n.toLocaleString("ru-RU") + " ₫";
  if (currencyId === "rub") return n.toLocaleString("ru-RU") + " ₽";
  return n.toLocaleString("ru-RU") + " USDT";
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function formatDateTime(d) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function currentMonth() { return new Date().toISOString().slice(0,7); }
function prevMonth() {
  const d = new Date(); d.setMonth(d.getMonth()-1);
  return d.toISOString().slice(0,7);
}

// ── LOGIN ──
function LoginScreen({ onLogin }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={S.loginRoot}>
      <div style={S.loginInner}>
        <div style={S.loginLogo}>🌿</div>
        <div style={S.loginTitle}>{APP_NAME}</div>
        <div style={S.loginSub}>Кто ты?</div>
        <div style={S.loginGrid}>
          {USERS.map(u => {
            const f = FAMILIES[u.family];
            return (
              <button key={u.id}
                style={{ ...S.userCard, borderColor: hovered===u.id ? f.color:"#2D2D4E", background: hovered===u.id ? f.bg:"#1E1E3A" }}
                onMouseEnter={() => setHovered(u.id)} onMouseLeave={() => setHovered(null)}
                onClick={() => onLogin(u)}>
                <div style={S.userEmoji}>{u.emoji}</div>
                <div style={S.userName}>{u.name}</div>
                <div style={{ ...S.userFamily, color: f.color }}>{f.name}</div>
              </button>
            );
          })}
        </div>
        <div style={S.loginHint}>Телефон запомнит тебя в следующий раз</div>
      </div>
    </div>
  );
}

// ── ADD EXPENSE MODAL ──
function AddExpenseModal({ currentUser, categories, onAdd, onClose }) {
  const myFamily = FAMILIES[currentUser.family];
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("vnd");
  const [category, setCategory] = useState(categories[0]);
  const [desc, setDesc] = useState("");

  function handleAdd() {
    if (!amount || !desc) return;
    onAdd({ amount: parseFloat(amount), currency, category, desc });
    onClose();
  }

  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <div style={S.modalTitle}>Новый расход</div>
          <div style={{ fontSize:12, color: myFamily.color, fontWeight:600 }}>от {myFamily.name}</div>
        </div>

        {/* Currency selector */}
        <div style={S.segRow}>
          {CURRENCIES.map(c => (
            <button key={c.id} style={{ ...S.seg, ...(currency===c.id ? { background: myFamily.color, color:"#fff", borderColor: myFamily.color } : { color: myFamily.color, borderColor: myFamily.color+"66" }) }}
              onClick={() => setCurrency(c.id)}>
              {c.symbol}
            </button>
          ))}
        </div>

        <input style={S.input} type="text" inputMode="numeric" placeholder={`Сумма, ${CURRENCIES.find(c=>c.id===currency)?.symbol}`}
          value={amount ? Number(amount.replace(/['\s]/g,'')).toLocaleString("ru-RU") : ""}
          onChange={e => {
            const raw = e.target.value.replace(/['\s  ]/g, "").replace(/[^0-9]/g, "");
            setAmount(raw);
          }} />

        {/* Category selector */}
        <div style={S.catGrid}>
          {categories.map(cat => (
            <button key={cat} style={{ ...S.catBtn, ...(category===cat ? { background: myFamily.color+"33", borderColor: myFamily.color, color: myFamily.color } : {}) }}
              onClick={() => setCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        <input style={S.input} type="text" placeholder="Описание"
          value={desc} onChange={e => setDesc(e.target.value)}
          onKeyDown={e => e.key==="Enter" && handleAdd()} />

        <div style={S.modalBtns}>
          <button style={S.cancelBtn} onClick={onClose}>Отмена</button>
          <button style={{ ...S.addBtn, background: myFamily.color, opacity: !amount||!desc ? 0.5:1 }} onClick={handleAdd}>
            + Добавить
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SETTLE MODAL ──
function SettleModal({ debts, onSettle, onClose }) {
  const [currency, setCurrency] = useState(Object.keys(debts).find(c => Math.abs(debts[c])>0) || "vnd");
  const [amount, setAmount] = useState("");
  const [dir, setDir] = useState(null);

  const debt = debts[currency] || 0;
  // debt > 0 → artem_natasha owes nastya_roma; < 0 → nastya_roma owes artem_natasha
  const autoDir = debt > 0 ? "an_to_nr" : "nr_to_an";

  const effectiveDir = dir || autoDir;

  function handle() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onSettle({ amount: amt, currency, direction: effectiveDir });
    onClose();
  }

  const currenciesWithDebt = CURRENCIES.filter(c => Math.abs(debts[c.id]||0) > 0);

  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalTitle}>Рассчитаться</div>
        <div style={S.modalSub}>Выбери валюту и сумму возврата</div>

        {/* Currency */}
        <div style={S.segRow}>
          {CURRENCIES.map(c => {
            const d = debts[c.id] || 0;
            const hasDebt = Math.abs(d) > 0;
            return (
              <button key={c.id} style={{ ...S.seg, ...(currency===c.id ? { background:"#4ECDC4", color:"#fff", borderColor:"#4ECDC4" } : {}), opacity: hasDebt ? 1 : 0.4 }}
                onClick={() => { setCurrency(c.id); setAmount(""); setDir(null); }}>
                {c.symbol}
              </button>
            );
          })}
        </div>

        {/* Auto-computed direction */}
        {Math.abs(debt) > 0 && (
          <div style={S.debtSummaryBox}>
            <span style={{ color: debt>0 ? FAMILIES.artem_natasha.color : FAMILIES.nastya_roma.color }}>
              {debt>0 ? "Артём & Наташа" : "Настя & Рома"}
            </span>
            {" должны → "}
            <span style={{ color: debt>0 ? FAMILIES.nastya_roma.color : FAMILIES.artem_natasha.color }}>
              {debt>0 ? "Настя & Рома" : "Артём & Наташа"}
            </span>
            <div style={{ fontWeight:700, marginTop:4 }}>{formatMoney(Math.abs(debt), currency)}</div>
          </div>
        )}

        {/* Override direction */}
        <div style={{ fontSize:11, color:"#9090A8", marginBottom:6 }}>Кто переводит (изменить):</div>
        <div style={S.dirToggle}>
          {[
            { val:"an_to_nr", label:"Артём & Наташа → Настя & Рома", fid:"artem_natasha" },
            { val:"nr_to_an", label:"Настя & Рома → Артём & Наташа", fid:"nastya_roma" },
          ].map(opt => {
            const f = FAMILIES[opt.fid];
            const active = effectiveDir === opt.val;
            return (
              <button key={opt.val} style={{ ...S.dirBtn, ...(active ? { background: f.bg, borderColor: f.color, color: f.color } : {}) }}
                onClick={() => setDir(opt.val)}>
                {opt.label}
              </button>
            );
          })}
        </div>

        {Math.abs(debt) > 0 && (
          <div style={S.suggestRow}>
            <span style={S.suggestLabel}>Полная сумма:</span>
            <button style={S.suggestBtn} onClick={() => setAmount(String(Math.abs(debt)))}>
              {formatMoney(Math.abs(debt), currency)}
            </button>
          </div>
        )}

        <input style={S.input} type="text" inputMode="numeric" placeholder={`Сумма, ${CURRENCIES.find(c=>c.id===currency)?.symbol}`}
          value={amount ? Number(amount.replace(/['\s]/g,'')).toLocaleString("ru-RU") : ""}
          onChange={e => {
            const raw = e.target.value.replace(/['\s  ]/g, "").replace(/[^0-9]/g, "");
            setAmount(raw);
          }} />

        <div style={S.modalBtns}>
          <button style={S.cancelBtn} onClick={onClose}>Отмена</button>
          <button style={{ ...S.addBtn, background:"#4ECDC4", opacity:!amount?0.5:1 }} onClick={handle}>
            Записать
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EDIT MODAL ──
function EditModal({ expense, categories, currentUser, onSave, onClose }) {
  const [amount, setAmount] = useState(String(expense.amount));
  const [currency, setCurrency] = useState(expense.currency);
  const [category, setCategory] = useState(expense.category);
  const [desc, setDesc] = useState(expense.desc);
  const f = FAMILIES[expense.family];

  function handle() {
    if (!amount || !desc) return;
    onSave({ ...expense, amount: parseFloat(amount), currency, category, desc,
      editedBy: currentUser.id, editedAt: new Date().toISOString() });
    onClose();
  }

  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalTitle}>Изменить расход</div>
        <div style={{ fontSize:12, color: f.color, marginBottom:14 }}>{f.name}</div>

        <div style={S.segRow}>
          {CURRENCIES.map(c => (
            <button key={c.id} style={{ ...S.seg, ...(currency===c.id ? { background: f.color, color:"#fff", borderColor: f.color } : { color: f.color, borderColor: f.color+"66" }) }}
              onClick={() => setCurrency(c.id)}>
              {c.symbol}
            </button>
          ))}
        </div>
        <input style={S.input} type="text" inputMode="numeric"
          value={amount ? Number(String(amount).replace(/['\s ]/g,'')).toLocaleString("ru-RU") : ""}
          onChange={e => {
            const raw = e.target.value.replace(/['\s  ]/g, "").replace(/[^0-9]/g, "");
            setAmount(raw);
          }} />
        <div style={S.catGrid}>
          {categories.map(cat => (
            <button key={cat} style={{ ...S.catBtn, ...(category===cat ? { background: f.color+"33", borderColor: f.color, color: f.color } : {}) }}
              onClick={() => setCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
        <input style={S.input} type="text" value={desc} onChange={e => setDesc(e.target.value)} />
        <div style={S.modalBtns}>
          <button style={S.cancelBtn} onClick={onClose}>Отмена</button>
          <button style={{ ...S.addBtn, background: f.color }} onClick={handle}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

// ── STATS TAB ──
function StatsTab({ expenses }) {
  const [viewMonth, setViewMonth] = useState(currentMonth());
  const cur = currentMonth();
  const prev = prevMonth();

  const months = useMemo(() => {
    const set = new Set(expenses.map(e => e.date.slice(0,7)));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const filterExp = (month) => expenses.filter(e => e.date.slice(0,7) === month && !e.settled);

  const thisExp = filterExp(viewMonth);
  const compareMonth = viewMonth === cur ? prev : null;
  const prevExp = compareMonth ? filterExp(compareMonth) : [];

  // Group by currency
  const byCurrency = {};
  CURRENCIES.forEach(c => {
    const total = thisExp.filter(e => e.currency === c.id).reduce((s,e) => s+e.amount, 0);
    if (total > 0) byCurrency[c.id] = total;
  });

  // By category per currency
  const byCat = {};
  thisExp.forEach(e => {
    const key = `${e.category}__${e.currency}`;
    byCat[key] = (byCat[key]||0) + e.amount;
  });

  // By family
  const byFamily = {};
  Object.values(FAMILIES).forEach(f => {
    byFamily[f.id] = {};
    CURRENCIES.forEach(c => {
      const total = thisExp.filter(e => e.family===f.id && e.currency===c.id).reduce((s,e)=>s+e.amount,0);
      if (total>0) byFamily[f.id][c.id] = total;
    });
  });

  // Comparison
  const prevByCurrency = {};
  CURRENCIES.forEach(c => {
    const total = prevExp.filter(e => e.currency===c.id).reduce((s,e)=>s+e.amount,0);
    if (total > 0) prevByCurrency[c.id] = total;
  });

  // Category totals for bar chart
  const catTotals = {};
  thisExp.forEach(e => {
    catTotals[e.category] = catTotals[e.category] || {};
    catTotals[e.category][e.currency] = (catTotals[e.category][e.currency]||0) + e.amount;
  });

  const monthLabel = (m) => {
    const [y,mo] = m.split("-");
    const d = new Date(parseInt(y), parseInt(mo)-1, 1);
    return d.toLocaleDateString("ru-RU", { month:"long", year:"numeric" });
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Month selector */}
      <div style={S.monthRow}>
        {[cur, prev, ...months.filter(m=>m!==cur&&m!==prev)].slice(0,4).map(m => (
          <button key={m} style={{ ...S.monthBtn, ...(viewMonth===m ? { background:"#E8E0D5", color:"#13132B" } : {}) }}
            onClick={() => setViewMonth(m)}>
            {new Date(m+"-01").toLocaleDateString("ru-RU",{month:"short", year:"2-digit"})}
          </button>
        ))}
      </div>

      <div style={S.statsTitle}>{monthLabel(viewMonth)}</div>

      {thisExp.length === 0 ? (
        <div style={S.empty}>Нет расходов за этот месяц</div>
      ) : (
        <>
          {/* Totals by currency */}
          <div style={S.sectionTitle}>Итого по валютам</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
            {CURRENCIES.filter(c => byCurrency[c.id]).map(c => {
              const prevTotal = prevByCurrency[c.id] || 0;
              const diff = prevTotal > 0 ? ((byCurrency[c.id]-prevTotal)/prevTotal*100) : null;
              return (
                <div key={c.id} style={S.currencyCard}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <span style={{ fontSize:12, color:"#9090A8", marginRight:8 }}>{c.name}</span>
                      <span style={{ fontSize:20, fontWeight:700 }}>{formatMoney(byCurrency[c.id], c.id)}</span>
                    </div>
                    {diff !== null && (
                      <div style={{ fontSize:12, color: diff>0?"#FF6B6B":"#4ECDC4", fontWeight:600 }}>
                        {diff>0?"↑":"↓"} {Math.abs(diff).toFixed(0)}% vs пред. мес.
                      </div>
                    )}
                  </div>
                  {prevTotal > 0 && (
                    <div style={{ fontSize:11, color:"#9090A8", marginTop:4 }}>
                      Предыдущий месяц: {formatMoney(prevTotal, c.id)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* By family */}
          <div style={S.sectionTitle}>По семьям</div>
          <div style={{ display:"flex", gap:10, marginBottom:20 }}>
            {Object.values(FAMILIES).map(f => (
              <div key={f.id} style={{ ...S.statCard, borderTop:`3px solid ${f.color}`, flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:f.color, marginBottom:8 }}>{f.name}</div>
                {Object.keys(byFamily[f.id]).length === 0
                  ? <div style={{ fontSize:12, color:"#9090A8" }}>—</div>
                  : CURRENCIES.filter(c => byFamily[f.id][c.id]).map(c => (
                    <div key={c.id} style={{ marginBottom:4 }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>{formatMoney(byFamily[f.id][c.id], c.id)}</div>
                      <div style={{ fontSize:11, color:"#9090A8" }}>{c.name}</div>
                    </div>
                  ))
                }
              </div>
            ))}
          </div>

          {/* By category table */}
          <div style={S.sectionTitle}>По категориям</div>
          <div style={S.catTable}>
            {Object.entries(catTotals).sort((a,b) => {
              const totA = Object.values(a[1]).reduce((s,v)=>s+v,0);
              const totB = Object.values(b[1]).reduce((s,v)=>s+v,0);
              return totB - totA;
            }).map(([cat, amounts]) => (
              <div key={cat} style={S.catTableRow}>
                <div style={S.catTableName}>{cat}</div>
                <div style={S.catTableAmounts}>
                  {CURRENCIES.filter(c => amounts[c.id]).map(c => (
                    <span key={c.id} style={S.catTableAmount}>{formatMoney(amounts[c.id], c.id)}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── MAIN APP ──
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("main");
  const [showAdd, setShowAdd] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newCatInput, setNewCatInput] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  // Load user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("splitfam_user");
    if (saved) {
      const u = USERS.find(u => u.id === saved);
      if (u) setCurrentUser(u);
    }
  }, []);

  // Firebase realtime listeners
  useEffect(() => {
    const unsubExp = onSnapshot(collection(db, "expenses"), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      setExpenses(data);
      setLoading(false);
    });
    const unsubSet = onSnapshot(collection(db, "settlements"), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      setSettlements(data);
    });
    const unsubCat = onSnapshot(doc(db, "settings", "categories"), snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.list && data.list.length > 0) setCategories(data.list);
      }
    });
    return () => { unsubExp(); unsubSet(); unsubCat(); };
  }, []);

  function handleLogin(user) {
    setCurrentUser(user);
    localStorage.setItem("splitfam_user", user.id);
  }

  function handleLogout() {
    setCurrentUser(null);
    localStorage.removeItem("splitfam_user");
  }

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;
  if (loading) return <div style={{ minHeight:"100vh", background:"#13132B", display:"flex", alignItems:"center", justifyContent:"center", color:"#9090A8", fontSize:16 }}>Загрузка...</div>;

  const myFamily = FAMILIES[currentUser.family];
  const unsettled = expenses.filter(e => !e.settled && !e.deleted);
  const settled   = expenses.filter(e => e.settled);

  // Compute debts per currency
  const debts = {};
  CURRENCIES.forEach(c => {
    const an = unsettled.filter(e => e.family==="artem_natasha" && e.currency===c.id).reduce((s,e)=>s+e.amount,0);
    const nr = unsettled.filter(e => e.family==="nastya_roma"   && e.currency===c.id).reduce((s,e)=>s+e.amount,0);
    const total = an + nr;
    const fair  = total / 2;
    debts[c.id] = fair - an; // >0 → AN owes NR; <0 → NR owes AN
  });

  const myDebts = Object.entries(debts)
    .filter(([c,v]) => (myFamily.id==="artem_natasha" ? v>0 : v<0) && Math.abs(v)>0);

  async function handleAddExpense(data) {
    await addDoc(collection(db, "expenses"), {
      family: currentUser.family,
      addedBy: currentUser.id,
      ...data,
      date: new Date().toISOString().slice(0,10),
      settled: false,
      createdAt: serverTimestamp(),
    });
  }

  async function handleSettle({ amount, currency, direction }) {
    const payer    = direction==="an_to_nr" ? "artem_natasha" : "nastya_roma";
    const receiver = direction==="an_to_nr" ? "nastya_roma"   : "artem_natasha";

    // Snapshot of current period totals
    const periodAN = {};
    const periodNR = {};
    CURRENCIES.forEach(c => {
      periodAN[c.id] = unsettled.filter(e => e.family==="artem_natasha" && e.currency===c.id).reduce((s,e)=>s+e.amount,0);
      periodNR[c.id] = unsettled.filter(e => e.family==="nastya_roma"   && e.currency===c.id).reduce((s,e)=>s+e.amount,0);
    });

    // Create settlement record with snapshot
    const settlementRef = await addDoc(collection(db, "settlements"), {
      fromId: payer, from: FAMILIES[payer].name,
      toId: receiver, to: FAMILIES[receiver].name,
      amount, currency,
      date: new Date().toISOString(),
      createdAt: serverTimestamp(),
      snapshot: { an: periodAN, nr: periodNR },
      expenseIds: unsettled.map(e => e.id),
    });

    // Mark ALL current unsettled expenses as closed in this settlement period
    for (const e of unsettled) {
      await updateDoc(doc(db, "expenses", e.id), {
        settled: true,
        settledAt: new Date().toISOString().slice(0,10),
        settlementId: settlementRef.id,
      });
    }
  }

  async function handleDeleteSettlement(settlement) {
    if (!window.confirm(`Удалить расчёт на ${formatMoney(settlement.amount, settlement.currency)}? Все расходы вернутся в активные.`)) return;
    // Reopen all expenses tied to this settlement
    const tied = expenses.filter(e => e.settlementId === settlement.id);
    for (const e of tied) {
      await updateDoc(doc(db, "expenses", e.id), {
        settled: false,
        settlementId: null,
        settledAt: null,
      });
    }
    // Delete the settlement record
    await deleteDoc(doc(db, "settlements", settlement.id));
  }

  async function handleSaveEdit(updated) {
    const { id, ...data } = updated;
    await updateDoc(doc(db, "expenses", id), {
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      desc: data.desc,
      editedBy: currentUser.id,
      editedAt: new Date().toISOString(),
    });
  }

  async function handleDelete(expense) {
    await updateDoc(doc(db, "expenses", expense.id), {
      deleted: true,
      deletedBy: currentUser.id,
      deletedAt: new Date().toISOString(),
    });
  }

  async function addCategory() {
    const t = newCatInput.trim();
    if (t && !categories.includes(t)) {
      const newList = [...categories, t];
      await setDoc(doc(db, "settings", "categories"), { list: newList });
    }
    setNewCatInput(""); setShowNewCat(false);
  }

  const allCats = [...categories, "+ Создать категорию"];

  // Expense row
  function ExpenseRow({ expense }) {
    const f = FAMILIES[expense.family];
    const addedByUser = USERS.find(u => u.id===expense.addedBy);
    const editedByUser = expense.editedBy ? USERS.find(u => u.id===expense.editedBy) : null;
    const deletedByUser = expense.deletedBy ? USERS.find(u => u.id===expense.deletedBy) : null;
    const isMe = expense.addedBy === currentUser.id;
    const isDeleted = !!expense.deleted;
    return (
      <div style={{ ...S.expenseRow, opacity: isDeleted ? 0.6 : 1, background: isDeleted ? "#1A0A0A" : "transparent", borderRadius: isDeleted ? 8 : 0, padding: isDeleted ? "10px 8px" : "14px 0" }}>
        <div style={{ ...S.expenseDot, background: isDeleted ? "#FF4444" : f.color }} />
        <div style={S.expenseInfo}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ ...S.expenseDesc, textDecoration: isDeleted ? "line-through" : "none", color: isDeleted ? "#FF6666" : "#E8E0D5" }}>{expense.desc}</div>
            {expense.editedBy && !isDeleted && (
              <div style={S.editedBadge} title={`Изм. ${editedByUser?.name||"?"} · ${formatDateTime(expense.editedAt)}`}>✎</div>
            )}
            {isDeleted && <div style={{ ...S.editedBadge, color:"#FF4444", borderColor:"#FF444444" }}>удалено</div>}
          </div>
          <div style={S.expenseMeta}>
            <span style={{ color: isDeleted ? "#FF6666" : f.color }}>{f.name}</span>
            <span style={S.dot}>·</span>
            <span style={{ color:"#7070A0" }}>{expense.category}</span>
            <span style={S.dot}>·</span>
            <span>{formatDate(expense.date)}</span>
            <span style={S.dot}>·</span>
            <span style={{ color: isMe?"#E8E0D5":"#9090A8" }}>{isMe?"вы":addedByUser?.name||"—"}</span>
          </div>
          {expense.editedBy && !isDeleted && (
            <div style={{ fontSize:10, color:"#5D5D7A", marginTop:2 }}>
              изм. {editedByUser?.name||"?"} · {formatDateTime(expense.editedAt)}
            </div>
          )}
          {isDeleted && (
            <div style={{ fontSize:10, color:"#FF4444", marginTop:2 }}>
              удалил {deletedByUser?.name||"?"} · {formatDateTime(expense.deletedAt)}
            </div>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
          <div style={{ ...S.expenseAmount, textDecoration: isDeleted ? "line-through" : "none", color: isDeleted ? "#FF6666" : "#E8E0D5" }}>{formatMoney(expense.amount, expense.currency)}</div>
          {!isDeleted && <button style={S.editBtn} onClick={() => setEditingExpense(expense)}>✎</button>}
          {!isDeleted && <button style={{ ...S.editBtn, color:"#FF4444" }} onClick={() => handleDelete(expense)}>🗑</button>}
        </div>
      </div>
    );
  }

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.logo}>🌿 {APP_NAME}</div>
          <div style={S.headerSub}>общий кошелёк двух семей</div>
        </div>
        <button style={{ ...S.avatarBtn, borderColor: myFamily.color, color: myFamily.color }}
          onClick={() => handleLogout()}>
          {currentUser.name} ↩
        </button>
      </div>

      {/* My debt banner */}
      {myDebts.length > 0 && (
        <div style={{ ...S.myDebtBanner, background: myFamily.bg, borderColor: myFamily.color }}>
          <span style={{ fontSize:12, color:"#9090A8" }}>Вы должны:</span>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"flex-end" }}>
            {myDebts.map(([c,v]) => (
              <span key={c} style={{ fontWeight:700, color: myFamily.color }}>{formatMoney(Math.abs(v), c)}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={S.tabs}>
        {[{id:"main",label:"Главная"},{id:"history",label:"История"},{id:"stats",label:"Статистика"}].map(t => (
          <button key={t.id} style={{ ...S.tab, ...(tab===t.id ? S.tabActive : {}) }} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={S.content}>

        {/* ── ГЛАВНАЯ ── */}
        {tab==="main" && (
          <div>

            {/* ИТОГО СВОДКА */}
            <div style={S.summaryBlock}>

              {/* Итого потрачено */}
              <div style={S.summarySection}>
                <div style={S.debtLabel}>Траты с последнего расчёта</div>
                {CURRENCIES.filter(c => unsettled.filter(e=>e.currency===c.id).reduce((s,e)=>s+e.amount,0)>0).map(c => {
                  const total = unsettled.filter(e=>e.currency===c.id).reduce((s,e)=>s+e.amount,0);
                  return (
                    <div key={c.id} style={S.summaryTotalRow}>
                      <span style={{ color:"#9090A8", fontSize:12 }}>{c.name}</span>
                      <span style={{ fontWeight:700, fontSize:18 }}>{formatMoney(total, c.id)}</span>
                    </div>
                  );
                })}
                {unsettled.length===0 && <div style={{ color:"#9090A8", fontSize:13 }}>нет активных расходов</div>}
              </div>

              <div style={S.summarySep} />

              {/* Потратили по семьям */}
              <div style={S.summarySection}>
                <div style={S.debtLabel}>Потратили</div>
                <div style={{ display:"flex", gap:10 }}>
                  {Object.values(FAMILIES).map(f => {
                    const isMe = f.id===currentUser.family;
                    const totals = {};
                    CURRENCIES.forEach(c => {
                      const t = unsettled.filter(e=>e.family===f.id&&e.currency===c.id).reduce((s,e)=>s+e.amount,0);
                      if (t>0) totals[c.id]=t;
                    });
                    return (
                      <div key={f.id} style={{ flex:1, background:"#13132B", borderRadius:10, padding:"12px", borderTop:`2px solid ${f.color}`, ...(isMe?{boxShadow:`0 0 0 1px ${f.color}44`}:{}) }}>
                        <div style={{ fontSize:11, color:f.color, fontWeight:700, marginBottom:8 }}>{f.name}{isMe?" · вы":""}</div>
                        {Object.keys(totals).length===0
                          ? <div style={{ fontSize:12, color:"#9090A8" }}>—</div>
                          : CURRENCIES.filter(c=>totals[c.id]).map(c=>(
                            <div key={c.id} style={{ marginBottom:4 }}>
                              <div style={{ fontSize:15, fontWeight:700 }}>{formatMoney(totals[c.id],c.id)}</div>
                              <div style={{ fontSize:10, color:"#9090A8" }}>{c.name}</div>
                            </div>
                          ))
                        }
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={S.summarySep} />

              {/* Долги */}
              <div style={S.summarySection}>
                <div style={S.debtLabel}>Кто кому должен</div>
                {CURRENCIES.every(c=>Math.abs(debts[c.id]||0)<1)
                  ? <div style={{ color:"#4ECDC4", fontSize:14, fontWeight:600 }}>🎉 Всё чисто!</div>
                  : CURRENCIES.filter(c=>Math.abs(debts[c.id]||0)>=1).map(c => {
                    const v = debts[c.id];
                    const debtor   = v>0 ? FAMILIES.artem_natasha : FAMILIES.nastya_roma;
                    const creditor = v>0 ? FAMILIES.nastya_roma   : FAMILIES.artem_natasha;
                    const isMyDebt = debtor.id===currentUser.family;
                    return (
                      <div key={c.id} style={{ display:"flex", alignItems:"center", background:isMyDebt?debtor.bg:"#13132B", borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
                        <div style={{ flex:1 }}>
                          <span style={{ color:debtor.color, fontWeight:700 }}>{debtor.name}</span>
                          <span style={{ color:"#9090A8", margin:"0 6px" }}>→</span>
                          <span style={{ color:creditor.color, fontWeight:700 }}>{creditor.name}</span>
                        </div>
                        <span style={{ fontWeight:700, fontSize:15, marginLeft:8 }}>{formatMoney(Math.abs(v),c.id)}</span>
                      </div>
                    );
                  })
                }
                {CURRENCIES.some(c=>Math.abs(debts[c.id]||0)>=1) && (
                  <button style={{ ...S.settleBtn, marginTop:8 }} onClick={()=>setShowSettle(true)}>
                    Рассчитаться
                  </button>
                )}
              </div>
            </div>

            {/* Список расходов */}
            <div style={S.sectionTitle}>Все активные расходы</div>
            {unsettled.length===0 && <div style={S.empty}>Нажми + чтобы добавить первый расход</div>}
            {[...expenses.filter(e => !e.settled)].map(e => <ExpenseRow key={e.id} expense={e} />)}
          </div>
        )}


        {/* ── ИСТОРИЯ ── */}
        {tab==="history" && (
          <div>
            {settlements.length===0 && <div style={S.empty}>История пустая</div>}
            {[...settlements].sort((a,b) => (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)).map(s => {
              const isOpen = selectedSettlement === s.id;
              const settledExp = expenses.filter(e => e.settlementId === s.id || (e.deleted && e.settlementId === s.id));
              // Also include deleted expenses that happened before this settlement date
              const settlementDate = s.date;
              const allPeriodExp = expenses.filter(e => 
                e.settlementId === s.id || 
                (e.deleted && !e.settlementId && e.createdAt?.seconds && s.createdAt?.seconds && e.createdAt.seconds <= s.createdAt.seconds)
              );
              return (
                <div key={s.id}>
                  <div style={{ ...S.settlementRow, cursor:"pointer", borderRadius:10, padding:"14px 12px", background: isOpen?"#1E1E3A":"transparent" }}
                    onClick={() => setSelectedSettlement(isOpen ? null : s.id)}>
                    <div style={{ fontSize:20 }}>💸</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>
                        <span style={{ color: FAMILIES[s.fromId]?.color }}>{s.from}</span>
                        {" → "}
                        <span style={{ color: FAMILIES[s.toId]?.color }}>{s.to}</span>
                      </div>
                      <div style={{ fontSize:12, color:"#9090A8", marginTop:2 }}>{formatDateTime(s.date)}</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:"#4ECDC4" }}>{formatMoney(s.amount, s.currency)}</div>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <div style={{ fontSize:11, color:"#9090A8" }}>{isOpen ? "▲ скрыть" : "▼ детали"}</div>
                        <button style={{ fontSize:11, background:"none", border:"1px solid #FF444466", borderRadius:6, color:"#FF4444", padding:"3px 8px", cursor:"pointer", fontFamily:"inherit" }}
                          onClick={e => { e.stopPropagation(); handleDeleteSettlement(s); }}>
                          удалить
                        </button>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ background:"#13132B", borderRadius:10, margin:"4px 0 12px", padding:"12px 14px" }}>
                      {/* Snapshot totals */}
                      {s.snapshot && (
                        <div style={{ marginBottom:12 }}>
                          <div style={{ fontSize:11, color:"#9090A8", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Итого за период</div>
                          <div style={{ display:"flex", gap:10 }}>
                            {Object.values(FAMILIES).map(f => {
                              const snap = f.id==="artem_natasha" ? s.snapshot.an : s.snapshot.nr;
                              return (
                                <div key={f.id} style={{ flex:1, background:"#1E1E3A", borderRadius:8, padding:"10px 12px", borderTop:`2px solid ${f.color}` }}>
                                  <div style={{ fontSize:11, color:f.color, fontWeight:600, marginBottom:6 }}>{f.name}</div>
                                  {CURRENCIES.filter(c => snap?.[c.id] > 0).map(c => (
                                    <div key={c.id} style={{ fontSize:13, fontWeight:700 }}>{formatMoney(snap[c.id], c.id)}</div>
                                  ))}
                                  {!CURRENCIES.some(c => snap?.[c.id] > 0) && <div style={{ fontSize:12, color:"#9090A8" }}>—</div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Expenses list */}
                      <div style={{ fontSize:11, color:"#9090A8", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Расходы в этом периоде</div>
                      {allPeriodExp.length===0 && <div style={{ fontSize:13, color:"#9090A8" }}>нет данных</div>}
                      {allPeriodExp.map(e => {
                        const f = FAMILIES[e.family];
                        const u = USERS.find(u=>u.id===e.addedBy);
                        const deletedBy = e.deletedBy ? USERS.find(u=>u.id===e.deletedBy) : null;
                        const isDeleted = !!e.deleted;
                        return (
                          <div key={e.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:"1px solid #2D2D4E", opacity: isDeleted ? 0.6 : 1 }}>
                            <div style={{ width:6, height:6, borderRadius:"50%", background: isDeleted ? "#FF4444" : f.color, flexShrink:0 }} />
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:13, textDecoration: isDeleted ? "line-through" : "none", color: isDeleted ? "#FF6666" : "#E8E0D5" }}>{e.desc}</div>
                              <div style={{ fontSize:11, color:"#9090A8" }}>{f.name} · {u?.name||"—"} · {formatDate(e.date)}</div>
                              {isDeleted && <div style={{ fontSize:10, color:"#FF4444" }}>удалил {deletedBy?.name||"?"} · {formatDateTime(e.deletedAt)}</div>}
                            </div>
                            <div style={{ fontSize:13, fontWeight:600, textDecoration: isDeleted ? "line-through" : "none", color: isDeleted ? "#FF6666" : "#E8E0D5" }}>{formatMoney(e.amount, e.currency)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── СТАТИСТИКА ── */}
        {tab==="stats" && <StatsTab expenses={expenses} />}

      </div>

      {/* ── FAB ── */}
      <button style={{ ...S.fab, background: myFamily.color }} onClick={() => setShowAdd(true)}>
        +
      </button>

      {/* Modals */}
      {showAdd && (
        <AddExpenseModal
          currentUser={currentUser}
          categories={[...categories, "+ Создать"]}
          onAdd={(data) => {
            if (data.category==="+Создать"||data.category==="+ Создать") {
              setShowNewCat(true); setShowAdd(false); return;
            }
            handleAddExpense(data);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {showSettle && (
        <SettleModal debts={debts} onSettle={handleSettle} onClose={() => setShowSettle(false)} />
      )}

      {editingExpense && (
        <EditModal
          expense={editingExpense}
          categories={categories}
          currentUser={currentUser}
          onSave={handleSaveEdit}
          onClose={() => setEditingExpense(null)}
        />
      )}

      {showNewCat && (
        <div style={S.modalOverlay} onClick={() => setShowNewCat(false)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={S.modalTitle}>Новая категория</div>
            <input style={S.input} type="text" placeholder="Название категории"
              value={newCatInput} onChange={e=>setNewCatInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addCategory()} autoFocus />
            <div style={S.modalBtns}>
              <button style={S.cancelBtn} onClick={() => setShowNewCat(false)}>Отмена</button>
              <button style={{ ...S.addBtn, background: myFamily.color }} onClick={addCategory}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STYLES ──
const S = {
  root: { minHeight:"100vh", background:"#13132B", color:"#E8E0D5", fontFamily:"'Inter',-apple-system,sans-serif", maxWidth:480, margin:"0 auto", paddingBottom:120, WebkitTapHighlightColor:"transparent" },

  loginRoot: { minHeight:"100vh", background:"#13132B", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 20px", paddingBottom:"max(24px, env(safe-area-inset-bottom))" },
  loginInner: { width:"100%", maxWidth:380, textAlign:"center" },
  loginLogo: { fontSize:48, marginBottom:8 },
  loginTitle: { fontSize:28, fontWeight:800, letterSpacing:-1, marginBottom:4, color:"#E8E0D5" },
  loginSub: { fontSize:16, color:"#9090A8", marginBottom:32 },
  loginGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 },
  userCard: { background:"#1E1E3A", border:"1.5px solid #2D2D4E", borderRadius:16, padding:"20px 16px", cursor:"pointer", transition:"all 0.15s", textAlign:"center", fontFamily:"inherit" },
  userEmoji: { fontSize:28, marginBottom:6 },
  userName: { fontSize:16, fontWeight:700, color:"#E8E0D5", marginBottom:4 },
  userFamily: { fontSize:12, fontWeight:500 },
  loginHint: { fontSize:12, color:"#4D4D6A" },

  header: { padding:"20px 24px 16px", borderBottom:"1px solid #2D2D4E", display:"flex", justifyContent:"space-between", alignItems:"center" },
  logo: { fontSize:20, fontWeight:700, letterSpacing:-0.5 },
  headerSub: { fontSize:12, color:"#9090A8", marginTop:2 },
  avatarBtn: { background:"none", border:"1.5px solid", borderRadius:20, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },

  myDebtBanner: { margin:"12px 16px 0", borderRadius:10, border:"1px solid", padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13 },

  tabs: { display:"flex", padding:"0 16px", borderBottom:"1px solid #2D2D4E", overflowX:"auto" },
  tab: { background:"none", border:"none", color:"#9090A8", padding:"16px 14px", fontSize:14, cursor:"pointer", borderBottom:"2px solid transparent", marginBottom:-1, fontFamily:"inherit", whiteSpace:"nowrap" },
  tabActive: { color:"#E8E0D5", borderBottom:"2px solid #E8E0D5" },

  content: { padding:"20px 24px" },

  debtCard: { background:"#1E1E3A", borderRadius:16, padding:"20px", marginBottom:16 },
  debtLabel: { fontSize:11, color:"#9090A8", textTransform:"uppercase", letterSpacing:1, marginBottom:14 },
  debtLine: { display:"flex", alignItems:"center", marginBottom:10, fontSize:14 },
  settleBtn: { width:"100%", padding:"14px", background:"#2D2D4E", border:"none", borderRadius:10, color:"#E8E0D5", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", minHeight:48 },
  statsRow: { display:"flex", gap:12, marginBottom:16 },
  statCard: { flex:1, background:"#1E1E3A", borderRadius:12, padding:"14px 12px" },
  statName: { fontSize:11, fontWeight:600, marginBottom:8 },

  sectionTitle: { fontSize:11, color:"#9090A8", textTransform:"uppercase", letterSpacing:1, marginBottom:12 },
  empty: { textAlign:"center", color:"#9090A8", padding:"32px 0", fontSize:14 },

  expenseRow: { display:"flex", alignItems:"flex-start", gap:10, padding:"14px 0", borderBottom:"1px solid #2D2D4E" },
  expenseDot: { width:8, height:8, borderRadius:"50%", flexShrink:0, marginTop:5 },
  expenseInfo: { flex:1, minWidth:0 },
  expenseDesc: { fontSize:14, fontWeight:500, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  expenseMeta: { fontSize:11, color:"#9090A8", display:"flex", gap:3, alignItems:"center", flexWrap:"wrap" },
  dot: { color:"#4D4D6A" },
  expenseAmount: { fontSize:14, fontWeight:700, textAlign:"right" },
  editBtn: { fontSize:12, background:"#2D2D4E", border:"none", borderRadius:6, color:"#9090A8", padding:"6px 10px", cursor:"pointer", fontFamily:"inherit", minHeight:32, minWidth:32 },
  editedBadge: { fontSize:10, background:"#2D2D4E", borderRadius:4, padding:"1px 5px", color:"#9090A8", cursor:"help" },

  settlementRow: { display:"flex", alignItems:"center", gap:12, padding:"14px 0", borderBottom:"1px solid #2D2D4E" },

  fab: { position:"fixed", bottom:28, right:20, width:70, height:70, borderRadius:"50%", border:"none", color:"#fff", fontSize:38, fontWeight:400, cursor:"pointer", boxShadow:"0 6px 32px rgba(180,60,120,0.5)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1, background:"linear-gradient(135deg, #C0386B, #8B1A4A)" },

  modalOverlay: { position:"fixed", inset:0, background:"#000000BB", display:"flex", alignItems:"flex-end", zIndex:100 },
  modal: { background:"#1E1E3A", borderRadius:"20px 20px 0 0", padding:"24px 20px 48px", width:"100%", maxWidth:480, margin:"0 auto", maxHeight:"92vh", overflowY:"auto" },
  modalHeader: { display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:16 },
  modalTitle: { fontSize:18, fontWeight:700, marginBottom:6 },
  modalSub: { fontSize:13, color:"#9090A8", marginBottom:16 },
  modalBtns: { display:"flex", gap:10, marginTop:4 },

  segRow: { display:"flex", gap:8, marginBottom:12 },
  seg: { flex:1, padding:"9px 8px", borderRadius:8, border:"1.5px solid #2D2D4E", background:"none", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },

  catGrid: { display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 },
  catBtn: { padding:"8px 14px", borderRadius:20, border:"1.5px solid #2D2D4E", background:"none", color:"#9090A8", fontSize:13, cursor:"pointer", fontFamily:"inherit", minHeight:36 },

  input: { width:"100%", background:"#13132B", border:"1px solid #2D2D4E", borderRadius:10, padding:"12px 14px", color:"#E8E0D5", fontSize:14, marginBottom:10, fontFamily:"inherit", boxSizing:"border-box", outline:"none" },
  addBtn: { flex:1, padding:"15px", border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", minHeight:50 },
  cancelBtn: { flex:1, padding:"15px", background:"#2D2D4E", border:"none", borderRadius:12, color:"#E8E0D5", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit", minHeight:50 },

  debtSummaryBox: { background:"#13132B", borderRadius:10, padding:"12px 14px", marginBottom:14, fontSize:13, textAlign:"center" },
  dirToggle: { display:"flex", flexDirection:"column", gap:8, marginBottom:14 },
  dirBtn: { padding:"10px 14px", borderRadius:10, border:"1.5px solid #2D2D4E", background:"none", color:"#9090A8", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"inherit", textAlign:"left" },
  suggestRow: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  suggestLabel: { fontSize:13, color:"#9090A8" },
  suggestBtn: { background:"#2D2D4E", border:"none", borderRadius:8, color:"#4ECDC4", padding:"6px 12px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },

  // Stats
  monthRow: { display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" },
  monthBtn: { padding:"6px 12px", borderRadius:20, border:"1px solid #2D2D4E", background:"none", color:"#9090A8", fontSize:12, cursor:"pointer", fontFamily:"inherit" },
  statsTitle: { fontSize:16, fontWeight:700, marginBottom:16, textTransform:"capitalize" },
  currencyCard: { background:"#1E1E3A", borderRadius:12, padding:"14px 16px" },
  catTable: { background:"#1E1E3A", borderRadius:12, overflow:"hidden" },
  summaryBlock: { background:"#1E1E3A", borderRadius:16, marginBottom:20, overflow:"hidden" },
  summarySection: { padding:"16px 18px" },
  summarySep: { height:1, background:"#2D2D4E" },
  summaryTotalRow: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 },
  catTableRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid #13132B" },
  catTableName: { fontSize:13, color:"#E8E0D5" },
  catTableAmounts: { display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 },
  catTableAmount: { fontSize:13, fontWeight:600 },
};
