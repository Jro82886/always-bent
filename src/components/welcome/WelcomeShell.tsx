export default function WelcomeShell() {
  return (
    <div className="abfi-card" style={{maxWidth:720, margin:'48px auto', padding:32}}>
      <h1 className="abfi-title">Welcome to ABFI</h1>
      <p className="abfi-copy">Pick your inlet and how you want to fish.</p>

      <div className="abfi-ghost" data-abfi="inlet-pill">Inlet: East Coast Overview ▾</div>
      <div style={{display:'grid', gap:12, marginTop:16}}>
        <button className="abfi-btn abfi-btn--blue"  data-abfi="join-community">Join Community</button>
        <button className="abfi-btn abfi-btn--green" data-abfi="solo-mode">Solo Mode</button>
        <button className="abfi-btn abfi-btn--green" data-abfi="take-tour">Take a Tour</button>
        <button className="abfi-btn" data-abfi="enter-abfi">Enter ABFI</button>
      </div>
    </div>
  );
}
