import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Footer from './components/layout/Footer.jsx'
import Header from './components/layout/Header.jsx'
import Navbar from './components/layout/Navbar.jsx'
import MessengerButton from './components/layout/MessengerButton.jsx'
import HomePage from './pages/Common/HomePage.jsx'
import ContactUsPage from './pages/Common/ContactUsPage.jsx'
import LoginPage from './pages/Authentication/LoginPage.jsx'
import DemoUI from './components/ui/DemoUI.jsx'
import './App.css'

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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
          path="/demo-ui"
          element={<Layout><DemoUI /></Layout>}
        />
        <Route
          path="*"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
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
