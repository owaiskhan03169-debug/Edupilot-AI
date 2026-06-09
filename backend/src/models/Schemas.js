import mongoose from 'mongoose';

// Student Schema
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
  rollNumber: { type: String, unique: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
  attendance: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' }],
  feeStatus: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee' },
  performanceMetrics: {
    averageAttendance: { type: Number, default: 0 },
    consecutiveAbsences: { type: Number, default: 0 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
  }
}, { timestamps: true });

// Teacher Schema
const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  assignedClasses: [{ type: String }],
  status: { type: String, enum: ['present', 'absent', 'on_leave'], default: 'present' },
  contactEmail: { type: String },
  contactPhone: { type: String },
  absenceHistory: [{
    date: { type: Date },
    reason: { type: String },
    substituteArranged: { type: Boolean, default: false }
  }]
}, { timestamps: true });

// Parent Schema
const parentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  alertPreferences: {
    attendance: { type: Boolean, default: true },
    fees: { type: Boolean, default: true },
    academic: { type: Boolean, default: true }
  },
  alertHistory: [{
    date: { type: Date, default: Date.now },
    type: { type: String },
    message: { type: String },
    status: { type: String, enum: ['sent', 'delivered', 'failed'], default: 'sent' }
  }]
}, { timestamps: true });

// Fee Schema
const feeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  academicYear: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['paid', 'partial', 'overdue', 'pending'], default: 'pending' },
  paymentHistory: [{
    amount: { type: Number },
    date: { type: Date, default: Date.now },
    method: { type: String },
    transactionId: { type: String }
  }],
  reminderHistory: [{
    dateSent: { type: Date, default: Date.now },
    type: { type: String, enum: ['email', 'sms', 'call'] },
    status: { type: String }
  }]
}, { timestamps: true });

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, required: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
  subject: { type: String },
  dailyAttendance: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
    remarks: { type: String }
  }],
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  statistics: {
    totalStudents: { type: Number },
    presentCount: { type: Number },
    absentCount: { type: Number },
    lateCount: { type: Number },
    attendancePercentage: { type: Number }
  }
}, { timestamps: true });

// Syllabus Schema
const syllabusSchema = new mongoose.Schema({
  class: { type: String, required: true },
  subject: { type: String, required: true },
  academicYear: { type: String, required: true },
  syllabusStructure: { type: Object, required: true }, // JSON structure of topics/modules
  uploadedFile: {
    filename: { type: String },
    uploadDate: { type: Date, default: Date.now },
    fileType: { type: String }
  },
  currentProgress: {
    currentChapter: { type: String },
    currentTopic: { type: String },
    completionPercentage: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Homework Schema
const homeworkSchema = new mongoose.Schema({
  class: { type: String, required: true },
  subject: { type: String, required: true },
  chapter: { type: String, required: true },
  generatedHomework: { type: Object, required: true }, // JSON with easy, medium, hard questions
  dateAssigned: { type: Date, default: Date.now },
  dueDate: { type: Date },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'all'], default: 'all' },
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    submittedDate: { type: Date },
    status: { type: String, enum: ['submitted', 'pending', 'late'] }
  }]
}, { timestamps: true });

// AI Log Schema
const aiLogSchema = new mongoose.Schema({
  actionType: { type: String, required: true }, // e.g., 'generate_lesson', 'flag_student', 'master_execution'
  aiActions: { type: Object, required: true }, // Details of the AI execution
  triggerSource: { type: String }, // What triggered this AI action
  inputData: { type: Object }, // Input provided to AI
  outputData: { type: Object }, // AI response
  executionTime: { type: Number }, // Time taken in milliseconds
  status: { type: String, enum: ['success', 'failed', 'partial'], default: 'success' },
  errorDetails: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// Lesson Plan Schema (Generated by AI)
const lessonPlanSchema = new mongoose.Schema({
  class: { type: String, required: true },
  subject: { type: String, required: true },
  chapter: { type: String, required: true },
  topic: { type: String, required: true },
  generatedBy: { type: String, enum: ['ai', 'teacher'], default: 'ai' },
  lessonContent: {
    summary: { type: String },
    explanation: { type: String },
    examples: [{ type: String }],
    keyConcepts: [{ type: String }],
    classNotes: { type: String }
  },
  dateGenerated: { type: Date, default: Date.now },
  usedInClass: { type: Boolean, default: false },
  teacherAbsenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comments: { type: String }
  }
}, { timestamps: true });

// Alert Schema
const alertSchema = new mongoose.Schema({
  type: { type: String, enum: ['attendance', 'fee', 'teacher_absence', 'system'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  targetAudience: { type: String, enum: ['parent', 'teacher', 'principal', 'student'], required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId },
  status: { type: String, enum: ['pending', 'sent', 'delivered', 'read', 'failed'], default: 'pending' },
  sentDate: { type: Date },
  readDate: { type: Date },
  metadata: { type: Object }
}, { timestamps: true });

// Analytics Schema (For Principal Dashboard)
const analyticsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  metrics: {
    attendance: {
      overall: { type: Number },
      gradeWise: { type: Object },
      trends: { type: Object }
    },
    fees: {
      collectionRate: { type: Number },
      pendingAmount: { type: Number },
      overdueCount: { type: Number },
      gradeWise: { type: Object }
    },
    teachers: {
      totalAbsences: { type: Number },
      departmentWise: { type: Object },
      substituteArrangements: { type: Number }
    },
    aiUsage: {
      lessonsGenerated: { type: Number },
      homeworkGenerated: { type: Number },
      doubtsAnswered: { type: Number },
      insightsProvided: { type: Number }
    }
  },
  insights: [{ type: String }],
  generatedBy: { type: String, default: 'ai' }
}, { timestamps: true });

const syllabusContextSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  subject: { type: String, required: true },
  class_name: { type: String, required: true },
  fullText: { type: String, required: true },
  chapters: [{
    number: { type: Number },
    title: { type: String },
    content: { type: String }
  }],
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Student = mongoose.model('Student', studentSchema);
export const Teacher = mongoose.model('Teacher', teacherSchema);
export const Parent = mongoose.model('Parent', parentSchema);
export const Fee = mongoose.model('Fee', feeSchema);
export const Attendance = mongoose.model('Attendance', attendanceSchema);
export const Syllabus = mongoose.model('Syllabus', syllabusSchema);
export const Homework = mongoose.model('Homework', homeworkSchema);
export const AILog = mongoose.model('AILog', aiLogSchema);
export const LessonPlan = mongoose.model('LessonPlan', lessonPlanSchema);
export const Alert = mongoose.model('Alert', alertSchema);
export const Analytics = mongoose.model('Analytics', analyticsSchema);
export const SyllabusContext = mongoose.model('SyllabusContext', syllabusContextSchema);
