import { useEffect } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, 3000)

        return () => clearTimeout(timer)
    }, [onClose])

    const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50'
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800'
    const Icon = type === 'success' ? CheckCircle : AlertCircle

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
            <div className={`${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3`}>
                <Icon size={20} />
                <p className="font-medium">{message}</p>
                <button onClick={onClose} className="hover:opacity-75 ml-2">
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}

export default Toast
