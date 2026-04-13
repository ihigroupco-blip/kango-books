import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Camera, Image as ImageIcon, X, Receipt } from 'lucide-react';

const empty = { description: '', amount: '', type: 'EXPENSE', date: '', categoryId: '', receiptUrl: '' };

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState({ type: '', page: 1 });
  const [uploading, setUploading] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const load = async () => {
    const params = new URLSearchParams();
    if (filter.type) params.set('type', filter.type);
    params.set('page', filter.page);
    const { data } = await api.get(`/transactions?${params}`);
    setTransactions(data.transactions);
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get('/categories').then(({ data }) => setCategories(data));
  }, [filter]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const openNew = (type = 'INCOME') => {
    setEditing(null);
    setForm({ ...empty, type, date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openReceipt = () => {
    setEditing(null);
    setForm({ ...empty, type: 'EXPENSE', date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
    // Trigger camera/file after modal opens
    setTimeout(() => {
      if (cameraInputRef.current) cameraInputRef.current.click();
    }, 300);
  };

  const openEdit = (tx) => {
    setEditing(tx);
    setForm({
      description: tx.description,
      amount: Number(tx.amount),
      type: tx.type,
      date: tx.date.split('T')[0],
      categoryId: tx.categoryId || '',
      receiptUrl: tx.receiptUrl || '',
    });
    setModalOpen(true);
  };

  const uploadReceipt = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const { data } = await api.post('/upload/receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => {
        const updates = { ...prev, receiptUrl: data.url };
        if (data.ocr?.amount) updates.amount = data.ocr.amount;
        if (data.ocr?.date) updates.date = data.ocr.date;
        if (data.ocr?.description && !prev.description) updates.description = data.ocr.description;
        return updates;
      });
      const filled = [];
      if (data.ocr?.amount) filled.push(`$${data.ocr.amount}`);
      if (data.ocr?.date) filled.push(data.ocr.date);
      if (data.ocr?.description) filled.push(data.ocr.description);
      toast.success(filled.length > 0 ? `Scanned: ${filled.join(', ')}` : 'Receipt uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadReceipt(file);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (!payload.categoryId) delete payload.categoryId;
      if (!payload.receiptUrl) delete payload.receiptUrl;
      if (editing) {
        await api.put(`/transactions/${editing.id}`, payload);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', payload);
        toast.success('Transaction created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}`);
    toast.success('Deleted');
    load();
  };

  const filteredCategories = categories.filter((c) => !form.type || c.type === form.type);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={openReceipt}
            className="flex items-center gap-2 bg-kango-red text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-kango-red/90 transition-colors"
          >
            <Camera size={18} /> Receipt
          </button>
          <button
            onClick={() => openNew('INCOME')}
            className="flex items-center gap-2 bg-kango-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} /> Add
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex gap-2 mb-4">
        {['', 'INCOME', 'EXPENSE'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter({ ...filter, type: t, page: 1 })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter.type === t ? 'bg-kango-navy text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <p className="p-8 text-center text-gray-400">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="p-8 text-center text-gray-400">No transactions found</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="px-5 py-4 flex items-center justify-between">
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  {tx.receiptUrl && (
                    <button
                      onClick={() => setPreviewImg(tx.receiptUrl)}
                      className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200"
                    >
                      <img src={tx.receiptUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                      {tx.receiptUrl && <Receipt size={13} className="text-gray-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.date).toLocaleDateString('en-AU')}
                      {tx.category && ` · ${tx.category.name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span
                    className={`text-sm font-semibold whitespace-nowrap ${
                      tx.type === 'INCOME' ? 'text-emerald-600' : 'text-kango-red'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}$
                    {Number(tx.amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </span>
                  <button onClick={() => openEdit(tx)} className="text-gray-400 hover:text-kango-navy p-1">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(tx.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Image Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-lg w-full">
            <button
              onClick={() => setPreviewImg(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X size={24} />
            </button>
            <img src={previewImg} alt="Receipt" className="w-full rounded-lg shadow-xl" />
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Transaction' : 'New Transaction'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Receipt Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Photo</label>
            {form.receiptUrl ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img src={form.receiptUrl} alt="Receipt" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, receiptUrl: '' })}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-kango-navy hover:text-kango-navy transition-colors"
                >
                  <Camera size={20} />
                  {uploading ? 'Scanning...' : 'Take Photo'}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-kango-navy hover:text-kango-navy transition-colors"
                >
                  <ImageIcon size={20} />
                  {uploading ? 'Scanning...' : 'Choose File'}
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="flex gap-2">
              {['INCOME', 'EXPENSE'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t, categoryId: '' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.type === t
                      ? t === 'INCOME'
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                        : 'bg-red-100 text-red-700 border-2 border-red-300'
                      : 'bg-gray-50 text-gray-500 border-2 border-transparent'
                  }`}
                >
                  {t === 'INCOME' ? 'Income' : 'Expense'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              required
              value={form.description}
              onChange={set('description')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kango-navy/30 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.amount}
                onChange={set('amount')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kango-navy/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={set('date')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kango-navy/30 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.categoryId}
              onChange={set('categoryId')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kango-navy/30 outline-none"
            >
              <option value="">No category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-kango-navy text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            {editing ? 'Update' : 'Create'} Transaction
          </button>
        </form>
      </Modal>
    </div>
  );
}
