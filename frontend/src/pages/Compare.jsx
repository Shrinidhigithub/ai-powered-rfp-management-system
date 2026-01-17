import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Award, Loader2, CheckCircle, AlertCircle, Trophy, X } from 'lucide-react'
import { compareProposals, awardProposal, getRFP } from '../services/api'

function Compare() {
  const { id } = useParams()
  const [rfp, setRfp] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [awarding, setAwarding] = useState(false)
  const [awarded, setAwarded] = useState(false)
  const [error, setError] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ open: false, vendorId: null, vendorName: '' })

  useEffect(() => {
    loadComparison()
  }, [id])

  const loadComparison = async () => {
    try {
      const { data } = await compareProposals(id)
      setRfp(data.rfp)
      setComparison(data.comparison)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to compare proposals')
    } finally {
      setLoading(false)
    }
  }

  const openConfirmModal = (vendorId, vendorName) => {
    setConfirmModal({ open: true, vendorId, vendorName })
  }

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, vendorId: null, vendorName: '' })
  }

  const handleAward = async () => {
    const { vendorId } = confirmModal
    
    setAwarding(true)
    closeConfirmModal()
    try {
      await awardProposal(id, vendorId)
      setAwarded(true)
    } catch (err) {
      setError('Failed to award RFP')
    } finally {
      setAwarding(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 size={32} className="animate-spin mx-auto mb-4" />
        <p>AI is analyzing proposals...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Cannot Compare</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link to={`/rfps/${id}`} className="text-indigo-600 hover:underline">
          Back to RFP
        </Link>
      </div>
    )
  }

  if (awarded) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">RFP Awarded!</h1>
        <p className="text-gray-600 mb-6">
          The RFP has been awarded to {comparison?.recommendation?.recommendedVendorName}
        </p>
        <Link
          to="/"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
        >
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const recommendation = comparison?.recommendation
  const evaluations = comparison?.evaluations || []

  return (
    <div className="max-w-6xl mx-auto">
      <Link to={`/rfps/${id}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft size={20} />
        Back to RFP
      </Link>

      <h1 className="text-2xl font-bold mb-2">Proposal Comparison</h1>
      <p className="text-gray-600 mb-8">{rfp?.title}</p>

      {/* AI Recommendation */}
      {recommendation && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
          <div className="flex items-start gap-4">
            <Trophy size={32} />
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">AI Recommendation</h2>
              <p className="text-lg mb-2">
                <span className="font-semibold">{recommendation.recommendedVendorName}</span> is the recommended vendor
              </p>
              <p className="opacity-90">{recommendation.reasoning}</p>
            </div>
            <button
              onClick={() => openConfirmModal(recommendation.recommendedVendorId, recommendation.recommendedVendorName)}
              disabled={awarding}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 flex items-center gap-2"
            >
              {awarding ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Award size={16} />
              )}
              Award
            </button>
          </div>
        </div>
      )}

      {/* Comparison Matrix */}
      {recommendation?.comparisonMatrix && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Comparison Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {recommendation.comparisonMatrix.headers.map((header, idx) => (
                    <th key={idx} className="text-left py-2 px-4 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recommendation.comparisonMatrix.rows.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="py-2 px-4">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual Evaluations */}
      <h2 className="text-lg font-semibold mb-4">Detailed Evaluations</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {evaluations.map((evaluation) => {
          const isRecommended = evaluation.vendorId === recommendation?.recommendedVendorId
          
          return (
            <div
              key={evaluation.vendorId}
              className={`bg-white rounded-lg shadow p-6 ${
                isRecommended ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {evaluation.vendorName}
                    {isRecommended && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                        Recommended
                      </span>
                    )}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-indigo-600">{evaluation.score}</div>
                  <div className="text-sm text-gray-500">/ 100</div>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{evaluation.summary}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-green-700 mb-2">Strengths</h4>
                  <ul className="space-y-1">
                    {evaluation.strengths?.map((s, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                        <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-red-700 mb-2">Weaknesses</h4>
                  <ul className="space-y-1">
                    {evaluation.weaknesses?.map((w, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                        <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {isRecommended ? (
                <button
                  onClick={() => openConfirmModal(evaluation.vendorId, evaluation.vendorName)}
                  disabled={awarding}
                  className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  <Award size={16} />
                  Award to {evaluation.vendorName}
                </button>
              ) : (
                <button
                  onClick={() => openConfirmModal(evaluation.vendorId, evaluation.vendorName)}
                  disabled={awarding}
                  className="mt-4 w-full border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Award size={16} />
                  Award instead
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-32 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Award size={24} className="text-indigo-600" />
              </div>
              <button
                onClick={closeConfirmModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Award RFP</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to award this RFP to <span className="font-semibold text-indigo-600">{confirmModal.vendorName}</span>? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={closeConfirmModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAward}
                disabled={awarding}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2"
              >
                {awarding ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Award size={16} />
                )}
                Confirm Award
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Compare
