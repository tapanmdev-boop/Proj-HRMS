import { useState } from 'react';
import { PageHeader, DataTable } from '../components/ui/Dashboard';
import { Button } from '../components/ui/Form';
import { Badge } from '../components/ui/Notifications';

// Component to display employee initials
const EmployeeAvatar = ({ name }: { name: string }) => {
	const initials = name
		.split(' ')
		.map((n) => n[0])
		.join('');
	
	return <>{initials}</>;
};

// Mock onboarding data
const initialOnboardingData = [
	{
		id: '1',
		name: 'James Wilson',
		position: 'Senior Developer',
		department: 'Engineering',
		joinDate: '2025-07-15',
		status: 'Pending',
		progress: 25,
	},
	{
		id: '2',
		name: 'Emily Johnson',
		position: 'UX Designer',
		department: 'Design',
		joinDate: '2025-06-20',
		status: 'In Progress',
		progress: 65,
	},
	{
		id: '3',
		name: 'Robert Martinez',
		position: 'Product Manager',
		department: 'Product',
		joinDate: '2025-06-10',
		status: 'Completed',
		progress: 100,
	},
	{
		id: '4',
		name: 'Sarah Thompson',
		position: 'Marketing Specialist',
		department: 'Marketing',
		joinDate: '2025-06-01',
		status: 'Completed',
		progress: 100,
	},
];

// Mock onboarding tasks
const onboardingTasks = [
	{ id: 'task1', name: 'Complete personal information', category: 'Documentation' },
	{ id: 'task2', name: 'Sign employment contract', category: 'Documentation' },
	{ id: 'task3', name: 'Submit ID and proof of address', category: 'Documentation' },
	{ id: 'task4', name: 'Set up payroll account', category: 'Finance' },
	{ id: 'task5', name: 'IT equipment setup', category: 'Equipment' },
	{ id: 'task6', name: 'System access provisioning', category: 'IT' },
	{ id: 'task7', name: 'Company introduction', category: 'Orientation' },
	{ id: 'task8', name: 'Team introduction', category: 'Orientation' },
	{ id: 'task9', name: 'Role training', category: 'Training' },
	{ id: 'task10', name: 'Compliance training', category: 'Training' },
];

// Column definitions for the onboarding table
const onboardingColumns = [
	{ key: 'name', label: 'Name' },
	{ key: 'position', label: 'Position' },
	{ key: 'department', label: 'Department' },
	{ key: 'joinDate', label: 'Join Date' },
	{ key: 'status', label: 'Status' },
	{ key: 'progress', label: 'Progress' },
];

// Move row actions to a separate component
const OnboardingRowActions = ({
	row,
	onPreview,
	onViewDetails,
}: {
	row: any;
	onPreview: (row: any) => void;
	onViewDetails: (id: string) => void;
}) => (
	<div className="flex gap-1">
		<Button
			variant="ghost-primary"
			size="sm"
			onClick={() => onPreview(row)}
			aria-label={`Preview onboarding for ${row.name}`}
		>
			Preview
		</Button>
		<Button
			variant="ghost-primary"
			size="sm"
			onClick={() => onViewDetails(row.id)}
			aria-label={`View onboarding checklist for ${row.name}`}
		>
			View Details
		</Button>
	</div>
);

