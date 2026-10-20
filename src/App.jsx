import { Fragment, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, doc, getDoc, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { transpose } from './transpose'
import { Auth, Join, Team, Agenda } from './Screens'
import { Plans, useCol } from './Plans'
import { Logo } from './Logo'

const hoy = new Date().toISOString().slice(0, 10)
const VACIA = { titulo: '', tono: '', bpm: '', dur: '', letra: '' }

function Songs({ cid, ro }) {
  const songs = useCol(cid, 'songs', 'titulo'), plans = useCol(cid, 'plans', 'fecha')
  const [q, setQ] = useState(''), [sel, setSel] = useState(null), [f, setF] = useState(null), [n, setN] = useState(0), [flat, setFlat] = useState(false), [pg, setPg] = useState(0)
  const list = songs.filter(s => (s.titulo || '').toLowerCase().includes(q.toLowerCase())), pages = Math.ceil(list.length / 25)
  const last = t => plans.filter(p => p.fecha <= hoy && (p.items || []).some(i => i.label === t)).map(p => p.fecha).sort().pop() || ''
  const save = async e => {
    e.preventDefault(); const { id, ...d } = f
    if (id) await updateDoc(doc(db, 'churches', cid, 'songs', id), d); else await addDoc(collection(db, 'churches', cid, 'songs'), d)
    setF(null)
  }
  const set = k => e => setF({ ...f, [k]: e.target.value })
  return <>
    <div className="pagehead"><h1>Canciones</h1><button hidden={ro} onClick={() => setF({ ...VACIA })}>Agregar canción</button></div>
    {f && <form onSubmit={save}><h2 style={{ marginTop: 0 }}>{f.id ? 'Editar canción' : 'Nueva canción'}</h2>
      <input required placeholder="Título" value={f.titulo} onChange={set('titulo')} />
      <div className="row3"><input placeholder="Tono (ej. G)" value={f.tono || ''} onChange={set('tono')} /><input placeholder="BPM" value={f.bpm || ''} onChange={set('bpm')} /><input placeholder="Duración m:ss" value={f.dur || ''} onChange={set('dur')} /></div>
      <textarea rows="8" placeholder="Letra con acordes entre corchetes: [G]Grande es [C]Dios" value={f.letra || ''} onChange={set('letra')} />
      <button>Guardar</button><button type="button" className="ghost" onClick={() => setF(null)}>Cancelar</button></form>}
    <input placeholder="Buscar canción…" value={q} onChange={e => { setQ(e.target.value); setPg(0) }} />
    <p className="mut">{list.length} canciones</p>
    <div className="tw"><table><thead><tr><th>Título</th><th>BPM</th><th>Tono</th><th>Última vez</th></tr></thead><tbody>
      {list.slice(pg * 25, pg * 25 + 25).map(s => <Fragment key={s.id}>
        <tr onClick={() => { setSel(sel === s.id ? null : s.id); setN(0) }}><td>{s.titulo}</td><td>{s.bpm}</td><td>{s.tono}</td><td>{last(s.titulo)}</td></tr>
        {sel === s.id && <tr><td colSpan="4">
          <div className="row"><button className="ghost sm" onClick={() => setN(n - 1)}>−1 tono</button><button className="ghost sm" onClick={() => setN(n + 1)}>+1 tono</button><button className="ghost sm" onClick={() => setFlat(!flat)}>{flat ? 'Usar #' : 'Usar b'}</button></div>
          <pre>{transpose(s.letra || '', n, flat)}</pre>
          <div className="row" hidden={ro}><button className="ghost sm" onClick={() => { setF(s); window.scrollTo(0, 0) }}>Editar</button>
            <button className="peligro sm" onClick={() => confirm('¿Eliminar esta canción?') && deleteDoc(doc(db, 'churches', cid, 'songs', s.id))}>Eliminar</button></div></td></tr>}
      </Fragment>)}
    </tbody></table></div>
    {!list.length && <p className="vacio">No hay canciones.</p>}
    <div className="row">{Array.from({ length: pages }, (_, i) => <button key={i} className={'pg' + (i === pg ? ' on' : '')} onClick={() => setPg(i)}>{i + 1}</button>)}</div>
  </>
}

export default function App() {
  const [u, setU] = useState(null), [cid, setCid] = useState(null), [me, setMe] = useState(null), [cn, setCn] = useState(''), [ready, setReady] = useState(false), [tab, setTab] = useState('agenda')
  useEffect(() => onAuthStateChanged(auth, async x => {
    setU(x); setMe(null); setCid(null)
    if (x) { try { setCid((await getDoc(doc(db, 'users', x.uid))).data()?.churchId || null) } catch { } }
    setReady(true)
  }), [])
  useEffect(() => { if (u && cid) return onSnapshot(doc(db, 'churches', cid, 'members', u.uid), s => setMe(s.exists() ? s.data() : false), () => setMe(false)) }, [u, cid])
  const active = me && me.rol !== 'pendiente'
  useEffect(() => { if (active) return onSnapshot(doc(db, 'churches', cid), s => setCn(s.data()?.nombre || ''), () => { }) }, [active, cid])
  const reset = async () => { try { await deleteDoc(doc(db, 'churches', cid, 'members', u.uid)) } catch { } await deleteDoc(doc(db, 'users', u.uid)); setCid(null) }
  if (!ready || (u && cid && me === null)) return <p className="vacio">Cargando…</p>
  if (!u) return <Auth />
  if (!cid) return <Join u={u} onDone={setCid} />
  if (!active) return <div className="wrap center"><Logo /><div className="card"><h2>Solicitud enviada</h2><p>El administrador debe aprobar tu acceso. Vuelve a entrar más tarde. Si te equivocaste de código, usa otro.</p><button onClick={reset}>Usar otro código</button></div><button className="link" onClick={() => signOut(auth)}>Salir</button></div>
  const adm = me.rol === 'admin', sv = adm || me.canciones !== 'ninguno', pl = adm || me.planes !== 'ninguno'
  const tabs = [['agenda', 'Mi agenda'], pl && ['plans', 'Planes'], sv && ['songs', 'Canciones'], adm && ['team', 'Personas']].filter(Boolean)
  const t = tabs.find(x => x[0] === tab) ? tab : tabs[0][0]
  return <>
    <header className="top"><Logo />
      <nav className="tabs">{tabs.map(([k, l]) => <button key={k} className={t === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</nav>
      <span className="chip">{cn}</span>
      <button className="avatar" title="Salir" aria-label="Salir" onClick={() => signOut(auth)}>{(u.displayName || u.email || '?')[0].toUpperCase()}</button></header>
    <main className="sheet">
      {t === 'agenda' && <Agenda cid={cid} uid={u.uid} />}
      {t === 'plans' && <Plans cid={cid} ro={!(adm || me.planes === 'editar')} />}
      {t === 'songs' && <Songs cid={cid} ro={!(adm || me.canciones === 'editar')} />}
      {t === 'team' && <Team cid={cid} uid={u.uid} />}
    </main>
  </>
}
