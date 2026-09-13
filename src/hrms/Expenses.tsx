import { useState } from 'react';
import { PageHeader, DataTable } from '../components/ui/Dashboard';
import { Button } from '../components/ui/Form';
import { Badge } from '../components/ui/Notifications';

// Mock expense data
const initialExpenses = [
  {
    id: '1',
    title: 'Business Trip - London Conference',
    amount: 1250.00,
    date: '2025-05-12',
    category: 'Travel',
    status: 'Pending'
  },
  {
    id: '2',
    title: 'Team Lunch',
    amount: 187.50,
    date: '2025-05-08',
    category: 'Meals',
    status: 'Approved'
  },
  {
    id: '3',
    title: 'Office Supplies',
    amount: 75.25,
    date: '2025-05-05',
    category: 'Supplies',
    status: 'Reimbursed'
  },
  {
    id: '4',
    title: 'Software Subscription',
    amount: 49.99,
    date: '2025-05-01',
    category: 'Subscription',
    status: 'Rejected'
  }
];

const EXPENSE_CATEGORIES = ['Travel', 'Meals', 'Supplies', 'Subscription', 'Other'];

// Column definitions for the expense table
const expenseColumns = [
  { key: 'title', label: 'Description' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' }
];

export default function Expenses() {
  // Was `const [expenses] = useState(...)` — setter never destructured, so
  // this page was entirely read-only/decorative regardless of what buttons
  // it showed.
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'Travel', date: new Date().toISOString().split('T')[0] });
  const [editExpense, setEditExpense] = useState<typeof initialExpenses[number] | null>(null);

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Format date values
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render expense status with appropriate styling
  const renderExpenseStatus = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="warning" rounded>{status}</Badge>;
      case 'Approved':
        return <Badge variant="info" rounded>{status}</Badge>;
      case 'Reimbursed':
        return <Badge variant="success" rounded>{status}</Badge>;
      case 'Rejected':
        return <Badge variant="danger" rounded>{status}</Badge>;
      default:
        return <Badge variant="secondary" rounded>{status}</Badge>;
    }
  };

  // Format data for the table, including formatted date, amount and status
  const formattedExpenses = expenses.map(expense => ({
    ...expense,
    amount: formatCurrency(expense.amount),
    date: formatDate(expense.date),
    status: renderExpenseStatus(expense.status)
  }));

  const handleAddExpense = () => {
    const amount = parseFloat(newExpense.amount);
    if (!newExpense.title || Number.isNaN(amount)) return;
    setExpenses(prev => [
      { id: Date.now().toString(), title: newExpense.title, amount, date: newExpense.date, category: newExpense.category, status: 'Pending' },
      ...prev,
    ]);
    setShowAddModal(false);
    setNewExpense({ title: '', amount: '', category: 'Travel', date: new Date().toISOString().split('T')[0] });
  };

  const handleApprove = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'Approved' } : e));
  };

  const handleReject = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'Rejected' } : e));
  };

  const renderExpenseActions = (row: Record<string, any>) => {
    const expense = expenses.find(e => e.id === row.id);
    if (!expense) return null;
    return (
      <div className="flex gap-1">
        <Button variant="ghost-primary" size="sm" onClick={() => setEditExpense(expense)}>Edit</Button>
        {expense.status === 'Pending' && (
          <>
            <Button variant="ghost-success" size="sm" onClick={() => handleApprove(expense.id)}>Approve</Button>
            <Button variant="ghost-danger" size="sm" onClick={() => handleReject(expense.id)}>Reject</Button>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Expense Claims & Reimbursements"
        subtitle="Manage expense reports and reimbursement requests"
        actionButton={
          <Button onClick={() => setShowAddModal(true)}>Submit New Expense</Button>
        }
      />

      <div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
        <DataTable
          columns={expenseColumns}
          data={formattedExpenses}
          actions={renderExpenseActions}
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Submit New Expense</h3>
            <div className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Description"
                value={newExpense.title}
                onChange={e => setNewExpense({ ...newExpense, title: e.target.value })}
              />
              <input
                className="w-full border rounded px-3 py-2"
                type="number"
                step="0.01"
                placeholder="Amount"
                value={newExpense.amount}
                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
              />
              <select
                className="w-full border rounded px-3 py-2"
                value={newExpense.category}
                onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                className="w-full border rounded px-3 py-2"
                type="date"
                value={newExpense.date}
                onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddExpense}>Submit</Button>
            </div>
          </div>
        </div>
      )}

      {editExpense && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Edit Expense</h3>
            <div className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2"
                value={editExpense.title}
                onChange={e => setEditExpense({ ...editExpense, title: e.target.value })}
              />
              <input
                className="w-full border rounded px-3 py-2"
                type="number"
                step="0.01"
                value={editExpense.amount}
                onChange={e => setEditExpense({ ...editExpense, amount: parseFloat(e.target.value) || 0 })}
              />
              <select
                className="w-full border rounded px-3 py-2"
                value={editExpense.category}
                onChange={e => setEditExpense({ ...editExpense, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditExpense(null)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setExpenses(prev => prev.map(e => e.id === editExpense.id ? editExpense : e));
                  setEditExpense(null);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
