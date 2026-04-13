import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color, subtext }) {
  const iconColors = {
    green: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-kango-red',
    blue: 'bg-kango-navy/15 text-kango-navy',
  };

  const bgColors = {
    green: 'bg-emerald-50/60 border-emerald-200/60',
    red: 'bg-red-50/60 border-red-200/60',
    blue: 'bg-blue-50/60 border-blue-200/60',
  };

  return (
    <div className={`rounded-xl border p-5 ${bgColors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <div className={`p-2 rounded-lg ${iconColors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        ${Number(value).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
      </p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/transactions/summary').then(({ data }) => {
      setSummary(data);
      setLoading(false);
    });
  }, []);

  if (loading)
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here's your financial overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Monthly Income"
          value={summary.monthlyIncome}
          icon={TrendingUp}
          color="green"
          subtext="This month"
        />
        <StatCard
          title="Monthly Expenses"
          value={summary.monthlyExpenses}
          icon={TrendingDown}
          color="red"
          subtext="This month"
        />
        <StatCard
          title="Monthly Profit"
          value={summary.monthlyProfit}
          icon={DollarSign}
          color={summary.monthlyProfit >= 0 ? 'blue' : 'red'}
          subtext="This month"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Income" value={summary.totalIncome} icon={ArrowUpRight} color="green" subtext="All time" />
        <StatCard title="Total Expenses" value={summary.totalExpenses} icon={ArrowDownRight} color="red" subtext="All time" />
        <StatCard
          title="Net Profit"
          value={summary.totalProfit}
          icon={DollarSign}
          color={summary.totalProfit >= 0 ? 'blue' : 'red'}
          subtext="All time"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        {summary.recentTransactions.length === 0 ? (
          <p className="p-5 text-gray-400 text-center">No transactions yet. Add your first one!</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {summary.recentTransactions.map((tx) => (
              <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.date).toLocaleDateString('en-AU')}{' '}
                    {tx.category && `· ${tx.category.name}`}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    tx.type === 'INCOME' ? 'text-emerald-600' : 'text-kango-red'
                  }`}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}$
                  {Number(tx.amount).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
