import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import LazyRoute from './components/LazyRoute';

// Lazy loading de todas as páginas para reduzir o bundle inicial
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudyCycle = lazy(() => import('./pages/StudyCycle'));
const Revisions = lazy(() => import('./pages/Revisions'));
const WeeklyPlan = lazy(() => import('./pages/WeeklyPlan'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Constancy = lazy(() => import('./pages/Constancy'));
const ExamOutline = lazy(() => import('./pages/ExamOutline'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <ErrorBoundary name="App" showHomeButton>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route 
            path="dashboard" 
            element={
              <LazyRoute name="Dashboard">
                <Dashboard />
              </LazyRoute>
            } 
          />
          <Route 
            path="study-cycle" 
            element={
              <LazyRoute name="StudyCycle">
                <StudyCycle />
              </LazyRoute>
            } 
          />
          <Route 
            path="revisions" 
            element={
              <LazyRoute name="Revisions">
                <Revisions />
              </LazyRoute>
            } 
          />
          <Route 
            path="weekly-plan" 
            element={
              <LazyRoute name="WeeklyPlan">
                <WeeklyPlan />
              </LazyRoute>
            } 
          />
          <Route 
            path="statistics" 
            element={
              <LazyRoute name="Statistics">
                <Statistics />
              </LazyRoute>
            } 
          />
          <Route 
            path="constancy" 
            element={
              <LazyRoute name="Constancy">
                <Constancy />
              </LazyRoute>
            } 
          />
          <Route 
            path="exam-outline" 
            element={
              <LazyRoute name="ExamOutline">
                <ExamOutline />
              </LazyRoute>
            } 
          />
          <Route 
            path="settings" 
            element={
              <LazyRoute name="Settings">
                <Settings />
              </LazyRoute>
            } 
          />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

