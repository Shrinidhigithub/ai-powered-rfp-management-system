import { Outlet, Link, useLocation } from 'react-router-dom'
import { FileText, Users, Plus, Home } from 'lucide-react'

function Layout() {
  const location = useLocation()
  
  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/rfps/new', icon: Plus, label: 'Create RFP' },
    { path: '/vendors', icon: Users, label: 'Vendors' },
  ]
  
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-700 text-white">
        <div className="p-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText size={24} />
            RFP Manager
          </h1>
        </div>
        <nav className="mt-6">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-indigo-600 transition-colors ${
                location.pathname === path ? 'bg-indigo-800' : ''
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
