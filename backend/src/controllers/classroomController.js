import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import axios from 'axios';
import { SyllabusContext } from '../models/Schemas.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
}).single('file');

export const uploadSyllabusPdf = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const filePath = req.file.path;
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      const textContent = pdfData.text;
      const chapters = extractChapters(textContent);
      
      const syllabusDoc = new SyllabusContext({
        filename: req.file.filename,
        originalName: req.file.originalname,
        subject: 'Mathematics',
        class_name: 'Class 8',
        fullText: textContent,
        chapters: chapters,
        uploadedAt: new Date()
      });
      
      await syllabusDoc.save();
      
      res.json({
        success: true,
        filename: req.file.filename,
        chapters: chapters.length,
        message: 'PDF uploaded and processed successfully'
      });
    } catch (error) {
      console.error('PDF processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process PDF',
        message: error.message
      });
    }
  });
};

const extractChapters = (text) => {
  const chapters = [];
  const lines = text.split('\n');
  let currentChapter = null;
  let chapterContent = [];
  
  lines.forEach((line) => {
    const chapterMatch = line.match(/^Chapter\s+(\d+)[:\s]+(.+)/i);
    
    if (chapterMatch) {
      if (currentChapter) {
        chapters.push({
          number: currentChapter.number,
          title: currentChapter.title,
          content: chapterContent.join('\n').trim()
        });
      }
      
      currentChapter = {
        number: parseInt(chapterMatch[1]),
        title: chapterMatch[2].trim()
      };
      chapterContent = [];
    } else if (currentChapter) {
      chapterContent.push(line);
    }
  });
  
  if (currentChapter) {
    chapters.push({
      number: currentChapter.number,
      title: currentChapter.title,
      content: chapterContent.join('\n').trim()
    });
  }
  
  return chapters;
};

export const startLesson = async (req, res) => {
  try {
    const { class_name, subject, chapter } = req.body;
    
    const syllabusContext = await SyllabusContext.findOne({
      class_name: class_name,
      subject: subject
    }).sort({ uploadedAt: -1 });
    
    let contextText = '';
    if (syllabusContext) {
      const chapterData = syllabusContext.chapters.find(ch => 
        ch.title.toLowerCase().includes(chapter.toLowerCase())
      );
      
      if (chapterData) {
        contextText = chapterData.content;
      }
    }
    
    let lessonData = {
      lesson_summary: `Today we will learn about ${chapter} from ${subject}.`,
      explanation: `${chapter} is an important topic in ${subject}. Let's understand the key concepts.`,
      examples: [`Example 1 related to ${chapter}`, `Example 2 related to ${chapter}`],
      key_concepts: ['Concept 1', 'Concept 2', 'Concept 3']
    };
    
    try {
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/api/ai/continuity-lesson`,
        {
          class_name: class_name,
          subject: subject,
          current_chapter: chapter,
          previous_topic: 'Introduction',
          syllabus_context: contextText
        },
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
          validateStatus: (status) => status < 500
        }
      );
      
      if (aiResponse.status === 200 && aiResponse.data) {
        lessonData = aiResponse.data.lesson || aiResponse.data;
      }
    } catch (aiError) {
      console.log('AI service unavailable, using fallback lesson');
    }
    
    res.json({
      success: true,
      lesson: lessonData,
      context_used: contextText.length > 0
    });
  } catch (error) {
    console.error('Start lesson error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start lesson',
      lesson: {
        lesson_summary: 'Welcome to the virtual classroom. Today we will explore new concepts.',
        explanation: 'This is a comprehensive lesson covering important topics.',
        examples: ['Example 1', 'Example 2'],
        key_concepts: ['Key Concept 1', 'Key Concept 2']
      }
    });
  }
};

