import { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingDown, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [selectedClass, setSelectedClass] = useState('All');

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedClass]);

  const fetchAttendanceData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orchestration/attendance/students');
      setStudents(response.data.students || getMockStudents());
      
      const insightsResponse = await axios.post('http://localhost:8000/api/ai/attendance-insights', {
        attendance_history: response.data.students || getMockStudents()
      });
      setInsights(insightsResponse.data.insights);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setStudents(getMockStudents());
      setInsights('Unable to load AI insights. Using local data.');
    } finally {
      setLoading(false);
    }
  };

  const getMockStudents = () => [
    { id: 1, name: 'John Doe', class: 'Class 8', section: 'A', attendance: 72, status: 'Chronic Absenteeism', consecutive: 5, risk: 'high' },
    { id: 2, name: 'Jane Smith', class: 'Class 8', section: 'A', attendance: 95, status: 'Good', consecutive: 0, risk: 'low' },
    { id: 3, name: 'Bob Wilson', class: 'Class 9', section: 'B', attendance: 68, status: 'Attendance Drop', consecutive: 3, risk: 'high' },
    { id: 4, name: 'Alice Brown', class: 'Class 8', section: 'A', attendance: 88, status: 'Good', consecutive: 0, risk: 'low' },
    { id: 5, name: 'Charlie Davis', class: 'Class 9', section: 'A', attendance: 78, status: 'Risky Student', consecutive: 2, risk: 'medium' },
    { id: 6, name: 'Diana Evans', class: 'Class 10', section: 'A', attendance: 92, status: 'Good', consecutive: 0, risk: 'low' },
    { id: 7, name: 'Frank Miller', class: 'Class 8', section: 'B', attendance: 65, status: 'Chronic Absenteeism', consecutive: 6, risk: 'high' },
    { id: 8, name: 'Grace Lee', class: 'Class 9', section: 'A', attendance: 85, status: 'Good', consecutive: 0, risk: 'low' },
  ];

  const handleMarkAbsent = async (studentId) => {
    try {
      await axios.post(`http://localhost:5000/api/orchestration/student/${studentId}/absent`);
      fetchAttendanceData();
    } catch (error) {
      console.error('Error marking absent:', error);
    }
  };

  const getRiskBadge = (risk) => {
    const badges = {
      high: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400', icon: AlertTriangle },
      medium: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', icon: TrendingDown },
      low: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle }
    };
    const badge = badges[risk] || badges.low;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold tracking-wide ${badge.bg} ${badge.text}`}>
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {risk.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === 'Good') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-emerald-500/20 text-xs font-semibold tracking-wide bg-emerald-500/10 text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-rose-500/20 text-xs font-semibold tracking-wide bg-rose-500/10 text-rose-400">
        <XCircle className="w-3.5 h-3.5 mr-1.5" /> {status}
      </span>
    );
  };

  const filteredStudents = selectedClass === 'All' 
    ? students 
    : students.filter(s => s.class === selectedClass);

  const stats = {
    total: students.length,
    highRisk: students.filter(s => s.risk === 'high').length,
    avgAttendance: students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.attendance, 0) / students.length) : 0
  };

  return (
    <div className="w-full min-h-screen bg-[#09090B] p-6 md:p-8 text-[#FAFAFA] font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Attendance Intelligence</h2>
            <p className="text-[#A1A1AA] text-sm">AI-powered attendance tracking and risk profiling.</p>
          </div>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-[#18181B] text-white border border-[#27272A] rounded-xl text-sm font-medium focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-colors"
          >
            <option value="All">All Classes</option>
            <option value="Class 8">Class 8</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 10">Class 10</option>
          </select>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#18181B] border border-[#27272A] p-6 rounded-2xl shadow-xl group hover:border-[#7C3AED]/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#A1A1AA] mb-1">Total Students</p>
                <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
              </div>
              <div className="p-3 bg-[#7C3AED]/10 rounded-xl text-[#8B5CF6]">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-[#18181B] border border-[#27272A] p-6 rounded-2xl shadow-xl group hover:border-rose-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#A1A1AA] mb-1">High Risk Students</p>
                <h3 className="text-3xl font-bold text-white">{stats.highRisk}</h3>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-[#18181B] border border-[#27272A] p-6 rounded-2xl shadow-xl group hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#A1A1AA] mb-1">Average Attendance</p>
                <h3 className="text-3xl font-bold text-white">{stats.avgAttendance}%</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Section */}
        {insights && (
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-xl flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
              <h4 className="text-lg font-bold text-white">AI Attendance Insights</h4>
            </div>
            <div className="bg-[#09090B] p-5 rounded-xl border border-[#27272A]">
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{insights}</p>
            </div>
          </div>
        )}

        {/* Data Table Section */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-[#09090B]/50 border-b border-[#27272A]">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Class & Section</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Attendance %</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Risk Level</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Consecutive Absences</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-[#A1A1AA]">
                      <Clock className="w-6 h-6 animate-spin mx-auto mb-3 text-[#8B5CF6]" />
                      Loading attendance data...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-[#A1A1AA]">
                      No students found for this selection.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-[#27272A]/30 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm font-semibold text-white">{student.name}</td>
                      <td className="px-6 py-4 text-sm text-[#A1A1AA]">{student.class} - {student.section}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-[#27272A] rounded-full h-2 w-24">
                            <div 
                              className={`h-2 rounded-full ${student.attendance >= 85 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : student.attendance >= 70 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}
                              style={{ width: `${student.attendance}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-white">{student.attendance}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(student.status)}</td>
                      <td className="px-6 py-4">{getRiskBadge(student.risk)}</td>
                      <td className="px-6 py-4 text-center">
                        {student.consecutive > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {student.consecutive} days
                          </span>
                        ) : (
                          <span className="text-[#A1A1AA]">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleMarkAbsent(student.id)}
                          className="px-3.5 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-semibold rounded-lg transition-all duration-200 border border-rose-500/20 text-xs shadow-sm"
                        >
                          Mark Absent
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}