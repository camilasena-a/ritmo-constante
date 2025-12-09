import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StudyCycle from './pages/StudyCycle';
import Revisions from './pages/Revisions';
import WeeklyPlan from './pages/WeeklyPlan';
import Statistics from './pages/Statistics';
import Constancy from './pages/Constancy';
import ExamOutline from './pages/ExamOutline';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="study-cycle" element={<StudyCycle />} />
        <Route path="revisions" element={<Revisions />} />
        <Route path="weekly-plan" element={<WeeklyPlan />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="constancy" element={<Constancy />} />
        <Route path="exam-outline" element={<ExamOutline />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;

