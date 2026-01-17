import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Loader2, CheckCircle, FileText } from 'lucide-react'
import { createRFP } from '../services/api'

function CreateRFP() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [createdRFP, setCreatedRFP] = useState(null)

  const exampleInput = `I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty.`

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { data } = await createRFP(input)
      setCreatedRFP(data)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create RFP')
    } finally {
      setLoading(false)
    }
  }

  const useExample = () => {
    setInput(exampleInput)
  }

  if (createdRFP) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-6">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">RFP Created Successfully!</h1>
            <p className="text-gray-600">AI has parsed your requirements into a structured RFP</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">{createdRFP.title}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {createdRFP.budget && (
                <div>
                  <span className="text-gray-500 text-sm">Budget</span>
                  <p className="font-medium">${createdRFP.budget.toLocaleString()} {createdRFP.currency}</p>
                </div>
              )}
              {createdRFP.deliveryDays && (
                <div>
                  <span className="text-gray-500 text-sm">Delivery</span>
                  <p className="font-medium">{createdRFP.deliveryDays} days</p>
                </div>
              )}
              {createdRFP.paymentTerms && (
                <div>
                  <span className="text-gray-500 text-sm">Payment Terms</span>
                  <p className="font-medium">{createdRFP.paymentTerms}</p>
                </div>
              )}
              {createdRFP.warrantyMonths && (
                <div>
                  <span className="text-gray-500 text-sm">Warranty</span>
                  <p className="font-medium">{createdRFP.warrantyMonths} months</p>
                </div>
              )}
            </div>

            <h3 className="font-semibold mb-2">Items</h3>
            <div className="space-y-2">
              {createdRFP.items?.map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded border">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-600">Qty: {item.quantity}</span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500">{item.description}</p>
                  )}
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

          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/rfps/${createdRFP.id}`)}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View RFP & Send to Vendors
            </button>
            <button
              onClick={() => {
                setCreatedRFP(null)
                setInput('')
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New RFP</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={20} className="text-indigo-600" />
            <h2 className="text-lg font-semibold">Describe your procurement needs</h2>
          </div>
          <p className="text-gray-600 text-sm">
            Describe what you want to buy in natural language. Include details like quantities, 
            specifications, budget, delivery timeline, and any other requirements. 
            AI will convert this into a structured RFP.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g., I need to procure 50 office chairs with ergonomic design, mesh back, and adjustable height. Budget is $15,000. Need delivery within 2 weeks..."
            className="w-full h-48 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            disabled={loading}
          />

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="mt-4 flex gap-4">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Create RFP
                </>
              )}
            </button>
            <button
              type="button"
              onClick={useExample}
              disabled={loading}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
            >
              Use Example
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRFP
