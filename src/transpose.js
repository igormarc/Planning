const N = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const F = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
const isChord = c => /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|M|\d|[#b+°-]|\/[A-G][#b]?)*$/.test(c)
const shift = (c, n, flat) => c.replace(/[A-G][#b]?/g, m => {
  const i = N.indexOf(m) >= 0 ? N.indexOf(m) : F.indexOf(m)
  return i < 0 ? m : (flat ? F : N)[(i + n + 120) % 12]
})
export const transpose = (txt, n, flat) =>
  n ? txt.replace(/\[([^\]]+)\]/g, (s, c) => isChord(c) ? '[' + shift(c, n, flat) + ']' : s) : txt
