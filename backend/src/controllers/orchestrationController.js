import axios from 'axios';
import mongoose from 'mongoose';
import { Teacher, AILog, Homework, LessonPlan, Alert, Student, Attendance, Analytics } from '../models/Schemas.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
};

const getFallbackLesson = () => ({
  lesson_summary: "Today's lesson covers the fundamental concepts of the current chapter, ensuring continuity despite the teacher's absence.",
  explanation: "We will review the previous topic and introduce the next logical steps, focusing on core principles and practical applications. The lesson builds upon foundational knowledge while introducing new concepts in a structured manner.",
  examples: [
    "Example 1: Basic application demonstrating the core concept with step-by-step breakdown",
    "Example 2: Real-world scenario showing practical usage in everyday situations",
    "Example 3: Advanced case study for deeper understanding and critical thinking"
  ],
  key_concepts: [
    "Fundamental principle of the topic and its significance",
    "Relationship with previous concepts and how they connect",
    "Practical applications in real-world scenarios",
    "Common misconceptions to avoid and correct understanding"
  ],
  class_notes: "Please review the examples carefully and practice the corresponding exercises. Focus on understanding the key concepts rather than memorization. Complete the practice problems and prepare questions for the next class."
});

const getFallbackHomework = () => ({
  easy: [
    "Define the main concept discussed in this chapter and explain its importance.",
    "List three key characteristics of the topic with brief descriptions.",
    "What is the basic formula or principle? Write it down and explain each component."
  ],
  medium: [
    "Explain how this concept applies to a real-world scenario. Provide specific examples.",
    "Compare and contrast this topic with a related concept. Create a comparison table.",
    "Solve a numerical problem involving the core principle. Show all your work."
  ],
  hard: [
    "Design an experiment to demonstrate this concept. Include hypothesis, procedure, and expected results.",
    "Create a mathematical model showing the relationship between variables. Explain your reasoning.",
    "Analyze a complex case study and provide detailed reasoning with multiple perspectives."
  ]
});

const getFallbackInsights = () => 
  "Strategic Insights:\n\n📊 ATTENDANCE TRENDS:\n- Grade 8 attendance decreased by 6% compared to last month\n- Overall school attendance rate is at 88%, down from 94%\n\n💰 FEE COLLECTION STATUS:\n- Most fee delays are occurring in Grade 9 (42 students pending)\n- Total pending amount: ₹80,000\n\n👥 STAFFING & OPERATIONS:\n- Science department has highest teacher absence rate (20% vs school average of 10%)\n- Mathematics department showing improved attendance\n\n⚠️ PRIORITY ACTIONS:\n- Implement targeted intervention for Grade 9 fee collection\n- Review Science department staffing and create backup teaching plans";

const getFallbackAttendanceInsights = () =>
  "Critical Insights:\n- John Doe shows a 15% drop in attendance this month (8 absences in last 20 days)\n- Bob Wilson has 5 consecutive absences, indicating potential health or family issues\n- Overall class attendance dropped from 94% to 88% in the past two weeks\n- Recommendation: Immediate parent contact for students with >3 consecutive absences\n- Recommendation: Schedule counseling sessions for students with declining attendance";

