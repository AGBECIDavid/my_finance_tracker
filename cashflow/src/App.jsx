import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ── API ─────────────────────────────────────────────────────
const BASE = "http://10.174.2.193:3001/api";
const getToken = () => localStorage.getItem("cf_token");
const apiHeaders = () => ({ "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) });
const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, { method, headers: apiHeaders(), ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur serveur");
  return data;
};
const api = {
  register: (b) => req("POST", "/auth/register", b),
  login:    (b) => req("POST", "/auth/login",    b),
  me:       ()  => req("GET",  "/auth/me"),
  getTx:    ()  => req("GET",  "/transactions"),
  addTx:    (b) => req("POST", "/transactions",  b),
  delTx:    (id)      => req("DELETE", `/transactions/${id}`),
  getCats:  ()        => req("GET",    "/categories"),
  addCat:   (b)       => req("POST",   "/categories", b),
  updCat:   (id, b)   => req("PUT",    `/categories/${id}`, b),
  delCat:   (id)      => req("DELETE", `/categories/${id}`),
};

// ── Thèmes ──────────────────────────────────────────────────
const THEMES = {
  dark:     { name:"Sombre",  icon:"◐", bg:"#0c0e14", surface:"#14171f", surface2:"#1c2030", border:"#252a3a", text:"#e8eaf0", muted:"#6b7394", accent:"#00e5a0", income:"#00e5a0", expense:"#ff4d6d", cardShadow:"0 4px 24px rgba(0,0,0,0.4)", inputBg:"#1c2030", navActive:"rgba(0,229,160,0.10)", navActiveBorder:"rgba(0,229,160,0.25)", gridColor:"rgba(0,229,160,0.03)" },
  light:    { name:"Clair",   icon:"○", bg:"#f5f6fa", surface:"#ffffff", surface2:"#f0f2f8", border:"#e2e5f0", text:"#1a1d2e", muted:"#8890b0", accent:"#0aad76", income:"#0aad76", expense:"#e8294a", cardShadow:"0 4px 24px rgba(0,0,0,0.06)", inputBg:"#f0f2f8", navActive:"rgba(10,173,118,0.08)", navActiveBorder:"rgba(10,173,118,0.25)", gridColor:"rgba(10,173,118,0.04)" },
  colorful: { name:"Coloré",  icon:"●", bg:"#0f0728", surface:"#1a0f3a", surface2:"#241550", border:"#3a2570", text:"#f0ecff", muted:"#9080c0", accent:"#ff6bff", income:"#00ffcc", expense:"#ff4f8b", cardShadow:"0 4px 32px rgba(100,0,200,0.25)", inputBg:"#241550", navActive:"rgba(255,107,255,0.1)", navActiveBorder:"rgba(255,107,255,0.3)", gridColor:"rgba(255,107,255,0.04)" },
};

const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const ICONS  = ["💰","🏪","🎁","🏠","🛒","🚗","🎬","💊","📱","👗","✈️","🍔","🎓","🏋️","🎮","🔧","💡","🌍","🐾","🎵"];
const COLORS = ["#00e5a0","#ff4d6d","#4d9fff","#ffd166","#a78bfa","#ff6b35","#06d6a0","#e040fb","#ff6bff","#00ffcc","#ffcc00","#ff4f8b"];

const fmt   = (n) => Math.round(Number(n)).toLocaleString("fr-FR") + " F";
const uid   = ()  => Math.random().toString(36).slice(2, 10);
const today = ()  => new Date().toISOString().split("T")[0];

const useIsMobile = () => {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
};

// ════════════════════════════════════════════════════════════
//  PAGE LOGIN / REGISTER
// ════════════════════════════════════════════════════════════
function AuthPage({ onAuth, themeKey, setThemeKey }) {
  const t = THEMES[themeKey];
  const [mode,   setMode]   = useState("login"); // "login" | "register"
  const [form,   setForm]   = useState({ username:"", email:"", password:"" });
  const [error,  setError]  = useState("");
  const [loading,setLoading]= useState(false);

  useEffect(() => {
    const s = document.createElement("style"); s.id = "auth-style";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400;500&display=swap');
      *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
      html, body, #root { width:100%; min-height:100vh; }
      body { background:${t.bg}; font-family:'DM Mono',monospace; color:${t.text}; }
      @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    `;
    const old = document.getElementById("auth-style"); if (old) old.remove();
    document.head.appendChild(s);
  }, [t]);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password };
      const data = await (mode === "login" ? api.login(payload) : api.register(payload));
      localStorage.setItem("cf_token", data.token);
      localStorage.setItem("cf_user",  JSON.stringify(data.user));
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const inp = { background:t.inputBg, border:`1px solid ${t.border}`, borderRadius:"10px", padding:"12px 16px", color:t.text, fontFamily:"DM Mono,monospace", fontSize:"14px", outline:"none", width:"100%", transition:"border .2s" };
  const lbl = { fontSize:"11px", color:t.muted, letterSpacing:".5px", textTransform:"uppercase", display:"block", marginBottom:"6px" };

  return (
    <div style={{ minHeight:"100vh", background:t.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", position:"relative", overflow:"hidden" }}>
      {/* Fond décoratif */}
      <div style={{ position:"absolute", top:"-100px", right:"-100px", width:"400px", height:"400px", borderRadius:"50%", background:`${t.accent}08`, filter:"blur(60px)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:"-80px", left:"-80px",  width:"300px", height:"300px", borderRadius:"50%", background:`${t.expense}06`, filter:"blur(50px)", pointerEvents:"none" }}/>

      <div style={{ width:"100%", maxWidth:"400px", animation:"fadeIn .5s ease" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:"32px", fontWeight:800, color:t.accent, animation:"float 3s ease-in-out infinite" }}>
            cash<span style={{ color:t.text }}>flow</span>
          </div>
          <div style={{ fontSize:"12px", color:t.muted, marginTop:"6px" }}>
            {mode === "login" ? "Connecte-toi à ton compte" : "Crée ton compte gratuitement"}
          </div>
        </div>

        {/* Card */}
        <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:"20px", padding:"28px", boxShadow:t.cardShadow }}>

          {/* Toggle login/register */}
          <div style={{ display:"flex", background:t.surface2, borderRadius:"12px", padding:"4px", marginBottom:"24px" }}>
            {[{ v:"login", l:"Connexion" }, { v:"register", l:"Inscription" }].map(opt => (
              <button key={opt.v} style={{ flex:1, padding:"10px", borderRadius:"9px", border:"none", cursor:"pointer", fontFamily:"DM Mono,monospace", fontSize:"13px", transition:"all .2s", background:mode === opt.v ? t.accent : "transparent", color:mode === opt.v ? "#0c0e14" : t.muted, fontWeight:mode === opt.v ? 600 : 400 }}
                onClick={() => { setMode(opt.v); setError(""); setForm({ username:"", email:"", password:"" }); }}>
                {opt.l}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
            {mode === "register" && (
              <div>
                <label style={lbl}>Nom d'utilisateur</label>
                <input style={inp} placeholder="Ex: david123" value={form.username} onChange={e => setForm({ ...form, username:e.target.value })}
                  onFocus={e => e.target.style.borderColor = t.accent} onBlur={e => e.target.style.borderColor = t.border}
                  onKeyDown={e => e.key === "Enter" && submit()}/>
              </div>
            )}
            <div>
              <label style={lbl}>Email</label>
              <input style={inp} type="email" placeholder="exemple@email.com" value={form.email} onChange={e => setForm({ ...form, email:e.target.value })}
                onFocus={e => e.target.style.borderColor = t.accent} onBlur={e => e.target.style.borderColor = t.border}
                onKeyDown={e => e.key === "Enter" && submit()}/>
            </div>
            <div>
              <label style={lbl}>Mot de passe {mode === "register" && <span style={{ color:t.muted }}>(min 6 caractères)</span>}</label>
              <input style={inp} type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password:e.target.value })}
                onFocus={e => e.target.style.borderColor = t.accent} onBlur={e => e.target.style.borderColor = t.border}
                onKeyDown={e => e.key === "Enter" && submit()}/>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{ marginTop:"14px", padding:"10px 14px", background:`${t.expense}15`, border:`1px solid ${t.expense}40`, borderRadius:"8px", fontSize:"13px", color:t.expense, display:"flex", alignItems:"center", gap:"8px" }}>
              ⚠ {error}
            </div>
          )}

          {/* Bouton submit */}
          <button style={{ width:"100%", marginTop:"20px", padding:"13px", borderRadius:"10px", border:"none", cursor:loading ? "not-allowed" : "pointer", fontFamily:"DM Mono,monospace", fontSize:"14px", fontWeight:600, background:loading ? t.border : t.accent, color:"#0c0e14", transition:"all .2s", opacity:loading ? 0.7 : 1 }}
            onClick={submit} disabled={loading}>
            {loading ? "Chargement..." : mode === "login" ? "Se connecter →" : "Créer mon compte →"}
          </button>

          {/* Thème switcher */}
          <div style={{ display:"flex", justifyContent:"center", gap:"8px", marginTop:"20px", paddingTop:"20px", borderTop:`1px solid ${t.border}` }}>
            {Object.entries(THEMES).map(([key, th]) => (
              <button key={key} style={{ width:"32px", height:"32px", borderRadius:"50%", border:`2px solid ${themeKey === key ? t.accent : t.border}`, background:themeKey === key ? `${t.accent}20` : "transparent", color:themeKey === key ? t.accent : t.muted, cursor:"pointer", fontSize:"13px", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}
                onClick={() => setThemeKey(key)}>{th.icon}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  APP PRINCIPALE (après connexion)
// ════════════════════════════════════════════════════════════
function MainApp({ user, onLogout, themeKey, setThemeKey }) {
  const isMobile = useIsMobile();
  const t = THEMES[themeKey];
  const [transactions, setTransactions] = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [page,         setPage]         = useState("dashboard");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType,      setAddType]      = useState("expense");
  const [filterType,   setFilterType]   = useState("all");
  const [search,       setSearch]       = useState("");
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat,      setEditCat]      = useState(null);
  const [notif,        setNotif]        = useState(null);
  const [showTheme,    setShowTheme]    = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [form,    setForm]    = useState({ label:"", amount:"", date:today(), categoryId:"", note:"" });
  const [catForm, setCatForm] = useState({ name:"", type:"expense", icon:"🛒", color:"#ff4d6d" });

  // Charger les données depuis l'API
  useEffect(() => {
    (async () => {
      try {
        const [txs, cats] = await Promise.all([api.getTx(), api.getCats()]);
        setTransactions(txs.map(tx => ({ ...tx, categoryId: tx.category_id })));
        setCategories(cats);
      } catch (err) {
        notify("Erreur de chargement : " + err.message, t.expense);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const s = document.createElement("style"); s.id = "bfs";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
      *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
      html, body, #root { width:100%; min-height:100vh; }
      body { background:${t.bg}; font-family:'DM Mono',monospace; color:${t.text}; transition:background .3s; -webkit-font-smoothing:antialiased; }
      ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${t.bg}}::-webkit-scrollbar-thumb{background:${t.border};border-radius:2px}
      @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes popIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
      @keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      @keyframes notifAnim{0%{opacity:0;transform:translateY(20px)}10%{opacity:1;transform:translateY(0)}85%{opacity:1}100%{opacity:0}}
      input[type=date]::-webkit-calendar-picker-indicator{filter:${themeKey!=="light"?"invert(1)":"none"}}
    `;
    const old = document.getElementById("bfs"); if (old) old.remove();
    document.head.appendChild(s);
  }, [t, themeKey]);

  const notify = (msg, color) => { setNotif({ msg, color }); setTimeout(() => setNotif(null), 3000); };

  const now = new Date(); const cm = now.getMonth(), cy = now.getFullYear();
  const monthTx  = useMemo(() => transactions.filter(tx => { const d = new Date(tx.date); return d.getMonth()===cm && d.getFullYear()===cy; }), [transactions,cm,cy]);
  const totalIn  = useMemo(() => monthTx.filter(tx=>tx.type==="income").reduce((s,tx)=>s+tx.amount,0),  [monthTx]);
  const totalOut = useMemo(() => monthTx.filter(tx=>tx.type==="expense").reduce((s,tx)=>s+tx.amount,0), [monthTx]);
  const balance  = totalIn - totalOut;

  const chartData = useMemo(()=>Array.from({length:6},(_,i)=>{
    const d=new Date(cy,cm-5+i,1); const m=d.getMonth(),y=d.getFullYear();
    const mt=transactions.filter(tx=>{const td=new Date(tx.date);return td.getMonth()===m&&td.getFullYear()===y;});
    return {name:MONTHS[m],Entrées:mt.filter(tx=>tx.type==="income").reduce((s,tx)=>s+tx.amount,0),Sorties:mt.filter(tx=>tx.type==="expense").reduce((s,tx)=>s+tx.amount,0)};
  }),[transactions,cm,cy]);

  const catBreak = useMemo(()=>{
    const map={};
    monthTx.filter(tx=>tx.type==="expense").forEach(tx=>{map[tx.categoryId]=(map[tx.categoryId]||0)+tx.amount;});
    return Object.entries(map).map(([id,amount])=>{const cat=categories.find(c=>c.id===id)||{name:"Autre",color:"#888",icon:"?"};return {...cat,id,amount};}).sort((a,b)=>b.amount-a.amount);
  },[monthTx,categories]);

  const filteredTx = useMemo(()=>transactions
    .filter(tx=>filterType==="all"||tx.type===filterType)
    .filter(tx=>!search||tx.label.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>new Date(b.date)-new Date(a.date)),
  [transactions,filterType,search]);

  const S = {
    btn:(bg,col="#fff")=>({display:"inline-flex",alignItems:"center",gap:"6px",padding:"9px 16px",borderRadius:"8px",fontFamily:"DM Mono,monospace",fontSize:"13px",cursor:"pointer",border:"none",background:bg,color:col,fontWeight:500,transition:"all .18s",WebkitTapHighlightColor:"transparent"}),
    input:{background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:"8px",padding:"10px 14px",color:t.text,fontFamily:"DM Mono,monospace",fontSize:"13px",outline:"none",width:"100%",transition:"border .2s"},
    select:{background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:"8px",padding:"10px 14px",color:t.text,fontFamily:"DM Mono,monospace",fontSize:"13px",outline:"none",width:"100%",cursor:"pointer"},
    label:{fontSize:"11px",color:t.muted,letterSpacing:".5px",textTransform:"uppercase",display:"block",marginBottom:"6px"},
    card:{background:t.surface,border:`1px solid ${t.border}`,borderRadius:"14px",padding:isMobile?"16px":"22px",boxShadow:t.cardShadow,transition:"background .3s,border .3s"},
    chip:(active,color)=>({padding:"5px 12px",borderRadius:"20px",fontSize:"11px",cursor:"pointer",border:`1px solid ${active?color:t.border}`,color:active?color:t.muted,background:active?`${color}18`:t.surface2,transition:"all .15s"}),
    modal:{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(6px)",display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",zIndex:1000,padding:isMobile?"0":"16px"},
    modalBox:{background:t.surface,border:`1px solid ${t.border}`,borderRadius:isMobile?"20px 20px 0 0":"16px",padding:"24px",width:"100%",maxWidth:isMobile?"100%":"440px",animation:isMobile?"slideUp .3s ease":"popIn .25s ease",boxShadow:"0 20px 60px rgba(0,0,0,.5)",maxHeight:isMobile?"92vh":"auto",overflowY:"auto"},
    txItem:{display:"flex",alignItems:"center",gap:"12px",padding:"12px",borderRadius:"10px",transition:"background .15s"},
    navItem:(active)=>({display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"8px",fontSize:"13px",color:active?t.accent:t.muted,cursor:"pointer",transition:"all .2s",background:active?t.navActive:"transparent",border:`1px solid ${active?t.navActiveBorder:"transparent"}`}),
  };

  const getCat = (id) => categories.find(c=>c.id===id)||{name:"Autre",color:t.muted,icon:"?"};

  const openAdd  = (type) => { setAddType(type); setForm({label:"",amount:"",date:today(),categoryId:"",note:""}); setShowAddModal(true); };
  const submitTx = async () => {
    if (!form.label||!form.amount||!form.categoryId) return notify("Remplis tous les champs requis !",t.expense);
    try {
      const newTx = { id:uid(), type:addType, label:form.label, amount:parseFloat(form.amount), date:form.date, category_id:form.categoryId, note:form.note };
      await api.addTx(newTx);
      setTransactions(prev=>[{...newTx, categoryId:newTx.category_id},...prev]);
      setShowAddModal(false);
      notify(`${addType==="income"?"Revenu":"Dépense"} ajouté${addType==="expense"?"e":""}!`,addType==="income"?t.income:t.expense);
    } catch (err) { notify(err.message, t.expense); }
  };
  const deleteTx = async (id) => {
    try { await api.delTx(id); setTransactions(prev=>prev.filter(tx=>tx.id!==id)); notify("Transaction supprimée",t.muted); }
    catch (err) { notify(err.message, t.expense); }
  };

  const openCatModal = (cat=null) => { setEditCat(cat); setCatForm(cat?{name:cat.name,type:cat.type,icon:cat.icon,color:cat.color}:{name:"",type:"expense",icon:"🛒",color:"#ff4d6d"}); setShowCatModal(true); };
  const submitCat = async () => {
    if (!catForm.name) return notify("Nom requis!",t.expense);
    try {
      if (editCat) {
        await api.updCat(editCat.id, catForm);
        setCategories(prev=>prev.map(c=>c.id===editCat.id?{...c,...catForm}:c));
        notify("Catégorie modifiée!",t.accent);
      } else {
        const newCat = { id:uid(), ...catForm };
        await api.addCat(newCat);
        setCategories(prev=>[...prev,newCat]);
        notify("Catégorie créée!",t.accent);
      }
      setShowCatModal(false);
    } catch (err) { notify(err.message, t.expense); }
  };
  const deleteCat = async (id) => {
    try { await api.delCat(id); setCategories(prev=>prev.filter(c=>c.id!==id)); notify("Catégorie supprimée",t.muted); }
    catch (err) { notify(err.message, t.expense); }
  };

  const logout = () => { localStorage.removeItem("cf_token"); localStorage.removeItem("cf_user"); onLogout(); };

  const NAV=[{id:"dashboard",icon:"◈",label:"Accueil",mi:"🏠"},{id:"transactions",icon:"↕",label:"Transactions",mi:"↕"},{id:"categories",icon:"◎",label:"Catégories",mi:"◎"}];

  if (loading) return (
    <div style={{ minHeight:"100vh", background:t.bg, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"16px" }}>
      <div style={{ fontFamily:"Syne,sans-serif", fontSize:"24px", fontWeight:800, color:t.accent }}>cash<span style={{color:t.text}}>flow</span></div>
      <div style={{ fontSize:"13px", color:t.muted }}>Chargement de tes données...</div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",minHeight:"100vh",width:"100%",position:"relative"}}>
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${t.gridColor} 1px,transparent 1px),linear-gradient(90deg,${t.gridColor} 1px,transparent 1px)`,backgroundSize:"40px 40px",pointerEvents:"none",zIndex:0}}/>
      {notif&&<div style={{position:"fixed",bottom:isMobile?"80px":"28px",right:"16px",left:isMobile?"16px":"auto",zIndex:2000,background:t.surface,border:`1px solid ${notif.color}`,borderRadius:"10px",padding:"12px 18px",fontSize:"13px",color:t.text,boxShadow:"0 4px 20px rgba(0,0,0,.3)",animation:"notifAnim 3s ease forwards",display:"flex",alignItems:"center",gap:"8px"}}><span style={{color:notif.color}}>●</span>{notif.msg}</div>}

      {/* SIDEBAR DESKTOP */}
      {!isMobile&&<aside style={{width:"220px",flexShrink:0,background:t.surface,borderRight:`1px solid ${t.border}`,padding:"28px 16px",display:"flex",flexDirection:"column",gap:"4px",position:"sticky",top:0,height:"100vh",zIndex:10}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:"20px",fontWeight:800,color:t.accent,padding:"0 12px 24px",borderBottom:`1px solid ${t.border}`,marginBottom:"12px"}}>cash<span style={{color:t.text}}>flow</span></div>
        {NAV.map(nav=>(<div key={nav.id} style={S.navItem(page===nav.id)} onClick={()=>setPage(nav.id)}><span style={{fontSize:"15px",width:"18px",textAlign:"center"}}>{nav.icon}</span>{nav.label}</div>))}
        <div style={{marginTop:"auto",paddingTop:"20px",borderTop:`1px solid ${t.border}`}}>
          {/* User info */}
          <div style={{padding:"10px 12px",background:t.surface2,borderRadius:"10px",marginBottom:"12px",border:`1px solid ${t.border}`}}>
            <div style={{fontSize:"11px",color:t.muted,textTransform:"uppercase",letterSpacing:".5px"}}>Connecté</div>
            <div style={{fontSize:"13px",fontWeight:500,marginTop:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>@{user.username}</div>
          </div>
          {/* Thèmes */}
          <div style={{fontSize:"10px",color:t.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px",paddingLeft:"4px"}}>Thème</div>
          <div style={{display:"flex",gap:"6px",justifyContent:"center"}}>
            {Object.entries(THEMES).map(([key,th])=>(<button key={key} style={{width:"32px",height:"32px",borderRadius:"50%",border:`2px solid ${themeKey===key?t.accent:t.border}`,background:themeKey===key?`${t.accent}20`:"transparent",color:themeKey===key?t.accent:t.muted,cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}} onClick={()=>setThemeKey(key)}>{th.icon}</button>))}
          </div>
          <div style={{marginTop:"12px",padding:"10px 12px",background:t.surface2,borderRadius:"10px",textAlign:"center",border:`1px solid ${t.border}`}}>
            <div style={{fontSize:"10px",color:t.muted,textTransform:"uppercase"}}>Solde ce mois</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:"18px",fontWeight:800,color:balance>=0?t.income:t.expense,marginTop:"4px"}}>{fmt(balance)}</div>
          </div>
          <button style={{...S.btn(t.surface2,t.muted),width:"100%",marginTop:"10px",justifyContent:"center",fontSize:"12px"}} onClick={logout}>
            ⎋ Déconnexion
          </button>
        </div>
      </aside>}

      {/* TOPBAR MOBILE */}
      {isMobile&&<div style={{position:"sticky",top:0,zIndex:10,background:t.surface,borderBottom:`1px solid ${t.border}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:"18px",fontWeight:800,color:t.accent}}>cash<span style={{color:t.text}}>flow</span></div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:"14px",fontWeight:700,color:balance>=0?t.income:t.expense}}>{fmt(balance)}</div>
          <button style={{width:"30px",height:"30px",borderRadius:"50%",border:`1px solid ${t.border}`,background:t.surface2,color:t.accent,cursor:"pointer",fontSize:"13px",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowTheme(!showTheme)}>{THEMES[themeKey].icon}</button>
          <button style={{width:"30px",height:"30px",borderRadius:"50%",border:`1px solid ${t.border}`,background:t.surface2,color:t.muted,cursor:"pointer",fontSize:"13px",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={logout} title="Déconnexion">⎋</button>
        </div>
        {showTheme&&<div style={{position:"absolute",top:"58px",right:"16px",background:t.surface,border:`1px solid ${t.border}`,borderRadius:"12px",padding:"12px",display:"flex",gap:"8px",boxShadow:t.cardShadow,zIndex:100}}>
          {Object.entries(THEMES).map(([key,th])=>(<button key={key} style={{width:"38px",height:"38px",borderRadius:"50%",border:`2px solid ${themeKey===key?t.accent:t.border}`,background:themeKey===key?`${t.accent}20`:"transparent",color:themeKey===key?t.accent:t.muted,cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{setThemeKey(key);setShowTheme(false);}}>{th.icon}</button>))}
        </div>}
      </div>}

      {/* MAIN */}
      <main style={{flex:1,padding:isMobile?"16px 16px 90px":"28px 32px",display:"flex",flexDirection:"column",gap:isMobile?"16px":"24px",background:t.bg,minHeight:"100vh",transition:"background .3s",animation:"fadeIn .4s ease",zIndex:1,width:"100%",overflowX:"hidden"}} key={page}>

        {/* DASHBOARD */}
        {page==="dashboard"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <h1 style={{fontFamily:"Syne,sans-serif",fontSize:isMobile?"20px":"24px",fontWeight:800,display:"flex",alignItems:"center",gap:"8px"}}>
                Bonjour, {user.username} 👋
              </h1>
              <p style={{fontSize:"12px",color:t.muted,marginTop:"4px"}}>{MONTHS[cm]} {cy} · {monthTx.length} transaction{monthTx.length!==1?"s":""}</p>
            </div>
            {!isMobile&&<div style={{display:"flex",gap:"8px"}}>
              <button style={S.btn(t.surface2,t.muted)} onMouseEnter={e=>e.currentTarget.style.color=t.expense} onMouseLeave={e=>e.currentTarget.style.color=t.muted} onClick={()=>openAdd("expense")}>− Dépense</button>
              <button style={S.btn(t.income,"#0c0e14")} onClick={()=>openAdd("income")}>+ Revenu</button>
            </div>}
          </div>

          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:isMobile?"10px":"16px"}}>
            {[{label:"Solde",amount:balance,color:balance>=0?t.income:t.expense},{label:"Entrées",amount:totalIn,color:t.income},{label:"Sorties",amount:totalOut,color:t.expense}].map((item,i)=>(
              <div key={i} style={{...S.card,borderTop:`2px solid ${item.color}`,gridColumn:isMobile&&i===0?"1 / -1":"auto"}}>
                <div style={{fontSize:"10px",color:t.muted,letterSpacing:"1px",textTransform:"uppercase",display:"flex",alignItems:"center",gap:"5px",marginBottom:"8px"}}><span style={{width:"5px",height:"5px",borderRadius:"50%",background:item.color,display:"inline-block"}}/>{item.label}</div>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:isMobile?"20px":"26px",fontWeight:800,color:item.color,letterSpacing:"-1px"}}>{fmt(item.amount)}</div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
              <span style={{fontFamily:"Syne,sans-serif",fontSize:"14px",fontWeight:700}}>Flux mensuels</span>
              <div style={{display:"flex",gap:"10px"}}>
                {[{color:t.income,label:"Entrées"},{color:t.expense,label:"Sorties"}].map(l=>(<div key={l.label} style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"11px",color:t.muted}}><span style={{width:"7px",height:"7px",borderRadius:"2px",background:l.color,display:"inline-block"}}/>{l.label}</div>))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={isMobile?140:180}>
              <BarChart data={chartData} barSize={isMobile?7:10} barGap={3}>
                <XAxis dataKey="name" tick={{fill:t.muted,fontSize:10,fontFamily:"DM Mono,monospace"}} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip contentStyle={{background:t.surface2,border:`1px solid ${t.border}`,borderRadius:"8px",fontFamily:"DM Mono,monospace",fontSize:"12px",color:t.text}} formatter={v=>[fmt(v)]} cursor={{fill:`${t.accent}08`}}/>
                <Bar dataKey="Entrées" fill={t.income} radius={[4,4,0,0]}/>
                <Bar dataKey="Sorties" fill={t.expense} radius={[4,4,0,0]} opacity={0.85}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {catBreak.length>0&&<div style={S.card}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:"14px",fontWeight:700,marginBottom:"14px"}}>Par catégorie</div>
            <div style={{display:"flex",gap:"16px",flexDirection:isMobile?"column":"row",alignItems:"center"}}>
              <ResponsiveContainer width={isMobile?"100%":140} height={130}>
                <PieChart><Pie data={catBreak} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
                  {catBreak.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie><Tooltip contentStyle={{background:t.surface2,border:`1px solid ${t.border}`,borderRadius:"8px",fontFamily:"DM Mono,monospace",fontSize:"12px",color:t.text}} formatter={v=>[fmt(v)]}/></PieChart>
              </ResponsiveContainer>
              <div style={{flex:1,width:"100%",display:"flex",flexDirection:"column",gap:"8px"}}>
                {catBreak.slice(0,5).map(c=>(<div key={c.id} style={{display:"flex",alignItems:"center",gap:"8px"}}><span style={{width:"8px",height:"8px",borderRadius:"50%",background:c.color,flexShrink:0}}/><span style={{fontSize:"12px",color:t.muted,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.icon} {c.name}</span><span style={{fontSize:"12px",color:t.text,fontWeight:500}}>{fmt(c.amount)}</span></div>))}
              </div>
            </div>
          </div>}

          <div style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
              <span style={{fontFamily:"Syne,sans-serif",fontSize:"14px",fontWeight:700}}>Transactions récentes</span>
              <span style={{fontSize:"12px",color:t.accent,cursor:"pointer"}} onClick={()=>setPage("transactions")}>Voir tout →</span>
            </div>
            {transactions.length===0
              ?<div style={{textAlign:"center",padding:"32px 0",color:t.muted}}><div style={{fontSize:"36px",marginBottom:"8px"}}>💸</div><div>Aucune transaction pour l'instant</div></div>
              :transactions.slice(0,5).map(tx=>{const cat=getCat(tx.categoryId);return(
                <div key={tx.id} style={S.txItem} onMouseEnter={e=>e.currentTarget.style.background=t.surface2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{width:"36px",height:"36px",borderRadius:"10px",background:`${cat.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>{cat.icon}</div>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:"13px",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{tx.label}</div><div style={{fontSize:"11px",color:t.muted,marginTop:"1px"}}>{cat.name} · {tx.date}</div></div>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:"13px",fontWeight:700,color:tx.type==="income"?t.income:t.expense,flexShrink:0}}>{tx.type==="income"?"+":"-"}{fmt(tx.amount)}</div>
                </div>);})}
          </div>

          {!isMobile&&<div style={{background:`linear-gradient(135deg,${t.income}10,${t.income}04)`,border:`1px solid ${t.income}30`,borderRadius:"14px",padding:"20px",display:"flex",alignItems:"center",gap:"16px"}}>
            <span style={{fontSize:"24px"}}>⚡</span>
            <div><h3 style={{fontFamily:"Syne,sans-serif",fontSize:"14px",fontWeight:700}}>Ajout rapide</h3><p style={{fontSize:"12px",color:t.muted,marginTop:"2px"}}>Enregistre une transaction en quelques secondes</p></div>
            <div style={{marginLeft:"auto",display:"flex",gap:"8px"}}>
              <button style={S.btn(t.expense)} onClick={()=>openAdd("expense")}>− Dépense</button>
              <button style={S.btn(t.income,"#0c0e14")} onClick={()=>openAdd("income")}>+ Revenu</button>
            </div>
          </div>}
        </>}

        {/* TRANSACTIONS */}
        {page==="transactions"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><h1 style={{fontFamily:"Syne,sans-serif",fontSize:isMobile?"20px":"24px",fontWeight:800}}>Transactions</h1><p style={{fontSize:"12px",color:t.muted,marginTop:"4px"}}>{filteredTx.length} résultat{filteredTx.length!==1?"s":""}</p></div>
            {!isMobile&&<div style={{display:"flex",gap:"8px"}}><button style={S.btn(t.expense)} onClick={()=>openAdd("expense")}>− Dépense</button><button style={S.btn(t.income,"#0c0e14")} onClick={()=>openAdd("income")}>+ Revenu</button></div>}
          </div>
          <div style={S.card}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:"8px",padding:"10px 14px",marginBottom:"14px"}}>
              <span style={{color:t.muted}}>⌕</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." style={{background:"none",border:"none",outline:"none",color:t.text,fontFamily:"DM Mono,monospace",fontSize:"13px",flex:1}}/>
              {search&&<span style={{color:t.muted,cursor:"pointer"}} onClick={()=>setSearch("")}>✕</span>}
            </div>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"16px"}}>
              {[{v:"all",l:"Tout"},{v:"income",l:"Entrées"},{v:"expense",l:"Sorties"}].map(f=>(<div key={f.v} style={S.chip(filterType===f.v,f.v==="income"?t.income:f.v==="expense"?t.expense:t.accent)} onClick={()=>setFilterType(f.v)}>{f.l}</div>))}
            </div>
            {filteredTx.length===0
              ?<div style={{textAlign:"center",padding:"40px 0",color:t.muted}}><div style={{fontSize:"28px",marginBottom:"8px"}}>🔍</div><div>Aucune transaction trouvée</div></div>
              :filteredTx.map(tx=>{const cat=getCat(tx.categoryId);return(
                <div key={tx.id} style={{...S.txItem,borderBottom:`1px solid ${t.border}`}} onMouseEnter={e=>e.currentTarget.style.background=t.surface2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{width:"36px",height:"36px",borderRadius:"10px",background:`${cat.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>{cat.icon}</div>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:"13px",fontWeight:500}}>{tx.label}</div><div style={{fontSize:"11px",color:t.muted,marginTop:"1px"}}>{cat.name} · {tx.date}{tx.note&&` · ${tx.note}`}</div></div>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:"13px",fontWeight:700,color:tx.type==="income"?t.income:t.expense,marginRight:"8px",flexShrink:0}}>{tx.type==="income"?"+":"-"}{fmt(tx.amount)}</div>
                  <button style={{background:"transparent",border:"none",color:t.muted,cursor:"pointer",fontSize:"14px",padding:"4px 6px",borderRadius:"6px",flexShrink:0}}
                    onMouseEnter={e=>{e.currentTarget.style.color=t.expense;e.currentTarget.style.background=`${t.expense}18`;}} onMouseLeave={e=>{e.currentTarget.style.color=t.muted;e.currentTarget.style.background="transparent";}}
                    onClick={()=>deleteTx(tx.id)}>✕</button>
                </div>);})}
          </div>
        </>}

        {/* CATEGORIES */}
        {page==="categories"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><h1 style={{fontFamily:"Syne,sans-serif",fontSize:isMobile?"20px":"24px",fontWeight:800}}>Catégories</h1><p style={{fontSize:"12px",color:t.muted,marginTop:"4px"}}>{categories.length} catégories</p></div>
            <button style={{...S.btn(t.accent,"#0c0e14"),fontSize:"12px",padding:"8px 12px"}} onClick={()=>openCatModal()}>+ Nouvelle</button>
          </div>
          {["income","expense"].map(type=>(<div key={type} style={S.card}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:"14px",fontWeight:700,marginBottom:"14px",display:"flex",alignItems:"center",gap:"8px"}}><span style={{width:"8px",height:"8px",borderRadius:"50%",background:type==="income"?t.income:t.expense,display:"inline-block"}}/>{type==="income"?"Revenus":"Dépenses"}</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(180px,1fr))",gap:"8px"}}>
              {categories.filter(c=>c.type===type).map(cat=>(<div key={cat.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"10px",border:`1px solid ${t.border}`,background:t.surface2,transition:"all .2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=cat.color} onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
                <div style={{width:"34px",height:"34px",borderRadius:"8px",background:`${cat.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>{cat.icon}</div>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:"13px",fontWeight:500}}>{cat.name}</div><div style={{fontSize:"11px",color:t.muted}}>{transactions.filter(tx=>tx.categoryId===cat.id).length} tx</div></div>
                <div style={{display:"flex",gap:"2px",flexShrink:0}}>
                  <button style={{background:"transparent",border:"none",color:t.muted,cursor:"pointer",fontSize:"13px",padding:"4px 6px",borderRadius:"6px"}}
                    onMouseEnter={e=>{e.currentTarget.style.color=t.accent;e.currentTarget.style.background=`${t.accent}18`;}} onMouseLeave={e=>{e.currentTarget.style.color=t.muted;e.currentTarget.style.background="transparent";}}
                    onClick={()=>openCatModal(cat)}>✎</button>
                  <button style={{background:"transparent",border:"none",color:t.muted,cursor:"pointer",fontSize:"13px",padding:"4px 6px",borderRadius:"6px"}}
                    onMouseEnter={e=>{e.currentTarget.style.color=t.expense;e.currentTarget.style.background=`${t.expense}18`;}} onMouseLeave={e=>{e.currentTarget.style.color=t.muted;e.currentTarget.style.background="transparent";}}
                    onClick={()=>deleteCat(cat.id)}>✕</button>
                </div>
              </div>))}
            </div>
          </div>))}
        </>}
      </main>

      {/* FAB MOBILE */}
      {isMobile&&<div style={{position:"fixed",bottom:"70px",right:"16px",display:"flex",flexDirection:"column",gap:"10px",zIndex:50}}>
        <button style={{width:"48px",height:"48px",borderRadius:"50%",background:t.expense,border:"none",color:"#fff",fontSize:"22px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 16px ${t.expense}60`,cursor:"pointer"}} onClick={()=>openAdd("expense")}>−</button>
        <button style={{width:"56px",height:"56px",borderRadius:"50%",background:t.income,border:"none",color:"#0c0e14",fontSize:"26px",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px ${t.income}60`,cursor:"pointer"}} onClick={()=>openAdd("income")}>+</button>
      </div>}

      {/* BOTTOM NAV MOBILE */}
      {isMobile&&<nav style={{position:"fixed",bottom:0,left:0,right:0,background:t.surface,borderTop:`1px solid ${t.border}`,display:"flex",zIndex:20}}>
        {NAV.map(nav=>(<div key={nav.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 0",cursor:"pointer",color:page===nav.id?t.accent:t.muted,fontSize:"10px",gap:"4px",transition:"color .2s",WebkitTapHighlightColor:"transparent"}} onClick={()=>setPage(nav.id)}><span style={{fontSize:"18px"}}>{nav.mi}</span><span>{nav.label}</span></div>))}
      </nav>}

      {/* MODAL TRANSACTION */}
      {showAddModal&&<div style={S.modal} onClick={e=>e.target===e.currentTarget&&setShowAddModal(false)}>
        <div style={S.modalBox}>
          {isMobile&&<div style={{width:"40px",height:"4px",background:t.border,borderRadius:"2px",margin:"0 auto 20px"}}/>}
          <div style={{display:"flex",marginBottom:"20px",background:t.surface2,borderRadius:"10px",padding:"4px"}}>
            {[{v:"income",l:"💰 Revenu"},{v:"expense",l:"💸 Dépense"}].map(opt=>(<button key={opt.v} style={{flex:1,padding:"10px",borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:"DM Mono,monospace",fontSize:"13px",transition:"all .2s",background:addType===opt.v?(opt.v==="income"?t.income:t.expense):"transparent",color:addType===opt.v?"#fff":t.muted,fontWeight:addType===opt.v?600:400}} onClick={()=>setAddType(opt.v)}>{opt.l}</button>))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <div><label style={S.label}>Libellé *</label><input style={S.input} placeholder="Ex: Salaire mars..." value={form.label} onChange={e=>setForm({...form,label:e.target.value})} onFocus={e=>e.target.style.borderColor=t.accent} onBlur={e=>e.target.style.borderColor=t.border}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <div><label style={S.label}>Montant (F) *</label><input style={S.input} type="number" inputMode="numeric" min="0" step="1" placeholder="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} onFocus={e=>e.target.style.borderColor=t.accent} onBlur={e=>e.target.style.borderColor=t.border}/></div>
              <div><label style={S.label}>Date *</label><input style={S.input} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} onFocus={e=>e.target.style.borderColor=t.accent} onBlur={e=>e.target.style.borderColor=t.border}/></div>
            </div>
            <div><label style={S.label}>Catégorie *</label>
              <select style={S.select} value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})}>
                <option value="">Choisir une catégorie...</option>
                {categories.filter(c=>c.type===addType).map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div><label style={S.label}>Note (optionnel)</label><input style={S.input} placeholder="Remarque..." value={form.note} onChange={e=>setForm({...form,note:e.target.value})} onFocus={e=>e.target.style.borderColor=t.accent} onBlur={e=>e.target.style.borderColor=t.border}/></div>
          </div>
          <div style={{display:"flex",gap:"10px",marginTop:"20px"}}>
            <button style={{...S.btn(t.surface2,t.muted),flex:1}} onClick={()=>setShowAddModal(false)}>Annuler</button>
            <button style={{...S.btn(addType==="income"?t.income:t.expense,"#fff"),flex:2,justifyContent:"center"}} onClick={submitTx}>{addType==="income"?"Ajouter le revenu":"Ajouter la dépense"}</button>
          </div>
        </div>
      </div>}

      {/* MODAL CATEGORIE */}
      {showCatModal&&<div style={S.modal} onClick={e=>e.target===e.currentTarget&&setShowCatModal(false)}>
        <div style={S.modalBox}>
          {isMobile&&<div style={{width:"40px",height:"4px",background:t.border,borderRadius:"2px",margin:"0 auto 20px"}}/>}
          <h2 style={{fontFamily:"Syne,sans-serif",fontSize:"17px",fontWeight:800,marginBottom:"18px"}}>{editCat?"Modifier":"Nouvelle catégorie"}</h2>
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <div><label style={S.label}>Nom *</label><input style={S.input} placeholder="Ex: Loyer, Marché..." value={catForm.name} onChange={e=>setCatForm({...catForm,name:e.target.value})} onFocus={e=>e.target.style.borderColor=t.accent} onBlur={e=>e.target.style.borderColor=t.border}/></div>
            <div><label style={S.label}>Type *</label>
              <div style={{display:"flex",background:t.surface2,borderRadius:"10px",padding:"4px"}}>
                {[{v:"expense",l:"💸 Dépense"},{v:"income",l:"💰 Revenu"}].map(opt=>(<button key={opt.v} style={{flex:1,padding:"9px",borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:"DM Mono,monospace",fontSize:"13px",transition:"all .2s",background:catForm.type===opt.v?t.accent:"transparent",color:catForm.type===opt.v?"#0c0e14":t.muted}} onClick={()=>setCatForm({...catForm,type:opt.v})}>{opt.l}</button>))}
              </div>
            </div>
            <div><label style={S.label}>Icône</label><div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>{ICONS.map(icon=><div key={icon} style={{width:"36px",height:"36px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",cursor:"pointer",background:catForm.icon===icon?`${t.accent}30`:t.surface2,border:`1px solid ${catForm.icon===icon?t.accent:t.border}`,transition:"all .15px"}} onClick={()=>setCatForm({...catForm,icon})}>{icon}</div>)}</div></div>
            <div><label style={S.label}>Couleur</label><div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>{COLORS.map(color=><div key={color} style={{width:"28px",height:"28px",borderRadius:"50%",background:color,cursor:"pointer",border:`3px solid ${catForm.color===color?t.text:"transparent"}`,outline:`2px solid ${catForm.color===color?color:"transparent"}`,outlineOffset:"2px",transition:"all .15s"}} onClick={()=>setCatForm({...catForm,color})}/>)}</div></div>
            <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"10px",background:t.surface2,border:`1px solid ${t.border}`}}>
              <div style={{width:"36px",height:"36px",borderRadius:"8px",background:`${catForm.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>{catForm.icon}</div>
              <div><div style={{fontSize:"13px",fontWeight:500}}>{catForm.name||"Aperçu"}</div><div style={{fontSize:"11px",color:t.muted}}>{catForm.type==="income"?"Revenu":"Dépense"}</div></div>
              <div style={{marginLeft:"auto",width:"10px",height:"10px",borderRadius:"50%",background:catForm.color}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:"10px",marginTop:"20px"}}>
            <button style={{...S.btn(t.surface2,t.muted),flex:1}} onClick={()=>setShowCatModal(false)}>Annuler</button>
            <button style={{...S.btn(t.accent,"#0c0e14"),flex:2,justifyContent:"center"}} onClick={submitCat}>{editCat?"Enregistrer":"Créer"}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  POINT D'ENTRÉE — Gestion de l'auth
// ════════════════════════════════════════════════════════════
export default function App() {
  const [themeKey, setThemeKey] = useState(THEMES[localStorage.getItem("cf_theme")] ? localStorage.getItem("cf_theme") : "dark");
  const [user,     setUser]     = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => { localStorage.setItem("cf_theme", themeKey); }, [themeKey]);

  // Vérifier si déjà connecté au démarrage
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("cf_token");
      if (!token) { setChecking(false); return; }
      try {
        const data = await api.me();
        setUser(data.user);
      } catch {
        localStorage.removeItem("cf_token");
        localStorage.removeItem("cf_user");
      }
      setChecking(false);
    })();
  }, []);

  const t = THEMES[themeKey];

  if (checking) return (
    <div style={{ minHeight:"100vh", background:t.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Syne,sans-serif", fontSize:"24px", fontWeight:800, color:t.accent }}>
      cash<span style={{ color:t.text }}>flow</span>
    </div>
  );

  if (!user) return <AuthPage onAuth={setUser} themeKey={themeKey} setThemeKey={setThemeKey}/>;
  return <MainApp user={user} onLogout={() => setUser(null)} themeKey={themeKey} setThemeKey={setThemeKey}/>;
}
