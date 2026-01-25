import { useState, useEffect } from 'react';
import api from '../services/api';
import { Skeleton, SkeletonCard } from '../components/Skeleton';
import TableCard from '../components/TableCard';

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

  const transactionColumns = [
    { key: 'date', label: 'Datum', priority: 'high' },
    { key: 'name', label: 'Naziv', priority: 'high' },
    {
      key: 'payment',
      label: 'Uplata',
      priority: 'high',
      format: (value, row) => {
        const isPayment = value && value.trim() !== '';
        return isPayment ? (
          <span className="text-green-600 dark:text-green-400 font-medium">{value} €</span>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">-</span>
        );
      }
    },
    {
      key: 'debt',
      label: 'Dugovanje',
      priority: 'high',
      format: (value, row) => {
        const isDebt = value && value.trim() !== '';
        return isDebt ? (
          <span className="text-red-600 dark:text-red-400 font-medium">{value} €</span>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">-</span>
        );
      }
    },
    {
      key: 'balance',
      label: 'Stanje',
      priority: 'low',
      format: (value) => (
        <span className="font-medium">{value} €</span>
      )
    },
    {
      key: 'description',
      label: 'Opis',
      priority: 'medium',
      format: (value) => value || '-'
    },
  ];

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
      <div className="loading-container">
        <div className="error-banner">
          {error}
        </div>
      </div>
    );
  }

  const { transactions, summary } = finance || {};

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financije</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pregled financijskih obaveza</p>
            </div>
          </div>

          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat-card">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Trenutno stanje</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.currentBalance}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Zona: {summary.currentZone}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ukupno uplaćeno</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white text-green-600 dark:text-green-400">{summary.totalPayments.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{summary.transactionCount} transakcija</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ukupno dugovanje</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white text-red-600 dark:text-red-400">{summary.totalDebt.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ukupni iznos</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="max-w-6xl mx-auto fade-in">
          {transactions && transactions.length > 0 ? (
            <>
              <div className="hidden md:block table-container">
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="table-header-cell">Datum</th>
                        <th className="table-header-cell">Naziv</th>
                        <th className="table-header-cell hidden md:table-cell">Opis</th>
                        <th className="table-header-cell text-right">Uplata</th>
                        <th className="table-header-cell text-right">Dugovanje</th>
                        <th className="table-header-cell text-right">Stanje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction, index) => {
                        const isPayment = transaction.payment && transaction.payment.trim() !== '';
                        const isDebt = transaction.debt && transaction.debt.trim() !== '';
                        const transactionKey = `${transaction.date}-${transaction.name}-${index}`;

                        return (
                          <tr
                            key={transactionKey}
                            className={`table-row ${index % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}
                          >
                            <td className="table-cell">{transaction.date}</td>
                            <td className="table-cell font-medium">{transaction.name}</td>
                            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{transaction.description || '-'}</td>
                            <td className="table-cell text-right">
                              {isPayment ? (
                                <span className="text-green-600 dark:text-green-400 font-medium">{transaction.payment} €</span>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400">-</span>
                              )}
                            </td>
                            <td className="table-cell text-right">
                              {isDebt ? (
                                <span className="text-red-600 dark:text-red-400 font-medium">{transaction.debt} €</span>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400">-</span>
                              )}
                            </td>
                            <td className="table-cell text-right font-medium">{transaction.balance} €</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:hidden space-y-3">
                {transactions.map((transaction, index) => {
                  const transactionKey = `${transaction.date}-${transaction.name}-${index}`;
                  return (
                    <TableCard
                      key={transactionKey}
                      data={transaction}
                      columns={transactionColumns}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="card text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Nema transakcija</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Finance;
