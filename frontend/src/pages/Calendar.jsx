import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const typeColors = {
  BOOKING: 'bg-kango-navy/10 text-kango-navy border-l-kango-navy',
  NOTE: 'bg-amber-50 text-amber-700 border-l-amber-400',
  FOLLOWUP: 'bg-purple-50 text-purple-700 border-l-purple-400',
};

const typeBadge = {
  BOOKING: 'bg-kango-navy/10 text-kango-navy',
  NOTE: 'bg-amber-100 text-amber-700',
  FOLLOWUP: 'bg-purple-100 text-purple-700',
};

const empty = { title: '', date: '', startTime: '', endTime: '', type: 'BOOKING', clientId: '', notes: '', location: '' };

export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [selectedDate, setSelectedDate] = useState(null);

  const load = async () => {
    const { data } = await api.get(`/bookings?year=${year}&month=${month}`);
    setBookings(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [year, month]);
  useEffect(() => { api.get('/clients').then(({ data }) => setClients(data)); }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); };

  const openNewOnDate = (dateStr) => {
    setEditing(null);
    setForm({ ...empty, date: dateStr });
    setModalOpen(true);
  };

  const openEdit = (booking) => {
    setEditing(booking);
    setForm({
      title: booking.title,
      date: booking.date.split('T')[0],
      startTime: booking.startTime || '',
      endTime: booking.endTime || '',
      type: booking.type,
      clientId: booking.clientId || '',
      notes: booking.notes || '',
      location: booking.location || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.clientId) delete payload.clientId;
      if (!payload.startTime) delete payload.startTime;
      if (!payload.endTime) delete payload.endTime;
      if (!payload.notes) delete payload.notes;
      if (!payload.location) delete payload.location;

      if (editing) {
        await api.put(`/bookings/${editing.id}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/bookings', payload);
        toast.success('Added');
      }
      setModalOpen(false);
      setSelectedDate(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await api.delete(`/bookings/${id}`);
    toast.success('Deleted');
    setSelectedDate(null);
    load();
  };

  // Calendar grid calculation
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  let startDow = firstDay.getDay() - 1; // Mon=0
  if (startDow < 0) startDow = 6;

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const bookingsOnDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter((b) => b.date.startsWith(dateStr));
  };

  const isToday = (day) =>
    day && year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();

  const dateStr = (day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const selectedBookings = selectedDate ? bookingsOnDay(selectedDate) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <button onClick={goToday} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200">
            Today
          </button>
        </div>
        <button
          onClick={() => openNewOnDate(new Date().toISOString().split('T')[0])}
          className="flex items-center gap-2 bg-kango-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-kango-navy/90 transition-colors"
        >
          <Plus size={18} /> Add Entry
        </button>
      </div>

      {/* Month Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{MONTHS[month - 1]} {year}</h2>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <p className="p-8 text-center text-gray-400">Loading...</p>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dayBookings = bookingsOnDay(day);
              const today = isToday(day);
              const selected = selectedDate === day;
              return (
                <div
                  key={i}
                  onClick={() => day && setSelectedDate(day === selectedDate ? null : day)}
                  className={`min-h-[80px] md:min-h-[100px] border-b border-r border-gray-100 p-1 cursor-pointer transition-colors ${
                    day ? 'hover:bg-gray-50' : 'bg-gray-50/50'
                  } ${selected ? 'bg-kango-navy/5 ring-1 ring-inset ring-kango-navy/20' : ''}`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between px-1">
                        <span
                          className={`text-sm font-medium ${
                            today
                              ? 'bg-kango-navy text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'
                              : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </span>
                        {dayBookings.length > 0 && (
                          <span className="text-[10px] text-gray-400">{dayBookings.length}</span>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {dayBookings.slice(0, 3).map((b) => (
                          <div
                            key={b.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded border-l-2 truncate ${typeColors[b.type]}`}
                          >
                            {b.startTime && <span className="font-medium">{b.startTime} </span>}
                            {b.title}
                          </div>
                        ))}
                        {dayBookings.length > 3 && (
                          <p className="text-[10px] text-gray-400 px-1">+{dayBookings.length - 3} more</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Day Detail Panel */}
      {selectedDate && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              {new Date(year, month - 1, selectedDate).toLocaleDateString('en-AU', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </h3>
            <button
              onClick={() => openNewOnDate(dateStr(selectedDate))}
              className="text-xs bg-kango-navy/10 text-kango-navy rounded px-2 py-1 font-medium hover:bg-kango-navy/20"
            >
              + Add
            </button>
          </div>
          {selectedBookings.length === 0 ? (
            <p className="p-5 text-sm text-gray-400 text-center">Nothing scheduled</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {selectedBookings.map((b) => (
                <div key={b.id} className="px-5 py-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeBadge[b.type]}`}>
                        {b.type}
                      </span>
                      <p className="text-sm font-medium text-gray-900">{b.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-x-3 text-xs text-gray-400 mt-1">
                      {b.startTime && <span>{b.startTime}{b.endTime && ` - ${b.endTime}`}</span>}
                      {b.client && <span>{b.client.name}</span>}
                      {b.location && <span>{b.location}</span>}
                    </div>
                    {b.notes && <p className="text-xs text-gray-500 mt-1">{b.notes}</p>}
                  </div>
                  <div className="flex gap-1 ml-3">
                    <button onClick={() => openEdit(b)} className="text-gray-400 hover:text-kango-navy p-1">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Entry' : 'New Entry'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={set('title')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
              placeholder="Client meeting, Follow-up call..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="flex gap-2">
              {[['BOOKING', 'Booking'], ['NOTE', 'Note'], ['FOLLOWUP', 'Follow-up']].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, type: val })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${
                    form.type === val
                      ? val === 'BOOKING' ? 'bg-kango-navy/10 text-kango-navy border-kango-navy/30'
                        : val === 'NOTE' ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-purple-50 text-purple-700 border-purple-300'
                      : 'bg-gray-50 text-gray-500 border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={set('date')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={set('startTime')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={set('endTime')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              value={form.clientId}
              onChange={set('clientId')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
            >
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              value={form.location}
              onChange={set('location')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
              placeholder="Site address, online..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-kango-navy/30"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-kango-navy text-white py-2.5 rounded-lg font-medium hover:bg-kango-navy/90 transition-colors"
          >
            {editing ? 'Update' : 'Add'} Entry
          </button>
        </form>
      </Modal>
    </div>
  );
}
