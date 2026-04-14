import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import {
  Plus, Pencil, Trash2, Car, MapPin, Clock, ArrowRight, Lock,
  Camera, Image as ImageIcon, X, Receipt,
} from 'lucide-react';

const TABS = ['Vehicles', 'Trips', 'Expenses', 'Reports'];

// ─── Vehicles Tab ───
function VehiclesTab() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ rego: '', make: '', model: '', year: '', currentOdometer: '' });

  const load = () => api.get('/vehicles').then(({ data }) => { setVehicles(data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openNew = () => { setEditing(null); setForm({ rego: '', make: '', model: '', year: new Date().getFullYear(), currentOdometer: '' }); setModalOpen(true); };
  const openEdit = (v) => { setEditing(v); setForm({ rego: v.rego, make: v.make, model: v.model, year: v.year, currentOdometer: v.currentOdometer }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/vehicles/${editing.id}`, form); toast.success('Vehicle updated'); }
      else { await api.post('/vehicles', form); toast.success('Vehicle added'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed'); }
  };

  const handleDelete = async (id) => { if (!confirm('Delete this vehicle and all its trips?')) return; await api.delete(`/vehicles/${id}`); toast.success('Deleted'); load(); };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</p>
        <button onClick={openNew} className="flex items-center gap-2 bg-kango-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-kango-navy/90 transition-colors">
          <Plus size={18} /> Add Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <p className="col-span-2 text-center text-gray-400 py-8">Loading...</p> :
          vehicles.length === 0 ? <p className="col-span-2 text-center text-gray-400 py-8">No vehicles yet. Add your first vehicle to start logging trips.</p> :
          vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold bg-kango-navy/10 text-kango-navy px-2 py-0.5 rounded">{v.rego}</span>
                    {v.logbookPeriods?.[0]?.isActive && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Active Logbook</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">{v.year} {v.make} {v.model}</p>
                  <p className="text-xs text-gray-400 mt-1">Odometer: {v.currentOdometer.toLocaleString()} km</p>
                  <p className="text-xs text-gray-400">{v._count?.trips || 0} trips · {v._count?.expenses || 0} expenses</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(v)} className="text-gray-400 hover:text-kango-navy p-1"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(v.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vehicle' : 'Add Vehicle'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration *</label>
            <input required value={form.rego} onChange={set('rego')} placeholder="ABC123" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30 uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
              <input required value={form.make} onChange={set('make')} placeholder="Toyota" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
              <input required value={form.model} onChange={set('model')} placeholder="HiAce" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
              <input type="number" required min="1990" max="2030" value={form.year} onChange={set('year')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Odometer (km) *</label>
              <input type="number" required min="0" value={form.currentOdometer} onChange={set('currentOdometer')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
            </div>
          </div>
          <button type="submit" className="w-full bg-kango-navy text-white py-2.5 rounded-lg font-medium hover:bg-kango-navy/90 transition-colors">
            {editing ? 'Update' : 'Add'} Vehicle
          </button>
        </form>
      </Modal>
    </>
  );
}

// ─── Trips Tab ───
function TripsTab() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({
    vehicleId: '', date: '', startOdometer: '', endOdometer: '',
    startTime: '', endTime: '', startLocation: '', endLocation: '',
    purpose: '', classification: 'BUSINESS',
  });

  const [logbookPeriods, setLogbookPeriods] = useState([]);

  const load = async () => {
    const params = new URLSearchParams();
    if (selectedVehicle) params.set('vehicleId', selectedVehicle);
    if (filterClass) params.set('classification', filterClass);
    const [tripsRes, summaryRes, periodsRes] = await Promise.all([
      api.get(`/trips?${params}`),
      api.get(`/trips/summary${selectedVehicle ? `?vehicleId=${selectedVehicle}` : ''}`),
      api.get(`/logbooks${selectedVehicle ? `?vehicleId=${selectedVehicle}` : ''}`),
    ]);
    setTrips(tripsRes.data.trips);
    setSummary(summaryRes.data);
    setLogbookPeriods(periodsRes.data);
    setLoading(false);
  };

  useEffect(() => { api.get('/vehicles').then(({ data }) => setVehicles(data)); }, []);
  useEffect(() => { load(); }, [selectedVehicle, filterClass]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openNew = async () => {
    setEditing(null);
    const vehicleId = selectedVehicle || vehicles[0]?.id || '';
    let startOdo = '';
    if (vehicleId) {
      try {
        const { data } = await api.get(`/trips/recent?vehicleId=${vehicleId}`);
        if (data?.endOdometer) startOdo = data.endOdometer;
        else {
          const v = vehicles.find((v) => v.id === vehicleId);
          if (v) startOdo = v.currentOdometer;
        }
      } catch { /* ignore */ }
    }
    setForm({
      vehicleId, date: new Date().toISOString().split('T')[0],
      startOdometer: startOdo, endOdometer: '', startTime: '', endTime: '',
      startLocation: '', endLocation: '', purpose: '', classification: 'BUSINESS',
    });
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      vehicleId: t.vehicleId, date: t.date.split('T')[0],
      startOdometer: t.startOdometer, endOdometer: t.endOdometer,
      startTime: t.startTime || '', endTime: t.endTime || '',
      startLocation: t.startLocation, endLocation: t.endLocation,
      purpose: t.purpose, classification: t.classification,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, startOdometer: parseInt(form.startOdometer), endOdometer: parseInt(form.endOdometer) };
      if (!payload.startTime) delete payload.startTime;
      if (!payload.endTime) delete payload.endTime;
      if (editing) { await api.put(`/trips/${editing.id}`, payload); toast.success('Trip updated'); }
      else { await api.post('/trips', payload); toast.success('Trip logged'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed'); }
  };

  const handleDelete = async (id) => { if (!confirm('Delete this trip?')) return; try { await api.delete(`/trips/${id}`); toast.success('Deleted'); load(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } };

  const calcDistance = form.endOdometer && form.startOdometer ? parseInt(form.endOdometer) - parseInt(form.startOdometer) : null;

  // Saved locations for autocomplete
  const savedLocations = JSON.parse(localStorage.getItem('kango_locations') || '[]');

  const saveLocations = () => {
    const locs = new Set(savedLocations);
    if (form.startLocation) locs.add(form.startLocation);
    if (form.endLocation) locs.add(form.endLocation);
    localStorage.setItem('kango_locations', JSON.stringify([...locs].slice(-20)));
  };

  return (
    <>
      {/* Logbook Period Banner */}
      {selectedVehicle && (() => {
        const activePeriod = logbookPeriods.find((p) => p.isActive);
        const validPeriod = logbookPeriods.find((p) => p.isValid && new Date(p.validUntil) > new Date());
        if (activePeriod) {
          const days = Math.floor((new Date() - new Date(activePeriod.startDate)) / (1000 * 60 * 60 * 24));
          const pct = Math.min(100, (days / 84) * 100);
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Active Logbook Period - Day {days} of 84</span>
                {days >= 84 && (
                  <button onClick={async () => { try { await api.post(`/logbooks/${activePeriod.id}/close`); toast.success('Logbook period closed and validated!'); load(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } }}
                    className="text-xs bg-emerald-600 text-white px-3 py-1 rounded font-medium hover:bg-emerald-700">
                    Close & Validate
                  </button>
                )}
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-blue-600 mt-1">{days >= 84 ? 'Minimum 12 weeks reached - ready to close' : `${84 - days} days remaining`}</p>
            </div>
          );
        }
        if (validPeriod) {
          return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-emerald-800">Valid Logbook Period</span>
                <p className="text-xs text-emerald-600">Business use: {Number(validPeriod.businessPct)}% · Valid until {new Date(validPeriod.validUntil).toLocaleDateString('en-AU')}</p>
              </div>
            </div>
          );
        }
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-amber-700">No active logbook period for this vehicle</span>
            <button onClick={async () => { try { await api.post('/logbooks/start', { vehicleId: selectedVehicle }); toast.success('Logbook period started!'); load(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } }}
              className="text-xs bg-kango-navy text-white px-3 py-1.5 rounded font-medium hover:bg-kango-navy/90">
              Start 12-Week Period
            </button>
          </div>
        );
      })()}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Total Trips</p>
            <p className="text-xl font-bold text-gray-900">{summary.totalTrips}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Total KM</p>
            <p className="text-xl font-bold text-gray-900">{summary.totalKm.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50/60 rounded-lg border border-emerald-200/60 p-3">
            <p className="text-xs text-emerald-600">Business</p>
            <p className="text-xl font-bold text-emerald-700">{summary.businessPct}%</p>
            <p className="text-[10px] text-emerald-500">{summary.businessKm.toLocaleString()} km</p>
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Private</p>
            <p className="text-xl font-bold text-gray-600">{(100 - summary.businessPct).toFixed(1)}%</p>
            <p className="text-[10px] text-gray-400">{summary.privateKm.toLocaleString()} km</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
          <option value="">All Vehicles</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.rego} - {v.make} {v.model}</option>)}
        </select>
        <div className="flex gap-1">
          {['', 'BUSINESS', 'PRIVATE'].map((c) => (
            <button key={c} onClick={() => setFilterClass(c)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterClass === c ? 'bg-kango-navy text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {c || 'All'}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={openNew} className="flex items-center gap-2 bg-kango-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-kango-navy/90 transition-colors">
          <Plus size={18} /> Log Trip
        </button>
      </div>

      {/* Trip List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? <p className="p-8 text-center text-gray-400">Loading...</p> :
          trips.length === 0 ? <p className="p-8 text-center text-gray-400">No trips logged yet</p> :
          <div className="divide-y divide-gray-100">
            {trips.map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${t.classification === 'BUSINESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {t.classification}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('en-AU')}</span>
                    {t.vehicle && <span className="text-xs font-medium text-kango-navy">{t.vehicle.rego}</span>}
                    {t.isLocked && <Lock size={12} className="text-gray-400" />}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{t.purpose}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={10} /> {t.startLocation} → {t.endLocation}
                    <span className="ml-2 font-medium text-gray-600">{t.distance} km</span>
                    {t.startTime && <><Clock size={10} className="ml-2" /> {t.startTime}{t.endTime && ` - ${t.endTime}`}</>}
                  </p>
                </div>
                {!t.isLocked && (
                  <div className="flex gap-1 ml-3">
                    <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-kango-navy p-1"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={15} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        }
      </div>

      {/* Trip Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Trip' : 'Log Trip'}>
        <form onSubmit={(e) => { saveLocations(); handleSubmit(e); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
            <select required value={form.vehicleId} onChange={set('vehicleId')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30">
              <option value="">Select vehicle</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.rego} - {v.make} {v.model}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input type="date" required value={form.date} onChange={set('date')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Odometer *</label>
              <input type="number" required min="0" value={form.startOdometer} onChange={set('startOdometer')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Odometer *</label>
              <input type="number" required min="0" value={form.endOdometer} onChange={set('endOdometer')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
              {calcDistance !== null && (
                <p className={`text-xs mt-1 font-medium ${calcDistance > 0 ? 'text-emerald-600' : 'text-kango-red'}`}>
                  {calcDistance > 0 ? `${calcDistance} km` : 'End must be greater than start'}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Location *</label>
              <input required value={form.startLocation} onChange={set('startLocation')} list="locations" placeholder="e.g. Office, Depot" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Location *</label>
              <input required value={form.endLocation} onChange={set('endLocation')} list="locations" placeholder="e.g. Client site" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
            </div>
          </div>
          <datalist id="locations">
            {savedLocations.map((l, i) => <option key={i} value={l} />)}
          </datalist>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={set('startTime')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={set('endTime')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose * <span className="text-gray-400 font-normal">(ATO requires descriptive detail)</span></label>
            <input required minLength="3" value={form.purpose} onChange={set('purpose')} placeholder="e.g. Client visit - Smith & Co for quarterly inspection" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Classification *</label>
            <div className="flex gap-2">
              {['BUSINESS', 'PRIVATE'].map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, classification: c })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border-2 ${
                    form.classification === c
                      ? c === 'BUSINESS' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-gray-100 text-gray-700 border-gray-300'
                      : 'bg-gray-50 text-gray-400 border-transparent'
                  }`}>
                  {c === 'BUSINESS' ? 'Business' : 'Private'}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-kango-navy text-white py-2.5 rounded-lg font-medium hover:bg-kango-navy/90 transition-colors">
            {editing ? 'Update' : 'Log'} Trip
          </button>
        </form>
      </Modal>
    </>
  );
}

// ─── Expenses Tab ───
const EXPENSE_TYPES = ['FUEL', 'TOLLS', 'PARKING', 'MAINTENANCE', 'INSURANCE', 'REGISTRATION', 'OTHER'];
const expenseTypeBadge = {
  FUEL: 'bg-amber-100 text-amber-700', TOLLS: 'bg-blue-100 text-blue-700', PARKING: 'bg-purple-100 text-purple-700',
  MAINTENANCE: 'bg-red-100 text-red-700', INSURANCE: 'bg-emerald-100 text-emerald-700', REGISTRATION: 'bg-gray-100 text-gray-700', OTHER: 'bg-gray-100 text-gray-600',
};

function ExpensesTab() {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [filterType, setFilterType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [form, setForm] = useState({ vehicleId: '', type: 'FUEL', description: '', amount: '', date: '', receiptUrl: '' });

  const load = async () => {
    const params = new URLSearchParams();
    if (selectedVehicle) params.set('vehicleId', selectedVehicle);
    if (filterType) params.set('type', filterType);
    const { data } = await api.get(`/vehicle-expenses?${params}`);
    setExpenses(data.expenses);
    setLoading(false);
  };

  useEffect(() => { api.get('/vehicles').then(({ data }) => setVehicles(data)); }, []);
  useEffect(() => { load(); }, [selectedVehicle, filterType]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openNew = () => { setEditing(null); setForm({ vehicleId: selectedVehicle || vehicles[0]?.id || '', type: 'FUEL', description: '', amount: '', date: new Date().toISOString().split('T')[0], receiptUrl: '' }); setModalOpen(true); };
  const openEdit = (exp) => { setEditing(exp); setForm({ vehicleId: exp.vehicleId, type: exp.type, description: exp.description, amount: Number(exp.amount), date: exp.date.split('T')[0], receiptUrl: exp.receiptUrl || '' }); setModalOpen(true); };

  const uploadReceipt = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const { data } = await api.post('/upload/receipt', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((prev) => {
        const updates = { ...prev, receiptUrl: data.url };
        if (data.ocr?.amount) updates.amount = data.ocr.amount;
        if (data.ocr?.date) updates.date = data.ocr.date;
        if (data.ocr?.description && !prev.description) updates.description = data.ocr.description;
        return updates;
      });
      toast.success(data.ocr?.amount ? `Scanned: $${data.ocr.amount}` : 'Receipt uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) uploadReceipt(f); e.target.value = ''; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (!payload.receiptUrl) delete payload.receiptUrl;
      if (editing) { await api.put(`/vehicle-expenses/${editing.id}`, payload); toast.success('Updated'); }
      else { await api.post('/vehicle-expenses', payload); toast.success('Expense added'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => { if (!confirm('Delete this expense?')) return; await api.delete(`/vehicle-expenses/${id}`); toast.success('Deleted'); load(); };

  return (
    <>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
          <option value="">All Vehicles</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.rego} - {v.make} {v.model}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
          <option value="">All Types</option>
          {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={openNew} className="flex items-center gap-2 bg-kango-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-kango-navy/90 transition-colors">
          <Plus size={18} /> Add Expense
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? <p className="p-8 text-center text-gray-400">Loading...</p> :
          expenses.length === 0 ? <p className="p-8 text-center text-gray-400">No expenses recorded</p> :
          <div className="divide-y divide-gray-100">
            {expenses.map((exp) => (
              <div key={exp.id} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  {exp.receiptUrl && (
                    <button onClick={() => setPreviewImg(exp.receiptUrl)} className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                      <img src={exp.receiptUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${expenseTypeBadge[exp.type]}`}>{exp.type}</span>
                      <p className="text-sm font-medium text-gray-900 truncate">{exp.description}</p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString('en-AU')} {exp.vehicle && `· ${exp.vehicle.rego}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <span className="text-sm font-semibold text-kango-red">${Number(exp.amount).toFixed(2)}</span>
                  <button onClick={() => openEdit(exp)} className="text-gray-400 hover:text-kango-navy p-1"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(exp.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        }
      </div>

      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-lg w-full">
            <button onClick={() => setPreviewImg(null)} className="absolute -top-10 right-0 text-white"><X size={24} /></button>
            <img src={previewImg} alt="Receipt" className="w-full rounded-lg shadow-xl" />
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Expense' : 'Add Vehicle Expense'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Photo</label>
            {form.receiptUrl ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img src={form.receiptUrl} alt="" className="w-full h-full object-contain" />
                <button type="button" onClick={() => setForm({ ...form, receiptUrl: '' })} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm"><X size={14} /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={uploading} className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-kango-navy hover:text-kango-navy">
                  <Camera size={18} /> {uploading ? 'Scanning...' : 'Take Photo'}
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-kango-navy hover:text-kango-navy">
                  <ImageIcon size={18} /> {uploading ? 'Scanning...' : 'Choose File'}
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
              <select required value={form.vehicleId} onChange={set('vehicleId')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30">
                <option value="">Select</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.rego}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select required value={form.type} onChange={set('type')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30">
                {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input required value={form.description} onChange={set('description')} placeholder="e.g. Shell fuel, CityLink toll" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
              <input type="number" step="0.01" min="0.01" required value={form.amount} onChange={set('amount')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" required value={form.date} onChange={set('date')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30" />
            </div>
          </div>
          <button type="submit" className="w-full bg-kango-navy text-white py-2.5 rounded-lg font-medium hover:bg-kango-navy/90 transition-colors">
            {editing ? 'Update' : 'Add'} Expense
          </button>
        </form>
      </Modal>
    </>
  );
}

// ─── Reports Tab ───
function ReportsTab() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [fbtYear, setFbtYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/vehicles').then(({ data }) => { setVehicles(data); if (data[0]) setSelectedVehicle(data[0].id); }); }, []);

  useEffect(() => {
    if (!selectedVehicle) return;
    setLoading(true);
    Promise.all([
      api.get(`/fbt-reports/summary?vehicleId=${selectedVehicle}&fbtYear=${fbtYear}`),
      api.get(`/fbt-reports/expense-summary?vehicleId=${selectedVehicle}&fbtYear=${fbtYear}`),
      api.get(`/fbt-reports/odometer-gaps?vehicleId=${selectedVehicle}`),
    ]).then(([sumRes, expRes, gapRes]) => {
      setSummary(sumRes.data);
      setExpenseBreakdown(expRes.data);
      setGaps(gapRes.data);
      setLoading(false);
    });
  }, [selectedVehicle, fbtYear]);

  const yearOptions = [];
  const cur = new Date().getFullYear();
  for (let y = cur + 1; y >= cur - 4; y--) yearOptions.push(y);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.rego} - {v.make} {v.model}</option>)}
        </select>
        <select value={fbtYear} onChange={(e) => setFbtYear(parseInt(e.target.value))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
          {yearOptions.map((y) => <option key={y} value={y}>FBT {y - 1}-{String(y).slice(-2)}</option>)}
        </select>
        <div className="flex-1" />
        <a href={`/api/fbt-reports/export?vehicleId=${selectedVehicle}&fbtYear=${fbtYear}`} target="_blank"
          className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 font-medium">
          Export CSV
        </a>
      </div>

      {loading ? <p className="text-center text-gray-400 py-16">Loading...</p> : summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total KM</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalKm.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{summary.tripCount} trips</p>
            </div>
            <div className="bg-emerald-50/60 rounded-lg border border-emerald-200/60 p-4">
              <p className="text-xs text-emerald-600">Business Use</p>
              <p className="text-2xl font-bold text-emerald-700">{summary.appliedBusinessPct}%</p>
              <p className="text-xs text-emerald-500">{summary.businessKm.toLocaleString()} km</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">${summary.totalExpenses.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-kango-navy/5 rounded-lg border border-kango-navy/20 p-4">
              <p className="text-xs text-kango-navy">Deductible</p>
              <p className="text-2xl font-bold text-kango-navy">${summary.deductibleExpenses.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-gray-400">@ {summary.appliedBusinessPct}% business</p>
            </div>
          </div>

          {/* Logbook Period Status */}
          {summary.validLogbookPeriod ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-emerald-800 font-medium">Valid logbook period active</p>
              <p className="text-xs text-emerald-600">Established business use: {summary.validLogbookPeriod.businessPct}% · Valid until {new Date(summary.validLogbookPeriod.validUntil).toLocaleDateString('en-AU')}</p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800 font-medium">No validated logbook period</p>
              <p className="text-xs text-amber-600">You need a completed 12-week logbook period to establish your business use percentage for FBT purposes.</p>
            </div>
          )}

          {/* Expense Breakdown */}
          {expenseBreakdown.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Expense Breakdown</h3>
              <div className="space-y-2">
                {expenseBreakdown.map((e) => {
                  const pct = summary.totalExpenses > 0 ? (e.total / summary.totalExpenses) * 100 : 0;
                  return (
                    <div key={e.type} className="flex items-center gap-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium w-24 text-center ${expenseTypeBadge[e.type] || 'bg-gray-100 text-gray-600'}`}>{e.type}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-kango-navy h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-24 text-right">${e.total.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Odometer Gaps */}
          {gaps.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-4">
              <h3 className="text-sm font-semibold text-red-800 mb-2">Odometer Gaps Detected ({gaps.length})</h3>
              <p className="text-xs text-red-600 mb-3">The ATO may flag missing or overlapping odometer records. Review and correct these entries.</p>
              <div className="space-y-2">
                {gaps.slice(0, 10).map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${g.type === 'missing' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {g.type === 'missing' ? `+${g.gapKm} km gap` : `${g.gapKm} km overlap`}
                    </span>
                    <span className="text-gray-500">
                      between {new Date(g.afterTrip.date).toLocaleDateString('en-AU')} (odo {g.afterTrip.endOdometer})
                      and {new Date(g.beforeTrip.date).toLocaleDateString('en-AU')} (odo {g.beforeTrip.startOdometer})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gaps.length === 0 && summary.tripCount > 1 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-emerald-800 font-medium">No odometer gaps detected</p>
              <p className="text-xs text-emerald-600">All trip odometer readings are consecutive and consistent.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ─── Main Logbook Page ───
export default function Logbook() {
  const [activeTab, setActiveTab] = useState('Vehicles');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">FBT Logbook</h1>
      <p className="text-sm text-gray-500 mb-5">ATO-compliant vehicle logbook & expense tracking</p>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[80px] px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Vehicles' && <VehiclesTab />}
      {activeTab === 'Trips' && <TripsTab />}
      {activeTab === 'Expenses' && <ExpensesTab />}
      {activeTab === 'Reports' && <ReportsTab />}
    </div>
  );
}