export default function Onboarding() {
	// Was `const [onboardingData] = useState(...)` — the setter was never
	// destructured, so this data was runtime-immutable and "Create Onboarding
	// Plan" had nothing to write to.
	const [onboardingData, setOnboardingData] = useState(initialOnboardingData);
	const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
	const [previewEmployee, setPreviewEmployee] = useState<any | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newPlan, setNewPlan] = useState({ name: '', position: '', department: '', joinDate: '' });

	const handleCreatePlan = () => {
		if (!newPlan.name || !newPlan.position || !newPlan.department || !newPlan.joinDate) return;
		setOnboardingData(prev => [
			{ ...newPlan, id: Date.now().toString(), status: 'Pending', progress: 0 },
			...prev,
		]);
		setShowCreateModal(false);
		setNewPlan({ name: '', position: '', department: '', joinDate: '' });
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

	// Render onboarding status with appropriate styling
	const renderStatus = (status: string) => {
		switch (status) {
			case 'Pending':
				return <Badge variant="warning" rounded>{status}</Badge>;
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

	// Format onboarding data for display
	const formattedOnboardingData = onboardingData.map((employee) => ({
		...employee,
		joinDate: formatDate(employee.joinDate),
		status: renderStatus(employee.status),
		progress: renderProgress(employee.progress),
	}));

	// Get tasks for selected employee
	const getEmployeeTasks = () => {
		if (!selectedEmployee) return [];

		// In a real application, you would fetch tasks for the specific employee
		return onboardingTasks.map((task) => {
			// Simulate task status - in real app this would come from API
			let status = 'Not Started';
			const employee = onboardingData.find((e) => e.id === selectedEmployee);

			if (employee) {
				const taskIndex = onboardingTasks.findIndex((t) => t.id === task.id);
				const totalTasks = onboardingTasks.length;
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
		return onboardingData.find((employee) => employee.id === selectedEmployee);
	};

	return (
		<div>
			<PageHeader
				title="Employee Onboarding"
				subtitle="Manage the onboarding process for new employees"
				actionButton={<Button onClick={() => setShowCreateModal(true)}>Create Onboarding Plan</Button>}
			/>

			<div className="mt-6 bg-white overflow-hidden rounded-xl border border-ivory-300 shadow-premium-sm">
				<DataTable
					columns={onboardingColumns}
					data={formattedOnboardingData}
					actions={(row) => (
						<OnboardingRowActions row={row} onPreview={setPreviewEmployee} onViewDetails={setSelectedEmployee} />
					)}
				/>
			</div>

			{previewEmployee && (
				<div className="fixed inset-0 flex items-center justify-center bg-ink-950/50 backdrop-blur-[2px] z-50">
					<div className="bg-white rounded-xl border border-ivory-300 shadow-premium-lg p-6 w-full max-w-md">
						<h2 className="font-display text-[22px] font-medium tracking-[-0.015em] text-ink-900 mb-4">Onboarding Preview</h2>
						<div className="mb-4">
							<p><span className="font-semibold">Name:</span> {previewEmployee?.name}</p>
							<p><span className="font-semibold">Start Date:</span> {formatDate(previewEmployee?.joinDate ?? '')}</p>
							<p><span className="font-semibold">Position:</span> {previewEmployee?.position}</p>
							{/* Add more fields as needed */}
						</div>
						<Button variant="outline" onClick={() => setPreviewEmployee(null)}>Close</Button>
					</div>
				</div>
			)}

			{showCreateModal && (
				<div className="fixed inset-0 flex items-center justify-center bg-ink-950/50 backdrop-blur-[2px] z-50">
					<div className="bg-white rounded-xl border border-ivory-300 shadow-premium-lg p-6 w-full max-w-md">
						<h2 className="font-display text-[22px] font-medium tracking-[-0.015em] text-ink-900 mb-4">Create Onboarding Plan</h2>
						<div className="space-y-3">
							<input
								className="w-full border rounded px-3 py-2"
								placeholder="Full Name"
								value={newPlan.name}
								onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
							/>
							<input
								className="w-full border rounded px-3 py-2"
								placeholder="Position"
								value={newPlan.position}
								onChange={e => setNewPlan({ ...newPlan, position: e.target.value })}
							/>
							<input
								className="w-full border rounded px-3 py-2"
								placeholder="Department"
								value={newPlan.department}
								onChange={e => setNewPlan({ ...newPlan, department: e.target.value })}
							/>
							<input
								className="w-full border rounded px-3 py-2"
								type="date"
								value={newPlan.joinDate}
								onChange={e => setNewPlan({ ...newPlan, joinDate: e.target.value })}
							/>
						</div>
						<div className="flex justify-end gap-2 mt-4">
							<Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
							<Button variant="primary" onClick={handleCreatePlan}>Create</Button>
						</div>
					</div>
				</div>
			)}

			{selectedEmployee && (
				<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Employee Information */}
					<div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
						<h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Employee Information</h3>
						{getSelectedEmployeeData() && (
							<div className="space-y-4">
								<div className="flex justify-center">
									<div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 text-xl font-semibold">
										<EmployeeAvatar name={getSelectedEmployeeData()?.name ?? ''} />
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
										<span className="text-gray-600">Start Date:</span>
										<span className="font-medium">
											{formatDate(getSelectedEmployeeData()?.joinDate ?? '')}
										</span>
									</div>
									<div className="flex justify-between mb-2">
										<span className="text-gray-600">Overall Progress:</span>
										<span className="font-medium">{getSelectedEmployeeData()?.progress}%</span>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Onboarding Checklist */}
					<div className="md:col-span-2 bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
						<h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Onboarding Tasks</h3>
						<div className="space-y-4">
							{getEmployeeTasks().map((task) => (
								<div key={task.id} className="flex items-center p-3 border rounded-md">
									<TaskStatusIndicator status={task.status} />
									<div className="ml-3 flex-1">
										<p className="font-medium">{task.name}</p>
										<p className="text-xs text-gray-500">{task.category}</p>
									</div>
									<div>										<TaskStatusBadge status={task.status} />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

// TaskStatusBadge component for displaying colored badges based on status
const TaskStatusBadge = ({ status }: { status: string }) => {
	// Helper function to get appropriate color classes based on status
	const getBadgeColorClass = (statusValue: string): string => {
		if (statusValue === 'Completed') return 'bg-green-100 text-green-800';
		if (statusValue === 'In Progress') return 'bg-yellow-100 text-yellow-800';
		return 'bg-gray-100 text-gray-800';
	};

	return (
		<span
			className={`inline-flex text-xs px-2 py-1 rounded-full ${getBadgeColorClass(status)}`}
		>
			{status}
		</span>
	);
};

// Extract nested ternary operations into independent statements
const TaskStatusIndicator = ({ status }: { status: string }) => {	// Helper function to get appropriate color classes based on status
	const getIndicatorColorClass = (statusValue: string): string => {
		if (statusValue === 'Completed') return 'bg-green-500 border-green-500';
		if (statusValue === 'In Progress') return 'bg-yellow-500 border-yellow-500';
		return 'bg-white border-gray-300';
	};
	
	return (
		<div
			className={`flex-shrink-0 h-5 w-5 rounded-full border ${getIndicatorColorClass(status)}`}
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
}
