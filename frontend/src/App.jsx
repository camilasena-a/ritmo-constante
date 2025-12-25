import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
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
    <ErrorBoundary name="App" showHomeButton>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route 
            path="dashboard" 
            element={
              <ErrorBoundary name="Dashboard">
                <Dashboard />
              </ErrorBoundary>
            } 
          />
          <Route 
            path="study-cycle" 
            element={
              <ErrorBoundary name="StudyCycle">
                <StudyCycle />
              </ErrorBoundary>
            } 
          />
          <Route 
            path="revisions" 
            element={
              <ErrorBoundary name="Revisions">
                <Revisions />
              </ErrorBoundary>
            } 
          />
          <Route 
            path="weekly-plan" 
            element={
              <ErrorBoundary name="WeeklyPlan">
                <WeeklyPlan />
              </ErrorBoundary>
            } 
          />
          <Route 
            path="statistics" 
            element={
              <ErrorBoundary name="Statistics">
                <Statistics />
              </ErrorBoundary>
            } 
          />
          <Route 
            path="constancy" 
            element={
              <ErrorBoundary name="Constancy">
                <Constancy />
              </ErrorBoundary>
            } 
          />
          <Route 
            path="exam-outline" 
            element={
              <ErrorBoundary name="ExamOutline">
                <ExamOutline />
              </ErrorBoundary>
            } 
          />
          <Route 
            path="settings" 
            element={
              <ErrorBoundary name="Settings">
                <Settings />
              </ErrorBoundary>
            } 
          />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

