import React, { useState, useEffect, useCallback } from "react";
import { decryptData } from "../utils/crypto";
import type { StudentFormData } from "./StudentForm";

export interface RawStudent {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  courseEnrolled: string;
  createdAt: string;
  updatedAt: string;
}

export interface DecryptedStudent {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  courseEnrolled: string;
  createdAt: string;
}

interface StudentListProps {
  onEdit: (student: { id: string } & StudentFormData) => void;
  refreshKey: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const StudentList: React.FC<StudentListProps> = ({ onEdit, refreshKey }) => {
  const [students, setStudents]   = useState<DecryptedStudent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  // ── Fetch & decrypt students ──────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/students`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to load students");
        return;
      }

      // Backend sends FE-encrypted data → decrypt each field here
      const decrypted: DecryptedStudent[] = (data.data as RawStudent[]).map((s) => ({
        id:             s._id,
        fullName:       decryptData(s.fullName),
        email:          decryptData(s.email),
        phoneNumber:    decryptData(s.phoneNumber),
        dateOfBirth:    decryptData(s.dateOfBirth),
        gender:         decryptData(s.gender),
        address:        decryptData(s.address),
        courseEnrolled: decryptData(s.courseEnrolled),
        createdAt:      s.createdAt,
      }));

      setStudents(decrypted);
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents, refreshKey]);

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res  = await fetch(`${API_BASE}/student/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert(data.message || "Delete failed");
      }
    } catch {
      alert("Network error during delete");
    } finally {
      setDeleting(null);
      setConfirmDel(null);
    }
  }

  // ── Edit handler ──────────────────────────────────────────────────────────
  function handleEdit(s: DecryptedStudent) {
    onEdit({
      id:             s.id,
      fullName:       s.fullName,
      email:          s.email,
      phoneNumber:    s.phoneNumber,
      dateOfBirth:    s.dateOfBirth,
      gender:         s.gender,
      address:        s.address,
      courseEnrolled: s.courseEnrolled,
      password:       "",
    });
  }

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.courseEnrolled.toLowerCase().includes(q)
    );
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by name, email or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.badge}>{filtered.length} student{filtered.length !== 1 ? "s" : ""}</div>
      </div>

      {/* States */}
      {loading && (
        <div style={styles.centered}>
          <div style={styles.spinner} />
          <p style={{ color: "#64748b", marginTop: 16 }}>Loading students...</p>
        </div>
      )}

      {!loading && error && (
        <div style={styles.errorBox}>
          <p style={{ margin: 0 }}> {error}</p>
          <button onClick={fetchStudents} style={styles.retryBtn}>Retry</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={styles.centered}>
          <p style={{ color: "#475569", fontSize: 48, margin: 0 }}>🎓</p>
          <p style={{ color: "#64748b", marginTop: 8 }}>
            {search ? "No students match your search" : "No students registered yet"}
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["#", "Full Name", "Email", "Phone", "DOB", "Gender", "Course", "Address", "Actions"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr key={s.id} style={styles.tr}>
                  <td style={styles.td}>{idx + 1}</td>
                  <td style={{ ...styles.td, fontWeight: 600, color: "#e2e8f0" }}>{s.fullName}</td>
                  <td style={styles.td}>{s.email}</td>
                  <td style={styles.td}>{s.phoneNumber}</td>
                  <td style={styles.td}>{s.dateOfBirth}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.genderBadge,
                      background: s.gender === "Male" ? "rgba(59,130,246,0.15)"
                        : s.gender === "Female" ? "rgba(236,72,153,0.15)"
                        : "rgba(148,163,184,0.15)",
                      color: s.gender === "Male" ? "#60a5fa"
                        : s.gender === "Female" ? "#f472b6"
                        : "#94a3b8",
                    }}>
                      {s.gender}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.courseBadge}>{s.courseEnrolled}</span>
                  </td>
                  <td style={{ ...styles.td, maxWidth: 160 }}>
                    <span title={s.address} style={styles.addressText}>{s.address}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionBtns}>
                      {/* Edit */}
                      <button onClick={() => handleEdit(s)} style={styles.editBtn} title="Edit">✏️</button>

                      {/* Delete / Confirm */}
                      {confirmDel === s.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(s.id)}
                            style={styles.confirmBtn}
                            disabled={deleting === s.id}
                          >
                            {deleting === s.id ? "..." : "✓"}
                          </button>
                          <button onClick={() => setConfirmDel(null)} style={styles.cancelDelBtn}>✕</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDel(s.id)} style={styles.deleteBtn} title="Delete">🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  searchWrap: {
    position: "relative",
    flex: 1,
    minWidth: 220,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 14,
  },
  searchInput: {
    width: "100%",
    padding: "10px 14px 10px 36px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    color: "#f1f5f9",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  badge: {
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.3)",
    color: "#818cf8",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  centered: {
    textAlign: "center",
    padding: "60px 0",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #334155",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto",
  },
  errorBox: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 12,
    padding: "20px 24px",
    color: "#f87171",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  retryBtn: {
    background: "rgba(239,68,68,0.2)",
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 8,
    color: "#f87171",
    cursor: "pointer",
    padding: "6px 16px",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  tableWrap: {
    overflowX: "auto",
    borderRadius: 14,
    border: "1px solid #334155",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
    minWidth: 900,
  },
  th: {
    background: "#0f172a",
    color: "#64748b",
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    padding: "14px 16px",
    textAlign: "left",
    borderBottom: "1px solid #334155",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #1e293b",
  },
  td: {
    color: "#94a3b8",
    padding: "14px 16px",
    verticalAlign: "middle",
  },
  genderBadge: {
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  courseBadge: {
    background: "rgba(16,185,129,0.1)",
    color: "#34d399",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  addressText: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 160,
  },
  actionBtns: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  editBtn: {
    background: "rgba(59,130,246,0.15)",
    border: "1px solid rgba(59,130,246,0.3)",
    borderRadius: 8,
    cursor: "pointer",
    padding: "6px 10px",
    fontSize: 13,
  },
  deleteBtn: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 8,
    cursor: "pointer",
    padding: "6px 10px",
    fontSize: 13,
  },
  confirmBtn: {
    background: "rgba(239,68,68,0.25)",
    border: "1px solid rgba(239,68,68,0.5)",
    borderRadius: 8,
    color: "#f87171",
    cursor: "pointer",
    padding: "6px 10px",
    fontSize: 13,
    fontWeight: 700,
  },
  cancelDelBtn: {
    background: "rgba(148,163,184,0.1)",
    border: "1px solid #475569",
    borderRadius: 8,
    color: "#94a3b8",
    cursor: "pointer",
    padding: "6px 10px",
    fontSize: 13,
  },
};

export default StudentList;