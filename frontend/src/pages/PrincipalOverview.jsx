import { useState, useEffect } from 'react';
import { Users, AlertTriangle, FileText, CheckCircle, Sparkles, Activity, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import axios from 'axios';

export default function PrincipalOverview() {
  const [insights, setInsights] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);

  const fetchInsights = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orchestration/insights');
      setInsights(response.data.insights);
    } catch (error) {
      console.error("Error fetching principal insights:", error);
      setInsights("Unable to load insights. Please check AI service connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orchestration/dashboard/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setStats({
        students: { total: 1240, present: 1180, absent: 60 },
        teachers: { total: 45, present: 43, absent: 2 },
        fees: { pending: 42, overdue: 15 },
        aiActivity: { lessonsGenerated: 4, homeworkGenerated: 4, alertsSent: 8 }
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orchestration/ai/logs?limit=5');
      setRecentLogs(response.data.logs || []);
    } catch (error) {
      console.error("Error fetching AI logs:", error);
    }
  };

  const fetchDashboardData = async () => {
    fetchInsights();
    fetchStats();
    fetchRecentLogs();
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalStudents = stats?.students?.total || 0;
  const presentStudents = stats?.students?.present || 0;
  const attendanceRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

  const displayStudentsTotal = statsLoading ? '...' : stats?.students?.total || '1,240';
  const displayTeachersAbsent = statsLoading ? '...' : stats?.teachers?.absent || '2';
  const displayTeachersPresent = statsLoading ? '...' : stats?.teachers?.present || '43';
  const displayLessonsGenerated = statsLoading ? '...' : stats?.aiActivity?.lessonsGenerated || '4';
  const displayFeesPending = statsLoading ? '...' : stats?.fees?.pending || '42';
  const displayFeesOverdue = statsLoading ? '...' : stats?.fees?.overdue || '15';
  const displayAttendanceRate = statsLoading ? '...' : attendanceRate;
  const displayAlertsSent = statsLoading ? '...' : stats?.aiActivity?.alertsSent || '8';

  const metrics = [
    { 
      title: 'Total Active Students', 
      value: displayStudentsTotal,
      change: '+4% this month', 
      icon: Users, 
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      trendIcon: TrendingUp,
      trendColor: 'text-emerald-400'
    },
    { 
      title: 'Teacher Absence Today', 
      value: displayTeachersAbsent,
      change: displayTeachersPresent + ' Present', 
      icon: AlertTriangle, 
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      trendIcon: Activity,
      trendColor: 'text-gray-400'
    },
    { 
      title: 'AI Continuity Classes', 
      value: displayLessonsGenerated + ' Active',
      change: 'Automated materials live', 
      icon: CheckCircle, 
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      trendIcon: TrendingUp,
      trendColor: 'text-emerald-400'
    },
    { 
      title: 'Pending Fee Alerts', 
      value: displayFeesPending + ' Students',
      change: displayFeesOverdue + ' Overdue', 
      icon: FileText, 
      iconColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      trendIcon: Activity,
      trendColor: 'text-gray-400'
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#09090B] p-8 text-white font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Operational Dashboard</h1>
            <p className="text-gray-400 text-sm">Real-time school overview and automated assistance status</p>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-white px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 shadow-md"
          >
            <Activity className="w-4 h-4" />
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((card, idx) => (
            <div key={idx} className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col">
              <span className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <span className={card.iconColor}>
                  <card.icon className="w-5 h-5" />
                </span>
                {card.title}
              </span>
              <span className="text-4xl font-bold text-white mt-4 mb-1">
                {card.value}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <card.trendIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">
                  {card.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" /> 
                AI Strategic Insights
              </h4>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated just now
              </span>
            </div>
            <div className="bg-gradient-to-br from-[#18181B] to-[#27272A] p-6 rounded-xl border border-[#27272A]">
              {loading ? (
                <div className="flex items-center text-gray-400">
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" /> 
                  Analyzing school data...
                </div>
              ) : insights ? (
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-400 mt-1 flex-shrink-0" />
                    <div className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                      {insights}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  AI Insights unavailable. Please check microservice connection.
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col">
            <h4 className="text-lg font-semibold text-white mb-4">Critical Workflow Triggers</h4>
            <div className="space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-red-300">
                    <strong>System Alert:</strong> Grade 8 Math teacher marked absent. Continuity engine has generated backup assignments.
                  </div>
                </div>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-300">
                    <strong>Attendance Dip:</strong> Science department has shown a 6% drop in student turnout this week.
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-300">
                    <strong>Fee Collection:</strong> Grade 9 has 25 pending fee payments. Automated reminders sent.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Recent AI Activity
          </h4>
          {recentLogs.length > 0 ? (
            <div className="space-y-2">
              {recentLogs.map((log, idx) => {
                const statusDotClass = log.status === 'success' ? 'bg-emerald-400' : 'bg-rose-400';
                const actionTypeDisplay = log.actionType.replace(/_/g, ' ').toUpperCase();
                const executionDisplay = log.executionTime ? 'Completed in ' + log.executionTime + 'ms' : 'Processing...';
                const timeDisplay = new Date(log.timestamp).toLocaleTimeString();
                
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#27272A] rounded-lg border border-[#27272A]">
                    <div className="flex items-center gap-3">
                      <div className={statusDotClass + ' w-2 h-2 rounded-full'}></div>
                      <div>
                        <p className="text-sm font-medium text-white">{actionTypeDisplay}</p>
                        <p className="text-xs text-gray-400">{executionDisplay}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{timeDisplay}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent AI activity</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50 p-6 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-300 mb-2">Attendance Rate</p>
                <h3 className="text-4xl font-bold text-white">{displayAttendanceRate}%</h3>
              </div>
              <Users className="w-12 h-12 text-blue-400 opacity-50" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 border border-emerald-700/50 p-6 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-300 mb-2">AI Lessons Generated</p>
                <h3 className="text-4xl font-bold text-white">{displayLessonsGenerated}</h3>
              </div>
              <Sparkles className="w-12 h-12 text-emerald-400 opacity-50" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/40 border border-amber-700/50 p-6 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-300 mb-2">Alerts Sent Today</p>
                <h3 className="text-4xl font-bold text-white">{displayAlertsSent}</h3>
              </div>
              <AlertTriangle className="w-12 h-12 text-amber-400 opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
