import Quiz from "../models/Quiz.js";
import { createResponse } from "../utils/helpers.js";
import { authenticateJWT, authorize } from "../middleware/authMiddleware.js";
import {
  quizCreateSchema,
  quizUpdateSchema,
} from "../validators/quizValidator.js";

export default {
  // Create new quiz
  createQuiz: [
    authenticateJWT,
    authorize(["instructor", "admin"]),
    async (req, res) => {
      try {
        // Validate request body
        const { error, value } = quizCreateSchema.validate(req.body);

        if (error) {
          return res.status(400).json({
            success: false,
            message: "Validation error",
            error: error.details[0].message,
          });
        }

        // Create quiz with validated data
        const quiz = await Quiz.create(
          value.lesson_id,
          value.title,
          value.max_score
        );

        return res
          .status(201)
          .json(createResponse(true, "Quiz created successfully", quiz));
      } catch (error) {
        return res
          .status(error.status || 500)
          .json(createResponse(false, error.message));
      }
    },
  ],

  // Get quiz details
  getQuiz: async (req, res) => {
    try {
      const { id } = req.params;
      const quiz = await Quiz.findById(id);

      if (!quiz) {
        return res.status(404).json(createResponse(false, "Quiz not found"));
      }

      return res.json(
        createResponse(true, "Quiz retrieved successfully", quiz)
      );
    } catch (error) {
      return res
        .status(error.status || 500)
        .json(createResponse(false, error.message));
    }
  },

  // Update quiz
  updateQuiz: [
    authenticateJWT,
    authorize(["instructor", "admin"]),
    async (req, res) => {
      try {
        // Validate request body
        const { error, value } = quizUpdateSchema.validate(req.body);

        if (error) {
          return res.status(400).json({
            success: false,
            message: "Validation error",
            error: error.details[0].message,
          });
        }

        const { id } = req.params;
        const quiz = await Quiz.update(id, value);

        if (!quiz) {
          return res.status(404).json(createResponse(false, "Quiz not found"));
        }

        return res.json(
          createResponse(true, "Quiz updated successfully", quiz)
        );
      } catch (error) {
        return res
          .status(error.status || 500)
          .json(createResponse(false, error.message));
      }
    },
  ],

  // Delete quiz
  deleteQuiz: [
    authenticateJWT,
    authorize(["instructor", "admin"]),
    async (req, res) => {
      try {
        const { id } = req.params;
        const quiz = await Quiz.delete(id);

        if (!quiz) {
          return res.status(404).json(createResponse(false, "Quiz not found"));
        }

        return res.json(
          createResponse(true, "Quiz deleted successfully", quiz)
        );
      } catch (error) {
        return res
          .status(error.status || 500)
          .json(createResponse(false, error.message));
      }
    },
  ],

  // Get all quizzes for a lesson
  getQuizzesByLesson: async (req, res) => {
    try {
      const { lesson_id } = req.params;
      const quizzes = await Quiz.findByLessonId(lesson_id);

      return res.json(
        createResponse(true, "Quizzes retrieved successfully", quizzes)
      );
    } catch (error) {
      return res
        .status(error.status || 500)
        .json(createResponse(false, error.message));
    }
  },
};
