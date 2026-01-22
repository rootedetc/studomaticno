import { useState, useEffect } from 'react';
import api from '../services/api';
import { Skeleton, SkeletonCard } from '../components/Skeleton';

function Finance() {
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFinance();
  }, []);

  const loadFinance = async () => {
    try {
      const result = await api.getPayments();
      setFinance(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <Skeleton variant="text" height="h-8" width="w-32" className="mb-2" />
          <Skeleton variant="text" width="w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const { transactions, summary } = finance || {};

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 lg:p-6 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financije</h1>
              <p className="text-gray-600 dark:text-gray-400">Pregled financijskih obaveza</p>
            </div>
          </div>

          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Trenutno stanje</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.currentBalance}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Zona: {summary.currentZone}</div>
              </div>
              <div className="card">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ukupno uplaćeno</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.totalPayments.toFixed(2)} €</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{summary.transactionCount} transakcija</div>
              </div>
              <div className="card">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ukupno dugovanje</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.totalDebt.toFixed(2)} €</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Ukupni iznos</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-6">
        <div className="max-w-6xl mx-auto fade-in">
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">Datum</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">Naziv</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hidden md:table-cell">Opis</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">Uplata</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">Dugovanje</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">Stanje</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions && transactions.length > 0 ? (
                    transactions.map((transaction, index) => {
                      const isPayment = transaction.payment && transaction.payment.trim() !== '';
                      const isDebt = transaction.debt && transaction.debt.trim() !== '';
                      
                      return (
                        <tr
                          key={index}
                          className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                            index % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/50'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{transaction.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{transaction.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">{transaction.description || '-'}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {isPayment ? (
                              <span className="text-green-600 dark:text-green-400 font-medium">{transaction.payment} €</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {isDebt ? (
                              <span className="text-red-600 dark:text-red-400 font-medium">{transaction.debt} €</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{transaction.balance} €</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Nema transakcija
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Finance;
