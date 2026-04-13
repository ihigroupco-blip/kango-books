import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, ArrowRight, UserPlus } from 'lucide-react';

const STAGES = [
  { key: 'COLD', label: 'Cold', color: 'bg-slate-100 border-slate-300 text-slate-700' },
  { key: 'CONTACTED', label: 'Contacted', color: 'bg-blue-50 border-blue-300 text-blue-700' },
  { key: 'PROPOSAL', label: 'Proposal', color: 'bg-amber-50 border-amber-300 text-amber-700' },
  { key: 'WON', label: 'Won', color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
  { key: 'LOST', label: 'Lost', color: 'bg-red-50 border-red-300 text-red-700' },
];

const stageBadge = {
  COLD: 'bg-slate-200 text-slate-700',
  CONTACTED: 'bg-blue-100 text-blue-700',
  PROPOSAL: 'bg-amber-100 text-amber-700',
  WON: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-red-100 text-red-700',
};

const empty = { name: '', company: '', email: '', phone: '', value: '', notes: '', source: '', status: 'COLD' };

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [view, setView] = useState('pipeline');

  const load = async () => {
    const [leadsRes, statsRes] = await Promise.all([
      api.get('/leads'),
      api.get('/leads/stats'),
    ]);
    setLeads(leadsRes.data.leads);
    setStats(statsRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (lead) => {
    setEditing(lead);
    setForm({
      name: lead.name,
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      value: lead.value ? Number(lead.value) : '',
      notes: lead.notes || '',
      source: lead.source || '',
      status: lead.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.value) payload.value = parseFloat(payload.value);
      else delete payload.value;
      if (!payload.company) delete payload.company;
      if (!payload.email) delete payload.email;
      if (!payload.phone) delete payload.phone;
      if (!payload.notes) delete payload.notes;
      if (!payload.source) delete payload.source;

      if (editing) {
        await api.put(`/leads/${editing.id}`, payload);
        toast.success('Lead updated');
      } else {
        await api.post('/leads', payload);
        toast.success('Lead added');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed');
    }
  };

  const moveStage = async (lead, newStatus) => {
    try {
      const result = await api.patch(`/leads/${lead.id}/status`, { status: newStatus });
      if (result.data.convertedClient) {
        toast.success(`Lead won! Client "${result.data.convertedClient.name}" created`);
      } else {
        toast.success(`Moved to ${newStatus.toLowerCase()}`);
      }
      load();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    await api.delete(`/leads/${id}`);
    toast.success('Deleted');
    load();
  };

  const getNextStage = (current) => {
    const order = ['COLD', 'CONTACTED', 'PROPOSAL', 'WON'];
    const idx = order.indexOf(current);
    if (idx >= 0 && idx < order.length - 1) return order[idx + 1];
    return null;
  };

  const leadsByStatus = (status) => leads.filter((l) => l.status === status);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            {leads.length} lead{leads.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('pipeline')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'pipeline' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-kango-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-kango-navy/90 transition-colors"
          >
            <Plus size={18} /> Add Lead
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {STAGES.map(({ key, label, color }) => (
          <div key={key} className={`rounded-lg border p-3 ${color}`}>
            <p className="text-xs font-medium opacity-75">{label}</p>
            <p className="text-xl font-bold">{stats[key]?.count || 0}</p>
            {stats[key]?.value > 0 && (
              <p className="text-xs opacity-75">${stats[key].value.toLocaleString('en-AU')}</p>
            )}
          </div>
        ))}
      </div>

      {view === 'pipeline' ? (
        /* Pipeline / Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.filter((s) => s.key !== 'LOST').map(({ key, label, color }) => (
            <div key={key} className="flex-shrink-0 w-72">
              <div className={`rounded-t-lg border-t-4 ${color.replace('bg-', 'border-').replace(/50|100/, '400')} bg-gray-50 px-3 py-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                  <span className="text-xs bg-white rounded-full px-2 py-0.5 text-gray-500 font-medium">
                    {leadsByStatus(key).length}
                  </span>
                </div>
              </div>
              <div className="space-y-2 mt-2 min-h-[100px]">
                {leadsByStatus(key).map((lead) => (
                  <div key={lead.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(lead)} className="text-gray-400 hover:text-kango-navy p-0.5">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(lead.id)} className="text-gray-400 hover:text-red-500 p-0.5">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {lead.company && <p className="text-xs text-gray-500">{lead.company}</p>}
                    {lead.email && <p className="text-xs text-gray-400">{lead.email}</p>}
                    {lead.value && (
                      <p className="text-xs font-medium text-emerald-600 mt-1">
                        ${Number(lead.value).toLocaleString('en-AU')}
                      </p>
                    )}
                    {lead.source && (
                      <span className="inline-block text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 mt-1">
                        {lead.source}
                      </span>
                    )}
                    <div className="flex gap-1 mt-2">
                      {getNextStage(key) && (
                        <button
                          onClick={() => moveStage(lead, getNextStage(key))}
                          className="flex items-center gap-1 text-[11px] bg-kango-navy/10 text-kango-navy rounded px-2 py-1 font-medium hover:bg-kango-navy/20 transition-colors"
                        >
                          <ArrowRight size={12} />
                          {STAGES.find((s) => s.key === getNextStage(key))?.label}
                        </button>
                      )}
                      {key !== 'WON' && key !== 'LOST' && (
                        <button
                          onClick={() => moveStage(lead, 'LOST')}
                          className="text-[11px] bg-red-50 text-red-500 rounded px-2 py-1 font-medium hover:bg-red-100 transition-colors"
                        >
                          Lost
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Lost column - collapsed */}
          {leadsByStatus('LOST').length > 0 && (
            <div className="flex-shrink-0 w-60">
              <div className="rounded-t-lg border-t-4 border-red-400 bg-gray-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Lost</span>
                  <span className="text-xs bg-white rounded-full px-2 py-0.5 text-gray-500 font-medium">
                    {leadsByStatus('LOST').length}
                  </span>
                </div>
              </div>
              <div className="space-y-2 mt-2">
                {leadsByStatus('LOST').map((lead) => (
                  <div key={lead.id} className="bg-white rounded-lg border border-gray-200 p-3 opacity-60">
                    <p className="text-sm font-medium text-gray-700">{lead.name}</p>
                    {lead.company && <p className="text-xs text-gray-400">{lead.company}</p>}
                    <button
                      onClick={() => moveStage(lead, 'COLD')}
                      className="text-[11px] text-kango-navy mt-1 hover:underline"
                    >
                      Reopen
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-200">
          {leads.length === 0 ? (
            <p className="p-8 text-center text-gray-400">No leads yet. Add your first one!</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <div key={lead.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageBadge[lead.status]}`}>
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {[lead.company, lead.email, lead.source].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {lead.value && (
                      <span className="text-sm font-medium text-gray-600">
                        ${Number(lead.value).toLocaleString('en-AU')}
                      </span>
                    )}
                    {getNextStage(lead.status) && (
                      <button
                        onClick={() => moveStage(lead, getNextStage(lead.status))}
                        className="text-xs bg-kango-navy/10 text-kango-navy rounded px-2 py-1 font-medium hover:bg-kango-navy/20"
                      >
                        <ArrowRight size={14} />
                      </button>
                    )}
                    <button onClick={() => openEdit(lead)} className="text-gray-400 hover:text-kango-navy p-1">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(lead.id)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Lead' : 'New Lead'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
            <input
              required
              value={form.name}
              onChange={set('name')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              value={form.company}
              onChange={set('company')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
              placeholder="ABC Corp"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.value}
                onChange={set('value')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input
                value={form.source}
                onChange={set('source')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
                placeholder="Cold email, Referral, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <select
              value={form.status}
              onChange={set('status')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
            >
              {STAGES.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
              placeholder="Follow-up details, meeting notes..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-kango-navy text-white py-2.5 rounded-lg font-medium hover:bg-kango-navy/90 transition-colors"
          >
            {editing ? 'Update' : 'Add'} Lead
          </button>
        </form>
      </Modal>
    </div>
  );
}
