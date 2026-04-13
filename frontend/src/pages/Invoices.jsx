import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Plus, Eye, Trash2, X } from 'lucide-react';

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-400',
};

const emptyItem = { description: '', quantity: 1, unitPrice: '' };

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [form, setForm] = useState({
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    tax: 0,
    notes: '',
    items: [{ ...emptyItem }],
  });

  const load = async () => {
    const { data } = await api.get('/invoices');
    setInvoices(data.invoices);
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get('/clients').then(({ data }) => setClients(data));
  }, []);

  const subtotal = form.items.reduce((s, i) => s + (i.quantity || 0) * (parseFloat(i.unitPrice) || 0), 0);
  const total = subtotal + (parseFloat(form.tax) || 0);

  const updateItem = (idx, key, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [key]: value };
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        tax: parseFloat(form.tax) || 0,
        items: form.items.map((i) => ({
          description: i.description,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
        })),
      };
      await api.post('/invoices', payload);
      toast.success('Invoice created');
      setCreateOpen(false);
      setForm({
        clientId: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        tax: 0,
        notes: '',
        items: [{ ...emptyItem }],
      });
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed');
    }
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/invoices/${id}/status`, { status });
    toast.success(`Marked as ${status.toLowerCase()}`);
    setViewInvoice(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    await api.delete(`/invoices/${id}`);
    toast.success('Deleted');
    load();
  };

  const viewDetail = async (id) => {
    const { data } = await api.get(`/invoices/${id}`);
    setViewInvoice(data);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-kango-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-kango-navy/90 transition-colors"
        >
          <Plus size={18} /> New Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <p className="p-8 text-center text-gray-400">Loading...</p>
        ) : invoices.length === 0 ? (
          <p className="p-8 text-center text-gray-400">No invoices yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <div key={inv.id} className="px-5 py-4 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{inv.invoiceNumber}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status]}`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {inv.client?.name} · Due {new Date(inv.dueDate).toLocaleDateString('en-AU')}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-sm font-semibold text-gray-900">
                    ${Number(inv.total).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </span>
                  <button onClick={() => viewDetail(inv.id)} className="text-gray-400 hover:text-kango-navy p-1">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => handleDelete(inv.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Invoice">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              required
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input
                type="date"
                required
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Line Items</label>
              <button type="button" onClick={addItem} className="text-xs text-primary-light hover:underline">
                + Add item
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input
                    placeholder="Description"
                    required
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-kango-navy/30"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="0.01"
                    step="0.01"
                    required
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-kango-navy/30"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    required
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                    className="w-24 px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-kango-navy/30"
                  />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 p-2">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.tax}
                onChange={(e) => setForm({ ...form, tax: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
              />
            </div>
            <div className="flex flex-col justify-end text-right">
              <p className="text-sm text-gray-500">Subtotal: ${subtotal.toFixed(2)}</p>
              <p className="text-lg font-bold text-gray-900">Total: ${total.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-kango-navy text-white py-2.5 rounded-lg font-medium hover:bg-kango-navy/90 transition-colors"
          >
            Create Invoice
          </button>
        </form>
      </Modal>

      {/* View Invoice Modal */}
      <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)} title={viewInvoice?.invoiceNumber || ''}>
        {viewInvoice && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <div>
                <p className="font-medium text-gray-900">{viewInvoice.client?.name}</p>
                <p className="text-gray-400">{viewInvoice.client?.email}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium h-fit ${statusColors[viewInvoice.status]}`}>
                {viewInvoice.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
              <p>Issued: {new Date(viewInvoice.issueDate).toLocaleDateString('en-AU')}</p>
              <p>Due: {new Date(viewInvoice.dueDate).toLocaleDateString('en-AU')}</p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="text-left py-2">Item</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {viewInvoice.items?.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2">{item.description}</td>
                    <td className="text-right py-2">{Number(item.quantity)}</td>
                    <td className="text-right py-2">${Number(item.unitPrice).toFixed(2)}</td>
                    <td className="text-right py-2">${Number(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-gray-500">
                  <td colSpan={3} className="text-right py-1">Subtotal</td>
                  <td className="text-right py-1">${Number(viewInvoice.subtotal).toFixed(2)}</td>
                </tr>
                <tr className="text-gray-500">
                  <td colSpan={3} className="text-right py-1">Tax</td>
                  <td className="text-right py-1">${Number(viewInvoice.tax).toFixed(2)}</td>
                </tr>
                <tr className="font-bold text-gray-900">
                  <td colSpan={3} className="text-right py-2">Total</td>
                  <td className="text-right py-2">${Number(viewInvoice.total).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            {viewInvoice.notes && (
              <p className="text-sm text-gray-500 italic">{viewInvoice.notes}</p>
            )}

            {viewInvoice.status !== 'PAID' && viewInvoice.status !== 'CANCELLED' && (
              <div className="flex gap-2 pt-2">
                {viewInvoice.status === 'DRAFT' && (
                  <button
                    onClick={() => updateStatus(viewInvoice.id, 'SENT')}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Mark as Sent
                  </button>
                )}
                <button
                  onClick={() => updateStatus(viewInvoice.id, 'PAID')}
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
                >
                  Mark as Paid
                </button>
                <button
                  onClick={() => updateStatus(viewInvoice.id, 'CANCELLED')}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
