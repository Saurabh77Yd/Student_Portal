import React, { useState, useEffect } from "react";
import { encryptData } from "../utils/crypto";

export interface StudentFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  courseEnrolled: string;
  password: string;
}

interface StudentFormProps {
  editStudent?: { id: string } & StudentFormData;
  onSuccess: () => void;
  onCancel: () => void;
}

type FormErrors = Partial<StudentFormData>;

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const COURSES = [
  "Computer Science",
  "Data Science",
  "Information Technology",
  "Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
  "Medicine",
  "Law",
  "Architecture",
];

const EMPTY_FORM: StudentFormData = {
  fullName: "", email: "", phoneNumber: "",
  dateOfBirth: "", gender: "", address: "",
  courseEnrolled: "", password: "",
};

const StudentForm: React.FC<StudentFormProps> = ({ editStudent, onSuccess, onCancel }) => {
  const isEdit = !!editStudent;

  const [form, setForm]         = useState<StudentFormData>(EMPTY_FORM);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editStudent) {
      const { id: _id, ...rest } = editStudent;
      setForm({ ...rest, password: "" }); 
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setApiError("");
  }, [editStudent]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: FormErrors = {};
    const phone = /^[6-9]\d{9}$/;
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.fullName.trim())        e.fullName       = "Full name is required";
    if (!form.email.trim())           e.email          = "Email is required";
    else if (!emailRx.test(form.email)) e.email        = "Enter a valid email";
    if (!form.phoneNumber.trim())     e.phoneNumber    = "Phone number is required";
    else if (!phone.test(form.phoneNumber)) e.phoneNumber = "Enter valid 10-digit phone";
    if (!form.dateOfBirth)            e.dateOfBirth    = "Date of birth is required";
    if (!form.gender)                 e.gender         = "Gender is required";
    if (!form.address.trim())         e.address        = "Address is required";
    if (!form.courseEnrolled)         e.courseEnrolled = "Course is required";
    if (!isEdit) {
      if (!form.password)             e.password       = "Password is required";
      else if (form.password.length < 6) e.password    = "Minimum 6 characters";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    setLoading(true);
    try {
      // Build payload — encrypt every field individually
      const plainPayload: Record<string, string> = {
        fullName:       form.fullName,
        email:          form.email,
        phoneNumber:    form.phoneNumber,
        dateOfBirth:    form.dateOfBirth,
        gender:         form.gender,
        address:        form.address,
        courseEnrolled: form.courseEnrolled,
      };
      if (!isEdit || form.password) plainPayload.password = form.password;

      const encrypted: Record<string, string> = {};
      for (const [key, value] of Object.entries(plainPayload)) {
        encrypted[key] = encryptData(value);
      }

      const url    = isEdit ? `${API_BASE}/student/${editStudent!.id}` : `${API_BASE}/register`;
      const method = isEdit ? "PUT" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(encrypted),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setApiError(data.message || "Something went wrong");
        return;
      }

      onSuccess();
    } catch {
      setApiError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  // ── Field renderer ────────────────────────────────────────────────────────
  const Field = ({
    label, name, type = "text", placeholder = "", required = true,
  }: {
    label: string; name: keyof StudentFormData;
    type?: string; placeholder?: string; required?: boolean;
  }) => (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}{required && <span style={{ color: "#f87171" }}> *</span>}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ ...styles.input, ...(errors[name] ? styles.inputError : {}) }}
      />
      {errors[name] && <span style={styles.errorMsg}>{errors[name]}</span>}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {isEdit ? "✏️ Edit Student" : "➕ Register New Student"}
          </h2>
          <button onClick={onCancel} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          {apiError && <div style={styles.apiError}>{apiError}</div>}

          {/* Row 1 */}
          <div style={styles.row}>
            <Field label="Full Name" name="fullName" placeholder="John Doe" />
            <Field label="Email Address" name="email" type="email" placeholder="john@example.com" />
          </div>

          {/* Row 2 */}
          <div style={styles.row}>
            <Field label="Phone Number" name="phoneNumber" placeholder="9876543210" />
            <Field label="Date of Birth" name="dateOfBirth" type="date" />
          </div>

          {/* Row 3 */}
          <div style={styles.row}>
            {/* Gender */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Gender <span style={{ color: "#f87171" }}>*</span></label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                style={{ ...styles.input, ...(errors.gender ? styles.inputError : {}) }}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <span style={styles.errorMsg}>{errors.gender}</span>}
            </div>

            {/* Course */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Course Enrolled <span style={{ color: "#f87171" }}>*</span></label>
              <select
                name="courseEnrolled"
                value={form.courseEnrolled}
                onChange={handleChange}
                style={{ ...styles.input, ...(errors.courseEnrolled ? styles.inputError : {}) }}
              >
                <option value="">Select Course</option>
                {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.courseEnrolled && <span style={styles.errorMsg}>{errors.courseEnrolled}</span>}
            </div>
          </div>

          {/* Address */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Address <span style={{ color: "#f87171" }}>*</span></label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="123 Main St, City, State"
              rows={2}
              style={{ ...styles.input, ...(errors.address ? styles.inputError : {}), resize: "vertical" }}
            />
            {errors.address && <span style={styles.errorMsg}>{errors.address}</span>}
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Password{!isEdit && <span style={{ color: "#f87171" }}> *</span>}
              {isEdit && <span style={{ color: "#64748b", fontWeight: 400 }}> (leave blank to keep current)</span>}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={isEdit ? "••••••••" : "Min 6 characters"}
                style={{ ...styles.input, ...(errors.password ? styles.inputError : {}), paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <span style={styles.errorMsg}>{errors.password}</span>}
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button type="button" onClick={onCancel} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Student" : "Register Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 20,
    width: "100%",
    maxWidth: 720,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
    borderBottom: "1px solid #334155",
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
    borderRadius: "20px 20px 0 0",
  },
  modalTitle: {
    color: "#f1f5f9",
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  closeBtn: {
    background: "rgba(255,255,255,0.1)",
    border: "none",
    borderRadius: 8,
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 16,
    padding: "6px 12px",
  },
  form: {
    padding: "28px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  apiError: {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 8,
    color: "#f87171",
    padding: "10px 14px",
    fontSize: 13,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.3,
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 10,
    color: "#f1f5f9",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  inputError: { borderColor: "#ef4444" },
  errorMsg: { color: "#f87171", fontSize: 12 },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    padding: 0,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    paddingTop: 8,
    borderTop: "1px solid #334155",
  },
  cancelBtn: {
    padding: "11px 24px",
    background: "transparent",
    border: "1px solid #475569",
    borderRadius: 10,
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  submitBtn: {
    padding: "11px 28px",
    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default StudentForm;