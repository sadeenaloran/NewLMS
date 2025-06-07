import express from "express";
import quizController from "../controllers/quizController.js";
import { authenticateJWT, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// إنشاء اختبار جديد (للمعلمين والمشرفين)
router.post(
  "/",
  authenticateJWT,
  authorize(["instructor", "admin"]),
  quizController.createQuiz
);

// الحصول على تفاصيل اختبار
router.get("/:id", authenticateJWT, quizController.getQuiz);

// تحديث اختبار (للمعلمين والمشرفين)
router.put(
  "/:id",
  authenticateJWT,
  authorize(["instructor", "admin"]),
  quizController.updateQuiz
);

// حذف اختبار (للمعلمين والمشرفين)
router.delete(
  "/:id",
  authenticateJWT,
  authorize(["instructor", "admin"]),
  quizController.deleteQuiz
);

// الحصول على جميع اختبارات درس معين
router.get(
  "/lesson/:lesson_id",
  authenticateJWT,
  quizController.getQuizzesByLesson
);

export default router;
