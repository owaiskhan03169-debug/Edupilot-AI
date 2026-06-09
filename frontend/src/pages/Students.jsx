import { useState, useEffect } from 'react';
import { Users, Mail, Phone, AlertCircle, CheckCircle, Bell } from 'lucide-react';
import axios from 'axios';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, alerts: 0 });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orchestration/students');
      setStudents(response.data.students || getMockStudents());
      calculateStats(response.data.students || getMockStudents());
    } catch (error) {
      console.error('Error fetching students:', error);
      const mockData = getMockStudents();
      setStudents(mockData);
      calculateStats(mockData);
    } finally {
      setLoading(false);
    }
  };

  const getMockStudents = () => [
    { id: 1, name: 'John Doe', class: 'Class 8', section: 'A', rollNumber: '801', parent: 'Robert Doe', phone: '+91-9876543210', email: 'robert@example.com', status: 'absent', alertStatus: 'sent' },
    { id: 2, name: 'Jane Smith', class: 'Class 8', section: 'A', rollNumber: '802', parent: 'Mary Smith', phone: '+91-9876543211', email: 'mary@example.com', status: 'present', alertStatus: 'none' },
    { id: 3, name: 'Bob Wilson', class: 'Class 9', section: 'B', rollNumber: '901', parent: 'Tom Wilson', phone: '+91-9876543212', email: 'tom@example.com', status: 'absent', alertStatus: 'pending' },
    { id: 4, name: 'Alice Brown', class: 'Class 8', section: 'A', rollNumber: '803', parent: 'Sarah Brown', phone: '+91-9876543213', email: 'sarah@example.com', status: 'present', alertStatus: 'none' },
    { id: 5, name: 'Charlie Davis', class: 'Class 9', section: 'A', rollNumber: '902', parent: 'Mike Davis', phone: '+91-9876543214', email: 'mike@example.com', status: 'present', alertStatus: 'none' },
    { id: 6, name: 'Diana Evans', class: 'Class 10', section: 'A', rollNumber: '1001', parent: 'Linda Evans', phone: '+91-9876543215', email: 'linda@example.com', status: 'present', alertStatus: 'none' },
    { id: 7, name: 'Frank Miller', class: 'Class 8', section: 'B', rollNumber: '804', parent: 'James Miller', phone: '+91-9876543216', email: 'james@example.com', status: 'absent', alertStatus: 'sent' },
    { id: 8, name: 'Grace Lee', class: 'Class 9', section: 'A', rollNumber: '903', parent: 'Anna Lee', phone: '+91-9876543217', email: 'anna@example.com', status: 'present', alertStatus: 'none' },
  ];

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      present: data.filter(s => s.status === 'present').length,
      absent: data.filter(s => s.status === 'absent').length,
      alerts: data.filter(s => s.alertStatus === 'sent' || s.alertStatus === 'pending').length
    });
  };

  const handleToggleStatus = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    const newStatus = student.status === 'present' ? 'absent' : 'present';
    
    try {
      await axios.post(`http://localhost:5000/api/orchestration/student/${studentId}/status`, {
        status: newStatus
      });
      
      const updatedStudents = students.map(s => 
        s.id === studentId ? { ...s, status: newStatus, alertStatus: newStatus === 'absent' ? 'pending' : 'none' } : s
      );
      setStudents(updatedStudents);
      calculateStats(updatedStudents);
    } catch (error) {
      console.error('Error updating status:', error);
      const updatedStudents = students.map(s => 
        s.id === studentId ? { ...s, status: newStatus, alertStatus: newStatus === 'absent' ? 'pending' : 'none' } : s
      );
      setStudents(updatedStudents);
      calculateStats(updatedStudents);
    }
  };

  const handleSendAlert = async (studentId) => {
    try {
      await axios.post(`http://localhost:5000/api/orchestration/student/${studentId}/alert`);
      const updatedStudents = students.map(s => 
        s.id === studentId ? { ...s, alertStatus: 'sent' } : s
      );
      setStudents(updatedStudents);
      calculateStats(updatedStudents);
    } catch (error) {
      console.error('Error sending alert:', error);
      const updatedStudents = students.map(s => 
        s.id === studentId ? { ...s, alertStatus: 'sent' } : s
      );
      setStudents(updatedStudents);
      calculateStats(updatedStudents);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'present') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        <CheckCircle className="w-3 h-3 mr-1" /> Present
      </span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
      <AlertCircle className="w-3 h-3 mr-1" /> Absent
    </span>;
  };

  const getAlertBadge = (alertStatus) => {
    const badges = {
      sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Alert Sent' },
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
      none: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'No Alert' }
    };
    const badge = badges[alertStatus] || badges.none;
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
      {badge.label}
    </span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Students Directory</h2>
        <p className="text-slate-500 mt-1">Manage student records and parent communications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Active Students</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</h3>
            </div>
            <Users className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Present Today</p>
              <h3 className="text-3xl font-bold text-emerald-900 mt-1">{stats.present}</h3>
              <p className="text-xs text-slate-400 mt-1">{Math.round((stats.present / stats.total) * 100)}% Turnout</p>
            </div>
            <CheckCircle className="w-10 h-10 text-emerald-600 opacity-50" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Absent Today</p>
              <h3 className="text-3xl font-bold text-rose-900 mt-1">{stats.absent}</h3>
              <p className="text-xs text-slate-400 mt-1">{Math.round((stats.absent / stats.total) * 100)}% Absent</p>
            </div>
            <AlertCircle className="w-10 h-10 text-rose-600 opacity-50" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Parent Alerts</p>
              <h3 className="text-3xl font-bold text-amber-900 mt-1">{stats.alerts}</h3>
              <p className="text-xs text-slate-400 mt-1">Sent/Pending</p>
            </div>
            <Bell className="w-10 h-10 text-amber-600 opacity-50" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
              <th className="p-4">Roll No</th>
              <th className="p-4">Student Name</th>
              <th className="p-4">Class & Section</th>
              <th className="p-4">Parent Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Status</th>
              <th className="p-4">Alert Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-500">Loading students...</td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-500">No students found</td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-slate-600">{student.rollNumber}</td>
                  <td className="p-4 font-semibold text-slate-800">{student.name}</td>
                  <td className="p-4 text-slate-600">{student.class} - {student.section}</td>
                  <td className="p-4 text-slate-600">{student.parent}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center text-xs text-slate-600">
                        <Phone className="w-3 h-3 mr-1" /> {student.phone}
                      </span>
                      <span className="flex items-center text-xs text-slate-600">
                        <Mail className="w-3 h-3 mr-1" /> {student.email}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">{getStatusBadge(student.status)}</td>
                  <td className="p-4">{getAlertBadge(student.alertStatus)}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleToggleStatus(student.id)}
                        className={`px-3 py-1.5 font-medium rounded-lg transition-colors border text-xs ${
                          student.status === 'present' 
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200'
                        }`}
                      >
                        {student.status === 'present' ? 'Mark Absent' : 'Mark Present'}
                      </button>
                      {student.status === 'absent' && student.alertStatus !== 'sent' && (
                        <button 
                          onClick={() => handleSendAlert(student.id)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium rounded-lg transition-colors border border-blue-200 text-xs flex items-center gap-1"
                        >
                          <Bell className="w-3 h-3" /> Send Alert
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Made with Bob
