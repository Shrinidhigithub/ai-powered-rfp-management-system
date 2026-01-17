import { AlertTriangle, X, Loader2 } from 'lucide-react'

function ConfirmationModal({ isOpen, title, message, onConfirm, onClose, loading, confirmText = 'Delete', confirmColor = 'bg-red-600 hover:bg-red-700' }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 pt-20 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 animate-scale-in">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-full">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-gray-600 mb-6">{message}</p>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`${confirmColor} text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50`}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmationModal
