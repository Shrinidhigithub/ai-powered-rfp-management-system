import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Send, Loader2, Check, X, Mail, BarChart3, Plus, ExternalLink, CheckCircle } from 'lucide-react'
import { getRFP, getVendors, sendRFP, simulateResponse } from '../services/api'

function RFPDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfp, setRfp] = useState(null)
  const [vendors, setVendors] = useState([])
  const [selectedVendors, setSelectedVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [showSimulate, setShowSimulate] = useState(false)
  const [simulateVendor, setSimulateVendor] = useState('')
  const [simulateContent, setSimulateContent] = useState('')
  const [simulating, setSimulating] = useState(false)
  const [emailPreviews, setEmailPreviews] = useState([])
  const [showEmailSuccess, setShowEmailSuccess] = useState(false)
  const [emailMode, setEmailMode] = useState('ethereal')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [rfpRes, vendorsRes] = await Promise.all([
        getRFP(id),
        getVendors()
      ])
      setRfp(rfpRes.data)
      setVendors(vendorsRes.data)
    } catch (err) {
      setError('Failed to load RFP')
    } finally {
      setLoading(false)
    }
  }

  const toggleVendor = (vendorId) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    )
  }

  const handleSend = async () => {
    if (selectedVendors.length === 0) return
    
    setSending(true)
    setError(null)
    try {
      const response = await sendRFP(id, selectedVendors)
      
      // Store email mode and previews
      setEmailMode(response.data.emailMode || 'ethereal')
      
      // Build email preview data for the modal
      const previews = response.data.results.map(r => ({
        vendorName: r.vendorName,
        vendorEmail: vendors.find(v => v.id === r.vendorId)?.email || '',
        previewUrl: r.previewUrl,
        status: r.status
      }))
      setEmailPreviews(previews)
      setShowEmailSuccess(true)
      
      await loadData()
      setSelectedVendors([])
    } catch (err) {
      setError('Failed to send RFP')
    } finally {
      setSending(false)
    }
  }

  const handleSimulate = async () => {
    if (!simulateVendor || !simulateContent) return
    
    setSimulating(true)
    try {
      await simulateResponse(id, simulateVendor, simulateContent)
      await loadData()
      setShowSimulate(false)
      setSimulateContent('')
      setSimulateVendor('')
    } catch (err) {
      setError('Failed to simulate response')
    } finally {
      setSimulating(false)
    }
  }

  const exampleResponse = `Thank you for the RFP. Here is our proposal:

Laptops (20 units):
- Model: Dell Latitude 5540
- 16GB RAM, 512GB SSD
- Price: $1,100 per unit
- Subtotal: $22,000

Monitors (15 units):
- Model: Dell P2723D 27-inch
- Price: $350 per unit
- Subtotal: $5,250

Total Price: $27,250

Delivery: 21 business days
Warranty: 3 years on-site
Payment Terms: Net 30

Best regards,
TechSupply Sales Team`

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!rfp) {
    return <div className="text-center py-12 text-red-600">RFP not found</div>
  }

  const sentVendorIds = rfp.rfpVendors?.map(rv => rv.vendorId) || []

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">{rfp.title}</h1>
          <p className="text-gray-600">{rfp.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          rfp.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
          rfp.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
          rfp.status === 'EVALUATING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {rfp.status}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-5 gap-6">
        {/* RFP Details */}
        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">RFP Details</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {rfp.budget && (
                <div>
                  <span className="text-gray-500 text-sm">Budget</span>
                  <p className="font-medium">${rfp.budget.toLocaleString()}</p>
                </div>
              )}
              {rfp.deliveryDays && (
                <div>
                  <span className="text-gray-500 text-sm">Delivery</span>
                  <p className="font-medium">{rfp.deliveryDays} days</p>
                </div>
              )}
              {rfp.paymentTerms && (
                <div>
                  <span className="text-gray-500 text-sm">Payment Terms</span>
                  <p className="font-medium">{rfp.paymentTerms}</p>
                </div>
              )}
              {rfp.warrantyMonths && (
                <div>
                  <span className="text-gray-500 text-sm">Warranty</span>
                  <p className="font-medium">{rfp.warrantyMonths} months</p>
                </div>
              )}
            </div>

            <h3 className="font-semibold mb-2">Items</h3>
            <div className="space-y-2">
              {rfp.items?.map((item) => (
                <div key={item.id} className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.name}</span>
                    <span>Qty: {item.quantity}</span>
                  </div>
                  {item.specifications && Object.keys(item.specifications).length > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      {Object.entries(item.specifications).map(([key, value]) => (
                        <span key={key} className="mr-3">{key}: {value}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Proposals */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Proposals Received ({rfp.proposals?.length || 0})</h2>
              {rfp.proposals?.length > 0 && (
                <Link
                  to={`/rfps/${id}/compare`}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 text-sm"
                >
                  <BarChart3 size={16} />
                  Compare & Evaluate
                </Link>
              )}
            </div>

            {rfp.proposals?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail size={32} className="mx-auto mb-2 opacity-50" />
                <p>No proposals received yet</p>
                <button
                  onClick={() => setShowSimulate(true)}
                  className="mt-4 text-indigo-600 hover:underline text-sm flex items-center gap-1 mx-auto"
                >
                  <Plus size={14} />
                  Simulate vendor response (for testing)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {rfp.proposals.map((proposal) => (
                  <div key={proposal.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{proposal.vendor.name}</h3>
                        <p className="text-sm text-gray-500">{proposal.vendor.email}</p>
                      </div>
                      {proposal.totalPrice && (
                        <span className="text-lg font-semibold text-green-600">
                          ${proposal.totalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-4 text-sm text-gray-600">
                      {proposal.deliveryDays && <span>Delivery: {proposal.deliveryDays} days</span>}
                      {proposal.warranty && <span>Warranty: {proposal.warranty}</span>}
                      {proposal.aiScore && <span>AI Score: {proposal.aiScore}/100</span>}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowSimulate(true)}
                  className="w-full mt-2 text-indigo-600 hover:bg-indigo-50 p-2 rounded text-sm flex items-center gap-1 justify-center"
                >
                  <Plus size={14} />
                  Simulate another response
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Vendors Sidebar */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Send to Vendors</h2>
            
            {vendors.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p className="mb-2">No vendors yet</p>
                <Link to="/vendors" className="text-indigo-600 hover:underline text-sm">
                  Add vendors
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {vendors.map((vendor) => {
                    const isSent = sentVendorIds.includes(vendor.id)
                    const isSelected = selectedVendors.includes(vendor.id)
                    
                    return (
                      <label
                        key={vendor.id}
                        className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                          isSent 
                            ? 'bg-green-50 cursor-default' 
                            : isSelected 
                              ? 'bg-indigo-50 border-indigo-200 border' 
                              : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                          {isSent ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleVendor(vendor.id)}
                              className="w-4 h-4 rounded text-indigo-600"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{vendor.name}</p>
                          <p className="text-xs text-gray-500 truncate">{vendor.email}</p>
                        </div>
                        {isSent && (
                          <span className="text-xs text-green-600 font-medium flex-shrink-0 bg-green-100 px-2 py-1 rounded">Sent</span>
                        )}
                      </label>
                    )
                  })}
                </div>

                <button
                  onClick={handleSend}
                  disabled={sending || selectedVendors.length === 0}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send RFP ({selectedVendors.length})
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Simulate Response Modal */}
      {showSimulate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Simulate Vendor Response</h2>
              <button onClick={() => setShowSimulate(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Vendor</label>
                <select
                  value={simulateVendor}
                  onChange={(e) => setSimulateVendor(e.target.value)}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Select a vendor...</option>
                  {vendors.filter(v => sentVendorIds.includes(v.id)).map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">Email Content</label>
                  <button 
                    onClick={() => setSimulateContent(exampleResponse)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Use example
                  </button>
                </div>
                <textarea
                  value={simulateContent}
                  onChange={(e) => setSimulateContent(e.target.value)}
                  placeholder="Paste or type vendor's email response..."
                  className="w-full h-48 border rounded-lg p-3 text-sm"
                />
              </div>
              
              <button
                onClick={handleSimulate}
                disabled={simulating || !simulateVendor || !simulateContent}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {simulating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  'Process Response'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Success Modal */}
      {showEmailSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Emails Sent Successfully!</h3>
                <p className="text-sm text-gray-600">
                  {emailMode === 'gmail' 
                    ? 'Emails delivered to real inboxes!' 
                    : 'View sent emails using the links below'}
                </p>
              </div>
            </div>

            {emailMode === 'gmail' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800 font-medium mb-2">✅ Real Email Delivery (Gmail)</p>
                <p className="text-xs text-green-700">
                  Emails have been sent to the actual vendor email addresses. Check their inboxes!
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-2">📧 Using Ethereal Test Email</p>
                <p className="text-xs text-blue-700">
                  Ethereal is a test SMTP service. Click the preview links to view sent emails.
                </p>
              </div>
            )}

            <div className="space-y-3 mb-4">
              <p className="text-sm font-medium text-gray-700">Sent to vendors:</p>
              {emailPreviews.map((preview, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{preview.vendorName}</p>
                      <p className="text-sm text-gray-600">{preview.vendorEmail}</p>
                    </div>
                    {emailMode === 'gmail' ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle size={14} />
                        Delivered
                      </span>
                    ) : preview.previewUrl ? (
                      <a
                        href={preview.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700"
                      >
                        <ExternalLink size={14} />
                        View Email
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500">No preview</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowEmailSuccess(false)}
              className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RFPDetail
