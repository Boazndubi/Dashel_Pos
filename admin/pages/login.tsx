"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
  Check,
} from "lucide-react"

const RECEIPT_LINES = [
  { icon: ShoppingCart, label: "SALES TERMINAL" },
  { icon: Package, label: "INVENTORY SYNC" },
  { icon: Receipt, label: "ORDER QUEUE" },
  { icon: BarChart3, label: "ANALYTICS FEED" },
]

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || "Invalid email or password")
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      router.replace("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .login-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          background: #090c14;
          font-family: 'Inter', sans-serif;
        }
        @media (max-width: 900px) {
          .login-shell { grid-template-columns: 1fr; }
          .login-visual { display: none; }
        }

        /* ── Left: signature receipt panel ── */
        .login-visual {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 20% 15%, rgba(79,140,255,0.14), transparent 45%),
            radial-gradient(circle at 80% 85%, rgba(52,211,153,0.12), transparent 50%),
            #0a0e1a;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 4rem 3.5rem;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .brand-mark {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 1.75rem;
          color: #f5f6f8;
          letter-spacing: -0.02em;
          margin-bottom: 0.4rem;
        }
        .brand-mark span { color: #34d399; }
        .brand-sub {
          color: #7d879c;
          font-size: 0.9rem;
          margin-bottom: 3rem;
        }

        .receipt {
          background: #f3eee3;
          color: #1a1a1a;
          width: 320px;
          padding: 1.75rem 1.5rem 2rem;
          border-radius: 2px;
          box-shadow: 0 30px 60px -20px rgba(0,0,0,0.6);
          font-family: 'IBM Plex Mono', monospace;
          position: relative;
        }
        .receipt::before,
        .receipt::after {
          content: "";
          position: absolute;
          left: 0; right: 0;
          height: 10px;
          background:
            linear-gradient(135deg, #f3eee3 50%, transparent 50%) 0 0/10px 10px repeat-x,
            linear-gradient(-135deg, #f3eee3 50%, transparent 50%) 0 0/10px 10px repeat-x;
          background-color: #090c14;
        }
        .receipt::before { top: -10px; }
        .receipt::after { bottom: -10px; transform: rotate(180deg); }

        .receipt-head {
          text-align: center;
          border-bottom: 1px dashed #b8b0a0;
          padding-bottom: 0.85rem;
          margin-bottom: 0.85rem;
        }
        .receipt-head .txn {
          font-size: 0.68rem;
          color: #7a7264;
          letter-spacing: 0.06em;
        }
        .receipt-head .title {
          font-size: 0.95rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          margin-top: 0.3rem;
        }

        .receipt-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.55rem 0;
          font-size: 0.78rem;
          letter-spacing: 0.03em;
          opacity: 0;
          animation: printLine 0.5s ease forwards;
        }
        .receipt-row .icon-box {
          width: 20px; height: 20px;
          display: flex; align-items: center; justify-content: center;
          color: #4a4438;
          flex-shrink: 0;
        }
        .receipt-row .status {
          margin-left: auto;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #d7f7e6;
          color: #16a34a;
          display: flex; align-items: center; justify-content: center;
          opacity: 0;
          animation: checkIn 0.3s ease forwards;
        }
        .receipt-row:nth-child(1) { animation-delay: 0.3s; }
        .receipt-row:nth-child(2) { animation-delay: 0.7s; }
        .receipt-row:nth-child(3) { animation-delay: 1.1s; }
        .receipt-row:nth-child(4) { animation-delay: 1.5s; }
        .receipt-row:nth-child(1) .status { animation-delay: 0.75s; }
        .receipt-row:nth-child(2) .status { animation-delay: 1.15s; }
        .receipt-row:nth-child(3) .status { animation-delay: 1.55s; }
        .receipt-row:nth-child(4) .status { animation-delay: 1.95s; }

        .receipt-foot {
          border-top: 1px dashed #b8b0a0;
          margin-top: 0.6rem;
          padding-top: 0.75rem;
          font-size: 0.7rem;
          color: #7a7264;
          display: flex;
          justify-content: space-between;
        }

        @keyframes printLine {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkIn {
          from { opacity: 0; transform: scale(0.4); }
          to { opacity: 1; transform: scale(1); }
        }

        .visual-caption {
          margin-top: 3rem;
          color: #5c6579;
          font-size: 0.85rem;
          line-height: 1.6;
          max-width: 320px;
        }
        .visual-caption strong { color: #cdd3e0; font-weight: 500; }

        @media (prefers-reduced-motion: reduce) {
          .receipt-row, .receipt-row .status { animation: none; opacity: 1; }
        }

        /* ── Right: form panel ── */
        .login-form-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .login-form-card { width: 100%; max-width: 380px; }
        .form-heading {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 1.6rem;
          color: #f5f6f8;
          letter-spacing: -0.02em;
          margin-bottom: 0.3rem;
        }
        .form-sub {
          color: #7d879c;
          font-size: 0.88rem;
          margin-bottom: 2rem;
        }
        .field-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: #9aa2b4;
          margin-bottom: 0.4rem;
        }
        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 0.7rem 0.9rem;
          color: #f0f1f4;
          font-size: 0.92rem;
          transition: border-color 150ms ease, background 150ms ease;
        }
        .field-input::placeholder { color: #545c6e; }
        .field-input:focus {
          outline: none;
          border-color: #4f8cff;
          background: rgba(79,140,255,0.06);
          box-shadow: 0 0 0 3px rgba(79,140,255,0.15);
        }
        .field-input:disabled { opacity: 0.5; }

        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #34d399, #22b17f);
          color: #06251a;
          font-weight: 600;
          font-size: 0.92rem;
          padding: 0.75rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: filter 150ms ease, transform 150ms ease;
        }
        .submit-btn:hover:not(:disabled) { filter: brightness(1.08); }
        .submit-btn:active:not(:disabled) { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .submit-btn:focus-visible {
          outline: 2px solid #34d399;
          outline-offset: 2px;
        }
      `}</style>

      {/* Left signature panel */}
      <div className="login-visual" aria-hidden="true">
        <div className="brand-mark">
          Dashel<span>POS</span>
        </div>
        <div className="brand-sub">System Administration</div>

        <div className="receipt">
          <div className="receipt-head">
            <div className="txn">TXN #DP-{new Date().getFullYear()}-0417</div>
            <div className="title">SYSTEM CHECK</div>
          </div>

          {RECEIPT_LINES.map(({ icon: Icon, label }) => (
            <div className="receipt-row" key={label}>
              <span className="icon-box">
                <Icon size={14} strokeWidth={2} />
              </span>
              <span>{label}</span>
              <span className="status">
                <Check size={10} strokeWidth={3} />
              </span>
            </div>
          ))}

          <div className="receipt-foot">
            <span>ALL SYSTEMS</span>
            <span>ONLINE</span>
          </div>
        </div>

        <p className="visual-caption">
          <strong>One dashboard</strong> for every till — sales, stock, orders
          and reports, synced in real time.
        </p>
      </div>

      {/* Right login form panel */}
      <div className="login-form-panel">
        <div className="login-form-card">
          <div className="form-heading">Welcome back</div>
          <p className="form-sub">Sign in to the Dashel POS admin console.</p>

          {error && (
            <div
              role="alert"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.35)",
                color: "#fca5a5",
              }}
              className="px-4 py-3 rounded-lg mb-4 text-sm"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="field-input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="field-label" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <a href="/forgot-password" className="text-xs" style={{ color: "#4f8cff" }}>
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="field-input"
                  style={{ paddingRight: "2.75rem" }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#7d879c", display: "flex", minWidth: 24, minHeight: 24, alignItems: "center", justifyContent: "center" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading && (
                <span
                  style={{
                    height: 14,
                    width: 14,
                    border: "2px solid rgba(6,37,26,0.35)",
                    borderTopColor: "#06251a",
                    borderRadius: "50%",
                  }}
                  className="animate-spin"
                />
              )}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}