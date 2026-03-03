import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const THEMES = {
  dark: { name:"Sombre",icon:"◐",bg:"#0c0e14",surface:"#14171f",surface2:"#1c2030",border:"#252a3a",text:"#e8eaf0",muted:"#6b7394",accent:"#00e5a0",income:"#00e5a0",expense:"#ff4d6d",cardShadow:"0 4px 24px rgba(0,0,0,0.4)",inputBg:"#1c2030",navActive:"rgba(0,229,160,0.08)",navActiveBorder:"rgba(0,229,160,0.2)",gridColor:"rgba(0,229,160,0.03)" },
  light: { name:"Clair",icon:"○",bg:"#f5f6fa",surface:"#ffffff",surface2:"#f0f2f8",border:"#e2e5f0",text:"#1a1d2e",muted:"#8890b0",accent:"#0aad76",income:"#0aad76",expense:"#e8294a",cardShadow:"0 4px 24px rgba(0,0,0,0.06)",inputBg:"#f0f2f8",navActive:"rgba(10,173,118,0.08)",navActiveBorder:"rgba(10,173,118,0.25)",gridColor:"rgba(10,173,118,0.04)" },
  colorful: { name:"Coloré",icon:"●",bg:"#0f0728",surface:"#1a0f3a",surface2:"#241550",border:"#3a2570",text:"#f0ecff",muted:"#9080c0",accent:"#ff6bff",income:"#00ffcc",expense:"#ff4f8b",cardShadow:"0 4px 32px rgba(100,0,200,0.25)",inputBg:"#241550",navActive:"rgba(255,107,255,0.1)",navActiveBorder:"rgba(255,107,255,0.3)",gridColor:"rgba(255,107,255,0.04)" },
};

const DEFAULT_CATEGORIES = [
  { id:"cat1",name:"Salaire",type:"income",icon:"💰",color:"#00e5a0" },
  { id:"cat2",name:"Commerce",type:"income",icon:"🏪",color:"#4d9fff" },
  { id:"cat3",name:"Autre revenu",type:"income",icon:"🎁",color:"#a78bfa" },
  { id:"cat4",name:"Logement",type:"expense",icon:"🏠",color:"#ff4d6d" },
  { id:"cat5",name:"Alimentation",type:"expense",icon:"🛒",color:"#ffd166" },
  { id:"cat6",name:"Transport",type:"expense",icon:"🚗",color:"#4d9fff" },
  { id:"cat7",name:"Loisirs",type:"expense",icon:"🎬",color:"#a78bfa" },
  { id:"cat8",name:"Santé",type:"expense",icon:"💊",color:"#ff6b35" },
  { id:"cat9",name:"Téléphone",type:"expense",icon:"📱",color:"#06d6a0" },
  { id:"cat10",name:"Vêtements",type:"expense",icon:"👗",color:"#e040fb" },
];

const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const ICONS = ["💰","🏪","🎁","🏠","🛒","🚗","🎬","💊","📱","👗","✈️","🍔","🎓","🏋️","🎮","🔧","💡","🌍","🐾","🎵"];
const COLORS = ["#00e5a0","#ff4d6d","#4d9fff","#ffd166","#a78bfa","#ff6b35","#06d6a0","#e040fb","#ff6bff","#00ffcc","#ffcc00","#ff4f8b"];

// ── Franc CFA ──
const fmt = (n) => Math.round(Number(n)).toLocaleString("fr-FR") + " F";
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().split("T")[0];

// ── localStorage helpers ──
const lsGet = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
};
const lsSet = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

