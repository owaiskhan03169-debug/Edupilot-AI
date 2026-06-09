import { LayoutDashboard, Users, GraduationCap, ClipboardCheck, AlertCircle, MonitorPlay } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/principal' },
    { icon: AlertCircle, label: 'AI Insights', path: '/principal/insights' },
    { icon: Users, label: 'Teachers', path: '/principal/teachers' },
    { icon: GraduationCap, label: 'Students', path: '/principal/students' },
    { icon: ClipboardCheck, label: 'Attendance', path: '/principal/attendance' },
    { icon: MonitorPlay, label: 'Smart Classroom', path: '/principal/smart-classroom' },
  ];

  return (
    <aside className="w-64 shrink-0 h-full bg-[#09090B] border-r border-[#27272A] flex flex-col p-6 z-20">
      <div className="flex items-center gap-3 text-xl font-bold text-white mb-10 px-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#7C3AED]/20">
        </div>
        EduPilot AI
      </div>
      <nav className="flex flex-col space-y-2 flex-1">
        {menuItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            end={item.path === '/principal'} 
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}