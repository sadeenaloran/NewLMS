import express from 'express';
import enrollmentController from '../controllers/enrollmentController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with authentication
router.use(authenticate);



// Basic enrollment routes
router.post('/', authorize('student'), enrollmentController.enrollUser);
router.get('/:id', enrollmentController.getEnrollment);
router.get('/user/me', enrollmentController.getUserEnrollments);
router.get('/:id/progress', enrollmentController.getCourseProgressDetails);

// Progress tracking routes
router.post('/complete-lesson', authorize('student'), enrollmentController.markLessonCompleted);
router.get('/course/:courseId/summary', enrollmentController.getProgressSummary);

export default router;