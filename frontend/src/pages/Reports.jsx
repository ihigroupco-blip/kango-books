import { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

export default function Reports() {
  const [plData, setPlData] = useState([]);
  const [catData, setCatData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [catType, setCatType] = useState('EXPENSE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/reports/profit-loss?year=${year}`).then(({ data }) => {
      setPlData(data);
      setLoading(false);
    });
  }, [year]);

  useEffect(() => {
    api.get(`/reports/categories?type=${catType}`).then(({ data }) => setCatData(data));
  }, [catType]);

  const totalPL = plData.reduce((s, m) => s + m.profit, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      {/* Monthly P&L */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Monthly Profit & Loss</h2>
            <p className="text-sm text-gray-400">
              Year total: <span className={totalPL >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                ${totalPL.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-16">Loading...</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={plData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Category Breakdown</h2>
          <div className="flex gap-2">
            {['EXPENSE', 'INCOME'].map((t) => (
              <button
                key={t}
                onClick={() => setCatType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  catType === t ? 'bg-kango-navy text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {t === 'EXPENSE' ? 'Expenses' : 'Income'}
              </button>
            ))}
          </div>
        </div>

        {catData.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No data for this category type</p>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="total"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ categoryName, percent }) => `${categoryName} (${(percent * 100).toFixed(0)}%)`}
                >
                  {catData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `$${Number(v).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-full md:w-64 space-y-2">
              {catData.map((c, i) => (
                <div key={c.categoryId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-700">{c.categoryName}</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    ${Number(c.total).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
