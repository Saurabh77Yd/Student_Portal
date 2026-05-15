import { Router } from "express";
import {
  registerStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
  loginStudent,
} from "../controllers/studentController";

const router = Router();

router.post("/login",          loginStudent);
router.post("/register",       registerStudent);
router.get("/students",        getAllStudents);
router.put("/student/:id",     updateStudent);
router.delete("/student/:id",  deleteStudent);

export default router;