export default function App() {
  const [themeKey, setThemeKey] = useState(() => lsGet("cf_theme", "dark"));
  const t = THEMES[themeKey];

  const [transactions, setTransactions] = useState(() => lsGet("cf_transactions", []));
  const [categories, setCategories] = useState(() => lsGet("cf_categories", DEFAULT_CATEGORIES));
  const [page, setPage] = useState("dashboard");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState("expense");
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [notif, setNotif] = useState(null);
  const [form, setForm] = useState({ label:"", amount:"", date:today(), categoryId:"", note:"" });
  const [catForm, setCatForm] = useState({ name:"", type:"expense", icon:"🛒", color:"#ff4d6d" });

  // ── Sauvegarde automatique dans localStorage ──
  useEffect(() => { lsSet("cf_transactions", transactions); }, [transactions]);
  useEffect(() => { lsSet("cf_categories", categories); }, [categories]);
  useEffect(() => { lsSet("cf_theme", themeKey); }, [themeKey]);

  const notify = (msg, color) => {
    setNotif({ msg, color });
    setTimeout(() => setNotif(null), 2800);
  };

  // ── Stats ──
  const now = new Date();
  const cm = now.getMonth(), cy = now.getFullYear();

  const monthTx = useMemo(() =>
    transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === cm && d.getFullYear() === cy;
    }), [transactions, cm, cy]);

  const totalIn  = useMemo(() => monthTx.filter(tx => tx.type === "income").reduce((s, tx) => s + tx.amount, 0), [monthTx]);
  const totalOut = useMemo(() => monthTx.filter(tx => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0), [monthTx]);
  const balance  = totalIn - totalOut;

  const chartData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(cy, cm - 5 + i, 1);
    const m = d.getMonth(), y = d.getFullYear();
    const mt = transactions.filter(tx => { const td = new Date(tx.date); return td.getMonth() === m && td.getFullYear() === y; });
    return {
      name: MONTHS[m],
      Entrées: mt.filter(tx => tx.type === "income").reduce((s, tx) => s + tx.amount, 0),
      Sorties: mt.filter(tx => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0),
    };
  }), [transactions, cm, cy]);

  const catBreak = useMemo(() => {
    const map = {};
    monthTx.filter(tx => tx.type === "expense").forEach(tx => { map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount; });
    return Object.entries(map)
      .map(([id, amount]) => { const cat = categories.find(c => c.id === id) || { name:"Autre", color:"#888", icon:"?" }; return { ...cat, id, amount }; })
      .sort((a, b) => b.amount - a.amount);
  }, [monthTx, categories]);

  const filteredTx = useMemo(() =>
    transactions
      .filter(tx => filterType === "all" || tx.type === filterType)
      .filter(tx => filterCat === "all" || tx.categoryId === filterCat)
      .filter(tx => !search || tx.label.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, filterType, filterCat, search]);

  // ── CSS Global ──
  useEffect(() => {
    const s = document.createElement("style");
    s.id = "bfs";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
      *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
      html, body, #root { height:100%; }
      body { background:${t.bg}; font-family:'DM Mono',monospace; color:${t.text}; transition:background .3s; }
      ::-webkit-scrollbar { width:4px; }
      ::-webkit-scrollbar-track { background:${t.bg}; }
      ::-webkit-scrollbar-thumb { background:${t.border}; border-radius:2px; }
      @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes popIn  { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
      @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
      @keyframes notifAnim { 0%{opacity:0;transform:translateY(20px)} 10%{opacity:1;transform:translateY(0)} 85%{opacity:1} 100%{opacity:0} }
      input[type=date]::-webkit-calendar-picker-indicator { filter: ${themeKey !== "light" ? "invert(1)" : "none"}; }
    `;
    const old = document.getElementById("bfs");
    if (old) old.remove();
    document.head.appendChild(s);
  }, [t, themeKey]);

  // ── Styles réutilisables ──
  const S = {
    btn: (bg, col = "#fff") => ({ display:"inline-flex", alignItems:"center", gap:"6px", padding:"9px 16px", borderRadius:"8px", fontFamily:"DM Mono,monospace", fontSize:"13px", cursor:"pointer", border:"none", background:bg, color:col, fontWeight:500, transition:"all .18s" }),
    input: { background:t.inputBg, border:`1px solid ${t.border}`, borderRadius:"8px", padding:"10px 14px", color:t.text, fontFamily:"DM Mono,monospace", fontSize:"13px", outline:"none", width:"100%", transition:"border .2s" },
    select: { background:t.inputBg, border:`1px solid ${t.border}`, borderRadius:"8px", padding:"10px 14px", color:t.text, fontFamily:"DM Mono,monospace", fontSize:"13px", outline:"none", width:"100%", cursor:"pointer" },
    label: { fontSize:"11px", color:t.muted, letterSpacing:".5px", textTransform:"uppercase", display:"block", marginBottom:"6px" },
    card: { background:t.surface, border:`1px solid ${t.border}`, borderRadius:"14px", padding:"22px", boxShadow:t.cardShadow, transition:"background .3s,border .3s" },
    chip: (active, color) => ({ padding:"5px 12px", borderRadius:"20px", fontSize:"11px", cursor:"pointer", border:`1px solid ${active ? color : t.border}`, color:active ? color : t.muted, background:active ? `${color}18` : t.surface2, transition:"all .15s" }),
    navItem: (active) => ({ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"8px", fontSize:"13px", color:active ? t.accent : t.muted, cursor:"pointer", transition:"all .2s", background:active ? t.navActive : "transparent", border:`1px solid ${active ? t.navActiveBorder : "transparent"}` }),
    modal: { position:"fixed", inset:0, background:"rgba(0,0,0,.65)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"16px" },
    modalBox: { background:t.surface, border:`1px solid ${t.border}`, borderRadius:"16px", padding:"28px", width:"100%", maxWidth:"440px", animation:"popIn .25s ease", boxShadow:"0 20px 60px rgba(0,0,0,.5)" },
    txItem: { display:"flex", alignItems:"center", gap:"14px", padding:"12px", borderRadius:"10px", transition:"background .15s", cursor:"default" },
    themeBtn: (active) => ({ width:"36px", height:"36px", borderRadius:"50%", border:`2px solid ${active ? t.accent : t.border}`, background:active ? `${t.accent}20` : "transparent", color:active ? t.accent : t.muted, cursor:"pointer", fontSize:"14px", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }),
  };

  const getCat = (id) => categories.find(c => c.id === id) || { name:"Autre", color:t.muted, icon:"?" };

  const openAdd = (type) => { setAddType(type); setForm({ label:"", amount:"", date:today(), categoryId:"", note:"" }); setShowAddModal(true); };
  const submitTx = () => {
    if (!form.label || !form.amount || !form.categoryId) return notify("Remplis tous les champs requis !", t.expense);
    setTransactions(prev => [{ id:uid(), type:addType, label:form.label, amount:parseFloat(form.amount), date:form.date, categoryId:form.categoryId, note:form.note, createdAt:Date.now() }, ...prev]);
    setShowAddModal(false);
    notify(`${addType === "income" ? "Revenu" : "Dépense"} ajouté${addType === "expense" ? "e" : ""} !`, addType === "income" ? t.income : t.expense);
  };
  const deleteTx = (id) => { setTransactions(prev => prev.filter(tx => tx.id !== id)); notify("Transaction supprimée", t.muted); };

  const openCatModal = (cat = null) => { setEditCat(cat); setCatForm(cat ? { name:cat.name, type:cat.type, icon:cat.icon, color:cat.color } : { name:"", type:"expense", icon:"🛒", color:"#ff4d6d" }); setShowCatModal(true); };
  const submitCat = () => {
    if (!catForm.name) return notify("Nom requis !", t.expense);
    if (editCat) { setCategories(prev => prev.map(c => c.id === editCat.id ? { ...c, ...catForm } : c)); notify("Catégorie modifiée !", t.accent); }
    else { setCategories(prev => [...prev, { id:uid(), ...catForm }]); notify("Catégorie créée !", t.accent); }
    setShowCatModal(false);
  };
  const deleteCat = (id) => { setCategories(prev => prev.filter(c => c.id !== id)); notify("Catégorie supprimée", t.muted); };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", minHeight:"100vh", position:"relative" }}>

      {/* Grille de fond */}
      <div style={{ position:"fixed", inset:0, backgroundImage:`linear-gradient(${t.gridColor} 1px,transparent 1px),linear-gradient(90deg,${t.gridColor} 1px,transparent 1px)`, backgroundSize:"40px 40px", pointerEvents:"none", zIndex:0 }}/>

      {/* Notification */}
      {notif && (
        <div style={{ position:"fixed", bottom:"28px", right:"28px", zIndex:2000, background:t.surface, border:`1px solid ${notif.color}`, borderRadius:"10px", padding:"12px 20px", fontSize:"13px", color:t.text, boxShadow:"0 4px 20px rgba(0,0,0,.3)", animation:"notifAnim 2.8s ease forwards", display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ color:notif.color }}>●</span> {notif.msg}
        </div>
      )}

      {/* ════ SIDEBAR ════ */}
      <aside style={{ background:t.surface, borderRight:`1px solid ${t.border}`, padding:"28px 16px", display:"flex", flexDirection:"column", gap:"4px", position:"sticky", top:0, height:"100vh", transition:"background .3s", zIndex:1 }}>
        <div style={{ fontFamily:"Syne,sans-serif", fontSize:"20px", fontWeight:800, color:t.accent, padding:"0 12px 24px", borderBottom:`1px solid ${t.border}`, marginBottom:"12px" }}>
          cash<span style={{ color:t.text }}>flow</span>
        </div>

        {[
          { id:"dashboard",   icon:"◈", label:"Tableau de bord" },
          { id:"transactions",icon:"↕", label:"Transactions"    },
          { id:"categories",  icon:"◎", label:"Catégories"      },
        ].map(nav => (
          <div key={nav.id} style={S.navItem(page === nav.id)} onClick={() => setPage(nav.id)}>
            <span style={{ fontSize:"15px", width:"18px", textAlign:"center" }}>{nav.icon}</span>
            {nav.label}
          </div>
        ))}

        <div style={{ marginTop:"auto", paddingTop:"20px", borderTop:`1px solid ${t.border}` }}>
          <div style={{ fontSize:"10px", color:t.muted, letterSpacing:"1px", textTransform:"uppercase", marginBottom:"10px", paddingLeft:"4px" }}>Thème</div>
          <div style={{ display:"flex", gap:"6px", justifyContent:"center" }}>
            {Object.entries(THEMES).map(([key, th]) => (
              <button key={key} style={S.themeBtn(themeKey === key)} onClick={() => setThemeKey(key)} title={th.name}>{th.icon}</button>
            ))}
          </div>
          <div style={{ textAlign:"center", fontSize:"11px", color:t.accent, marginTop:"8px" }}>{THEMES[themeKey].name}</div>

          <div style={{ marginTop:"16px", padding:"12px", background:t.surface2, borderRadius:"10px", textAlign:"center", border:`1px solid ${t.border}` }}>
            <div style={{ fontSize:"10px", color:t.muted, textTransform:"uppercase", letterSpacing:".5px" }}>Solde ce mois</div>
            <div style={{ fontFamily:"Syne,sans-serif", fontSize:"18px", fontWeight:800, color:balance >= 0 ? t.income : t.expense, marginTop:"4px" }}>{fmt(balance)}</div>
          </div>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <main style={{ padding:"28px 32px", display:"flex", flexDirection:"column", gap:"24px", background:t.bg, minHeight:"100vh", transition:"background .3s", animation:"fadeIn .4s ease", zIndex:1 }} key={page}>

        {/* ── DASHBOARD ── */}
        {page === "dashboard" && <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:"24px", fontWeight:800, letterSpacing:"-.5px", display:"flex", alignItems:"center", gap:"10px" }}>
                Tableau de bord
                <span style={{ width:"7px", height:"7px", background:t.income, borderRadius:"50%", display:"inline-block", animation:"pulse 2s infinite" }}/>
              </h1>
              <p style={{ fontSize:"12px", color:t.muted, marginTop:"4px" }}>{MONTHS[cm]} {cy} · {monthTx.length} transaction{monthTx.length !== 1 ? "s" : ""}</p>
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button style={S.btn(t.surface2, t.muted)}
                onMouseEnter={e => e.currentTarget.style.color = t.expense}
                onMouseLeave={e => e.currentTarget.style.color = t.muted}
                onClick={() => openAdd("expense")}>− Dépense</button>
              <button style={S.btn(t.income, "#0c0e14")} onClick={() => openAdd("income")}>+ Revenu</button>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px" }}>
            {[
              { label:"Solde actuel",   amount:balance,   color:balance >= 0 ? t.income : t.expense },
              { label:"Entrées du mois",amount:totalIn,   color:t.income  },
              { label:"Sorties du mois",amount:totalOut,  color:t.expense },
            ].map((item, i) => (
              <div key={i} style={{ ...S.card, borderTop:`2px solid ${item.color}` }}>
                <div style={{ fontSize:"10px", color:t.muted, letterSpacing:"1px", textTransform:"uppercase", display:"flex", alignItems:"center", gap:"6px", marginBottom:"12px" }}>
                  <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:item.color, display:"inline-block" }}/>{item.label}
                </div>
                <div style={{ fontFamily:"Syne,sans-serif", fontSize:"26px", fontWeight:800, color:item.color, letterSpacing:"-1px" }}>{fmt(item.amount)}</div>
              </div>
            ))}
          </div>

          {/* Graphiques */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:"20px" }}>
            <div style={S.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                <span style={{ fontFamily:"Syne,sans-serif", fontSize:"15px", fontWeight:700 }}>Flux mensuels</span>
                <div style={{ display:"flex", gap:"12px" }}>
                  {[{ color:t.income, label:"Entrées" }, { color:t.expense, label:"Sorties" }].map(l => (
                    <div key={l.label} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"11px", color:t.muted }}>
                      <span style={{ width:"8px", height:"8px", borderRadius:"2px", background:l.color, display:"inline-block" }}/>{l.label}
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barSize={10} barGap={3}>
                  <XAxis dataKey="name" tick={{ fill:t.muted, fontSize:11, fontFamily:"DM Mono,monospace" }} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Tooltip contentStyle={{ background:t.surface2, border:`1px solid ${t.border}`, borderRadius:"8px", fontFamily:"DM Mono,monospace", fontSize:"12px", color:t.text }} formatter={v => [fmt(v)]} cursor={{ fill:`${t.accent}08` }}/>
                  <Bar dataKey="Entrées" fill={t.income}  radius={[4,4,0,0]}/>
                  <Bar dataKey="Sorties" fill={t.expense} radius={[4,4,0,0]} opacity={0.85}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={S.card}>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:"15px", fontWeight:700, marginBottom:"16px" }}>Par catégorie</div>
              {catBreak.length === 0
                ? <div style={{ textAlign:"center", color:t.muted, fontSize:"12px", padding:"40px 0" }}>Aucune dépense ce mois</div>
                : <>
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={catBreak} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
                        {catBreak.map((e, i) => <Cell key={i} fill={e.color}/>)}
                      </Pie>
                      <Tooltip contentStyle={{ background:t.surface2, border:`1px solid ${t.border}`, borderRadius:"8px", fontFamily:"DM Mono,monospace", fontSize:"12px", color:t.text }} formatter={v => [fmt(v)]}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display:"flex", flexDirection:"column", gap:"7px", marginTop:"8px" }}>
                    {catBreak.slice(0, 4).map(c => (
                      <div key={c.id} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:c.color, flexShrink:0 }}/>
                        <span style={{ fontSize:"12px", color:t.muted, flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.icon} {c.name}</span>
                        <span style={{ fontSize:"12px", color:t.text, fontWeight:500 }}>{fmt(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              }
            </div>
          </div>

          {/* Transactions récentes */}
          <div style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
              <span style={{ fontFamily:"Syne,sans-serif", fontSize:"15px", fontWeight:700 }}>Transactions récentes</span>
              <span style={{ fontSize:"12px", color:t.accent, cursor:"pointer" }} onClick={() => setPage("transactions")}>Voir tout →</span>
            </div>
            {transactions.length === 0
              ? <div style={{ textAlign:"center", padding:"40px 0", color:t.muted }}>
                  <div style={{ fontSize:"36px", marginBottom:"10px" }}>💸</div>
                  <div style={{ fontSize:"14px" }}>Aucune transaction pour l'instant</div>
                  <div style={{ fontSize:"12px", marginTop:"4px" }}>Ajoute ta première entrée ou sortie !</div>
                </div>
              : transactions.slice(0, 5).map(tx => {
                  const cat = getCat(tx.categoryId);
                  return (
                    <div key={tx.id} style={S.txItem} onMouseEnter={e => e.currentTarget.style.background = t.surface2} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:`${cat.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>{cat.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"13px", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{tx.label}</div>
                        <div style={{ fontSize:"11px", color:t.muted, marginTop:"2px" }}>{cat.name} · {tx.date}</div>
                      </div>
                      <div style={{ fontFamily:"Syne,sans-serif", fontSize:"14px", fontWeight:700, color:tx.type === "income" ? t.income : t.expense }}>
                        {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                      </div>
                    </div>
                  );
                })
            }
          </div>

          {/* Ajout rapide */}
          <div style={{ background:`linear-gradient(135deg,${t.income}10,${t.income}04)`, border:`1px solid ${t.income}30`, borderRadius:"14px", padding:"20px", display:"flex", alignItems:"center", gap:"16px" }}>
            <span style={{ fontSize:"26px" }}>⚡</span>
            <div>
              <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:"14px", fontWeight:700 }}>Ajout rapide</h3>
              <p style={{ fontSize:"12px", color:t.muted, marginTop:"2px" }}>Enregistre une transaction en quelques secondes</p>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:"8px" }}>
              <button style={S.btn(t.expense)} onClick={() => openAdd("expense")}>− Dépense</button>
              <button style={S.btn(t.income, "#0c0e14")} onClick={() => openAdd("income")}>+ Revenu</button>
            </div>
          </div>
        </>}

        {/* ── TRANSACTIONS ── */}
        {page === "transactions" && <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:"24px", fontWeight:800 }}>Transactions</h1>
              <p style={{ fontSize:"12px", color:t.muted, marginTop:"4px" }}>{filteredTx.length} résultat{filteredTx.length !== 1 ? "s" : ""}</p>
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button style={S.btn(t.expense)} onClick={() => openAdd("expense")}>− Dépense</button>
              <button style={S.btn(t.income, "#0c0e14")} onClick={() => openAdd("income")}>+ Revenu</button>
            </div>
          </div>

          <div style={S.card}>
            {/* Recherche */}
            <div style={{ display:"flex", alignItems:"center", gap:"10px", background:t.inputBg, border:`1px solid ${t.border}`, borderRadius:"8px", padding:"10px 14px", marginBottom:"14px" }}>
              <span style={{ color:t.muted, fontSize:"15px" }}>⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ background:"none", border:"none", outline:"none", color:t.text, fontFamily:"DM Mono,monospace", fontSize:"13px", flex:1 }}/>
              {search && <span style={{ color:t.muted, cursor:"pointer" }} onClick={() => setSearch("")}>✕</span>}
            </div>

            {/* Filtres */}
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"18px" }}>
              {[{ v:"all", l:"Tout" }, { v:"income", l:"Entrées" }, { v:"expense", l:"Sorties" }].map(f => (
                <div key={f.v} style={S.chip(filterType === f.v, f.v === "income" ? t.income : f.v === "expense" ? t.expense : t.accent)} onClick={() => setFilterType(f.v)}>{f.l}</div>
              ))}
              <div style={{ width:"1px", background:t.border, margin:"0 4px" }}/>
              <div style={S.chip(filterCat === "all", t.accent)} onClick={() => setFilterCat("all")}>Toutes</div>
              {categories.map(cat => (
                <div key={cat.id} style={S.chip(filterCat === cat.id, cat.color)} onClick={() => setFilterCat(cat.id)}>{cat.icon} {cat.name}</div>
              ))}
            </div>

            {/* Liste */}
            {filteredTx.length === 0
              ? <div style={{ textAlign:"center", padding:"50px 0", color:t.muted }}><div style={{ fontSize:"32px", marginBottom:"8px" }}>🔍</div><div>Aucune transaction trouvée</div></div>
              : filteredTx.map(tx => {
                  const cat = getCat(tx.categoryId);
                  return (
                    <div key={tx.id} style={{ ...S.txItem, borderBottom:`1px solid ${t.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = t.surface2}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:`${cat.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>{cat.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"13px", fontWeight:500 }}>{tx.label}</div>
                        <div style={{ fontSize:"11px", color:t.muted, marginTop:"2px" }}>{cat.name} · {tx.date}{tx.note && ` · ${tx.note}`}</div>
                      </div>
                      <div style={{ fontFamily:"Syne,sans-serif", fontSize:"14px", fontWeight:700, color:tx.type === "income" ? t.income : t.expense, marginRight:"12px" }}>
                        {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                      </div>
                      <button style={{ background:"transparent", border:"none", color:t.muted, cursor:"pointer", fontSize:"15px", padding:"4px", borderRadius:"6px", transition:"all .15s" }}
                        onMouseEnter={e => { e.currentTarget.style.color = t.expense; e.currentTarget.style.background = `${t.expense}18`; }}
                        onMouseLeave={e => { e.currentTarget.style.color = t.muted;   e.currentTarget.style.background = "transparent"; }}
                        onClick={() => deleteTx(tx.id)}>✕</button>
                    </div>
                  );
                })
            }
          </div>
        </>}

        {/* ── CATEGORIES ── */}
        {page === "categories" && <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:"24px", fontWeight:800 }}>Catégories</h1>
              <p style={{ fontSize:"12px", color:t.muted, marginTop:"4px" }}>{categories.length} catégories</p>
            </div>
            <button style={S.btn(t.accent, "#0c0e14")} onClick={() => openCatModal()}>+ Nouvelle catégorie</button>
          </div>

          {["income", "expense"].map(type => (
            <div key={type} style={S.card}>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:"15px", fontWeight:700, marginBottom:"16px", display:"flex", alignItems:"center", gap:"8px" }}>
                <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:type === "income" ? t.income : t.expense, display:"inline-block" }}/>
                {type === "income" ? "Revenus" : "Dépenses"}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"10px" }}>
                {categories.filter(c => c.type === type).map(cat => (
                  <div key={cat.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"12px", borderRadius:"10px", border:`1px solid ${t.border}`, background:t.surface2, transition:"all .2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = cat.color}
                    onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                    <div style={{ width:"36px", height:"36px", borderRadius:"8px", background:`${cat.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>{cat.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"13px", fontWeight:500 }}>{cat.name}</div>
                      <div style={{ fontSize:"11px", color:t.muted }}>{transactions.filter(tx => tx.categoryId === cat.id).length} tx</div>
                    </div>
                    <div style={{ display:"flex", gap:"4px" }}>
                      <button style={{ background:"transparent", border:"none", color:t.muted, cursor:"pointer", fontSize:"13px", padding:"4px 6px", borderRadius:"6px", transition:"all .15s" }}
                        onMouseEnter={e => { e.currentTarget.style.color = t.accent; e.currentTarget.style.background = `${t.accent}18`; }}
                        onMouseLeave={e => { e.currentTarget.style.color = t.muted;  e.currentTarget.style.background = "transparent"; }}
                        onClick={() => openCatModal(cat)}>✎</button>
                      <button style={{ background:"transparent", border:"none", color:t.muted, cursor:"pointer", fontSize:"13px", padding:"4px 6px", borderRadius:"6px", transition:"all .15s" }}
                        onMouseEnter={e => { e.currentTarget.style.color = t.expense; e.currentTarget.style.background = `${t.expense}18`; }}
                        onMouseLeave={e => { e.currentTarget.style.color = t.muted;   e.currentTarget.style.background = "transparent"; }}
                        onClick={() => deleteCat(cat.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>}
      </main>

      {/* ════ MODAL TRANSACTION ════ */}
      {showAddModal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div style={S.modalBox}>
            <div style={{ display:"flex", marginBottom:"24px", background:t.surface2, borderRadius:"10px", padding:"4px" }}>
              {[{ v:"income", l:"💰 Revenu" }, { v:"expense", l:"💸 Dépense" }].map(opt => (
                <button key={opt.v} style={{ flex:1, padding:"10px", borderRadius:"7px", border:"none", cursor:"pointer", fontFamily:"DM Mono,monospace", fontSize:"13px", transition:"all .2s", background:addType === opt.v ? (opt.v === "income" ? t.income : t.expense) : "transparent", color:addType === opt.v ? "#fff" : t.muted, fontWeight:addType === opt.v ? 600 : 400 }} onClick={() => setAddType(opt.v)}>{opt.l}</button>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div>
                <label style={S.label}>Libellé *</label>
                <input style={S.input} placeholder="Ex: Salaire mars..." value={form.label} onChange={e => setForm({ ...form, label:e.target.value })}
                  onFocus={e => e.target.style.borderColor = t.accent} onBlur={e => e.target.style.borderColor = t.border}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                <div>
                  <label style={S.label}>Montant (F CFA) *</label>
                  <input style={S.input} type="number" min="0" step="1" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount:e.target.value })}
                    onFocus={e => e.target.style.borderColor = t.accent} onBlur={e => e.target.style.borderColor = t.border}/>
                </div>
                <div>
                  <label style={S.label}>Date *</label>
                  <input style={S.input} type="date" value={form.date} onChange={e => setForm({ ...form, date:e.target.value })}
                    onFocus={e => e.target.style.borderColor = t.accent} onBlur={e => e.target.style.borderColor = t.border}/>
                </div>
              </div>
              <div>
                <label style={S.label}>Catégorie *</label>
                <select style={S.select} value={form.categoryId} onChange={e => setForm({ ...form, categoryId:e.target.value })}>
                  <option value="">Choisir une catégorie...</option>
                  {categories.filter(c => c.type === addType).map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Note (optionnel)</label>
                <input style={S.input} placeholder="Remarque..." value={form.note} onChange={e => setForm({ ...form, note:e.target.value })}
                  onFocus={e => e.target.style.borderColor = t.accent} onBlur={e => e.target.style.borderColor = t.border}/>
              </div>
            </div>
            <div style={{ display:"flex", gap:"10px", marginTop:"24px" }}>
              <button style={{ ...S.btn(t.surface2, t.muted), flex:1 }} onClick={() => setShowAddModal(false)}>Annuler</button>
              <button style={{ ...S.btn(addType === "income" ? t.income : t.expense, "#fff"), flex:2, justifyContent:"center" }} onClick={submitTx}>
                {addType === "income" ? "Ajouter le revenu" : "Ajouter la dépense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL CATEGORIE ════ */}
      {showCatModal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowCatModal(false)}>
          <div style={S.modalBox}>
            <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"18px", fontWeight:800, marginBottom:"20px" }}>
              {editCat ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </h2>
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div>
                <label style={S.label}>Nom *</label>
                <input style={S.input} placeholder="Ex: Loyer, Marché..." value={catForm.name} onChange={e => setCatForm({ ...catForm, name:e.target.value })}
                  onFocus={e => e.target.style.borderColor = t.accent} onBlur={e => e.target.style.borderColor = t.border}/>
              </div>
              <div>
                <label style={S.label}>Type *</label>
                <div style={{ display:"flex", background:t.surface2, borderRadius:"10px", padding:"4px" }}>
                  {[{ v:"expense", l:"💸 Dépense" }, { v:"income", l:"💰 Revenu" }].map(opt => (
                    <button key={opt.v} style={{ flex:1, padding:"9px", borderRadius:"7px", border:"none", cursor:"pointer", fontFamily:"DM Mono,monospace", fontSize:"13px", transition:"all .2s", background:catForm.type === opt.v ? t.accent : "transparent", color:catForm.type === opt.v ? "#0c0e14" : t.muted }} onClick={() => setCatForm({ ...catForm, type:opt.v })}>{opt.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>Icône</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                  {ICONS.map(icon => (
                    <div key={icon} style={{ width:"36px", height:"36px", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", cursor:"pointer", background:catForm.icon === icon ? `${t.accent}30` : t.surface2, border:`1px solid ${catForm.icon === icon ? t.accent : t.border}`, transition:"all .15s" }} onClick={() => setCatForm({ ...catForm, icon })}>{icon}</div>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>Couleur</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                  {COLORS.map(color => (
                    <div key={color} style={{ width:"28px", height:"28px", borderRadius:"50%", background:color, cursor:"pointer", border:`3px solid ${catForm.color === color ? t.text : "transparent"}`, outline:`2px solid ${catForm.color === color ? color : "transparent"}`, outlineOffset:"2px", transition:"all .15s" }} onClick={() => setCatForm({ ...catForm, color })}/>
                  ))}
                </div>
              </div>
              {/* Aperçu */}
              <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"12px", borderRadius:"10px", background:t.surface2, border:`1px solid ${t.border}` }}>
                <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:`${catForm.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px" }}>{catForm.icon}</div>
                <div>
                  <div style={{ fontSize:"13px", fontWeight:500 }}>{catForm.name || "Nom de la catégorie"}</div>
                  <div style={{ fontSize:"11px", color:t.muted }}>{catForm.type === "income" ? "Revenu" : "Dépense"}</div>
                </div>
                <div style={{ marginLeft:"auto", width:"10px", height:"10px", borderRadius:"50%", background:catForm.color }}/>
              </div>
            </div>
            <div style={{ display:"flex", gap:"10px", marginTop:"22px" }}>
              <button style={{ ...S.btn(t.surface2, t.muted), flex:1 }} onClick={() => setShowCatModal(false)}>Annuler</button>
              <button style={{ ...S.btn(t.accent, "#0c0e14"), flex:2, justifyContent:"center" }} onClick={submitCat}>
                {editCat ? "Enregistrer" : "Créer la catégorie"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
