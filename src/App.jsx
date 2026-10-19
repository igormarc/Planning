import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { collection, doc, getDoc, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { auth, provider, db } from './firebase'
import { transpose } from './transpose'
import { Auth, Join, Team } from './Screens'

function useCol(cid, name, order) {
  const [rows, setRows] = useState([])
  useEffect(() => onSnapshot(query(collection(db, 'churches', cid, name), orderBy(order)),
    s => setRows(s.docs.map(d => ({ id: d.id, ...d.data() })))), [cid, name, order])
  return rows
}

function Songs({ cid, ro }) {
  const songs = useCol(cid, 'songs', 'titulo')
  const [sel, setSel] = useState(null), [f, setF] = useState({ titulo: '', tono: '', letra: '' })
  const [n, setN] = useState(0), [flat, setFlat] = useState(false)
  const save = async e => {
    e.preventDefault()
    if (f.id) await updateDoc(doc(db, 'churches', cid, 'songs', f.id), { titulo: f.titulo, tono: f.tono, letra: f.letra })
    else await addDoc(collection(db, 'churches', cid, 'songs'), { titulo: f.titulo, tono: f.tono, letra: f.letra })
    setF({ titulo: '', tono: '', letra: '' })
  }
  return <>
    <form onSubmit={save} hidden={ro}>
      <h2>{f.id ? 'Editar canción' : 'Nueva canción'}</h2>
      <input required placeholder="Título" value={f.titulo} onChange={e => setF({ ...f, titulo: e.target.value })} />
      <input placeholder="Tono (ej. G)" value={f.tono} onChange={e => setF({ ...f, tono: e.target.value })} />
      <textarea rows="8" placeholder="Letra con acordes entre corchetes: [G]Grande es [C]Dios" value={f.letra} onChange={e => setF({ ...f, letra: e.target.value })} />
      <button>Guardar canción</button>
    </form>
    <h2>Canciones ({songs.length})</h2>
    {!songs.length && <p className="vacio">Aún no hay canciones. Agrega la primera arriba.</p>}
    {songs.map(s => <div className="card" key={s.id}>
      <b onClick={() => { setSel(sel === s.id ? null : s.id); setN(0) }}>{s.titulo} <small>{s.tono}</small></b>
      {sel === s.id && <>
        <div className="row">
          <button onClick={() => setN(n - 1)}>−1 tono</button><button onClick={() => setN(n + 1)}>+1 tono</button>
          <button onClick={() => setFlat(!flat)}>{flat ? 'Usar #' : 'Usar b'}</button>
        </div>
        <pre>{transpose(s.letra || '', n, flat)}</pre>
        <div className="row" hidden={ro}><button onClick={() => { setF(s); window.scrollTo(0, 0) }}>Editar</button>
          <button className="peligro" onClick={() => confirm('¿Eliminar esta canción?') && deleteDoc(doc(db, 'churches', cid, 'songs', s.id))}>Eliminar</button></div>
      </>}
    </div>)}
  </>
}

function Plan({ cid, plan, songs, ro }) {
  const items = plan.items || []
  const [t, setT] = useState('song'), [txt, setTxt] = useState(''), [sid, setSid] = useState('')
  const put = arr => updateDoc(doc(db, 'churches', cid, 'plans', plan.id), { items: arr })
  const add = () => {
    const s = songs.find(x => x.id === sid)
    const it = t === 'song' ? s && { t, label: s.titulo, tono: s.tono } : txt && { t, label: txt }
    if (it) { put([...items, it]); setTxt('') }
  }
  const mv = (i, d) => { const a = [...items]; const j = i + d; if (j < 0 || j >= a.length) return;[a[i], a[j]] = [a[j], a[i]]; put(a) }
  return <div className="card">
    <ol>{items.map((it, i) => <li key={i}>
      <span>{it.t === 'song' ? '♪ ' : ''}{it.label} {it.tono && <small>({it.tono})</small>}</span>
      <span hidden={ro}><button onClick={() => mv(i, -1)}>↑</button><button onClick={() => mv(i, 1)}>↓</button><button className="peligro" onClick={() => put(items.filter((_, k) => k !== i))}>✕</button></span>
    </li>)}</ol>
    {!items.length && <p className="vacio">Plan vacío. Agrega canciones o ítems.</p>}
    <div className="row" hidden={ro}>
      <select value={t} onChange={e => setT(e.target.value)}><option value="song">Canción</option><option value="head">Encabezado</option><option value="read">Lectura</option><option value="ann">Anuncio</option></select>
      {t === 'song' ? <select value={sid} onChange={e => setSid(e.target.value)}><option value="">Elige canción</option>{songs.map(s => <option key={s.id} value={s.id}>{s.titulo}</option>)}</select>
        : <input placeholder="Texto del ítem" value={txt} onChange={e => setTxt(e.target.value)} />}
      <button onClick={add}>Agregar ítem</button>
    </div>
    <button className="peligro" hidden={ro} onClick={() => confirm('¿Eliminar este plan?') && deleteDoc(doc(db, 'churches', cid, 'plans', plan.id))}>Eliminar plan</button>
  </div>
}

function Plans({ cid, ro }) {
  const plans = useCol(cid, 'plans', 'fecha'), songs = useCol(cid, 'songs', 'titulo')
  const [f, setF] = useState({ titulo: '', fecha: '' }), [sel, setSel] = useState(null)
  const create = async e => { e.preventDefault(); await addDoc(collection(db, 'churches', cid, 'plans'), { ...f, items: [] }); setF({ titulo: '', fecha: '' }) }
  return <>
    <form onSubmit={create} hidden={ro}><h2>Nuevo plan</h2>
      <input required placeholder="Título (ej. Culto domingo)" value={f.titulo} onChange={e => setF({ ...f, titulo: e.target.value })} />
      <input required type="date" value={f.fecha} onChange={e => setF({ ...f, fecha: e.target.value })} />
      <button>Crear plan</button></form>
    <h2>Planes ({plans.length})</h2>
    {!plans.length && <p className="vacio">Aún no hay planes. Crea el primero arriba.</p>}
    {plans.map(p => <div key={p.id}>
      <div className="card"><b onClick={() => setSel(sel === p.id ? null : p.id)}>{p.titulo} <small>{p.fecha}</small></b></div>
      {sel === p.id && <Plan cid={cid} plan={p} songs={songs} ro={ro} />}
    </div>)}
  </>
}

export default function App() {
  const [u, setU] = useState(null), [cid, setCid] = useState(null), [me, setMe] = useState(null), [ready, setReady] = useState(false), [tab, setTab] = useState('plans')
  useEffect(() => onAuthStateChanged(auth, async x => {
    setU(x); setMe(null); setCid(null)
    if (x) { try { setCid((await getDoc(doc(db, 'users', x.uid))).data()?.churchId || null) } catch { } }
    setReady(true)
  }), [])
  useEffect(() => { if (u && cid) return onSnapshot(doc(db, 'churches', cid, 'members', u.uid), s => setMe(s.exists() ? s.data() : false), () => setMe(false)) }, [u, cid])
  const reset = async () => { try { await deleteDoc(doc(db, 'churches', cid, 'members', u.uid)) } catch { } await deleteDoc(doc(db, 'users', u.uid)); setCid(null) }
  if (!ready || (u && cid && me === null)) return <p className="vacio">Cargando…</p>
  if (!u) return <Auth />
  if (!cid) return <Join u={u} onDone={setCid} />
  if (!me || me.rol === 'pendiente') return <div className="wrap center"><div className="card"><h2>Solicitud enviada</h2><p>El administrador debe aprobar tu acceso. Vuelve a entrar más tarde. Si te equivocaste de código, usa otro.</p><button onClick={reset}>Usar otro código</button></div><button className="link" onClick={() => signOut(auth)}>Salir</button></div>
  const adm = me.rol === 'admin', sv = adm || me.canciones !== 'ninguno', pl = adm || me.planes !== 'ninguno'
  const tabs = [pl && ['plans', 'Planes'], sv && ['songs', 'Canciones'], adm && ['team', 'Equipo']].filter(Boolean)
  const t = tabs.find(x => x[0] === tab) ? tab : tabs[0]?.[0]
  return <>
    <header className="top"><b className="logo">♪ Servicios</b><span><small>{u.displayName || u.email}</small><button className="ghost sm" onClick={() => signOut(auth)}>Salir</button></span></header>
    <main className="wrap">
      <nav>{tabs.map(([k, l]) => <button key={k} className={t === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</nav>
      {!t && <p className="vacio">Aún no tienes accesos. Pide al administrador que te los asigne.</p>}
      {t === 'plans' && <Plans cid={cid} ro={!(adm || me.planes === 'editar')} />}
      {t === 'songs' && <Songs cid={cid} ro={!(adm || me.canciones === 'editar')} />}
      {t === 'team' && <Team cid={cid} />}
    </main>
  </>
}
