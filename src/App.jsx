import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { collection, doc, getDoc, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { auth, provider, db } from './firebase'
import { transpose } from './transpose'
import { Auth, Join, Team, Agenda } from './Screens'
import { Plans } from './Plans'

function useCol(cid, name, order) {
  const [rows, setRows] = useState([])
  useEffect(() => onSnapshot(query(collection(db, 'churches', cid, name), orderBy(order)),
    s => setRows(s.docs.map(d => ({ id: d.id, ...d.data() })))), [cid, name, order])
  return rows
}

function Songs({ cid, ro }) {
  const songs = useCol(cid, 'songs', 'titulo')
  const [sel, setSel] = useState(null), [f, setF] = useState({ titulo: '', tono: '', bpm: '', dur: '', letra: '' })
  const [n, setN] = useState(0), [flat, setFlat] = useState(false), [q, setQ] = useState('')
  const save = async e => {
    e.preventDefault()
    if (f.id) await updateDoc(doc(db, 'churches', cid, 'songs', f.id), { titulo: f.titulo, tono: f.tono, bpm: f.bpm || '', dur: f.dur || '', letra: f.letra })
    else await addDoc(collection(db, 'churches', cid, 'songs'), { titulo: f.titulo, tono: f.tono, bpm: f.bpm || '', dur: f.dur || '', letra: f.letra })
    setF({ titulo: '', tono: '', bpm: '', dur: '', letra: '' })
  }
  return <>
    <form onSubmit={save} hidden={ro}>
      <h2>{f.id ? 'Editar canción' : 'Nueva canción'}</h2>
      <input required placeholder="Título" value={f.titulo} onChange={e => setF({ ...f, titulo: e.target.value })} />
      <input placeholder="Tono (ej. G)" value={f.tono} onChange={e => setF({ ...f, tono: e.target.value })} />
      <input placeholder="BPM" value={f.bpm || ''} onChange={e => setF({ ...f, bpm: e.target.value })} />
      <input placeholder="Duración (m:ss)" value={f.dur || ''} onChange={e => setF({ ...f, dur: e.target.value })} />
      <textarea rows="8" placeholder="Letra con acordes entre corchetes: [G]Grande es [C]Dios" value={f.letra} onChange={e => setF({ ...f, letra: e.target.value })} />
      <button>Guardar canción</button>
    </form>
    <h2>Canciones ({songs.length})</h2>
    <input placeholder="Buscar canción…" value={q} onChange={e => setQ(e.target.value)} />
    {!songs.length && <p className="vacio">Aún no hay canciones. Agrega la primera arriba.</p>}
    {songs.filter(s => (s.titulo || '').toLowerCase().includes(q.toLowerCase())).map(s => <div className="card" key={s.id}>
      <b onClick={() => { setSel(sel === s.id ? null : s.id); setN(0) }}>{s.titulo} <small>{s.tono}{s.bpm ? ' · ' + s.bpm + ' bpm' : ''}{s.dur ? ' · ' + s.dur : ''}</small></b>
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

export default function App() {
  const [u, setU] = useState(null), [cid, setCid] = useState(null), [me, setMe] = useState(null), [ready, setReady] = useState(false), [tab, setTab] = useState('agenda')
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
  const tabs = [['agenda', 'Mi agenda'], pl && ['plans', 'Planes'], sv && ['songs', 'Canciones'], adm && ['team', 'Equipo']].filter(Boolean)
  const t = tabs.find(x => x[0] === tab) ? tab : tabs[0]?.[0]
  return <>
    <header className="top"><b className="logo">♪ Servicios</b><span><small>{u.displayName || u.email}</small><button className="ghost sm" onClick={() => signOut(auth)}>Salir</button></span></header>
    <main className="wrap">
      <nav>{tabs.map(([k, l]) => <button key={k} className={t === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</nav>
      {!t && <p className="vacio">Aún no tienes accesos. Pide al administrador que te los asigne.</p>}
      {t === 'plans' && <Plans cid={cid} ro={!(adm || me.planes === 'editar')} />}
      {t === 'songs' && <Songs cid={cid} ro={!(adm || me.canciones === 'editar')} />}
      {t === 'team' && <Team cid={cid} />}
      {t === 'agenda' && <Agenda cid={cid} uid={u.uid} />}
    </main>
  </>
}
