import { useState } from 'react';
import { PageHeader, DataTable } from '../components/ui/Dashboard';
import { Select, Button, Input } from '../components/ui/Form';
import { Badge } from '../components/ui/Notifications';

// Mock candidate data
const initialCandidates = [
	{
		id: '1',
		name: 'Emily Johnson',
		email: 'emily.johnson@email.com',
		jobTitle: 'UX/UI Designer',
		status: 'Interview',
		appliedDate: '2025-06-08',
		rating: 4,
	},
	{
		id: '2',
		name: 'Michael Roberts',
		email: 'michael.roberts@email.com',
		jobTitle: 'Full Stack Developer',
		status: 'Screening',
		appliedDate: '2025-06-07',
		rating: 3,
	},
	{
		id: '3',
		name: 'Sarah Wilson',
		email: 'sarah.wilson@email.com',
		jobTitle: 'Product Manager',
		status: 'Assessment',
		appliedDate: '2025-06-05',
		rating: 4,
	},
	{
		id: '4',
		name: 'David Chen',
		email: 'david.chen@email.com',
		jobTitle: 'Full Stack Developer',
		status: 'Applied',
		appliedDate: '2025-06-09',
		rating: null,
	},
	{
		id: '5',
		name: 'Jennifer Lopez',
		email: 'jennifer.lopez@email.com',
		jobTitle: 'Marketing Specialist',
		status: 'Rejected',
		appliedDate: '2025-06-03',
		rating: 2,
	},
];

const candidateColumns = [
	{ key: 'name', label: 'Name' },
	{ key: 'jobTitle', label: 'Position' },
	{ key: 'status', label: 'Status' },
	{ key: 'appliedDate', label: 'Applied Date' },
	{ key: 'rating', label: 'Rating' },
];

const statusOptions = [
	{ value: 'all', label: 'All Statuses' },
	{ value: 'Applied', label: 'Applied' },
	{ value: 'Screening', label: 'Screening' },
	{ value: 'Assessment', label: 'Assessment' },
	{ value: 'Interview', label: 'Interview' },
	{ value: 'Offered', label: 'Offered' },
	{ value: 'Hired', label: 'Hired' },
	{ value: 'Rejected', label: 'Rejected' },
];

const positionOptions = [
	{ value: 'all', label: 'All Positions' },
	{ value: 'Full Stack Developer', label: 'Full Stack Developer' },
	{ value: 'UX/UI Designer', label: 'UX/UI Designer' },
	{ value: 'Product Manager', label: 'Product Manager' },
	{ value: 'Marketing Specialist', label: 'Marketing Specialist' },
];

function CandidateStatusBadge({ status }: { readonly status: string }) {
	switch (status) {
		case 'Applied':
			return <Badge variant="info" rounded>
				{status}
			</Badge>;
		case 'Screening':
			return <Badge variant="primary" rounded>
				{status}
			</Badge>;
		case 'Assessment':
			return <Badge variant="warning" rounded>
				{status}
			</Badge>;
		case 'Interview':
		case 'Offered':
		case 'Hired':
			return <Badge variant="success" rounded>
				{status}
			</Badge>;
		case 'Rejected':
			return <Badge variant="danger" rounded>
				{status}
			</Badge>;
		default:
			return <Badge variant="secondary" rounded>
				{status}
			</Badge>;
	}
}

function CandidateRating({ rating }: { readonly rating: number | null }) {
	if (rating === null) return <div>--</div>;

	return (
		<div className="flex">
			{[1, 2, 3, 4, 5].map((star) => (
				<svg
					key={star}
					className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
				</svg>
			))}
		</div>
	);
}

function ActionsComponent({ row, onViewProfile, onUpdateStatus }: {
	readonly row: any;
	readonly onViewProfile: (id: string) => void;
	readonly onUpdateStatus: (id: string) => void;
}) {
	return (
		<div className="flex space-x-2">
			<button
				className="text-blue-600 hover:text-blue-800 text-sm"
				onClick={() => onViewProfile(row.id)}
			>
				View Profile
			</button>
			<button
				className="text-green-600 hover:text-green-800 text-sm"
				onClick={() => onUpdateStatus(row.id)}
			>
				Update Status
			</button>
		</div>
	);
}

