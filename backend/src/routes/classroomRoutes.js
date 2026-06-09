import express from 'express';
import { uploadSyllabusPdf, startLesson } from '../controllers/classroomController.js';

const router = express.Router();

router.post('/upload-syllabus-pdf', uploadSyllabusPdf);
router.post('/start-lesson', startLesson);

export default router;

