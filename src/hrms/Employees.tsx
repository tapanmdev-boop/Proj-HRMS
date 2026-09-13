import { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/Form';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../auth/authSlice';

// Component for displaying employee status with appropriate styling
const EmployeeStatusBadge = ({ status }: { status: string }) => {
  // Helper function to determine badge color class based on status
  const getStatusColorClass = (statusValue: string): string => {
    if (statusValue === 'Active') return 'bg-green-100 text-green-800';
    if (statusValue === 'On Leave') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(status)}`}>
      {status}
    </span>
  );
};

// Mock employee data. Fields below `joinDate` are UAE-specific — the
// UI/data-model groundwork for the Phase 1c payroll engine (basic salary +
// allowance breakdown feeds gratuity calculations and payslips; Emirates
// ID/labour card/IBAN feed WPS file generation). No backend consumes these
// yet; they're stored and edited locally like everything else on this page.
const MOCK_EMPLOYEES = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    position: 'Senior Developer',
    department: 'Engineering',
    status: 'Active',
    joinDate: '2023-01-15',
    avatar: 'JS',
    emiratesId: '784-1990-1234567-1',
    laborCardNumber: 'LC-100234',
    iban: 'AE070331234567890123456',
    basicSalary: 12000,
    housingAllowance: 4000,
    transportAllowance: 1000,
    otherAllowances: 500,
  },
  {
    id: '2',
    name: 'Maria Garcia',
    email: 'maria.garcia@company.com',
    position: 'UX Designer',
    department: 'Design',
    status: 'Active',
    joinDate: '2022-11-03',
    avatar: 'MG',
    emiratesId: '784-1988-2345678-2',
    laborCardNumber: 'LC-100235',
    iban: 'AE070331234567890123457',
    basicSalary: 10000,
    housingAllowance: 3500,
    transportAllowance: 1000,
    otherAllowances: 300,
  },
  {
    id: '3',
    name: 'David Johnson',
    email: 'david.johnson@company.com',
    position: 'Product Manager',
    department: 'Product',
    status: 'Active',
    joinDate: '2021-06-22',
    avatar: 'DJ',
    emiratesId: '784-1985-3456789-3',
    laborCardNumber: 'LC-100236',
    iban: 'AE070331234567890123458',
    basicSalary: 16000,
    housingAllowance: 5000,
    transportAllowance: 1200,
    otherAllowances: 800,
  },
  {
    id: '4',
    name: 'Linda Chen',
    email: 'linda.chen@company.com',
    position: 'Marketing Specialist',
    department: 'Marketing',
    status: 'On Leave',
    joinDate: '2022-03-10',
    avatar: 'LC',
    emiratesId: '784-1992-4567890-4',
    laborCardNumber: 'LC-100237',
    iban: 'AE070331234567890123459',
    basicSalary: 9000,
    housingAllowance: 3000,
    transportAllowance: 800,
    otherAllowances: 200,
  },
  {
    id: '5',
    name: 'Robert Wilson',
    email: 'robert.wilson@company.com',
    position: 'HR Manager',
    department: 'Human Resources',
    status: 'Active',
    joinDate: '2020-09-15',
    avatar: 'RW',
    emiratesId: '784-1983-5678901-5',
    laborCardNumber: 'LC-100238',
    iban: 'AE070331234567890123460',
    basicSalary: 14000,
    housingAllowance: 4500,
    transportAllowance: 1000,
    otherAllowances: 600,
  },
  {
    id: '6',
    name: 'Sarah Thompson',
    email: 'sarah.thompson@company.com',
    position: 'Financial Analyst',
    department: 'Finance',
    status: 'Active',
    joinDate: '2022-08-04',
    avatar: 'ST',
    emiratesId: '784-1991-6789012-6',
    laborCardNumber: 'LC-100239',
    iban: 'AE070331234567890123461',
    basicSalary: 11000,
    housingAllowance: 3800,
    transportAllowance: 1000,
    otherAllowances: 400,
  },
  {
    id: '7',
    name: 'James Brown',
    email: 'james.brown@company.com',
    position: 'DevOps Engineer',
    department: 'Engineering',
    status: 'Active',
    joinDate: '2023-02-01',
    avatar: 'JB',
    emiratesId: '784-1989-7890123-7',
    laborCardNumber: 'LC-100240',
    iban: 'AE070331234567890123462',
    basicSalary: 12500,
    housingAllowance: 4000,
    transportAllowance: 1000,
    otherAllowances: 500,
  },
  {
    id: '8',
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    position: 'Customer Success Rep',
    department: 'Customer Support',
    status: 'On Leave',
    joinDate: '2021-11-08',
    avatar: 'ED',
    emiratesId: '784-1993-8901234-8',
    laborCardNumber: 'LC-100241',
    iban: 'AE070331234567890123463',
    basicSalary: 8500,
    housingAllowance: 2800,
    transportAllowance: 800,
    otherAllowances: 200,
  }
];

const PAGE_SIZE = 5;

const emptyEmployeeForm = {
  name: '', email: '', position: '', department: '', status: 'Active', joinDate: '',
  emiratesId: '', laborCardNumber: '', iban: '',
  basicSalary: '', housingAllowance: '', transportAllowance: '', otherAllowances: '',
};

function exportToCSV(data: any[], filename: string) {
  if (!data.length) return;
  const csvRows = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Shared UAE payroll-info fields, used by both the Add and Edit modals.
function PayrollInfoFields({ value, onChange }: { value: any; onChange: (next: any) => void }) {
  return (
    <div className="border-t pt-3 mt-1 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">UAE Compliance & Payroll Info</p>
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Emirates ID (784-YYYY-XXXXXXX-X)"
        value={value.emiratesId}
        onChange={e => onChange({ ...value, emiratesId: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="Labour Card No."
          value={value.laborCardNumber}
          onChange={e => onChange({ ...value, laborCardNumber: e.target.value })}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="IBAN"
          value={value.iban}
          onChange={e => onChange({ ...value, iban: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Basic Salary (AED/mo)</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="number"
            value={value.basicSalary}
            onChange={e => onChange({ ...value, basicSalary: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Housing Allowance</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="number"
            value={value.housingAllowance}
            onChange={e => onChange({ ...value, housingAllowance: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Transport Allowance</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="number"
            value={value.transportAllowance}
            onChange={e => onChange({ ...value, transportAllowance: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Other Allowances</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="number"
            value={value.otherAllowances}
            onChange={e => onChange({ ...value, otherAllowances: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export default function Employees() {
  const currentUser = useAppSelector(selectCurrentUser);
  // Only Admin/HR can create, edit, delete employee records; everyone else
  // (manager/employee) gets a read-only directory + Preview.
  const canManageEmployees = currentUser?.role === 'admin' || currentUser?.role === 'hr';

  // The real, mutable dataset. Previously the filter effect below re-derived
  // from the MOCK_EMPLOYEES constant instead of this state, which silently
  // wiped out any Add/Edit/Delete the moment a search/filter changed.
  const [allEmployees, setAllEmployees] = useState(MOCK_EMPLOYEES);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [newEmployee, setNewEmployee] = useState(emptyEmployeeForm);

  const departments = useMemo(() => [...new Set(allEmployees.map(emp => emp.department))], [allEmployees]);
  const statuses = useMemo(() => [...new Set(allEmployees.map(emp => emp.status))], [allEmployees]);

  // Derived, filtered view of the real dataset — never mutates allEmployees.
  const employees = useMemo(() => {
    let filtered = allEmployees;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.position.toLowerCase().includes(term)
      );
    }

    if (filterDepartment) {
      filtered = filtered.filter(emp => emp.department === filterDepartment);
    }

    if (filterStatus) {
      filtered = filtered.filter(emp => emp.status === filterStatus);
    }

    return filtered;
  }, [allEmployees, searchTerm, filterDepartment, filterStatus]);

  // Reset to page 1 whenever the filtered set changes so pagination can't
  // point past the end of a newly-narrowed result set.
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterDepartment, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
  const pagedEmployees = employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.position || !newEmployee.department || !newEmployee.joinDate) return;
    setAllEmployees(prev => [
      {
        ...newEmployee,
        id: Date.now().toString(),
        avatar: newEmployee.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        basicSalary: Number(newEmployee.basicSalary) || 0,
        housingAllowance: Number(newEmployee.housingAllowance) || 0,
        transportAllowance: Number(newEmployee.transportAllowance) || 0,
        otherAllowances: Number(newEmployee.otherAllowances) || 0,
      },
      ...prev
    ]);
    setShowAddModal(false);
    setNewEmployee(emptyEmployeeForm);
  };

  const handleEditEmployee = () => {
    setAllEmployees(prev => prev.map(emp => emp.id === selectedEmployee.id ? {
      ...selectedEmployee,
      basicSalary: Number(selectedEmployee.basicSalary) || 0,
      housingAllowance: Number(selectedEmployee.housingAllowance) || 0,
      transportAllowance: Number(selectedEmployee.transportAllowance) || 0,
      otherAllowances: Number(selectedEmployee.otherAllowances) || 0,
    } : emp));
    setShowEditModal(false);
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setAllEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-4 md:mb-0">Employee Directory</h2>
          <div className="flex gap-2">
            {canManageEmployees && (
              <Button variant="success" onClick={() => setShowAddModal(true)}>
                + Add Employee
              </Button>
            )}
            <Button variant="outline" onClick={() => exportToCSV(employees, 'employees.csv')}>
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              id="search"
              placeholder="Search by name, email or position"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              id="department"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pagedEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium mr-3">
                        {employee.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">                    <EmployeeStatusBadge status={employee.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(employee.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-1">
                      {canManageEmployees && (
                        <>
                          <Button variant="ghost-primary" size="sm" onClick={() => { setSelectedEmployee(employee); setShowEditModal(true); }}>Edit</Button>
                          <Button variant="ghost-danger" size="sm" onClick={() => handleDeleteEmployee(employee.id)}>Delete</Button>
                        </>
                      )}
                      <Button variant="ghost-secondary" size="sm" onClick={() => { setSelectedEmployee(employee); setShowPreviewModal(true); }}>Preview</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No employees match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-5">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{pagedEmployees.length}</span> of <span className="font-medium">{employees.length}</span> employees
          </div>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <Button
                key={pageNum}
                variant={pageNum === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Add Employee Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">Add Employee</h3>
              <div className="space-y-3">
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Full Name"
                  value={newEmployee.name}
                  onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                />
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Email"
                  value={newEmployee.email}
                  onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                />
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Position"
                  value={newEmployee.position}
                  onChange={e => setNewEmployee({ ...newEmployee, position: e.target.value })}
                />
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Department"
                  value={newEmployee.department}
                  onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })}
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newEmployee.status}
                  onChange={e => setNewEmployee({ ...newEmployee, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="date"
                  value={newEmployee.joinDate}
                  onChange={e => setNewEmployee({ ...newEmployee, joinDate: e.target.value })}
                />
                <PayrollInfoFields value={newEmployee} onChange={setNewEmployee} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleAddEmployee}>Add</Button>
              </div>
            </div>
          </div>
        )}
        {/* Edit Employee Modal */}
        {showEditModal && selectedEmployee && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">Edit Employee</h3>
              <div className="space-y-3">
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Full Name"
                  value={selectedEmployee.name}
                  onChange={e => setSelectedEmployee({ ...selectedEmployee, name: e.target.value })}
                />
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Email"
                  value={selectedEmployee.email}
                  onChange={e => setSelectedEmployee({ ...selectedEmployee, email: e.target.value })}
                />
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Position"
                  value={selectedEmployee.position}
                  onChange={e => setSelectedEmployee({ ...selectedEmployee, position: e.target.value })}
                />
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Department"
                  value={selectedEmployee.department}
                  onChange={e => setSelectedEmployee({ ...selectedEmployee, department: e.target.value })}
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={selectedEmployee.status}
                  onChange={e => setSelectedEmployee({ ...selectedEmployee, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="date"
                  value={selectedEmployee.joinDate}
                  onChange={e => setSelectedEmployee({ ...selectedEmployee, joinDate: e.target.value })}
                />
                <PayrollInfoFields value={selectedEmployee} onChange={setSelectedEmployee} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleEditEmployee}>Save</Button>
              </div>
            </div>
          </div>
        )}
        {/* Preview Employee Modal */}
        {showPreviewModal && selectedEmployee && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">Employee Details</h3>
              <div className="space-y-2">
                <div className="flex items-center mb-2">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3 text-lg">
                    {selectedEmployee.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-lg">{selectedEmployee.name}</div>
                    <div className="text-sm text-gray-500">{selectedEmployee.email}</div>
                  </div>
                </div>
                <div className="text-sm"><b>Position:</b> {selectedEmployee.position}</div>
                <div className="text-sm"><b>Department:</b> {selectedEmployee.department}</div>
                <div className="text-sm"><b>Status:</b> {selectedEmployee.status}</div>
                <div className="text-sm"><b>Join Date:</b> {new Date(selectedEmployee.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>

                <div className="border-t pt-2 mt-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">UAE Compliance & Payroll</p>
                  <div className="text-sm"><b>Emirates ID:</b> {selectedEmployee.emiratesId || '—'}</div>
                  <div className="text-sm"><b>Labour Card No.:</b> {selectedEmployee.laborCardNumber || '—'}</div>
                  <div className="text-sm"><b>IBAN:</b> {selectedEmployee.iban || '—'}</div>
                  <div className="text-sm">
                    <b>Monthly Salary:</b> AED {(
                      (selectedEmployee.basicSalary || 0) +
                      (selectedEmployee.housingAllowance || 0) +
                      (selectedEmployee.transportAllowance || 0) +
                      (selectedEmployee.otherAllowances || 0)
                    ).toLocaleString()}
                    <span className="text-gray-500"> (Basic: {(selectedEmployee.basicSalary || 0).toLocaleString()})</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowPreviewModal(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
