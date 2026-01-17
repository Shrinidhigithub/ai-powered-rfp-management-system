import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { Link } from 'react-router-dom'
import { FileText, Plus, Clock, CheckCircle, Send, Award } from 'lucide-react'
import { getRFPs } from '../services/api'

const statusConfig = {
  DRAFT: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Draft' },
  SENT: { color: 'bg-blue-100 text-blue-800', icon: Send, label: 'Sent' },
  EVALUATING: { color: 'bg-yellow-100 text-yellow-800', icon: FileText, label: 'Evaluating' },
  AWARDED: { color: 'bg-green-100 text-green-800', icon: Award, label: 'Awarded' },
  CLOSED: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, label: 'Closed' },
}

function Dashboard() {
  const [rfps, setRfps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadRFPs()
    // Connect to socket.io for real-time updates
    const socket = io('http://localhost:3001', {
      transports: ['websocket'],
      withCredentials: true
    });
    socket.on('proposal-received', (data) => {
      // Refresh RFPs when a new proposal is received
      loadRFPs();
    });
    return () => {
      socket.disconnect();
    };
  }, [])

  const loadRFPs = async () => {
    try {
      const { data } = await getRFPs()
      // Only show non-awarded RFPs on the dashboard
      setRfps((data || []).filter(r => r.status !== 'AWARDED'))
    } catch (err) {
      setError('Failed to load RFPs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">RFP Dashboard</h1>
        <Link
          to="/rfps/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Create RFP
        </Link>
      </div>

      {rfps.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No RFPs yet</h2>
          <p className="text-gray-600 mb-4">Create your first RFP to get started</p>
          <Link
            to="/rfps/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus size={20} />
            Create RFP
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {rfps.map((rfp) => {
            const status = statusConfig[rfp.status] || statusConfig.DRAFT
            const StatusIcon = status.icon
            
            return (
              <Link
                key={rfp.id}
                to={`/rfps/${rfp.id}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">{rfp.title}</h2>
                    <p className="text-gray-600 text-sm mb-3">{rfp.description}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      {rfp.budget && (
                        <span>Budget: ${rfp.budget.toLocaleString()}</span>
                      )}
                      {rfp.deliveryDays && (
                        <span>Delivery: {rfp.deliveryDays} days</span>
                      )}
                      <span>{rfp.items?.length || 0} items</span>
                      <span>{rfp._count?.proposals || 0} proposals</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${status.color}`}>
                    <StatusIcon size={14} />
                    {status.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Dashboard
