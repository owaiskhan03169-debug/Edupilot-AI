import express from 'express';
import { 
  handleTeacherAbsence, 
  getPrincipalInsights,
  getDashboardStats,
  getRecentAILogs
} from '../controllers/orchestrationController.js';
import {
  getStudents,
  updateStudentStatus,
  sendParentAlert,
  getAttendanceStudents,
  markStudentAbsent
} from '../controllers/studentController.js';

const router = express.Router();

router.post('/teacher/:teacherId/absent', handleTeacherAbsence);
router.get('/insights', getPrincipalInsights);
router.get('/dashboard/stats', getDashboardStats);
router.get('/ai/logs', getRecentAILogs);

router.get('/students', getStudents);
router.post('/student/:studentId/status', updateStudentStatus);
router.post('/student/:studentId/alert', sendParentAlert);
router.get('/attendance/students', getAttendanceStudents);
router.post('/student/:studentId/absent', markStudentAbsent);

export default router;

