import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import HomePage from "./pages/user/HomePage";
import SurveyPage from "./pages/user/SurveyPage";
import Navbar from "./components/user/Navbar";
import Footer from "./components/user/Footer";
import surveyService from "./services/surveyService";
import LoginPage from "./pages/admin/LoginPage";
import AdminLayout from "./components/admin/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import RespondentsPage from "./pages/admin/RespondentsPage";
import QuestionsPage from "./pages/admin/QuestionsPage";
import TokensPage from "./pages/admin/TokensPage";
import ResultsPage from "./pages/admin/ResultsPage";
import authService from "./services/authService";
import AmbilTokenPage from "./pages/user/AmbilTokenPage";
import "./App.css";

const ProtectedAdminRoute = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const admin = await authService.getCurrentAdmin();
        setIsAdminAuthenticated(!!admin);
      } catch (error) {
        setIsAdminAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAdminAuthenticated === null) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        Memverifikasi sesi admin...
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/zonadptk/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const [hasSubmittedSurvey, setHasSubmittedSurvey] = useState(false);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(true);
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(true);
  const [, setCurrentAdmin] = useState(null);

  useEffect(() => {
    const checkUserSubmission = async () => {
      setIsCheckingSubmission(true);
      try {
        const data = await surveyService.checkSubmissionStatus();
        setHasSubmittedSurvey(data.hasSubmitted);
      } catch (error) {
        setHasSubmittedSurvey(false);
      } finally {
        setIsCheckingSubmission(false);
      }
    };

    const checkAdminSession = async () => {
      setIsAdminAuthLoading(true);
      const admin = await authService.getCurrentAdmin();
      setCurrentAdmin(admin);
      setIsAdminAuthLoading(false);
    };

    checkUserSubmission();
    checkAdminSession();
  }, []);

  const UserLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const handleNavigate = (path) => {
      navigate(path);
    };

    return (
      <div className="user-layout-container">
        <Navbar
          onNavigate={handleNavigate}
          isSurveyPage={location.pathname === "/isi-survey"}
          hasSubmitted={hasSubmittedSurvey}
        />

        <main className="main-content-area">{children}</main>
        <Footer />
      </div>
    );
  };

  if (isCheckingSubmission || isAdminAuthLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Memuat aplikasi...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <UserLayout>
              <HomePage />
            </UserLayout>
          }
        />
        <Route
          path="/isi-survey"
          element={
            <UserLayout>
              <SurveyPage
                hasSubmittedInitial={hasSubmittedSurvey}
                onSurveySubmit={() => setHasSubmittedSurvey(true)}
              />
            </UserLayout>
          }
        />

        <Route
          path="/ambiltoken"
          element={
            <UserLayout>
              <AmbilTokenPage />
            </UserLayout>
          }
        />

        <Route path="/zonadptk/login" element={<LoginPage />} />
        <Route
          path="/zonadptk"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="responden" element={<RespondentsPage />} />
          <Route path="kuesioner" element={<QuestionsPage />} />
          <Route path="token" element={<TokensPage />} />
          <Route path="hasil-kuesioner" element={<ResultsPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
