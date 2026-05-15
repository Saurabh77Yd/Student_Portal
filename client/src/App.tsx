import React, { useState } from "react";
import LoginForm from "./components/LoginForm";
import StudentForm, { type StudentFormData } from "./components/StudentForm";
import StudentList from "./components/StudentList";

type EditPayload = { id: string } & StudentFormData;

const App: React.FC = () => {
  const [userId, setUserId]         = useState<string | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [editStudent, setEditStudent] = useState<EditPayload | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleLoginSuccess(id: string) { setUserId(id); }

  function handleLogout() {
    setUserId(null);
    setShowForm(false);
    setEditStudent(undefined);
  }

  function handleSuccess() {
    setShowForm(false);
    setEditStudent(undefined);
    setRefreshKey((k) => k + 1); // trigger list refresh
  }

  function handleEdit(student: EditPayload) {
    setEditStudent(student);
    setShowForm(true);
  }

  function handleOpenCreate() {
    setEditStudent(undefined);
    setShowForm(true);
  }

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!userId) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Top nav */}
      <header style={styles.nav}>
        <div style={styles.navBrand}>
          <div style={styles.navIcon}>🎓</div>
          <span style={styles.navTitle}>Student Portal</span>
        </div>
        <div style={styles.navRight}>
          <span style={styles.encTag}>🔒 AES Encrypted</span>
          <button onClick={handleOpenCreate} style={styles.addBtn}>+ Add Student</button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      {/* Main content */}
      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Student Management</h1>
          <p style={styles.pageSubtitle}>
            All data is double-encrypted — frontend (AES) + backend (AES-256-CBC)
          </p>
        </div>

        <StudentList onEdit={handleEdit} refreshKey={refreshKey} />
      </main>

      {/* Modal form */}
      {showForm && (
        <StudentForm
          editStudent={editStudent}
          onSuccess={handleSuccess}
          onCancel={() => { setShowForm(false); setEditStudent(undefined); }}
        />
      )}

      {/* Spinner keyframe injected globally */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; background: #0f172a; }
        input, select, textarea { font-family: inherit; }
        input::placeholder { color: #475569; }
        table tr:hover { background: rgba(255,255,255,0.02); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>
    </div>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#f1f5f9",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 32px",
    height: 64,
    background: "#1e293b",
    borderBottom: "1px solid #334155",
    position: "sticky",
    top: 0,
    zIndex: 100,
    flexWrap: "wrap",
    gap: 12,
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  navIcon: {
    fontSize: 24,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: -0.3,
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  encTag: {
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.25)",
    borderRadius: 20,
    color: "#34d399",
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 12px",
  },
  addBtn: {
    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    padding: "8px 20px",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #475569",
    borderRadius: 10,
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    padding: "8px 16px",
  },
  main: {
    maxWidth: 1300,
    margin: "0 auto",
    padding: "40px 24px",
  },
  pageHeader: {
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    margin: "0 0 8px",
    color: "#f1f5f9",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#64748b",
    margin: 0,
  },
};

export default App;