import React, { useState } from "react";
import { encryptData } from "../utils/crypto";

interface LoginFormProps {
  onLoginSuccess: (id: string) => void;
}

interface LoginFields {
  email: string;
  password: string;
}

interface RegisterFields {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  courseEnrolled: string;
  password: string;
  confirmPassword: string;
}

type LoginErrors    = Partial<LoginFields>;
type RegisterErrors = Partial<RegisterFields>;

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const COURSES = [
  "Computer Science", "Data Science", "Information Technology",
  "Electronics Engineering", "Mechanical Engineering", "Civil Engineering",
  "Business Administration", "Medicine", "Law", "Architecture",
];

const EMPTY_LOGIN: LoginFields = { email: "", password: "" };

const EMPTY_REGISTER: RegisterFields = {
  fullName: "", email: "", phoneNumber: "", dateOfBirth: "",
  gender: "", address: "", courseEnrolled: "", password: "", confirmPassword: "",
};

// ─────────────────────────────────────────────────────────────────────────────

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<"login" | "register">("login");

  // ── Login state ────────────────────────────────────────────────────────────
  const [loginForm, setLoginForm]       = useState<LoginFields>(EMPTY_LOGIN);
  const [loginErrors, setLoginErrors]   = useState<LoginErrors>({});
  const [loginApiErr, setLoginApiErr]   = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  // ── Register state ─────────────────────────────────────────────────────────
  const [regForm, setRegForm]           = useState<RegisterFields>(EMPTY_REGISTER);
  const [regErrors, setRegErrors]       = useState<RegisterErrors>({});
  const [regApiErr, setRegApiErr]       = useState("");
  const [regLoading, setRegLoading]     = useState(false);
  const [regSuccess, setRegSuccess]     = useState(false);
  const [showRegPass, setShowRegPass]   = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);

  // ── Tab switch ─────────────────────────────────────────────────────────────
  function switchTab(t: "login" | "register") {
    setTab(t);
    setLoginApiErr(""); setRegApiErr(""); setRegSuccess(false);
    setLoginErrors({}); setRegErrors({});
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  LOGIN LOGIC
  // ══════════════════════════════════════════════════════════════════════════
  function validateLogin(): boolean {
    const e: LoginErrors = {};
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!loginForm.email.trim())             e.email    = "Email is required";
    else if (!emailRx.test(loginForm.email)) e.email    = "Enter a valid email";
    if (!loginForm.password)                 e.password = "Password is required";
    else if (loginForm.password.length < 6)  e.password = "Minimum 6 characters";
    setLoginErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginApiErr("");
    if (!validateLogin()) return;
    setLoginLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:    encryptData(loginForm.email),
          password: encryptData(loginForm.password),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setLoginApiErr(data.message || "Login failed"); return; }
      onLoginSuccess(data.data.id);
    } catch {
      setLoginApiErr("Network error. Is the server running?");
    } finally {
      setLoginLoading(false);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  REGISTER LOGIC
  // ══════════════════════════════════════════════════════════════════════════
  function validateRegister(): boolean {
    const e: RegisterErrors = {};
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRx = /^[6-9]\d{9}$/;

    if (!regForm.fullName.trim()) e.fullName = "Full name is required";
    if (!regForm.email.trim()) e.email = "Email is required";
    else if (!emailRx.test(regForm.email)) e.email = "Enter a valid email";
    if (!regForm.phoneNumber.trim()) e.phoneNumber = "Phone is required";
    else if (!phoneRx.test(regForm.phoneNumber)) e.phoneNumber = "Enter valid 10-digit phone";
    if (!regForm.dateOfBirth) e.dateOfBirth = "Date of birth is required";
    if (!regForm.gender) e.gender = "Gender is required";
    if (!regForm.address.trim()) e.address = "Address is required";
    if (!regForm.courseEnrolled) e.courseEnrolled = "Course is required";
    if (!regForm.password) e.password = "Password is required";
    else if (regForm.password.length < 6) e.password = "Minimum 6 characters";
    if (!regForm.confirmPassword) e.confirmPassword = "Please confirm password";
    else if (regForm.password !== regForm.confirmPassword)  e.confirmPassword = "Passwords do not match";
    setRegErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegApiErr("");
    if (!validateRegister()) return;
    setRegLoading(true);
    try {
      const { confirmPassword: _skip, ...rest } = regForm;
      const payload: Record<string, string> = {};
      for (const [k, v] of Object.entries(rest)) payload[k] = encryptData(v);

      const res  = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setRegApiErr(data.message || "Registration failed"); return; }

      setRegSuccess(true);
      setRegForm(EMPTY_REGISTER);
      setTimeout(() => { switchTab("login"); setRegSuccess(false); }, 2200);
    } catch {
      setRegApiErr("Network error. Is the server running?");
    } finally {
      setRegLoading(false);
    }
  }

  function handleRegChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setRegForm((p) => ({ ...p, [name]: value }));
    setRegErrors((p) => ({ ...p, [name]: "" }));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.wrapper}>
      <div style={S.card}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.iconWrap}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h1 style={S.headerTitle}>Student Portal</h1>
          <p style={S.headerSub}>Manage your academic journey</p>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div style={S.tabBar}>
          <button
            type="button"
            onClick={() => switchTab("login")}
            style={{ ...S.tabBtn, ...(tab === "login" ? S.tabActive : S.tabInactive) }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchTab("register")}
            style={{ ...S.tabBtn, ...(tab === "register" ? S.tabActive : S.tabInactive) }}
          >
            Register
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            LOGIN FORM
        ════════════════════════════════════════════════════════════════ */}
        {tab === "login" && (
          <form onSubmit={handleLogin} style={S.form} noValidate>
            {loginApiErr && <div style={S.apiError}>{loginApiErr}</div>}

            {/* Email */}
            <div style={S.fieldGroup}>
              <label style={S.label}>Email Address</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => {
                  setLoginForm((p) => ({ ...p, email: e.target.value }));
                  setLoginErrors((p) => ({ ...p, email: "" }));
                }}
                placeholder="you@example.com"
                style={{ ...S.input, ...(loginErrors.email ? S.inputErr : {}) }}
                autoComplete="email"
              />
              {loginErrors.email && <span style={S.errMsg}>{loginErrors.email}</span>}
            </div>

            {/* Password */}
            <div style={S.fieldGroup}>
              <label style={S.label}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showLoginPass ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) => {
                    setLoginForm((p) => ({ ...p, password: e.target.value }));
                    setLoginErrors((p) => ({ ...p, password: "" }));
                  }}
                  placeholder="••••••••"
                  style={{ ...S.input, ...(loginErrors.password ? S.inputErr : {}), paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowLoginPass(!showLoginPass)} style={S.eyeBtn}>
                  {showLoginPass ? "🙈" : "👁️"}
                </button>
              </div>
              {loginErrors.password && <span style={S.errMsg}>{loginErrors.password}</span>}
            </div>

            <button type="submit" style={S.submitBtn} disabled={loginLoading}>
              {loginLoading && <span style={S.spinner} />}
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>

            <p style={S.switchHint}>
              Don't have an account?{" "}
              <span onClick={() => switchTab("register")} style={S.switchLink}>Register here</span>
            </p>
          </form>
        )}

        {/* ════════════════════════════════════════════════════════════════
            REGISTER FORM
        ════════════════════════════════════════════════════════════════ */}
        {tab === "register" && (
          <form onSubmit={handleRegister} style={S.form} noValidate>
            {regApiErr  && <div style={S.apiError}>{regApiErr}</div>}
            {regSuccess && (
              <div style={S.successBox}>
                Account created successfully! Redirecting to login...
              </div>
            )}

            {/* Row 1 — Full Name + Email */}
            <div style={S.row}>
              <div style={S.fieldGroup}>
                <label style={S.label}>Full Name <Req /></label>
                <input name="fullName" value={regForm.fullName} onChange={handleRegChange}
                  placeholder="John Doe"
                  style={{ ...S.input, ...(regErrors.fullName ? S.inputErr : {}) }} />
                {regErrors.fullName && <span style={S.errMsg}>{regErrors.fullName}</span>}
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Email Address <Req /></label>
                <input name="email" type="email" value={regForm.email} onChange={handleRegChange}
                  placeholder="john@example.com"
                  style={{ ...S.input, ...(regErrors.email ? S.inputErr : {}) }} />
                {regErrors.email && <span style={S.errMsg}>{regErrors.email}</span>}
              </div>
            </div>

            {/* Row 2 — Phone + DOB */}
            <div style={S.row}>
              <div style={S.fieldGroup}>
                <label style={S.label}>Phone Number <Req /></label>
                <input name="phoneNumber" value={regForm.phoneNumber} onChange={handleRegChange}
                  placeholder="9876543210"
                  style={{ ...S.input, ...(regErrors.phoneNumber ? S.inputErr : {}) }} />
                {regErrors.phoneNumber && <span style={S.errMsg}>{regErrors.phoneNumber}</span>}
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Date of Birth <Req /></label>
                <input name="dateOfBirth" type="date" value={regForm.dateOfBirth}
                  onChange={handleRegChange}
                  style={{ ...S.input, ...(regErrors.dateOfBirth ? S.inputErr : {}) }} />
                {regErrors.dateOfBirth && <span style={S.errMsg}>{regErrors.dateOfBirth}</span>}
              </div>
            </div>

            {/* Row 3 — Gender + Course */}
            <div style={S.row}>
              <div style={S.fieldGroup}>
                <label style={S.label}>Gender <Req /></label>
                <select name="gender" value={regForm.gender} onChange={handleRegChange}
                  style={{ ...S.input, ...(regErrors.gender ? S.inputErr : {}) }}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {regErrors.gender && <span style={S.errMsg}>{regErrors.gender}</span>}
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Course Enrolled <Req /></label>
                <select name="courseEnrolled" value={regForm.courseEnrolled} onChange={handleRegChange}
                  style={{ ...S.input, ...(regErrors.courseEnrolled ? S.inputErr : {}) }}>
                  <option value="">Select Course</option>
                  {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {regErrors.courseEnrolled && <span style={S.errMsg}>{regErrors.courseEnrolled}</span>}
              </div>
            </div>

            {/* Address */}
            <div style={S.fieldGroup}>
              <label style={S.label}>Address <Req /></label>
              <textarea name="address" value={regForm.address} onChange={handleRegChange}
                placeholder="123 Main St, City, State" rows={2}
                style={{ ...S.input, ...(regErrors.address ? S.inputErr : {}), resize: "vertical" }} />
              {regErrors.address && <span style={S.errMsg}>{regErrors.address}</span>}
            </div>

            {/* Row 4 — Password + Confirm */}
            <div style={S.row}>
              <div style={S.fieldGroup}>
                <label style={S.label}>Password <Req /></label>
                <div style={{ position: "relative" }}>
                  <input name="password" type={showRegPass ? "text" : "password"}
                    value={regForm.password} onChange={handleRegChange}
                    placeholder="Min 6 characters"
                    style={{ ...S.input, ...(regErrors.password ? S.inputErr : {}), paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowRegPass(!showRegPass)} style={S.eyeBtn}>
                    {showRegPass ? "🙈" : "👁️"}
                  </button>
                </div>
                {regErrors.password && <span style={S.errMsg}>{regErrors.password}</span>}
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Confirm Password <Req /></label>
                <div style={{ position: "relative" }}>
                  <input name="confirmPassword" type={showConfPass ? "text" : "password"}
                    value={regForm.confirmPassword} onChange={handleRegChange}
                    placeholder="Re-enter password"
                    style={{ ...S.input, ...(regErrors.confirmPassword ? S.inputErr : {}), paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowConfPass(!showConfPass)} style={S.eyeBtn}>
                    {showConfPass ? "🙈" : "👁️"}
                  </button>
                </div>
                {regErrors.confirmPassword && <span style={S.errMsg}>{regErrors.confirmPassword}</span>}
              </div>
            </div>

            <button type="submit" style={S.submitBtn} disabled={regLoading}>
              {regLoading && <span style={S.spinner} />}
              {regLoading ? "Creating account..." : "Create Account"}
            </button>

            <p style={S.switchHint}>
              Already have an account?{" "}
              <span onClick={() => switchTab("login")} style={S.switchLink}>Sign in here</span>
            </p>
          </form>
        )}

        <p style={S.encNote}>All data encrypted with AES before transmission</p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        input::placeholder, textarea::placeholder { color: #475569; }
        input:focus, select:focus, textarea:focus {
          border-color: #6366f1 !important;
          outline: none;
        }
      `}</style>
    </div>
  );
};

// ── Small required asterisk ──────────────────────────────────────────────────
const Req = () => <span style={{ color: "#f87171" }}>*</span>;

// ── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: "24px 16px",
  },
  card: {
    width: "100%",
    maxWidth: 700,
    background: "#1e293b",
    borderRadius: 24,
    border: "1px solid #334155",
    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
    overflow: "hidden",
  },

  // Header
  header: {
    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    padding: "30px 40px 26px",
    textAlign: "center",
  },
  iconWrap: {
    width: 58, height: 58, borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 12px",
  },
  headerTitle: {
    color: "#fff", fontSize: 24, fontWeight: 700,
    margin: "0 0 5px", letterSpacing: -0.5,
  },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0 },

  // Tabs
  tabBar: { display: "flex", borderBottom: "1px solid #334155", background: "#0f172a" },
  tabBtn: {
    flex: 1, padding: "15px",
    border: "none", cursor: "pointer",
    fontSize: 14, fontWeight: 700,
    transition: "all 0.2s", letterSpacing: 0.3,
    fontFamily: "inherit",
  },
  tabActive:   { background: "#1e293b", color: "#6366f1", borderBottom: "3px solid #6366f1" },
  tabInactive: { background: "#0f172a", color: "#475569", borderBottom: "3px solid transparent" },

  // Form
  form: { padding: "26px 36px 18px", display: "flex", flexDirection: "column", gap: 16 },
  row:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 5 },
  label: {
    color: "#94a3b8", fontSize: 11, fontWeight: 700,
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  input: {
    width: "100%", padding: "10px 13px",
    background: "#0f172a", border: "1px solid #334155",
    borderRadius: 10, color: "#f1f5f9", fontSize: 14,
    outline: "none", fontFamily: "inherit",
  },
  inputErr: { borderColor: "#ef4444" },
  errMsg:   { color: "#f87171", fontSize: 11 },
  eyeBtn: {
    position: "absolute", right: 11, top: "50%",
    transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer",
    fontSize: 14, padding: 0,
  },
  apiError: {
    background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 10, color: "#f87171",
    padding: "10px 14px", fontSize: 13, textAlign: "center",
  },
  successBox: {
    background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.4)",
    borderRadius: 10, color: "#34d399",
    padding: "10px 14px", fontSize: 13, textAlign: "center",
  },
  submitBtn: {
    marginTop: 4, padding: "13px",
    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
    border: "none", borderRadius: 10, color: "#fff",
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "inherit",
  },
  spinner: {
    width: 15, height: 15,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  switchHint: { textAlign: "center", color: "#64748b", fontSize: 13, margin: "2px 0 0" },
  switchLink: { color: "#6366f1", cursor: "pointer", fontWeight: 600, textDecoration: "underline" },
  encNote: { textAlign: "center", color: "#475569", fontSize: 12, margin: "0 0 18px" },
};

export default LoginForm;