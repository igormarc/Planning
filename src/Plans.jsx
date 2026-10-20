import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, query, orderBy, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'

export const useCol = (cid, name, order) => {
  const [rows, setRows] = useState([])
  useEffect(() => onSnapshot(order ? query(collection(db, 'churches', cid, name), orderBy(order)) : collection(db, 'churches', cid, name),
    s => setRows(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => { }), [cid, name, order])
  return rows
}
const secs = t => { const [m, s] = (t || '0:00').split(':'); return (+m || 0) * 60 + (+s || 0) }
const fmt = n => Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0')
const ICON = { aceptado: '✓', rechazado: '✗', pendiente: '?' }

function Orden({ cid, plan, songs, ro }) {
  const items = plan.items || []
  const [t, setT] = useState('song'), [txt, setTxt] = useState(''), [sid, setSid] = useState(''), [len, setLen] = useState('')
  const put = arr => updateDoc(doc(db, 'churches', cid, 'plans', plan.id), { items: arr })
  const add = () => {
    const s = songs.find(x => x.id === sid)
    const it = t === 'song' ? s && { t, label: s.titulo, tono: s.tono || '', len: len || s.dur || '' } : txt && { t, label: txt, len }
    if (it) { put([...items, it]); setTxt(''); setLen('') }
  }
  const mv = (i, d) => { const a = [...items], j = i + d; if (j < 0 || j >= a.length) return;[a[i], a[j]] = [a[j], a[i]]; put(a) }
  const edit = (i, k, label) => { const v = prompt(label, items[i][k] || ''); if (v !== null) put(items.map((x, j) => j === i ? { ...x, [k]: v } : x)) }
  const total = items.reduce((a, it) => a + secs(it.len), 0)
  return <>
    <ol>{items.map((it, i) => <li key={i} className={it.t === 'head' ? 'head' : ''}>
      <span>{it.t === 'song' && '♪ '}{it.label}{it.t === 'song' && <button className="pill" disabled={ro} onClick={() => edit(i, 'tono', 'Tono')}>{it.tono || '—'}</button>}</span>
      <span>{it.t !== 'head' && <small onClick={() => !ro && edit(i, 'len', 'Duración (m:ss)')}>{it.len || '0:00'}</small>}
        <span hidden={ro}><button onClick={() => mv(i, -1)}>↑</button><button onClick={() => mv(i, 1)}>↓</button><button className="peligro" onClick={() => put(items.filter((_, k) => k !== i))}>✕</button></span></span>
    </li>)}</ol>
    {!items.length && <p className="vacio">Plan vacío. Agrega canciones, encabezados u otros ítems.</p>}
    <p><strong>Duración total: {fmt(total)}</strong></p>
    <div className="row" hidden={ro}>
      <select value={t} onChange={e => setT(e.target.value)}><option value="song">Canción</option><option value="head">Encabezado</option><option value="read">Lectura</option><option value="ann">Anuncio</option></select>
      {t === 'song' ? <select value={sid} onChange={e => setSid(e.target.value)}><option value="">Elige canción</option>{songs.map(s => <option key={s.id} value={s.id}>{s.titulo}</option>)}</select>
        : <input style={{ width: 160, margin: 0 }} placeholder="Texto" value={txt} onChange={e => setTxt(e.target.value)} />}
      {t !== 'head' && <input style={{ width: 80, margin: 0 }} placeholder="m:ss" value={len} onChange={e => setLen(e.target.value)} />}
      <button onClick={add}>Agregar</button>
    </div>
  </>
}

function Equipos({ cid, plan, teams, ro }) {
  const [list, setList] = useState([]), [ms, setMs] = useState([]), [bl, setBl] = useState([]), [uid, setUid] = useState(''), [tm, setTm] = useState(''), [pos, setPos] = useState('')
  const col = n => collection(db, 'churches', cid, n), map = s => s.docs.map(d => ({ id: d.id, ...d.data() }))
  useEffect(() => onSnapshot(query(col('assignments'), where('planId', '==', plan.id)), s => setList(map(s)), () => { }), [cid, plan.id])
  useEffect(() => {
    if (ro) return
    const a = onSnapshot(col('members'), s => setMs(map(s).filter(m => m.rol !== 'pendiente')), () => { })
    const b = onSnapshot(query(col('blockouts'), where('fecha', '==', plan.fecha)), s => setBl(map(s)), () => { })
    return () => { a(); b() }
  }, [cid, plan.fecha, ro])
  const T = teams.find(x => x.nombre === tm)
  const add = async () => {
    const m = ms.find(x => x.id === uid)
    if (!m || !tm || !pos.trim()) return
    if (bl.some(b => b.uid === uid) && !confirm((m.nombre || m.email) + ' marcó que no está disponible ese día. ¿Asignar igual?')) return
    await addDoc(col('assignments'), { planId: plan.id, planTitulo: plan.titulo, fecha: plan.fecha, uid, nombre: m.nombre || m.email, equipo: tm, posicion: pos.trim(), estado: 'pendiente' })
    setPos('')
  }
  const cnt = (rows, e) => rows.filter(a => a.estado === e).length
  const column = (nombre, rows) => <div className="col" key={nombre}>
    <h3>{nombre}</h3><small>✓ {cnt(rows, 'aceptado')} · ✗ {cnt(rows, 'rechazado')} · ? {cnt(rows, 'pendiente')}</small>
    {[...new Set(rows.map(a => a.posicion))].map(p => <div key={p}><div className="pos">{p}</div>
      {rows.filter(a => a.posicion === p).map(a => <div className="who" key={a.id}><span>{a.nombre}</span>
        <span><span className={'est ' + a.estado}>{ICON[a.estado]}</span><button className="peligro sm" hidden={ro} onClick={() => deleteDoc(doc(db, 'churches', cid, 'assignments', a.id))}>✕</button></span></div>)}</div>)}
  </div>
  const share = () => {
    const txt = '*' + plan.titulo + '* (' + plan.fecha + ')\n' + (plan.items || []).map((it, i) => (i + 1) + '. ' + it.label + (it.tono ? ' (' + it.tono + ')' : '')).join('\n') + '\n\nEquipo:\n' + list.map(a => '• ' + a.nombre + ': ' + a.posicion).join('\n')
    window.open('https://wa.me/?text=' + encodeURIComponent(txt))
  }
  const otros = list.filter(a => !teams.some(x => x.nombre === a.equipo))
  return <>
    {!teams.length && <p className="vacio">Aún no hay equipos. Créalos en “Tipos de servicio y equipos”, arriba en Planes.</p>}
    <div className="cols">{teams.map(x => column(x.nombre, list.filter(a => a.equipo === x.nombre)))}{otros.length > 0 && column('Otros', otros)}</div>
    <div className="row" hidden={ro}>
      <select value={uid} onChange={e => setUid(e.target.value)}><option value="">Persona</option>{ms.map(m => <option key={m.id} value={m.id}>{m.nombre || m.email}</option>)}</select>
      <select value={tm} onChange={e => { setTm(e.target.value); setPos('') }}><option value="">Equipo</option>{teams.map(x => <option key={x.id}>{x.nombre}</option>)}</select>
      <input list="pos" style={{ width: 140, margin: 0 }} placeholder="Posición" value={pos} onChange={e => setPos(e.target.value)} />
      <datalist id="pos">{(T?.posiciones || []).map(p => <option key={p} value={p} />)}</datalist>
      <button onClick={add}>Asignar</button>
    </div>
    <div className="row"><button className="ghost" onClick={share}>Compartir por WhatsApp</button></div>
  </>
}

function Plan({ cid, plan, songs, teams, ro }) {
  const [tab, setTab] = useState('orden'), [nt, setNt] = useState(plan.notas || '')
  return <div>
    <nav className="tabs2">{[['orden', 'Orden'], ['eq', 'Equipos'], ['ens', 'Ensayo']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</nav>
    {tab === 'orden' && <Orden cid={cid} plan={plan} songs={songs} ro={ro} />}
    {tab === 'eq' && <Equipos cid={cid} plan={plan} teams={teams} ro={ro} />}
    {tab === 'ens' && <><h2>Notas de ensayo</h2><textarea rows="8" disabled={ro} placeholder="Notas para el equipo…" value={nt} onChange={e => setNt(e.target.value)} onBlur={() => updateDoc(doc(db, 'churches', cid, 'plans', plan.id), { notas: nt })} /></>}
    <button className="peligro" hidden={ro} onClick={() => confirm('¿Eliminar este plan?') && deleteDoc(doc(db, 'churches', cid, 'plans', plan.id))}>Eliminar plan</button>
  </div>
}

export function Plans({ cid, ro }) {
  const plans = useCol(cid, 'plans', 'fecha'), songs = useCol(cid, 'songs', 'titulo'), types = useCol(cid, 'serviceTypes', 'nombre'), teams = useCol(cid, 'teams', 'nombre')
  const [f, setF] = useState({ titulo: '', fecha: '', tipo: '' }), [sel, setSel] = useState(null), [past, setPast] = useState(false), [day, setDay] = useState(''), [open, setOpen] = useState('')
  const [adding, setAdding] = useState(false), [cfg, setCfg] = useState(false), [nt, setNt] = useState(''), [tn, setTn] = useState(''), [tp, setTp] = useState('')
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const hoy = new Date().toISOString().slice(0, 10), y = mes.getFullYear(), mo = mes.getMonth()
  const ds = d => y + '-' + String(mo + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0')
  const cells = [...Array(mes.getDay()).fill(null), ...Array.from({ length: new Date(y, mo + 1, 0).getDate() }, (_, i) => i + 1)]
  const prox = plans.filter(p => day ? p.fecha === day : p.fecha >= hoy).slice(0, 8)
  const cur = plans.find(p => p.id === sel)
  const create = async e => { e.preventDefault(); await addDoc(collection(db, 'churches', cid, 'plans'), { ...f, items: [] }); setF({ ...f, titulo: '', fecha: '' }); setAdding(false) }
  if (cur) return <>
    <button className="ghost sm" onClick={() => setSel(null)}>← Planes</button>
    <small className="crumb">{cur.tipo}</small><h1 style={{ margin: 0, fontWeight: 500 }}>{cur.titulo}</h1><div className="datepill">{cur.fecha}</div>
    <Plan cid={cid} plan={cur} songs={songs} teams={teams} ro={ro} />
  </>
  return <>
    <div className="pagehead"><h1>Planes</h1><span><button className="ghost" hidden={ro} onClick={() => setCfg(!cfg)}>Ajustes</button><button hidden={ro} onClick={() => setAdding(!adding)}>Agregar plan</button></span></div>
    {cfg && !ro && <div className="card"><h2 style={{ marginTop: 0 }}>Tipos de servicio y equipos</h2>
      <form onSubmit={async e => { e.preventDefault(); await addDoc(collection(db, 'churches', cid, 'serviceTypes'), { nombre: nt }); setNt('') }}>
        <input required placeholder="Nuevo tipo (ej. Domingo 11AM)" value={nt} onChange={e => setNt(e.target.value)} /><button>Agregar tipo</button></form>
      <div>{types.map(x => <span className="pill" key={x.id}>{x.nombre}</span>)}</div>
      <form onSubmit={async e => { e.preventDefault(); await addDoc(collection(db, 'churches', cid, 'teams'), { nombre: tn, posiciones: tp.split(',').map(s => s.trim()).filter(Boolean) }); setTn(''); setTp('') }}>
        <input required placeholder="Equipo (ej. Banda)" value={tn} onChange={e => setTn(e.target.value)} />
        <input placeholder="Posiciones separadas por coma: Bajo, Batería, Voz" value={tp} onChange={e => setTp(e.target.value)} /><button>Agregar equipo</button></form>
      {teams.map(x => <div className="row" key={x.id}><strong>{x.nombre}</strong><small>{(x.posiciones || []).join(', ')}</small>
        <button className="peligro sm" onClick={() => confirm('¿Eliminar este equipo?') && deleteDoc(doc(db, 'churches', cid, 'teams', x.id))}>✕</button></div>)}</div>}
    {adding && !ro && <form onSubmit={create}><h2 style={{ marginTop: 0 }}>Nuevo plan</h2>
      <select required value={f.tipo} onChange={e => setF({ ...f, tipo: e.target.value })} style={{ width: '100%', marginBottom: 8 }}><option value="">Tipo de servicio</option>{types.map(x => <option key={x.id}>{x.nombre}</option>)}</select>
      <input required placeholder="Título (ej. Culto domingo)" value={f.titulo} onChange={e => setF({ ...f, titulo: e.target.value })} />
      <input required type="date" value={f.fecha} onChange={e => setF({ ...f, fecha: e.target.value })} /><button>Crear plan</button></form>}
    <div className="split">
      <aside>
        <div className="calhead"><b style={{ textTransform: 'capitalize' }}>{mes.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}</b>
          <span><button className="ghost sm" onClick={() => setMes(new Date(y, mo - 1, 1))}>‹</button><button className="ghost sm" onClick={() => setMes(new Date(y, mo + 1, 1))}>›</button></span></div>
        <div className="cal">{['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <i key={i} className="dow">{d}</i>)}
          {cells.map((d, i) => d ? <button key={i} className={'day' + (plans.some(p => p.fecha === ds(d)) ? ' has' : '') + (ds(d) === hoy ? ' today' : '') + (day === ds(d) ? ' sel' : '')} onClick={() => setDay(day === ds(d) ? '' : ds(d))}>{d}</button> : <i key={i} />)}</div>
        <h2>{day ? 'Servicios del ' + day : 'Próximos servicios'}</h2>
        {!prox.length && <p className="vacio">Sin servicios.</p>}
        {prox.map(p => <button className="up" key={p.id} onClick={() => setSel(p.id)}><b style={{ display: 'inline' }}>{p.titulo}</b><small>{p.fecha} · {p.tipo}</small></button>)}
      </aside>
      <section>
        <div className="calhead"><h2 style={{ margin: 0 }}>Tipos de servicio</h2><label><input type="checkbox" style={{ width: 'auto', margin: '0 6px 0 0' }} checked={past} onChange={e => setPast(e.target.checked)} />Ver pasados</label></div>
        {!types.length && <p className="vacio">Aún no hay tipos de servicio. Crea el primero en “Ajustes”.</p>}
        {types.map(x => { const ps = plans.filter(p => p.tipo === x.nombre && (past || p.fecha >= hoy)); return <div className="acc" key={x.id}>
          <button className="acch" onClick={() => setOpen(open === x.id ? '' : x.id)}><span>{open === x.id ? '▾' : '▸'} {x.nombre}</span><small>{ps.length}</small></button>
          {open === x.id && (ps.length ? ps.map(p => <button className="up" key={p.id} onClick={() => setSel(p.id)}>{p.fecha} — {p.titulo}</button>) : <p className="vacio">Sin planes.</p>)}</div> })}
      </section>
    </div>
  </>
}
