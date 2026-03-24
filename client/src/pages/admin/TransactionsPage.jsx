import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactionsAsync } from '../../features/admin/adminSlice';
import Button from '../../components/common/Button';

const TransactionsPage = () => {
  const dispatch = useDispatch();
  const { transactions, loading } = useSelector((state) => state.admin);

  const [status, setStatus] = useState('all');
  const [paymentType, setPaymentType] = useState('all');

  useEffect(() => {
    dispatch(fetchTransactionsAsync({ status, paymentType, page: 1, limit: 25 }));
  }, [dispatch, status, paymentType]);

  const handleRefund = (transaction) => {
    window.alert(`Refund modal placeholder for ${transaction.paymentNumber}.\nFields: amount, reason.`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600">Review payment flow and monitor transaction states.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-gray-300 px-4 py-2">
          {['all', 'pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'disputed'].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select value={paymentType} onChange={(event) => setPaymentType(event.target.value)} className="rounded-xl border border-gray-300 px-4 py-2">
          {['all', 'booking_fee', 'key_money', 'deposit', 'monthly_rent', 'water_bill', 'electricity_bill', 'other'].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Payment #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">Loading transactions...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">No transactions found.</td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.paymentNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.paidBy?.firstName} {item.paidBy?.lastName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.paidTo?.firstName} {item.paidTo?.lastName}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">LKR {Number(item.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-700">{item.paymentType?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.paymentMethod}</td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-700">{item.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => handleRefund(item)}>Refund</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;