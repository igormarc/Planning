export const Logo = ({ s = 36, text = true }) => <span className="logo">
  <svg width={s} height={s} viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#d9480f" />
    <g fill="#fff"><rect x="11" y="10" width="4" height="28" rx="2" /><rect x="22" y="10" width="4" height="28" rx="2" /><rect x="33" y="10" width="4" height="28" rx="2" /></g>
    <g fill="#d9480f" stroke="#fff" strokeWidth="3"><circle cx="13" cy="32" r="4.5" /><circle cx="24" cy="18" r="4.5" /><circle cx="35" cy="27" r="4.5" /></g></svg>
  {text && <b>ConfigBand</b>}</span>