export default function CandidateTracking() {
	// Was a plain const — no way to add candidates or update their status.
	const [candidates, setCandidates] = useState(initialCandidates);
	const [statusFilter, setStatusFilter] = useState('all');
	const [positionFilter, setPositionFilter] = useState('all');
	const [showAddModal, setShowAddModal] = useState(false);
	const [newCandidate, setNewCandidate] = useState({ name: '', email: '', jobTitle: '' });
	const [viewingCandidateId, setViewingCandidateId] = useState<string | null>(null);
	const [updatingCandidateId, setUpdatingCandidateId] = useState<string | null>(null);

	const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setStatusFilter(e.target.value);
	};

	const handlePositionFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setPositionFilter(e.target.value);
	};

	const handleAddCandidate = () => {
		if (!newCandidate.name || !newCandidate.email || !newCandidate.jobTitle) return;
		setCandidates(prev => [
			{ id: `cand-${Date.now()}`, ...newCandidate, status: 'Applied', appliedDate: new Date().toISOString().split('T')[0], rating: null },
			...prev,
		]);
		setShowAddModal(false);
		setNewCandidate({ name: '', email: '', jobTitle: '' });
	};

	const handleUpdateStatus = (id: string, status: string) => {
		setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
		setUpdatingCandidateId(null);
	};

	const renderActions = (row: any) => (
		<ActionsComponent row={row} onViewProfile={setViewingCandidateId} onUpdateStatus={setUpdatingCandidateId} />
	);

	const filteredCandidates = candidates.filter((candidate) => {
		const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
		const matchesPosition = positionFilter === 'all' || candidate.jobTitle === positionFilter;
		return matchesStatus && matchesPosition;
	});

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const candidatesWithFormattedData = filteredCandidates.map((candidate) => ({
		...candidate,
		appliedDate: formatDate(candidate.appliedDate),
		status: <CandidateStatusBadge status={candidate.status} />,
		rating: <CandidateRating rating={candidate.rating} />,
	}));

	return (
		<>
			<PageHeader
				title="Candidate Tracking"
				subtitle="Manage and track job applicants through the hiring process"
				actionButton={
					<Button onClick={() => setShowAddModal(true)}>Add Candidate</Button>
				}
			/>

			<div className="bg-white rounded-lg shadow p-6 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-2">Filter by Status</h3>
						<Select
							label=""
							id="statusFilter"
							name="statusFilter"
							value={statusFilter}
							onChange={handleStatusFilterChange}
							options={statusOptions}
						/>
					</div>

					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-2">Filter by Position</h3>
						<Select
							label=""
							id="positionFilter"
							name="positionFilter"
							value={positionFilter}
							onChange={handlePositionFilterChange}
							options={positionOptions}
						/>
					</div>
					<div className="flex items-end">
						<button
							className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
							onClick={() => {
								setStatusFilter('all');
								setPositionFilter('all');
							}}
						>
							Clear Filters
						</button>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-lg shadow overflow-hidden">
				<DataTable
					columns={candidateColumns}
					data={candidatesWithFormattedData}
					actions={renderActions}
				/>
			</div>

			{showAddModal && (
				<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-md">
						<h3 className="text-lg font-medium mb-4">Add Candidate</h3>
						<div className="space-y-3">
							<Input label="Full Name" value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} />
							<Input label="Email" type="email" value={newCandidate.email} onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })} />
							<Select
								label="Position"
								id="newCandidateJobTitle"
								name="jobTitle"
								value={newCandidate.jobTitle}
								onChange={e => setNewCandidate({ ...newCandidate, jobTitle: e.target.value })}
								options={positionOptions.filter(o => o.value !== 'all')}
							/>
						</div>
						<div className="flex justify-end gap-2 mt-4">
							<Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
							<Button variant="primary" onClick={handleAddCandidate}>Add</Button>
						</div>
					</div>
				</div>
			)}

			{viewingCandidateId && (() => {
				const candidate = candidates.find(c => c.id === viewingCandidateId);
				if (!candidate) return null;
				return (
					<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
						<div className="bg-white rounded-lg p-6 w-full max-w-md">
							<h3 className="text-lg font-medium mb-4">{candidate.name}</h3>
							<div className="space-y-2 text-sm">
								<p><span className="font-semibold">Email:</span> {candidate.email}</p>
								<p><span className="font-semibold">Position:</span> {candidate.jobTitle}</p>
								<p><span className="font-semibold">Status:</span> {candidate.status}</p>
								<p><span className="font-semibold">Applied:</span> {formatDate(candidate.appliedDate)}</p>
								<p><span className="font-semibold">Rating:</span> {candidate.rating ?? 'Not rated'}</p>
							</div>
							<div className="flex justify-end mt-4">
								<Button variant="outline" onClick={() => setViewingCandidateId(null)}>Close</Button>
							</div>
						</div>
					</div>
				);
			})()}

			{updatingCandidateId && (
				<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-md">
						<h3 className="text-lg font-medium mb-4">Update Status</h3>
						<div className="grid grid-cols-2 gap-2">
							{statusOptions.filter(o => o.value !== 'all').map(o => (
								<Button key={o.value} variant="outline" onClick={() => handleUpdateStatus(updatingCandidateId, o.value)}>
									{o.label}
								</Button>
							))}
						</div>
						<div className="flex justify-end mt-4">
							<Button variant="outline" onClick={() => setUpdatingCandidateId(null)}>Cancel</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
