# Smart Virtual Classroom - Complete Setup & Usage Guide

## Overview
The Smart Virtual Classroom is an AI-powered interactive learning module that combines voice synthesis, speech recognition, PDF context learning, and an interactive whiteboard to create an immersive educational experience.

## Features Implemented

### 1. PDF Context Processing Layer
- Upload syllabus PDFs (up to 30 pages)
- Automatic text extraction and chapter parsing
- MongoDB storage with SyllabusContext collection
- Context injection into AI lesson generation

### 2. AI Voice & Speech Layer
- **Teacher Voice**: Text-to-speech using Web Speech API
- **Student Voice Doubt Hub**: Speech recognition for questions
- Zero-latency, browser-native implementation
- No external API keys required
- Supports Hindi and English

### 3. Interactive Drawing Canvas Board
- HTML5 Canvas-based whiteboard
- Typewriter animation synchronized with voice
- Auto-draw content as AI speaks
- Clear and reset functionality

## Architecture

### Frontend (React)
```
SmartClassroom.jsx
├── PDF Upload Component
├── Interactive Canvas Board
├── Teacher Voice Controls
└── Student Voice Doubt Hub
```

### Backend (Node.js/Express)
```
classroomController.js
├── uploadSyllabusPdf() - PDF processing
└── startLesson() - AI lesson generation
```

### Database (MongoDB)
```
SyllabusContext Schema
├── filename
├── originalName
├── subject
├── class_name
├── fullText
└── chapters[]
    ├── number
    ├── title
    └── content
```

## Installation Steps

### 1. Install Backend Dependencies
```bash
cd edupilot-core/backend
npm install multer pdf-parse
```

### 2. Create Uploads Directory
```bash
mkdir -p edupilot-core/backend/uploads
```

### 3. Verify MongoDB Connection
Ensure MongoDB is running and connected. The SyllabusContext collection will be created automatically.

### 4. Start All Services
```bash
cd edupilot-core
./start-all.sh   # Linux/Mac
start-all.bat    # Windows
```

## How to Use

### Step 1: Access Smart Classroom
1. Navigate to `http://localhost:5173`
2. Click "Enter Principal Dashboard"
3. Click "Smart Classroom" in the sidebar

### Step 2: Upload PDF Context
1. Click the upload area
2. Select a Mathematics PDF (e.g., Class 8 textbook)
3. Wait for "PDF uploaded successfully!" message
4. PDF is processed and stored in MongoDB

### Step 3: Start Virtual Class
1. Click "Start Virtual Class" button
2. AI generates lesson content using PDF context
3. Browser speaks the lesson summary automatically
4. Canvas board auto-draws the content

### Step 4: Voice Controls
**Teacher Voice Controls:**
- Monitor speaking status (Speaking/Silent)
- Pause/Resume voice playback
- Stop speaking completely

**Student Voice Doubt Hub:**
1. Click "Ask Doubt (Voice)" button
2. Allow microphone permissions
3. Speak your question in Hindi or English
4. AI processes the question using syllabus context
5. Answer is displayed and spoken back

### Step 5: Interactive Board
- Watch content auto-draw as AI speaks
- Click "Clear" to reset the board
- Content syncs with voice pacing

## Browser Compatibility

### Supported Browsers
- ✅ Google Chrome (Recommended)
- ✅ Microsoft Edge
- ✅ Safari (macOS/iOS)
- ⚠️ Firefox (Limited speech synthesis)

### Required Permissions
- Microphone access for speech recognition
- Audio playback for text-to-speech

## API Endpoints

### POST /api/classroom/upload-syllabus-pdf
Upload and process syllabus PDF

**Request:**
```
Content-Type: multipart/form-data
Body: file (PDF)
```

**Response:**
```json
{
  "success": true,
  "filename": "1234567890-mathematics.pdf",
  "chapters": 12,
  "message": "PDF uploaded and processed successfully"
}
```

### POST /api/classroom/start-lesson
Start AI-powered virtual lesson

**Request:**
```json
{
  "class_name": "Class 8",
  "subject": "Mathematics",
  "chapter": "Rational Numbers"
}
```

**Response:**
```json
{
  "success": true,
  "lesson": {
    "lesson_summary": "Today we will learn about...",
    "explanation": "Rational numbers are...",
    "examples": ["1/2 is a rational number"],
    "key_concepts": ["Closure property"]
  },
  "context_used": true
}
```

## Technical Implementation Details

### Web Speech API Integration
```javascript
const recognition = new window.webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'hi-IN';

const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'en-IN';
utterance.rate = 0.9;
window.speechSynthesis.speak(utterance);
```

### Canvas Drawing Animation
```javascript
const drawWord = () => {
  if (wordIndex >= words.length) return;
  ctx.fillText(line, 20, y);
  wordIndex++;
  setTimeout(drawWord, 100);
};
```

### PDF Text Extraction
```javascript
const pdfData = await pdfParse(dataBuffer);
const textContent = pdfData.text;
const chapters = extractChapters(textContent);
```

## Troubleshooting

### Issue: Microphone Not Working
**Solution:** 
- Check browser permissions
- Use HTTPS or localhost
- Try Chrome/Edge instead of Firefox

### Issue: Voice Not Speaking
**Solution:**
- Check system volume
- Verify browser audio permissions
- Wait for voices to load (may take 2-3 seconds)

### Issue: PDF Upload Fails
**Solution:**
- Ensure file is valid PDF
- Check file size (< 10MB recommended)
- Verify uploads directory exists
- Check MongoDB connection

### Issue: Canvas Not Drawing
**Solution:**
- Refresh the page
- Check browser console for errors
- Verify canvas dimensions

## Performance Optimization

### PDF Processing
- Large PDFs (>30 pages) may take 5-10 seconds
- Chapter extraction uses regex pattern matching
- Content is cached in MongoDB for fast retrieval

### Voice Synthesis
- Browser-native, zero latency
- No API rate limits
- Works offline after initial load

### Canvas Rendering
- Optimized word-by-word drawing
- 100ms delay between words for readability
- Automatic line wrapping

## Security Considerations

### File Upload Security
- Only PDF files allowed (MIME type validation)
- File size limits enforced by multer
- Unique filenames prevent overwrites
- Files stored outside web root

### Speech Recognition
- Runs entirely in browser
- No audio data sent to external servers
- User must explicitly grant microphone permission

## Future Enhancements

### Planned Features
- Multi-language support (Hindi, Tamil, Telugu)
- Handwriting recognition on canvas
- Student drawing tools (pen, eraser, shapes)
- Lesson recording and playback
- Real-time collaboration
- AI-powered doubt clarification with follow-ups

## Testing Checklist

- [ ] PDF upload works
- [ ] Chapter extraction accurate
- [ ] Voice synthesis plays correctly
- [ ] Speech recognition captures questions
- [ ] Canvas draws synchronized with voice
- [ ] Doubt engine answers contextually
- [ ] Fallback works when AI service down
- [ ] Mobile responsive design
- [ ] Cross-browser compatibility

## Support & Contact

For issues or questions:
1. Check browser console for errors
2. Verify all services are running
3. Review MongoDB logs
4. Check network tab for API failures

## License
Part of EduPilot AI-Powered School Operations System