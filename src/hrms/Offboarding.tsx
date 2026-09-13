import { useState } from 'react';
import { PageHeader, DataTable } from '../components/ui/Dashboard';
import { Button } from '../components/ui/Form';
import { Badge } from '../components/ui/Notifications';
import { calculateGratuity, type TerminationType } from '../utils/uaeGratuity';

// Mock offboarding data. `joinDate`, `basicSalary`, and `terminationType` are
// UAE-specific additions feeding the gratuity calculator below.
const initialOffboardingData = [
	{
		id: '1',
		name: 'Jessica Parker',
		position: 'Marketing Manager',
		department: 'Marketing',
		joinDate: '2021-02-01',
		lastDay: '2025-06-30',
		status: 'In Progress',
		progress: 40,
		reason: 'New Opportunity',
		basicSalary: 11000,
		terminationType: 'resignation' as TerminationType,
	},
	{
		id: '2',
		name: 'Michael Chen',
		position: 'Frontend Developer',
		department: 'Engineering',
		joinDate: '2023-01-10',
		lastDay: '2025-06-15',
		status: 'In Progress',
		progress: 75,
		reason: 'Relocation',
		basicSalary: 12500,
		terminationType: 'resignation' as TerminationType,
	},
	{
		id: '3',
		name: 'David Rodriguez',
		position: 'Account Manager',
		department: 'Sales',
		joinDate: '2016-04-12',
		lastDay: '2025-05-31',
		status: 'Completed',
		progress: 100,
		reason: 'Retirement',
		basicSalary: 13000,
		terminationType: 'contract_end' as TerminationType,
	},
	{
		id: '4',
		name: 'Amanda Lewis',
		position: 'HR Coordinator',
		department: 'Human Resources',
		joinDate: '2022-06-20',
		lastDay: '2025-05-15',
		status: 'Completed',
		progress: 100,
		reason: 'New Opportunity',
		basicSalary: 9500,
		terminationType: 'resignation' as TerminationType,
	},
];

// Mock offboarding tasks
const offboardingTasks = [
	{ id: 'task1', name: 'Schedule exit interview', category: 'HR', assignedTo: 'HR Department' },
	{ id: 'task2', name: 'Return company equipment', category: 'Equipment', assignedTo: 'IT Department' },
	{ id: 'task3', name: 'Revoke system access', category: 'IT', assignedTo: 'IT Department' },
	{ id: 'task4', name: 'Prepare final settlement', category: 'Finance', assignedTo: 'Finance Department' },
	{ id: 'task5', name: 'Knowledge transfer sessions', category: 'Team', assignedTo: 'Department Manager' },
	{ id: 'task6', name: 'Update organizational chart', category: 'HR', assignedTo: 'HR Department' },
	{ id: 'task7', name: 'Issue relieving letter', category: 'Documentation', assignedTo: 'HR Department' },
	{ id: 'task8', name: 'Collect company property', category: 'Admin', assignedTo: 'Admin Department' },
];

// Column definitions for the offboarding table
const offboardingColumns = [
	{ key: 'name', label: 'Name' },
	{ key: 'position', label: 'Position' },
	{ key: 'department', label: 'Department' },
	{ key: 'lastDay', label: 'Last Working Day' },
	{ key: 'reason', label: 'Exit Reason' },
	{ key: 'status', label: 'Status' },
	{ key: 'progress', label: 'Progress' },
];

