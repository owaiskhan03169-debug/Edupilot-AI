import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import PrincipalOverview from './pages/PrincipalOverview';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import SmartClassroom from './pages/SmartClassroom';

const Login = () => (
  <div className="flex flex-col h-screen items-center justify-center bg-darkBg">
    <h1 className="text-4xl font-bold text-white mb-6">EduPilot Login</h1>
    <Link to="/principal" className="px-6 py-3 bg-normalPurple text-white font-semibold rounded-lg shadow-lg shadow-normalPurple/20 hover:bg-neonPurple transition-colors">
      Enter Principal Dashboard
    </Link>
  </div>
);

const PrincipalLayout = () => {
  return (
    <div className="flex h-screen w-full bg-darkBg text-white overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto bg-darkBg relative">
        <Routes>
          <Route path="/" element={<PrincipalOverview />} />
          <Route path="/insights" element={<div className="p-8"><div className="text-2xl font-bold text-white bg-darkSurface p-8 rounded-xl border border-borderDark">AI Insights Module coming soon...</div></div>} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/students" element={<Students />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/smart-classroom" element={<SmartClassroom />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/principal/*" element={<PrincipalLayout />} />
      </Routes>
    </Router>
  );
}

export default App;

// Made with Bob
