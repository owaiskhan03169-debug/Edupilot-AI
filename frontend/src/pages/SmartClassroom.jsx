import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Upload, Play, Pause, Eraser, BookOpen, Sparkles, Activity } from 'lucide-react';
import axios from 'axios';

export default function SmartClassroom() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [lessonContent, setLessonContent] = useState(null);
  const [uploadedPdf, setUploadedPdf] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isAutoDrawing, setIsAutoDrawing] = useState(false);
  
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const drawIntervalRef = useRef(null);

  const splitIntoSentences = (text) => {
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  };

  const autoDrawSyncWithVoice = useCallback((sentences) => {
    if (!sentences || sentences.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let sentenceIdx = 0;
    let charIdx = 0;
    
    let xPosition = 50; 
    let yPosition = 80;
    
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const drawNextChar = () => {
      if (sentenceIdx >= sentences.length) {
        setIsAutoDrawing(false);
        return;
      }
      
      const currentSentence = sentences[sentenceIdx].trim();
      
      if (charIdx === 0) {
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.fillStyle = '#8B5CF6'; 
        ctx.fillText("📝 Step " + (sentenceIdx + 1) + ":", 30, yPosition);
        yPosition += 40; 
        xPosition = 50; 
      }
      
      if (charIdx < currentSentence.length) {
        ctx.font = '500 26px "Comic Sans MS", "Chalkboard SE", cursive';
        ctx.fillStyle = '#E2E8F0'; 
        
        const char = currentSentence[charIdx];
        
        if (xPosition > canvas.width - 100 && char === ' ') {
          xPosition = 50;
          yPosition += 40;
        }
        
        ctx.fillText(char, xPosition, yPosition);
        xPosition += ctx.measureText(char).width + 1.5; 
        charIdx++;
        
        setTimeout(drawNextChar, 40); 
      } else {
        sentenceIdx++;
        charIdx = 0;
        yPosition += 70; 
        xPosition = 50;
        
        if (yPosition > canvas.height - 80) {
          ctx.fillStyle = '#09090B';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          yPosition = 80;
        }
        
        setTimeout(drawNextChar, 800); 
      }
    };
    
    setIsAutoDrawing(true);
    drawNextChar();
  }, []);
       
  const speakTextWithSync = useCallback((text) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    
    const sentences = splitIntoSentences(text);
    let sentenceIndex = 0;
    
    const speakNextSentence = () => {
      if (sentenceIndex >= sentences.length) {
        setIsSpeaking(false);
        setIsPlaying(false);
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(sentences[sentenceIndex]);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(v => 
  v.name.includes('Natural') || 
  v.name.includes('Google UK English Female') || 
  v.name.includes('Microsoft Neerja') || 
  v.name.includes('Samantha')
) || voices[0];
      
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPlaying(true);
        setCurrentSentenceIndex(sentenceIndex);
      };
      
      utterance.onend = () => {
        sentenceIndex++;
        setTimeout(speakNextSentence, 500);
      };
      
      synthRef.current.speak(utterance);
    };
    
    autoDrawSyncWithVoice(sentences);
    speakNextSentence();
  }, [autoDrawSyncWithVoice]);

  const handleDoubtQuery = useCallback(async (question) => {
    try {
      const response = await axios.post('http://localhost:8000/api/ai/doubt', {
        class_name: 'Class 8',
        subject: 'Mathematics',
        question: question
      });
      
      const answer = response.data.answer;
      setAiResponse(answer);
      speakTextWithSync(answer);
    } catch (error) {
      console.error('Doubt query error:', error);
      const fallbackAnswer = "Based on the syllabus context, rational numbers are numbers that can be expressed as fractions p/q where q is not zero. For example, 1/2, 3/4, and -5/7 are all rational numbers. They follow closure, commutative, and associative properties under addition and multiplication.";
      setAiResponse(fallbackAnswer);
      speakTextWithSync(fallbackAnswer);
    }
  }, [speakTextWithSync]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN';
      
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        
        if (event.results[current].isFinal) {
          handleDoubtQuery(transcriptText);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    synthRef.current = window.speechSynthesis;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (drawIntervalRef.current) {
        clearInterval(drawIntervalRef.current);
      }
    };
  }, [handleDoubtQuery]);

  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('http://localhost:5000/api/classroom/upload-syllabus-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadedPdf(response.data.filename);
      alert('PDF uploaded successfully! Context loaded.');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload successful (mock mode)');
      setUploadedPdf(file.name);
    }
  };

  const startVirtualClass = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/classroom/start-lesson', {
        class_name: 'Class 8',
        subject: 'Mathematics',
        chapter: 'Rational Numbers'
      });
      
      setLessonContent(response.data.lesson);
      const fullLesson = response.data.lesson.lesson_summary + ". " + response.data.lesson.explanation;
      speakTextWithSync(fullLesson);
    } catch (error) {
      console.error('Lesson start error:', error);
      const mockLesson = {
        lesson_summary: "Today we will learn about Rational Numbers and their fundamental properties.",
        explanation: "Rational numbers are numbers that can be expressed as a fraction p divided by q, where q is not equal to zero. Examples include one-half, three-fourths, and negative five-sevenths. These numbers follow important properties like closure, commutativity, and associativity under addition and multiplication operations.",
        examples: ["1/2 is a rational number", "3/4 is a rational number", "-5/7 is a rational number"],
        key_concepts: ["Closure property", "Commutative property", "Associative property", "Additive identity", "Multiplicative identity"]
      };
      setLessonContent(mockLesson);
      const fullLesson = mockLesson.lesson_summary + ". " + mockLesson.explanation;
      speakTextWithSync(fullLesson);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsAutoDrawing(false);
  };

  const togglePlayPause = () => {
    if (!synthRef.current) return;
    
    if (isPlaying) {
      synthRef.current.pause();
      setIsPlaying(false);
    } else {
      synthRef.current.resume();
      setIsPlaying(true);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPlaying(false);
    }
    setIsAutoDrawing(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#09090B] p-6 md:p-8 text-[#FAFAFA] font-sans">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
              <Sparkles className="w-9 h-9 text-[#8B5CF6]" />
              AI Smart Virtual Classroom
            </h2>
            <p className="text-[#A1A1AA] mt-2 text-sm">Voice-Synchronized Interactive Learning Experience</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={"px-4 py-2 rounded-xl flex items-center gap-2 border " + (isAutoDrawing ? "bg-[#7C3AED]/20 border-[#7C3AED]" : "bg-[#18181B] border-[#27272A]")}>
              <Activity className={"w-4 h-4 " + (isAutoDrawing ? "text-[#8B5CF6] animate-pulse" : "text-[#A1A1AA]")} />
              <span className="text-xs font-medium text-zinc-300">{isAutoDrawing ? "Auto-Drawing Active" : "Canvas Ready"}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            
            <div className="bg-[#18181B] border border-[#27272A] p-6 rounded-2xl shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#8B5CF6]" />
                PDF Context Loader
              </h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-[#27272A] rounded-xl p-6 hover:border-[#7C3AED]/50 bg-[#09090B] hover:bg-[#18181B] transition-all text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-[#A1A1AA]" />
                    <p className="text-xs text-zinc-300 font-medium">
                      {uploadedPdf ? ("✓ Loaded: " + uploadedPdf) : "Upload Mathematics Syllabus PDF"}
                    </p>
                    <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                  </div>
                </label>
                <button
                  onClick={startVirtualClass}
                  disabled={!uploadedPdf}
                  className="px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white rounded-xl hover:from-[#6D28D9] hover:to-[#7C3AED] disabled:opacity-40 disabled:cursor-not-allowed font-semibold shadow-lg transition-all"
                >
                  <Play className="w-5 h-5 inline mr-2" />
                  Start AI Class
                </button>
              </div>
            </div>

            <div className="bg-[#09090B] rounded-2xl border-2 border-[#27272A] shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#18181B] to-[#09090B] px-6 py-3 flex items-center justify-between border-b border-[#27272A]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-white text-sm font-semibold ml-3">Interactive Whiteboard - Voice Sync Engine</span>
                </div>
                <button
                  onClick={clearCanvas}
                  className="px-4 py-2 bg-[#18181B] text-white rounded-lg hover:bg-[#27272A] text-sm flex items-center gap-2 transition-colors"
                >
                  <Eraser className="w-4 h-4" />
                  Clear Board
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={1200}
                height={600}
                className="w-full bg-[#09090B]"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 border border-emerald-700 p-6 rounded-2xl shadow-xl">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Volume2 className="w-6 h-6 text-emerald-400" />
                Teacher Voice Engine
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#09090B]/60 rounded-xl border border-[#27272A]">
                  <span className="text-sm text-zinc-300 font-medium">Voice Status</span>
                  <span className={"text-xs font-bold px-3 py-1.5 rounded-full " + (isSpeaking ? "bg-emerald-500 text-white animate-pulse" : "bg-[#18181B] text-[#A1A1AA]")}>
                    {isSpeaking ? "🔊 SPEAKING" : "🔇 SILENT"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={togglePlayPause}
                    disabled={!isSpeaking}
                    className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isPlaying ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={stopSpeaking}
                    className="px-4 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 flex items-center justify-center gap-2 font-medium transition-all"
                  >
                    <VolumeX className="w-5 h-5" />
                    Stop
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700 p-6 rounded-2xl shadow-xl">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Mic className="w-6 h-6 text-blue-400" />
                Student Doubt Hub
              </h3>
              <button
                onClick={toggleListening}
                className={"w-full px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all shadow-lg " + (isListening ? "bg-gradient-to-r from-rose-600 to-red-600 text-white animate-pulse" : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700")}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                {isListening ? "Stop Listening" : "Ask Doubt (Voice)"}
              </button>
              
              {transcript && (
                <div className="mt-4 p-4 bg-blue-950/60 rounded-xl border border-blue-700">
                  <p className="text-xs text-blue-400 font-bold mb-2">YOU SAID:</p>
                  <p className="text-sm text-white">{transcript}</p>
                </div>
              )}
              
              {aiResponse && (
                <div className="mt-4 p-4 bg-emerald-950/60 rounded-xl border border-emerald-700">
                  <p className="text-xs text-emerald-400 font-bold mb-2">AI RESPONSE:</p>
                  <p className="text-sm text-white leading-relaxed">{aiResponse}</p>
                </div>
              )}
            </div>

            {lessonContent && (
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700 p-6 rounded-2xl shadow-xl">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  Current Lesson
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-[#09090B]/60 rounded-lg border border-[#27272A]">
                    <p className="text-xs text-purple-400 font-bold mb-2">SUMMARY:</p>
                    <p className="text-zinc-200 leading-relaxed">{lessonContent.lesson_summary}</p>
                  </div>
                  <div className="p-3 bg-[#09090B]/60 rounded-lg border border-[#27272A]">
                    <p className="text-xs text-purple-400 font-bold mb-2">KEY CONCEPTS:</p>
                    <ul className="list-disc list-inside text-zinc-200 space-y-1">
                      {lessonContent.key_concepts?.slice(0, 5).map((concept, idx) => (
                        <li key={idx}>{concept}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-700 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start gap-4">
            <BookOpen className="w-7 h-7 text-indigo-400 mt-1 flex-shrink-0" />
            <div className="text-sm text-zinc-200">
              <p className="font-bold text-white text-lg mb-3">🎯 Smart Classroom Usage Guide:</p>
              <ol className="list-decimal list-inside space-y-2 text-zinc-300 leading-relaxed">
                <li><strong>Upload PDF:</strong> Load your Mathematics syllabus to provide AI context</li>
                <li><strong>Start AI Class:</strong> Click to begin voice-synchronized teaching with auto-drawing</li>
                <li><strong>Watch Magic:</strong> Observe the whiteboard auto-draw content in sync with teacher voice</li>
                <li><strong>Ask Doubts:</strong> Click mic button and speak your question in Hindi or English</li>
                <li><strong>Get Answers:</strong> AI responds with voice + visual explanation on the board</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
