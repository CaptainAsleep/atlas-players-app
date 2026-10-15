import React from "react";

// Top-level safety net. Without this, any error thrown while rendering
// unmounts the whole React tree and the player is left staring at a white
// screen with no way to tell what happened. This catches it and shows a
// plain message with a reload button instead. Deliberately has no
// dependency on useTheme or anything else inside the app — it has to keep
// working even when the thing that broke is the app's own providers.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Atlas crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const message = String(this.state.error?.message || this.state.error || "Unknown error").slice(0, 300);
    return (
      <div className="atlas-eb">
        <style>{`
          .atlas-eb{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;
            background:#F4F6FA;color:#111827;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;text-align:center}
          .atlas-eb .card{max-width:340px}
          .atlas-eb h1{font-size:18px;font-weight:600;margin:0 0 8px}
          .atlas-eb p{font-size:13px;line-height:1.5;color:#4B5563;margin:0 0 16px}
          .atlas-eb button{border:0;border-radius:999px;padding:12px 24px;font-size:13px;font-weight:600;background:#1554B8;color:#fff;cursor:pointer}
          .atlas-eb code{display:block;margin-top:20px;font-size:10px;color:#9CA3AF;word-break:break-word}
          @media (prefers-color-scheme: dark){
            .atlas-eb{background:#0B1220;color:#E6EAF2}
            .atlas-eb p{color:#9AA4B5}
            .atlas-eb code{color:#5B6475}
          }
        `}</style>
        <div className="card">
          <h1>Something went wrong</h1>
          <p>Atlas hit an unexpected error. Reloading usually fixes it. If it keeps happening, let us know on Discord and include the note below.</p>
          <button onClick={() => window.location.reload()}>Reload Atlas</button>
          <code>{message}</code>
        </div>
      </div>
    );
  }
}
