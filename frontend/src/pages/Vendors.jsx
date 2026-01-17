import { useState, useEffect } from 'react'
import { Plus, X, Loader2, Pencil, Trash2 } from 'lucide-react'
import { getVendors, createVendor, updateVendor, deleteVendor } from '../services/api'
import Toast from '../components/Toast'
import ConfirmationModal from '../components/ConfirmationModal'

function Vendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    contactPerson: '',
    phone: '',
    address: '',
  })
  const [toast, setToast] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, vendor: null })

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      const { data } = await getVendors()
      setVendors(data)
    } catch (err) {
      setError('Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor)
      setForm({
        name: vendor.name,
        email: vendor.email,
        contactPerson: vendor.contactPerson || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
      })
    } else {
      setEditingVendor(null)
      setForm({ name: '', email: '', contactPerson: '', phone: '', address: '' })
    }
    setShowModal(true)
    setError(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingVendor(null)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (editingVendor) {
        await updateVendor(editingVendor.id, form)
        setToast({ message: 'Vendor updated successfully', type: 'success' })
      } else {
        await createVendor(form)
        setToast({ message: 'Vendor created successfully', type: 'success' })
      }
      await loadVendors()
      closeModal()
    } catch (err) {
      setToast({ message: err.response?.data?.error?.message || 'Failed to save vendor', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const openDeleteModal = (vendor) => {
    setDeleteModal({ isOpen: true, vendor })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, vendor: null })
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.vendor) return

    setSaving(true)
    try {
      await deleteVendor(deleteModal.vendor.id)
      setToast({ message: 'Vendor deleted successfully', type: 'success' })
      await loadVendors()
      closeDeleteModal()
    } catch (err) {
      setToast({ message: 'Failed to delete vendor', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={20} />
          Add Vendor
        </button>
      </div>

      {error && !showModal && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {vendors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4">No vendors yet</p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus size={20} />
            Add your first vendor
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Contact</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Phone</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">RFPs</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{vendor.name}</td>
                  <td className="px-6 py-4 text-gray-600">{vendor.email}</td>
                  <td className="px-6 py-4 text-gray-600">{vendor.contactPerson || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{vendor.phone || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{vendor._count?.rfpVendors || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openModal(vendor)}
                        className="p-1 text-gray-500 hover:text-indigo-600"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(vendor)}
                        className="p-1 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Person</label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  rows={2}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Vendor"
        message={`Are you sure you want to delete ${deleteModal.vendor?.name}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onClose={closeDeleteModal}
        loading={saving}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default Vendors
