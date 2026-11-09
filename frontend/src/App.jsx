import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './i18n';

// Common Components
import { AccessibilityBar } from './components/common/AccessibilityBar';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AiChatWidget } from './components/ai/AiChatWidget';
import { InstallPwaPrompt } from './components/common/InstallPwaPrompt';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Public Pages
import { Home } from './pages/public/Home';
import { OurDoctors } from './pages/public/OurDoctors';
import { AboutUs } from './pages/public/AboutUs';
import { ContactUs } from './pages/public/ContactUs';

// Auth Pages
import { Login } from './pages/auth/Login';
import { PatientRegister } from './pages/auth/PatientRegister';
import { DoctorRegister } from './pages/auth/DoctorRegister';
import { ForgotPassword } from './pages/auth/ForgotPassword';

// Patient Pages
import { DoctorDetails } from './pages/patient/DoctorDetails';
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { MyAppointments } from './pages/patient/MyAppointments';
import { DigitalPrescriptions } from './pages/patient/DigitalPrescriptions';
import { PatientProfile } from './pages/patient/PatientProfile';

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorProfile } from './pages/doctor/DoctorProfile';
import { ManageAppointments as DoctorAppointments } from './pages/doctor/ManageAppointments';
import { ManageAvailability } from './pages/doctor/ManageAvailability';
import { CreatePrescription } from './pages/doctor/CreatePrescription';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageDoctors } from './pages/admin/ManageDoctors';
import { ManagePatients } from './pages/admin/ManagePatients';
import { ManageAppointments as AdminAppointments } from './pages/admin/ManageAppointments';
import { AdminReports } from './pages/admin/AdminReports';
import { SystemSettings } from './pages/admin/SystemSettings';

// Shared Pages
import { VideoConsultationPage } from './pages/shared/VideoConsultationPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
            <AccessibilityBar />
            <Navbar />

            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/doctors" element={<OurDoctors />} />
                <Route path="/doctors/:doctorId" element={<DoctorDetails />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/contact" element={<ContactUs />} />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<PatientRegister />} />
                <Route path="/register-doctor" element={<DoctorRegister />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Patient Routes */}
                <Route
                  path="/patient"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <PatientDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/appointments"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <MyAppointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/prescriptions"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <DigitalPrescriptions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient/profile"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT']}>
                      <PatientProfile />
                    </ProtectedRoute>
                  }
                />

                {/* Doctor Routes */}
                <Route
                  path="/doctor"
                  element={
                    <ProtectedRoute allowedRoles={['DOCTOR']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/appointments"
                  element={
                    <ProtectedRoute allowedRoles={['DOCTOR']}>
                      <DoctorAppointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/availability"
                  element={
                    <ProtectedRoute allowedRoles={['DOCTOR']}>
                      <ManageAvailability />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/profile"
                  element={
                    <ProtectedRoute allowedRoles={['DOCTOR']}>
                      <DoctorProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/prescriptions/new"
                  element={
                    <ProtectedRoute allowedRoles={['DOCTOR']}>
                      <CreatePrescription />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/doctors"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <ManageDoctors />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/patients"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <ManagePatients />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/appointments"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminAppointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminReports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <SystemSettings />
                    </ProtectedRoute>
                  }
                />

                {/* Shared Video Telehealth Room */}
                <Route
                  path="/consultations/:appointmentId"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR', 'ADMIN']}>
                      <VideoConsultationPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <Footer />

            {/* Floating 24/7 AI Healthcare Assistant */}
            <AiChatWidget />

            {/* Mobile PWA Quick-Install Banner */}
            <InstallPwaPrompt />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
