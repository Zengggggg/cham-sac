import { useState } from 'react'
import ManageHeader from './ManageHeader.jsx'
import ManageSidebar from './ManageSidebar.jsx'
import './AdminLayout.scss'

function AdminLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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
