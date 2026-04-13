import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const empty = { name: '', email: '', phone: '', address: '' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    const { data } = await api.get('/clients');
    setClients(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setForm({ name: client.name, email: client.email || '', phone: client.phone || '', address: client.address || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/clients/${editing.id}`, form);
        toast.success('Client updated');
      } else {
        await api.post('/clients', form);
        toast.success('Client added');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this client? This will also delete their invoices.')) return;
    await api.delete(`/clients/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-kango-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-kango-navy/90 transition-colors"
        >
          <Plus size={18} /> Add Client
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <p className="p-8 text-center text-gray-400">Loading...</p>
        ) : clients.length === 0 ? (
          <p className="p-8 text-center text-gray-400">No clients yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {clients.map((c) => (
              <div key={c.id} className="px-5 py-4 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">
                    {[c.email, c.phone].filter(Boolean).join(' · ')}
                    {c._count?.invoices > 0 && ` · ${c._count.invoices} invoice(s)`}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-kango-navy p-1">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Client' : 'New Client'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={set('name')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={set('phone')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={form.address}
              onChange={set('address')}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-kango-navy text-white py-2.5 rounded-lg font-medium hover:bg-kango-navy/90 transition-colors"
          >
            {editing ? 'Update' : 'Add'} Client
          </button>
        </form>
      </Modal>
    </div>
  );
}