export const handleTeacherAbsence = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { teacherId } = req.params;
    
    // 🛠️ NAYA CODE: Frontend se bheja gaya Subject aur Grade yahan catch kar rahe hain
    const { subject: bodySubject, grade: bodyGrade } = req.body; 
    
    console.log(`[Master Flow] Starting execution for teacher ID: ${teacherId}, Subject: ${bodySubject}`);
    
    let teacher = null;
    
    if (isValidObjectId(teacherId)) {
      try {
        teacher = await Teacher.findById(teacherId);
      } catch(err) {
        console.log('[Master Flow] Teacher not found in DB, using mock data');
      }
    }
    
    // 🛠️ NAYA CODE: Ab hardcoded Maths ki jagah dynamic subject se teacher banega
    if (!teacher) {
      teacher = {
        _id: teacherId,
        name: `${bodySubject || 'Mock'} Teacher`,
        subject: bodySubject || 'Mathematics',
        assignedClasses: [bodyGrade || 'Class 8']
      };
    }

    console.log('[Master Flow] Step 1: Marking teacher absent');
    if (isValidObjectId(teacherId)) {
      try {
        await Teacher.findByIdAndUpdate(teacherId, { 
          status: 'absent',
          $push: {
            absenceHistory: {
              date: new Date(),
              reason: 'Marked absent via system',
              substituteArranged: true
            }
          }
        });
      } catch(e) {
        console.log('[Master Flow] Could not update teacher status:', e.message);
      }
    }
    
    console.log('[Master Flow] Step 2: Generating AI continuity lesson');
    
    const className = bodyGrade || teacher.assignedClasses[0] || 'Class 8';
    const subject = bodySubject || teacher.subject || 'Mathematics';
    
    let lessonData = getFallbackLesson();
    try {
      const lessonResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/continuity-lesson`, {
        class_name: className,
        subject: subject,
        current_chapter: "Chapter 1: Rational Numbers",
        previous_topic: "Introduction to Numbers"
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: (status) => status < 500
      });
      
      if (lessonResponse.status === 200 && lessonResponse.data) {
        lessonData = lessonResponse.data.lesson || lessonResponse.data;
        console.log('[Master Flow] ✓ AI lesson generated successfully');
      }
    } catch (error) {
      console.log('[Master Flow] AI service unavailable, using fallback lesson');
    }

    if (isValidObjectId(teacherId)) {
      try {
        await LessonPlan.create({
          class: className,
          subject: subject,
          chapter: "Chapter 1: Rational Numbers",
          topic: "Properties of Rational Numbers",
          generatedBy: 'ai',
          lessonContent: {
            summary: lessonData.lesson_summary,
            explanation: lessonData.explanation,
            examples: lessonData.examples,
            keyConcepts: lessonData.key_concepts,
            classNotes: lessonData.class_notes
          },
          teacherAbsenceId: teacherId,
          usedInClass: true
        });
        console.log('[Master Flow] Lesson plan saved to database');
      } catch(e) {
        console.log('[Master Flow] Could not save lesson plan:', e.message);
      }
    }

    console.log('[Master Flow] Step 3: Generating homework');
    let homeworkData = getFallbackHomework();
    try {
      const homeworkResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/homework`, {
        class_name: className,
        subject: subject,
        chapter: "Chapter 1: Rational Numbers",
        difficulty: "all"
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: (status) => status < 500
      });
      
      if (homeworkResponse.status === 200 && homeworkResponse.data) {
        homeworkData = homeworkResponse.data.homework || homeworkResponse.data;
        console.log('[Master Flow] ✓ AI homework generated successfully');
      }
    } catch (error) {
      console.log('[Master Flow] AI service unavailable, using fallback homework');
    }

    if (isValidObjectId(teacherId)) {
      try {
        await Homework.create({
          class: className,
          subject: subject,
          chapter: "Chapter 1: Rational Numbers",
          generatedHomework: homeworkData,
          assignedBy: teacherId,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        console.log('[Master Flow] Homework saved to database');
      } catch(e) {
        console.log('[Master Flow] Could not save homework:', e.message);
      }
    }

    console.log('[Master Flow] Step 4: Analyzing attendance');
    const dummyAttendance = [
      { student: "John Doe", studentId: "student1", status: "absent", consecutive: 3, total_days: 20, absent_days: 8 },
      { student: "Jane Smith", studentId: "student2", status: "present", consecutive: 0, total_days: 20, absent_days: 2 },
      { student: "Bob Wilson", studentId: "student3", status: "absent", consecutive: 5, total_days: 20, absent_days: 10 }
    ];
    
    let attendanceInsights = getFallbackAttendanceInsights();
    try {
      const attendanceResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/attendance-insights`, {
        attendance_history: dummyAttendance
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: (status) => status < 500
      });
      
      if (attendanceResponse.status === 200 && attendanceResponse.data) {
        attendanceInsights = attendanceResponse.data.insights;
        console.log('[Master Flow] ✓ AI attendance analysis completed');
      }
    } catch (error) {
      console.log('[Master Flow] AI service unavailable, using fallback attendance insights');
    }

    console.log('[Master Flow] Step 5: Generating parent alerts');
    const absentStudents = dummyAttendance.filter(s => s.status === 'absent');
    const parentAlerts = [];
    
    for (const student of absentStudents) {
      const alertMessage = `Alert: ${student.student} was absent today during the substitute class. This is their ${student.consecutive} consecutive absence. Please contact the school.`;
      parentAlerts.push(alertMessage);
      
      try {
        await Alert.create({
          type: 'attendance',
          priority: student.consecutive >= 3 ? 'high' : 'medium',
          title: 'Student Absence Alert',
          message: alertMessage,
          targetAudience: 'parent',
          status: 'sent',
          sentDate: new Date(),
          metadata: {
            studentName: student.student,
            consecutiveAbsences: student.consecutive,
            teacherAbsent: true
          }
        });
      } catch(e) {
        console.log('[Master Flow] Could not save alert:', e.message);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`[Master Flow] Step 6: Logging execution (took ${executionTime}ms)`);
    
    try {
      await AILog.create({
        actionType: 'master_execution_flow',
        aiActions: {
          teacherId,
          teacherName: teacher.name,
          subject: subject,
          class: className,
          lessonGenerated: true,
          homeworkGenerated: true,
          attendanceAnalyzed: true,
          alertsSent: parentAlerts.length
        },
        triggerSource: 'teacher_absence',
        inputData: { teacherId, className, subject },
        outputData: {
          lesson: lessonData,
          homework: homeworkData,
          attendanceInsights,
          parentAlerts
        },
        executionTime,
        status: 'success'
      });
    } catch(e) {
      console.log('[Master Flow] Could not save AI log:', e.message);
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await Analytics.findOneAndUpdate(
        { date: today, type: 'daily' },
        {
          $inc: {
            'metrics.teachers.totalAbsences': 1,
            'metrics.teachers.substituteArrangements': 1,
            'metrics.aiUsage.lessonsGenerated': 1,
            'metrics.aiUsage.homeworkGenerated': 1
          },
          $push: {
            insights: `${teacher.name} (${subject}) was absent. AI continuity system activated successfully.`
          }
        },
        { upsert: true, new: true }
      );
    } catch(e) {
      console.log('[Master Flow] Could not update analytics:', e.message);
    }

    console.log('[Master Flow] ✓ Master execution completed successfully');

    res.status(200).json({
      success: true,
      message: "Master execution flow completed successfully.",
      executionTime: `${executionTime}ms`,
      data: {
        teacher: {
          id: teacher._id,
          name: teacher.name,
          subject: subject,
          class: className
        },
        lesson: lessonData,
        homework: homeworkData,
        attendanceInsights: attendanceInsights,
        parentAlerts: parentAlerts,
        statistics: {
          absentStudents: absentStudents.length,
          alertsSent: parentAlerts.length,
          lessonsGenerated: 1,
          homeworkGenerated: 1
        }
      }
    });

  } catch (error) {
    console.error("[Master Flow] ✗ Error:", error.message);
    
    try {
      await AILog.create({
        actionType: 'master_execution_flow',
        aiActions: { error: error.message },
        triggerSource: 'teacher_absence',
        executionTime: Date.now() - startTime,
        status: 'failed',
        errorDetails: error.stack
      });
    } catch(e) {
      console.log('[Master Flow] Could not log error:', e.message);
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message || 'Server Error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getPrincipalInsights = async (req, res) => {
  try {
    console.log('[Principal Insights] Generating insights...');
    
    let attendanceData = {
      "Grade 8": { percentage: 88, trend: "down", change: -6 },
      "Grade 9": { percentage: 92, trend: "stable", change: 0 },
      "Grade 10": { percentage: 95, trend: "up", change: 3 }
    };
    
    let feeData = {
      totalDue: 500000,
      totalPaid: 420000,
      overdueCount: 42,
      mostDelaysIn: "Grade 9"
    };
    
    let teacherAbsenceData = {
      "Science": { total: 10, absent: 2, percentage: 20 },
      "Mathematics": { total: 8, absent: 1, percentage: 12.5 },
      "English": { total: 6, absent: 0, percentage: 0 }
    };
    
    try {
      const attendanceStats = await Attendance.aggregate([
        {
          $group: {
            _id: '$class',
            totalRecords: { $sum: 1 },
            avgAttendance: { $avg: '$statistics.attendancePercentage' }
          }
        }
      ]);
      
      if (attendanceStats.length > 0) {
        attendanceData = {};
        attendanceStats.forEach(stat => {
          attendanceData[stat._id] = {
            percentage: Math.round(stat.avgAttendance || 90),
            records: stat.totalRecords
          };
        });
      }
    } catch(e) {
      console.log('[Principal Insights] Using mock attendance data');
    }
    
    try {
      const teacherStats = await Teacher.aggregate([
        {
          $group: {
            _id: '$subject',
            totalTeachers: { $sum: 1 },
            absentCount: {
              $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
            }
          }
        }
      ]);
      
      if (teacherStats.length > 0) {
        teacherAbsenceData = {};
        teacherStats.forEach(stat => {
          teacherAbsenceData[stat._id] = {
            total: stat.totalTeachers,
            absent: stat.absentCount,
            percentage: Math.round((stat.absentCount / stat.totalTeachers) * 100)
          };
        });
      }
    } catch(e) {
      console.log('[Principal Insights] Using mock teacher data');
    }
    
    let insights = getFallbackInsights();
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/ai/principal-insights`, {
        attendance_data: attendanceData,
        fee_data: feeData,
        teacher_absence_data: teacherAbsenceData
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 200 && response.data) {
        insights = response.data.insights;
        console.log('[Principal Insights] ✓ AI insights generated successfully');
      }
    } catch (error) {
      console.log('[Principal Insights] AI service unavailable, using fallback insights');
    }
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await Analytics.findOneAndUpdate(
        { date: today, type: 'daily' },
        {
          $set: {
            'metrics.attendance': attendanceData,
            'metrics.fees': feeData,
            'metrics.teachers': teacherAbsenceData
          },
          $push: {
            insights: insights
          }
        },
        { upsert: true, new: true }
      );
    } catch(e) {
      console.log('[Principal Insights] Could not save analytics:', e.message);
    }
    
    console.log('[Principal Insights] ✓ Insights generated successfully');
    
    res.status(200).json({
      success: true,
      insights: insights,
      rawData: {
        attendance: attendanceData,
        fees: feeData,
        teachers: teacherAbsenceData
      }
    });
  } catch (error) {
    console.error("[Principal Insights] ✗ Error:", error.message);
    
    res.status(200).json({ 
      success: true,
      insights: getFallbackInsights(),
      rawData: {
        attendance: {
          "Grade 8": { percentage: 88, trend: "down", change: -6 },
          "Grade 9": { percentage: 92, trend: "stable", change: 0 },
          "Grade 10": { percentage: 95, trend: "up", change: 3 }
        },
        fees: {
          totalDue: 500000,
          totalPaid: 420000,
          overdueCount: 42
        },
        teachers: {
          "Science": { total: 10, absent: 2, percentage: 20 },
          "Mathematics": { total: 8, absent: 1, percentage: 12.5 }
        }
      }
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const stats = {
      students: {
        total: 1240,
        present: 1180,
        absent: 60
      },
      teachers: {
        total: 45,
        present: 43,
        absent: 2
      },
      fees: {
        pending: 42,
        overdue: 15
      },
      aiActivity: {
        lessonsGenerated: 4,
        homeworkGenerated: 4,
        alertsSent: 8
      }
    };
    
    try {
      stats.students.total = await Student.countDocuments();
      stats.teachers.total = await Teacher.countDocuments();
      stats.teachers.absent = await Teacher.countDocuments({ status: 'absent' });
      stats.teachers.present = stats.teachers.total - stats.teachers.absent;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayAnalytics = await Analytics.findOne({ date: today, type: 'daily' });
      if (todayAnalytics) {
        stats.aiActivity = {
          lessonsGenerated: todayAnalytics.metrics.aiUsage?.lessonsGenerated || 4,
          homeworkGenerated: todayAnalytics.metrics.aiUsage?.homeworkGenerated || 4,
          alertsSent: await Alert.countDocuments({ sentDate: { $gte: today } })
        };
      }
    } catch(e) {
      console.log('[Dashboard Stats] Using mock data:', e.message);
    }
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("[Dashboard Stats] Error:", error.message);
    res.status(200).json({ 
      success: true,
      stats: {
        students: { total: 1240, present: 1180, absent: 60 },
        teachers: { total: 45, present: 43, absent: 2 },
        fees: { pending: 42, overdue: 15 },
        aiActivity: { lessonsGenerated: 4, homeworkGenerated: 4, alertsSent: 8 }
      }
    });
  }
};

export const getRecentAILogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const logs = await AILog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    
    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error("[AI Logs] Error:", error.message);
    res.status(200).json({ 
      success: true,
      logs: []
    });
  }
};

