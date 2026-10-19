import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import ManageHeader from './ManageHeader.jsx'
import ManageSidebar from './ManageSidebar.jsx'
import { getStoredUser } from '../../services/apiClient.js'
import './AdminLayout.scss'

function AdminLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const user = getStoredUser()

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/403" replace />

  return (
    <div className={`admin-layout${isSidebarCollapsed ? ' admin-layout--sidebar-collapsed' : ''}`}>
      <ManageSidebar
        isCollapsed={isSidebarCollapsed}
      />
      <div className="admin-layout__main">
        <ManageHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        />
        <main className="admin-layout__content">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout
