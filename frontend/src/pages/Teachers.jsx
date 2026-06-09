import { useState, useEffect } from 'react';
import { UserCheck, UserX, Sparkles, Loader, CheckCircle, AlertCircle, BookOpen, FileText, Users, Clock } from 'lucide-react';
import axios from 'axios';

export default function Teachers() {
  const [teachers, setTeachers] = useState([
    { id: 1, name: "John doe", subject: "Mathematics", grade: "Class 8", status: "Present", aiAction: null, data: null },
    { id: 2, name: "Emily patrew", subject: "Science", grade: "Class 9", status: "Present", aiAction: null, data: null },
    { id: 3, name: "Charlotte", subject: "English", grade: "Class 10", status: "Present", aiAction: null, data: null },
    { id: 4, name: "Noah", subject: "Physics", grade: "Class 8", status: "Present", aiAction: null, data: null },
    { id: 5, name: "Henry", subject: "Social Studies", grade: "Class 9", status: "Present", aiAction: null, data: null }
  ]);

  const [loadingId, setLoadingId] = useState(null);
  const [masterFlowResult, setMasterFlowResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);

  const handleMarkAbsent = async (id, subject, grade) => {
    setLoadingId(id);
    setMasterFlowResult(null);
    setShowDetails(false);
    
    setTeachers(teachers.map(teacher => {
      if (teacher.id === id) {
        return { 
          ...teacher, 
          status: "Absent", 
          aiAction: "🔄 Initializing AI Continuity System..." 
        };
      }
      return teacher;
    }));

    try {
      console.log(`[Frontend] Triggering master flow for teacher ${id}`);
      const startTime = Date.now();
      
      const response = await axios.post("http://127.0.0.1:5000/api/orchestration/teacher/" + id + "/absent", {
    subject: subject,
    grade: grade
});
      const data = response.data.data;
      const execTime = Date.now() - startTime;
      
      setExecutionTime(execTime);
      setMasterFlowResult(data);
      setShowDetails(true);

      setTeachers(teachers => teachers.map(teacher => {
        if (teacher.id === id) {
          return { 
            ...teacher, 
            aiAction: "✅ AI Continuity System Activated!",
            data: data
          };
        }
        return teacher;
      }));

      console.log(`[Frontend] Master flow completed in ${execTime}ms`);
    } catch (error) {
      console.error("[Frontend] Error triggering master flow:", error);
      
      setTeachers(teachers => teachers.map(teacher => {
        if (teacher.id === id) {
          return { 
            ...teacher, 
            aiAction: "❌ Error: Could not activate AI system. Check backend connection.",
            data: null
          };
        }
        return teacher;
      }));
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkPresent = (id) => {
    setTeachers(teachers.map(teacher => {
      if (teacher.id === id) {
        return { 
          ...teacher, 
          status: "Present", 
          aiAction: null,
          data: null
        };
      }
      return teacher;
    }));
    
    if (masterFlowResult && masterFlowResult.teacher?.id === id) {
      setMasterFlowResult(null);
      setShowDetails(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#09090B] p-8 text-[#FAFAFA] overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Teachers Management</h1>
          <p className="text-[#A1A1AA] text-sm">Manage staff attendance and trigger AI Continuity workflows.</p>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-[#09090B]/50 border-b border-[#27272A]">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Teacher Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Subject & Grade</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">AI Continuity Engine</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-[#27272A]/30 transition-colors duration-200">
                    <td className="px-6 py-4 text-sm text-[#FAFAFA] font-semibold">{teacher.name}</td>
                    <td className="px-6 py-4 text-sm text-[#FAFAFA]">{teacher.subject} - {teacher.grade}</td>
                    <td className="px-6 py-4">
                      {teacher.status === "Present" ? (
                        <div className="flex items-center gap-2 text-emerald-400 font-medium bg-emerald-400/10 px-3 py-1 rounded-full w-fit">
                          <UserCheck className="w-4 h-4" /> Present
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-rose-400 font-medium bg-rose-400/10 px-3 py-1 rounded-full w-fit">
                          <UserX className="w-4 h-4" /> Absent
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {teacher.aiAction ? (
                        <span className={`inline-flex items-center font-medium text-xs ${
                          teacher.aiAction.includes('✅') ? 'text-emerald-400' : 
                          teacher.aiAction.includes('❌') ? 'text-rose-400' : 
                          'text-neonPurple'
                        }`}>
                          {loadingId === teacher.id ? (
                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                          ) : teacher.aiAction.includes('✅') ? (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          ) : teacher.aiAction.includes('❌') ? (
                            <AlertCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-1" />
                          )}
                          {teacher.aiAction}
                        </span>
                      ) : (
                        <span className="text-zinc-500 italic text-sm">No action required</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {teacher.status === "Present" ? (
                        <button 
                          onClick={() => handleMarkAbsent(teacher.id, teacher.subject, teacher.grade)}
                          disabled={loadingId === teacher.id}
                          className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Mark Absent
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleMarkPresent(teacher.id)}
                          className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm"
                        >
                          Mark Present
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {masterFlowResult && showDetails && (
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 p-6 rounded-2xl border-2 border-emerald-500/30 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Sparkles className="w-6 h-6 mr-2 animate-pulse text-emerald-400" /> 
                Master Execution Flow Completed Successfully
              </h3>
              <div className="flex items-center gap-4">
                {executionTime && (
                  <span className="text-sm text-emerald-300 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Completed in {executionTime}ms
                  </span>
                )}
                <button 
                  onClick={() => setShowDetails(false)}
                  className="text-emerald-300 hover:text-white text-sm font-medium"
                >
                  Hide Details
                </button>
              </div>
            </div>

            <div className="bg-[#18181B] p-4 rounded-lg mb-4 border border-[#27272A]">
              <h4 className="font-semibold text-white mb-2 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-emerald-400" />
                Execution Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[#A1A1AA]">Teacher</p>
                  <p className="font-semibold text-white">{masterFlowResult.teacher?.name}</p>
                </div>
                <div>
                  <p className="text-[#A1A1AA]">Subject</p>
                  <p className="font-semibold text-white">{masterFlowResult.teacher?.subject}</p>
                </div>
                <div>
                  <p className="text-[#A1A1AA]">Class</p>
                  <p className="font-semibold text-white">{masterFlowResult.teacher?.class}</p>
                </div>
                <div>
                  <p className="text-[#A1A1AA]">Alerts Sent</p>
                  <p className="font-semibold text-white">{masterFlowResult.statistics?.alertsSent || 0}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#18181B] p-5 rounded-lg shadow-sm border border-[#27272A]">
                <h4 className="font-semibold text-white mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-neonPurple" />
                  Phase 3: AI Continuity Teacher
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-[#A1A1AA] font-medium">Lesson Summary:</p>
                    <p className="text-white">{masterFlowResult.lesson?.lesson_summary}</p>
                  </div>
                  <div>
                    <p className="text-[#A1A1AA] font-medium">Key Concepts:</p>
                    <ul className="list-disc list-inside text-white space-y-1">
                      {masterFlowResult.lesson?.key_concepts?.slice(0, 3).map((concept, idx) => (
                        <li key={idx}>{concept}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-[#18181B] p-5 rounded-lg shadow-sm border border-[#27272A]">
                <h4 className="font-semibold text-white mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-400" />
                  Phase 5: Homework Generated
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-[#A1A1AA] font-medium">Easy Questions:</p>
                    <p className="text-white">{masterFlowResult.homework?.easy?.[0]}</p>
                  </div>
                  <div>
                    <p className="text-[#A1A1AA] font-medium">Medium Questions:</p>
                    <p className="text-white">{masterFlowResult.homework?.medium?.[0]}</p>
                  </div>
                  <div>
                    <p className="text-[#A1A1AA] font-medium">Hard Questions:</p>
                    <p className="text-white">{masterFlowResult.homework?.hard?.[0]}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#18181B] p-5 rounded-lg shadow-sm border border-[#27272A]">
                <h4 className="font-semibold text-white mb-3 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-amber-400" />
                  Phase 6: Attendance Intelligence
                </h4>
                <div className="text-sm">
                  <p className="text-white whitespace-pre-wrap">{masterFlowResult.attendanceInsights}</p>
                </div>
              </div>

              <div className="bg-[#18181B] p-5 rounded-lg shadow-sm border border-[#27272A]">
                <h4 className="font-semibold text-white mb-3 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-rose-400" />
                  Parent Alert System
                </h4>
                <div className="space-y-2">
                  {masterFlowResult.parentAlerts?.map((alert, idx) => (
                    <div key={idx} className="p-2 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-300">
                      {alert}
                    </div>
                  ))}
                  {(!masterFlowResult.parentAlerts || masterFlowResult.parentAlerts.length === 0) && (
                    <p className="text-sm text-[#A1A1AA]">No alerts generated</p>
                  )}
                </div>
              </div>
            </div>

            <details className="mt-4 bg-[#18181B] p-4 rounded-lg border border-[#27272A]">
              <summary className="font-semibold text-white cursor-pointer hover:text-neonPurple transition-colors">
                View Complete Lesson Plan & Notes
              </summary>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <h5 className="font-semibold text-white mb-2">Detailed Explanation:</h5>
                  <p className="text-[#A1A1AA] leading-relaxed">{masterFlowResult.lesson?.explanation}</p>
                </div>
                <div>
                  <h5 className="font-semibold text-white mb-2">Examples:</h5>
                  <ul className="list-decimal list-inside space-y-1 text-[#A1A1AA]">
                    {masterFlowResult.lesson?.examples?.map((example, idx) => (
                      <li key={idx}>{example}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-white mb-2">Class Notes:</h5>
                  <p className="text-[#A1A1AA] whitespace-pre-wrap bg-[#09090B] p-3 rounded border border-[#27272A]">
                    {masterFlowResult.lesson?.class_notes}
                  </p>
                </div>
              </div>
            </details>
          </div>
        )}

        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-8 shadow-xl mt-8 relative overflow-hidden">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-[#8B5CF6] flex items-center justify-center w-10 h-10 rounded-xl bg-[#7C3AED]/10">✨</span>
            How AI Continuity System Works
          </h3>
          <ol className="list-decimal list-inside space-y-3 text-[#A1A1AA] text-sm md:text-base marker:text-[#8B5CF6] marker:font-bold">
            <li><span className="text-white font-medium">Teacher marked absent</span> → System detects issue</li>
            <li>AI loads <span className="text-white font-medium">syllabus context</span> for the class</li>
            <li>Generates <span className="text-white font-medium">comprehensive lesson plan</span> (Phase 3)</li>
            <li>Creates <span className="text-white font-medium">difficulty-based homework</span> (Phase 5)</li>
            <li>Analyzes <span className="text-white font-medium">student attendance patterns</span> (Phase 6)</li>
            <li>Sends <span className="text-white font-medium">automated parent alerts</span> for absent students</li>
            <li>Updates <span className="text-white font-medium">principal dashboard</span> with insights</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