export default function Offboarding() {
	// Was `const [offboardingData] = useState(...)` — setter never
	// destructured, so this was runtime-immutable and "Initiate Exit Process"
	// had nothing to write to.
	const [offboardingData, setOffboardingData] = useState(initialOffboardingData);
	const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
	const [showInitiateModal, setShowInitiateModal] = useState(false);
	const [newExit, setNewExit] = useState({
		name: '', position: '', department: '', joinDate: '', lastDay: '', reason: '',
		basicSalary: '', terminationType: 'resignation' as TerminationType,
	});
	const [interviewScheduledFor, setInterviewScheduledFor] = useState<Set<string>>(new Set());

	const handleInitiateExit = () => {
		if (!newExit.name || !newExit.position || !newExit.department || !newExit.lastDay || !newExit.reason || !newExit.joinDate) return;
		setOffboardingData(prev => [
			{ ...newExit, id: Date.now().toString(), status: 'Not Started', progress: 0, basicSalary: Number(newExit.basicSalary) || 0 },
			...prev,
		]);
		setShowInitiateModal(false);
		setNewExit({ name: '', position: '', department: '', joinDate: '', lastDay: '', reason: '', basicSalary: '', terminationType: 'resignation' });
	};

	const handleScheduleExitInterview = (id: string) => {
		setInterviewScheduledFor(prev => new Set(prev).add(id));
	};

	// Format date values
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	// Render offboarding status with appropriate styling
	const renderStatus = (status: string) => {
		switch (status) {
			case 'Not Started':
				return <Badge variant="secondary" rounded>{status}</Badge>;
			case 'In Progress':
				return <Badge variant="info" rounded>{status}</Badge>;
			case 'Completed':
				return <Badge variant="success" rounded>{status}</Badge>;
			default:
				return <Badge variant="secondary" rounded>{status}</Badge>;
		}
	};
	// Render progress bar
	const renderProgress = (progress: number) => {
		// Extract nested ternary into a function that determines color based on progress
		const getColorClass = (value: number): string => {
			if (value < 50) return 'bg-red-500';
			if (value < 80) return 'bg-yellow-500';
			return 'bg-green-500';
		};

		return (
			<div className="w-full bg-gray-200 rounded-full h-2">
				<div
					className={`h-2 rounded-full ${getColorClass(progress)}`}
					style={{ width: `${progress}%` }}
				></div>
			</div>
		);
	};

	// Format offboarding data for display
	const formattedOffboardingData = offboardingData.map((employee) => ({
		...employee,
		lastDay: formatDate(employee.lastDay),
		status: renderStatus(employee.status),
		progress: renderProgress(employee.progress),
	}));

	const handleRowClick = (employee: Record<string, any>) => {
		setSelectedEmployee(employee.id);
	};

	// Get tasks for selected employee
	const getEmployeeTasks = () => {
		if (!selectedEmployee) return [];

		// In a real application, you would fetch tasks for the specific employee
		return offboardingTasks.map((task) => {
			// Simulate task status - in real app this would come from API
			let status = 'Not Started';
			const employee = offboardingData.find((e) => e.id === selectedEmployee);

			if (employee) {
				const taskIndex = offboardingTasks.findIndex((t) => t.id === task.id);
				const totalTasks = offboardingTasks.length;
				const completedTasksCount = Math.floor((employee.progress / 100) * totalTasks);

				if (taskIndex < completedTasksCount) {
					status = 'Completed';
				} else if (taskIndex === completedTasksCount) {
					status = 'In Progress';
				}
			}

			return { ...task, status };
		});
	};

	// Get selected employee data
	const getSelectedEmployeeData = () => {
		return offboardingData.find((employee) => employee.id === selectedEmployee);
	};

	// Calculate days remaining until last day
	const getDaysRemaining = (lastDay: string) => {
		const today = new Date();
		const exitDate = new Date(lastDay);
		const diffTime = exitDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays > 0 ? diffDays : 0;
	};

	return (
		<div>
			<PageHeader
				title="Employee Offboarding"
				subtitle="Manage exit formalities and offboarding processes"
				actionButton={<Button onClick={() => setShowInitiateModal(true)}>Initiate Exit Process</Button>}
			/>

			<div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
				<DataTable
					columns={offboardingColumns}
					data={formattedOffboardingData}
					actions={(_row) => (
						<Button variant="ghost-primary" size="sm" onClick={() => handleRowClick(_row)}>
							View Details
						</Button>
					)}
				/>
			</div>

			{selectedEmployee && (
				<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Employee Information */}
					<div className="bg-white shadow rounded-lg p-6">
						<h3 className="text-lg font-medium mb-4">Employee Exit Information</h3>
						{getSelectedEmployeeData() && (
							<div className="space-y-4">
								<div className="flex justify-center">
									<div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 text-xl font-semibold">
										{getSelectedEmployeeData()?.name.split(' ').map((n) => n[0]).join('')}
									</div>
								</div>
								<div className="text-center mt-2">
									<h4 className="text-lg font-medium">{getSelectedEmployeeData()?.name}</h4>
									<p className="text-gray-600">{getSelectedEmployeeData()?.position}</p>
								</div>
								<div className="border-t pt-4">
									<div className="flex justify-between mb-2">
										<span className="text-gray-600">Department:</span>
										<span className="font-medium">{getSelectedEmployeeData()?.department}</span>
									</div>
									<div className="flex justify-between mb-2">
										<span className="text-gray-600">Last Working Day:</span>
										<span className="font-medium">{getSelectedEmployeeData()?.lastDay}</span>
									</div>
									<div className="flex justify-between mb-2">
										<span className="text-gray-600">Days Remaining:</span>
										<span className="font-medium">
											{getDaysRemaining(getSelectedEmployeeData()?.lastDay ?? '')}
										</span>
									</div>
									<div className="flex justify-between mb-2">
										<span className="text-gray-600">Exit Reason:</span>
										<span className="font-medium">{getSelectedEmployeeData()?.reason}</span>
									</div>
									<div className="flex justify-between mb-2">
										<span className="text-gray-600">Overall Progress:</span>
										<span className="font-medium">{getSelectedEmployeeData()?.progress}%</span>
									</div>
								</div>

								{/* End-of-Service Gratuity — real UAE Labour Law No. 33/2021
								    calculation (see src/utils/uaeGratuity.ts), computed
								    client-side. Validate against MOHRE guidance before using
								    for an actual payout. */}
								{(() => {
									const emp = getSelectedEmployeeData();
									if (!emp || !emp.joinDate || !emp.basicSalary) return null;
									const gratuity = calculateGratuity({
										basicMonthlySalary: emp.basicSalary,
										joinDate: emp.joinDate,
										lastWorkingDay: emp.lastDay,
										terminationType: emp.terminationType,
									});
									return (
										<div className="border-t pt-4">
											<h4 className="font-medium mb-2">End-of-Service Gratuity</h4>
											{gratuity.eligible ? (
												<div className="bg-brand-50 rounded-lg p-3 space-y-1">
													<div className="flex justify-between text-sm">
														<span className="text-gray-600">Years of Service:</span>
														<span className="font-medium">{gratuity.yearsOfService.toFixed(1)}</span>
													</div>
													<div className="flex justify-between text-sm">
														<span className="text-gray-600">Days Entitled:</span>
														<span className="font-medium">{gratuity.daysEntitled.toFixed(0)}</span>
													</div>
													<div className="flex justify-between text-sm font-semibold pt-1 border-t border-brand-100">
														<span>Gratuity Payable:</span>
														<span>AED {gratuity.finalGratuity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
													</div>
													{gratuity.grossGratuity > gratuity.cap && (
														<p className="text-xs text-gray-500">Capped at 2 years' basic salary (AED {gratuity.cap.toLocaleString()}).</p>
													)}
												</div>
											) : (
												<div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
													Not eligible: {gratuity.reason}
												</div>
											)}
											<p className="text-xs text-gray-400 mt-1">
												Estimate only — validate against current MOHRE guidance before final settlement.
											</p>
										</div>
									);
								})()}

								<Button
									variant={interviewScheduledFor.has(selectedEmployee) ? 'success' : 'primary'}
									className="w-full mt-2"
									disabled={interviewScheduledFor.has(selectedEmployee)}
									onClick={() => handleScheduleExitInterview(selectedEmployee)}
								>
									{interviewScheduledFor.has(selectedEmployee) ? 'Exit Interview Scheduled ✓' : 'Schedule Exit Interview'}
								</Button>
							</div>
						)}
					</div>

					{/* Offboarding Checklist */}
					<div className="md:col-span-2 bg-white shadow rounded-lg p-6">
						<h3 className="text-lg font-medium mb-4">Offboarding Checklist</h3>
						<div className="space-y-4">							{getEmployeeTasks().map((task) => (
								<div key={task.id} className="flex items-center p-3 border rounded-md">
									<TaskStatusIndicator status={task.status} />
									<div className="ml-3 flex-1">
										<div className="flex justify-between">
											<p className="font-medium">{task.name}</p>
											<span className="text-xs text-gray-500">
												Assigned to: {task.assignedTo}
											</span>
										</div>
										<p className="text-xs text-gray-500">{task.category}</p>
									</div>
									<div className="ml-4">										<TaskStatusBadge status={task.status} />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{showInitiateModal && (
				<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-md">
						<h2 className="text-xl font-bold mb-4">Initiate Exit Process</h2>
						<div className="space-y-3">
							<input
								className="w-full border rounded px-3 py-2"
								placeholder="Full Name"
								value={newExit.name}
								onChange={e => setNewExit({ ...newExit, name: e.target.value })}
							/>
							<input
								className="w-full border rounded px-3 py-2"
								placeholder="Position"
								value={newExit.position}
								onChange={e => setNewExit({ ...newExit, position: e.target.value })}
							/>
							<input
								className="w-full border rounded px-3 py-2"
								placeholder="Department"
								value={newExit.department}
								onChange={e => setNewExit({ ...newExit, department: e.target.value })}
							/>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-xs text-gray-500 mb-1">Join Date</label>
									<input
										className="w-full border rounded px-3 py-2"
										type="date"
										value={newExit.joinDate}
										onChange={e => setNewExit({ ...newExit, joinDate: e.target.value })}
									/>
								</div>
								<div>
									<label className="block text-xs text-gray-500 mb-1">Last Working Day</label>
									<input
										className="w-full border rounded px-3 py-2"
										type="date"
										value={newExit.lastDay}
										onChange={e => setNewExit({ ...newExit, lastDay: e.target.value })}
									/>
								</div>
							</div>
							<input
								className="w-full border rounded px-3 py-2"
								placeholder="Exit Reason"
								value={newExit.reason}
								onChange={e => setNewExit({ ...newExit, reason: e.target.value })}
							/>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-xs text-gray-500 mb-1">Basic Salary (AED/mo)</label>
									<input
										className="w-full border rounded px-3 py-2"
										type="number"
										value={newExit.basicSalary}
										onChange={e => setNewExit({ ...newExit, basicSalary: e.target.value })}
									/>
								</div>
								<div>
									<label className="block text-xs text-gray-500 mb-1">Termination Type</label>
									<select
										className="w-full border rounded px-3 py-2"
										value={newExit.terminationType}
										onChange={e => setNewExit({ ...newExit, terminationType: e.target.value as TerminationType })}
									>
										<option value="resignation">Resignation</option>
										<option value="contract_end">Contract End</option>
										<option value="termination">Termination</option>
										<option value="termination_for_cause">Termination for Cause (Art. 44)</option>
									</select>
								</div>
							</div>
						</div>
						<div className="flex justify-end gap-2 mt-4">
							<Button variant="outline" onClick={() => setShowInitiateModal(false)}>Cancel</Button>
							<Button variant="primary" onClick={handleInitiateExit}>Initiate</Button>
						</div>
					</div>
				</div>
			)}
		</div>	);
}

// Extract components outside the main component
// TaskStatusBadge displays a colored badge based on the task status
const TaskStatusBadge = ({ status }: { status: string }) => {
	// Extract nested ternary into a function that determines color based on status
	const getBadgeClasses = (statusValue: string): string => {
		if (statusValue === 'Completed') return 'bg-green-100 text-green-800';
		if (statusValue === 'In Progress') return 'bg-yellow-100 text-yellow-800';
		return 'bg-gray-100 text-gray-800';
	};

	return (
		<span
			className={`inline-flex text-xs px-2 py-1 rounded-full ${getBadgeClasses(status)}`}
		>
			{status}
		</span>
	);
};

// TaskStatusIndicator shows a colored circle with a checkmark for completed tasks
const TaskStatusIndicator = ({ status }: { status: string }) => {
	// Extract nested ternary into a function that determines color based on status
	const getStatusClasses = (statusValue: string): string => {
		if (statusValue === 'Completed') return 'bg-green-500 border-green-500';
		if (statusValue === 'In Progress') return 'bg-yellow-500 border-yellow-500';
		return 'bg-white border-gray-300';
	};

	return (
		<div
			className={`flex-shrink-0 h-5 w-5 rounded-full border ${getStatusClasses(status)}`}
		>
			{status === 'Completed' && (
				<svg
					className="h-5 w-5 text-white"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			)}
		</div>
	);
};
