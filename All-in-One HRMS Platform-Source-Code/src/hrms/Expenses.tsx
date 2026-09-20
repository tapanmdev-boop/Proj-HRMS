import { useState } from 'react';
import { PageHeader, DataTable } from '../components/ui/Dashboard';
import { Button } from '../components/ui/Form';
import { Badge } from '../components/ui/Notifications';
import { ApprovalStepper, type ApprovalStep } from '../components/ui/ApprovalStepper';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../auth/authSlice';

const APPROVAL_STEPS: ApprovalStep[] = [
  { key: 'manager', label: 'Manager' },
  { key: 'finance', label: 'Finance' },
  { key: 'done', label: 'Approved' },
];
const STAGE_INDEX: Record<'manager' | 'finance' | 'done', number> = { manager: 0, finance: 1, done: 2 };

// Mock expense data. `stage` drives the Employee → Manager → Finance/HR
// approval chain; `status` reflects the outcome ('Reimbursed' is a separate
// step HR/Finance take after the chain reaches 'Approved').
const initialExpenses = [
  {
    id: '1',
    title: 'Business Trip - London Conference',
    amount: 1250.00,
    date: '2025-05-12',
    category: 'Travel',
    status: 'Pending',
    stage: 'manager' as const,
  },
  {
    id: '2',
    title: 'Team Lunch',
    amount: 187.50,
    date: '2025-05-08',
    category: 'Meals',
    status: 'Pending',
    stage: 'finance' as const,
  },
  {
    id: '3',
    title: 'Office Supplies',
    amount: 75.25,
    date: '2025-05-05',
    category: 'Supplies',
    status: 'Reimbursed',
    stage: 'done' as const,
  },
  {
    id: '4',
    title: 'Software Subscription',
    amount: 49.99,
    date: '2025-05-01',
    category: 'Subscription',
    status: 'Rejected',
    stage: 'manager' as const,
  }
];

const EXPENSE_CATEGORIES = ['Travel', 'Meals', 'Supplies', 'Subscription', 'Other'];

// Column definitions for the expense table
const expenseColumns = [
  { key: 'title', label: 'Description' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'category', label: 'Category' },
  { key: 'approval', label: 'Approval' },
  { key: 'status', label: 'Status' }
];

export default function Expenses() {
  const currentUser = useAppSelector(selectCurrentUser);
  const isFinance = currentUser?.role === 'hr' || currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';

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

  // Format data for the table, including formatted date, amount, status and
  // the approval-chain stepper.
  const formattedExpenses = expenses.map(expense => ({
    ...expense,
    amount: formatCurrency(expense.amount),
    date: formatDate(expense.date),
    approval: (
      <ApprovalStepper steps={APPROVAL_STEPS} activeIndex={STAGE_INDEX[expense.stage]} declined={expense.status === 'Rejected'} />
    ),
    status: renderExpenseStatus(expense.status)
  }));

  const handleAddExpense = () => {
    const amount = parseFloat(newExpense.amount);
    if (!newExpense.title || Number.isNaN(amount)) return;
    setExpenses(prev => [
      { id: Date.now().toString(), title: newExpense.title, amount, date: newExpense.date, category: newExpense.category, status: 'Pending', stage: 'manager' },
      ...prev,
    ]);
    setShowAddModal(false);
    setNewExpense({ title: '', amount: '', category: 'Travel', date: new Date().toISOString().split('T')[0] });
  };

  // `actorStage` is the stage the acting user owns — a manager can only clear
  // the 'manager' stage, Finance/HR only the 'finance' stage.
  const handleApprove = (id: string, actorStage: 'manager' | 'finance') => {
    setExpenses(prev => prev.map(e => {
      if (e.id !== id || e.stage !== actorStage) return e;
      if (actorStage === 'manager') return { ...e, stage: 'finance' };
      return { ...e, stage: 'done', status: 'Approved' };
    }));
  };

  const handleReject = (id: string, actorStage: 'manager' | 'finance') => {
    setExpenses(prev => prev.map(e => (e.id === id && e.stage === actorStage) ? { ...e, status: 'Rejected' } : e));
  };

  const handleMarkReimbursed = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'Reimbursed' } : e));
  };

  const renderExpenseActions = (row: Record<string, any>) => {
    const expense = expenses.find(e => e.id === row.id);
    if (!expense) return null;
    const canAct =
      expense.status === 'Pending' &&
      ((isManager && expense.stage === 'manager') || (isFinance && expense.stage === 'finance'));

    return (
      <div className="flex justify-end gap-1">
        <Button variant="ghost-primary" size="sm" onClick={() => setEditExpense(expense)}>Edit</Button>
        {canAct && (
          <>
            <Button variant="ghost-success" size="sm" onClick={() => handleApprove(expense.id, expense.stage as 'manager' | 'finance')}>Approve</Button>
            <Button variant="ghost-danger" size="sm" onClick={() => handleReject(expense.id, expense.stage as 'manager' | 'finance')}>Reject</Button>
          </>
        )}
        {isFinance && expense.status === 'Approved' && (
          <Button variant="ghost-secondary" size="sm" onClick={() => handleMarkReimbursed(expense.id)}>Mark Reimbursed</Button>
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

      <div className="mt-6 bg-white overflow-hidden rounded-xl border border-ivory-300 shadow-premium-sm">
        <DataTable
          columns={expenseColumns}
          data={formattedExpenses}
          actions={renderExpenseActions}
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-ink-950/50 backdrop-blur-[2px] z-50">
          <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-lg p-6 w-full max-w-md">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Submit New Expense</h3>
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
        <div className="fixed inset-0 flex items-center justify-center bg-ink-950/50 backdrop-blur-[2px] z-50">
          <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-lg p-6 w-full max-w-md">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Edit Expense</h3>
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
