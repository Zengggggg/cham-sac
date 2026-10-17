import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Footer from './components/layout/Footer.jsx'
import Header from './components/layout/Header.jsx'
import Navbar from './components/layout/Navbar.jsx'
import MessengerButton from './components/layout/MessengerButton.jsx'
import HomePage from './pages/Common/HomePage.jsx'
import ContactUsPage from './pages/Common/ContactUsPage.jsx'
import FAQ from './pages/Common/FAQ.jsx'
import LoginPage from './pages/Authentication/LoginPage.jsx'
import RegisterPage from './pages/Authentication/RegisterPage.jsx'
import ConfirmEmail from './pages/Authentication/ConfirmEmail.jsx'
import CompleteRegister from './pages/Authentication/CompleteRegister.jsx'
import ForgotPassword from './pages/Authentication/ForgotPassword.jsx'
import ResetPassword from './pages/Authentication/Reset_Password.jsx'
import EnterOldPassword from './pages/Authentication/EnterOldPassword.jsx'
import DemoUI from './components/ui/DemoUI.jsx'
import DataPolicy from './pages/Policy/DataPolicy.jsx'
import TermOfPrivacy from './pages/Policy/TermOfPrivacy.jsx'
import TermOfUse from './pages/Policy/TermOfUse.jsx'
import ErrorPage403 from './pages/Error/ErrorPage403.jsx'
import ErrorPage404 from './pages/Error/ErrorPage404.jsx'
import InternetConnection from './pages/Error/InternetConnection.jsx'
import UserProfile from './pages/Profile/UserProfile.jsx'
import AdminDashboard from './pages/Admin/AdminDashboard.jsx'
import AdminListUser from './pages/Admin/AdminListUser.jsx'
import AdminListContact from './pages/Admin/AdminListContact.jsx'
import AdminListOrder from './pages/Admin/AdminListOrder.jsx'
import AdminLayout from './components/layout/AdminLayout.jsx'
import './App.css'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [pathname])

  return null
}

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Header />
      <Navbar />
      <main className="app-main">{children}</main>
      <Footer />
      <MessengerButton />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/complete-register" element={<CompleteRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/enter-old-password" element={<EnterOldPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/user-profile" element={<Layout><UserProfile /></Layout>} />
        <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/users" element={<AdminLayout><AdminListUser /></AdminLayout>} />
        <Route path="/admin/contacts" element={<AdminLayout><AdminListContact /></AdminLayout>} />
        <Route path="/admin/orders" element={<AdminLayout><AdminListOrder /></AdminLayout>} />
        <Route path="/data-policy" element={<Layout><DataPolicy /></Layout>} />
        <Route path="/privacy-policy" element={<Layout><TermOfPrivacy /></Layout>} />
        <Route path="/terms-of-use" element={<Layout><TermOfUse /></Layout>} />
        <Route path="/403" element={<ErrorPage403 />} />
        <Route path="/offline" element={<InternetConnection />} />
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/contact-us"
          element={
            <Layout>
              <ContactUsPage />
            </Layout>
          }
        />
        <Route
          path="/faq"
          element={<Layout><FAQ /></Layout>}
        />
        <Route
          path="/demo-ui"
          element={<Layout><DemoUI /></Layout>}
        />
        <Route
          path="*"
          element={<ErrorPage404 />}
        />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#fffdf8',
            border: 'none',
            borderRadius: '8px',
            color: '#211832',
            fontFamily: 'Be Vietnam Pro, sans-serif',
            fontSize: '14px',
            fontWeight: 700,
          },
          success: { iconTheme: { primary: '#52bcbf', secondary: '#fffdf8' } },
          error: { iconTheme: { primary: '#d52841', secondary: '#fffdf8' } },
        }}
      />
    </BrowserRouter>
  )
}

export default App
