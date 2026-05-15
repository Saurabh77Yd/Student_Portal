import { Request, Response } from "express";
import mongoose from "mongoose";
import Student from "../models/Student";
import { encrypt, decrypt } from "../utils/crypto";

const STUDENT_FIELDS = [
  "fullName",
  "email",
  "phoneNumber",
  "dateOfBirth",
  "gender",
  "address",
  "courseEnrolled",
  "password",
] as const;

type StudentField = (typeof STUDENT_FIELDS)[number];

const RETURN_FIELDS: Exclude<StudentField, "password">[] = [
  "fullName",
  "email",
  "phoneNumber",
  "dateOfBirth",
  "gender",
  "address",
  "courseEnrolled",
];

function getMissingFields(body: Record<string, unknown>, fields: readonly string[]): string[] {
  return fields.filter((f) => !body[f] || String(body[f]).trim() === "");
}

/**
 * Wraps each frontend-encrypted value in a second backend AES layer.
 * Stored in MongoDB as: BE( FE(plaintext) )
 */
function applyBackendEncryption(
  body: Record<string, string>,
  fields: readonly StudentField[]
): Record<StudentField, string> {
  const result = {} as Record<StudentField, string>;
  for (const field of fields) {
    result[field] = encrypt(body[field]);
  }
  return result;
}

/**
 * Peels the backend layer so the client receives FE(plaintext).
 * Password is never returned.
 */
function stripBackendLayer(doc: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of RETURN_FIELDS) {
    if (doc[field]) {
      result[field] = decrypt(doc[field]); 
    }
  }
  return result;
}

// ─── POST /api/register ───────────────────────────────────────────────────────
export async function registerStudent(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, string>;

    const missing = getMissingFields(body, STUDENT_FIELDS);
    if (missing.length) {
      res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
      return;
    }

    // Duplicate email check (scan because email is double-encrypted)
    const all = await Student.find({});
    for (const s of all) {
      try {
        if (decrypt(s.email) === body.email) {
          res.status(409).json({ success: false, message: "Email already registered" });
          return;
        }
      } catch {
        // skip malformed records
      }
    }

    const doubleEncrypted = applyBackendEncryption(body, STUDENT_FIELDS);
    const student = new Student(doubleEncrypted);
    await student.save();

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      data: { id: student._id },
    });
  } catch (error) {
    console.error("[registerStudent]", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// ─── GET /api/students ────────────────────────────────────────────────────────
export async function getAllStudents(_req: Request, res: Response): Promise<void> {
  try {
    const students = await Student.find({});

    const data = students.map((s) => {
      const doc = s.toJSON() as Record<string, string>;
      return {
        _id: s._id,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        ...stripBackendLayer(doc),
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("[getAllStudents]", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// ─── PUT /api/student/:id ─────────────────────────────────────────────────────
export async function updateStudent(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid student ID" });
      return;
    }

    const body = req.body as Record<string, string>;
    const fieldsToUpdate = STUDENT_FIELDS.filter(
      (f) => body[f] !== undefined && String(body[f]).trim() !== ""
    );

    if (fieldsToUpdate.length === 0) {
      res.status(400).json({ success: false, message: "No valid fields provided for update" });
      return;
    }

    const updates: Record<string, string> = {};
    for (const field of fieldsToUpdate) {
      updates[field] = encrypt(body[field]); // re-wrap with backend layer
    }

    const student = await Student.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!student) {
      res.status(404).json({ success: false, message: "Student not found" });
      return;
    }

    const doc = student.toJSON() as Record<string, string>;
    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: { _id: student._id, ...stripBackendLayer(doc) },
    });
  } catch (error) {
    console.error("[updateStudent]", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// ─── DELETE /api/student/:id ──────────────────────────────────────────────────
export async function deleteStudent(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid student ID" });
      return;
    }

    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      res.status(404).json({ success: false, message: "Student not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.error("[deleteStudent]", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// ─── POST /api/login ──────────────────────────────────────────────────────────
export async function loginStudent(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const students = await Student.find({});
    const matched = students.find((s) => {
      try { return decrypt(s.email) === email; } catch { return false; }
    });

    if (!matched || decrypt(matched.password) !== password) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { id: matched._id },
    });
  } catch (error) {
    console.error("[loginStudent]", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

