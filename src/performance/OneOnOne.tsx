import { useState } from 'react';
import { PageHeader, DataTable } from '../components/ui/Dashboard';
import { Button, Input, Textarea } from '../components/ui/Form';
import { Badge } from '../components/ui/Notifications';

// Mock meeting data
const initialMeetingsData = [
	{
		id: 'meet1',
		employeeName: 'John Doe',
		managerName: 'Sarah Manager',
		scheduledDate: '2023-12-20T14:00:00',
		frequency: 'Weekly',
		status: 'Upcoming',
		agenda: 'Career development, Project updates',
	},
	{
		id: 'meet2',
		employeeName: 'Jane Smith',
		managerName: 'Mike Director',
		scheduledDate: '2023-12-18T10:00:00',
		frequency: 'Monthly',
		status: 'Completed',
		agenda: 'Performance review, Goal setting',
	},
];

// Column definitions
const meetingColumns = [
	{ key: 'employeeName', label: 'Employee' },
	{ key: 'managerName', label: 'Manager' },
	{ key: 'scheduledDateFormatted', label: 'Scheduled Date & Time' },
	{ key: 'frequency', label: 'Frequency' },
	{ key: 'statusFormatted', label: 'Status' },
];

// Mock agenda templates
const agendaTemplates = [
	{
		id: 'template1',
		name: 'Weekly Check-in',
		sections: [
			{
				title: 'Wins & Challenges',
				description: 'Discuss achievements and obstacles from the past week.',
			},
			{
				title: 'Goals Progress',
				description: 'Review progress on quarterly/annual goals.',
			},
			{
				title: 'Support Needed',
				description: 'Discuss what support or resources are needed.',
			},
			{
				title: 'Action Items',
				description: 'Define next steps and responsibilities.',
			},
		],
	},
	{
		id: 'template2',
		name: 'Career Development',
		sections: [
			{
				title: 'Career Aspirations',
				description: 'Discuss long-term career goals and aspirations.',
			},
			{
				title: 'Skill Development',
				description: 'Identify skills to develop and improvement areas.',
			},
			{
				title: 'Learning Opportunities',
				description: 'Explore training, mentorship, or project opportunities.',
			},
			{
				title: 'Action Plan',
				description: 'Create a development action plan with timelines.',
			},
		],
	},
	{
		id: 'template3',
		name: 'Performance Review Prep',
		sections: [
			{
				title: 'Accomplishments',
				description: 'Review key accomplishments since the last review.',
			},
			{
				title: 'Goals Assessment',
				description: 'Evaluate progress on set goals.',
			},
			{
				title: 'Growth Areas',
				description: 'Discuss areas for improvement.',
			},
			{
				title: 'Future Objectives',
				description: 'Set goals for the next performance period.',
			},
		],
	},
];

// Define meeting type
interface Meeting {
	id: string;
	employeeName: string;
	managerName: string;
	scheduledDate: string;
	frequency: string;
	status: string;
	agenda: string;
}

// Define the action item type
interface ActionItem {
	text: string;
	assigned: string;
	dueDate: string;
}

// Define MeetingDetails component outside the parent component
interface MeetingDetailsProps {
	readonly meeting: Meeting;
	readonly notes: string;
	readonly onNotesChange: (value: string) => void;
	readonly actionItems: ActionItem[];
	readonly onAddActionItem: (item: ActionItem) => void;
	readonly onUpdateActionItem: (index: number, item: ActionItem) => void;
}

function MeetingDetails({
	meeting,
	notes,
	onNotesChange,
	actionItems,
	onAddActionItem,
	onUpdateActionItem,
}: MeetingDetailsProps) {
	const [newActionItem, setNewActionItem] = useState<ActionItem>({
		text: '',
		assigned: '',
		dueDate: '',
	});

	return (
		<div className="bg-white p-6 rounded-lg shadow">
			<h2 className="text-xl font-semibold mb-4">Meeting Details</h2>

			<div className="grid grid-cols-2 gap-4 mb-6">
				<div>
					<p className="text-sm text-gray-500">Employee</p>
					<p className="font-medium">{meeting.employeeName}</p>
				</div>
				<div>
					<p className="text-sm text-gray-500">Manager</p>
					<p className="font-medium">{meeting.managerName}</p>
				</div>
				<div>
					<p className="text-sm text-gray-500">Date & Time</p>
					<p className="font-medium">
						{new Date(meeting.scheduledDate).toLocaleString()}
					</p>
				</div>
				<div>
					<p className="text-sm text-gray-500">Status</p>
					<p className="font-medium">{meeting.status}</p>
				</div>
			</div>

			<div className="mb-6">
				<h3 className="text-lg font-medium mb-2">Notes</h3>
				<Textarea
					label="Meeting Notes"
					id="meetingNotes"
					rows={4}
					value={notes}
					onChange={(e) => onNotesChange(e.target.value)}
				/>
			</div>

			<div className="mb-6">
				<h3 className="text-lg font-medium mb-2">Action Items</h3>
				<div className="space-y-2">
					{actionItems.map((item, i) => (
						<div
							key={`action-${meeting.id}-${i}`}
							className="flex items-center gap-2 p-2 bg-gray-50 rounded"
						>
							<div className="flex-1">
								<p className="font-medium">{item.text}</p>
								<p className="text-sm text-gray-500">
									Assigned to: {item.assigned} - Due: {item.dueDate}
								</p>
							</div>							<Button
								variant="outline"
								size="sm"
								onClick={() => onUpdateActionItem(i, item)}
							>
								Edit
							</Button>
						</div>
					))}
				</div>

				<div className="mt-4 p-3 border border-gray-200 rounded">
					<h4 className="text-sm font-medium mb-2">Add New Action Item</h4>
					<div className="grid grid-cols-1 gap-3">
						<Input
							label="Task"
							id="newActionText"
							type="text"
							value={newActionItem.text}
							onChange={(e) =>
								setNewActionItem({ ...newActionItem, text: e.target.value })
							}
						/>
						<Input
							label="Assigned To"
							id="newActionAssigned"
							type="text"
							value={newActionItem.assigned}
							onChange={(e) =>
								setNewActionItem({ ...newActionItem, assigned: e.target.value })
							}
						/>
						<Input
							label="Due Date"
							id="newActionDueDate"
							type="date"
							value={newActionItem.dueDate}
							onChange={(e) =>
								setNewActionItem({ ...newActionItem, dueDate: e.target.value })
							}
						/>
						<Button
							onClick={() => {
								if (newActionItem.text) {
									onAddActionItem(newActionItem);
									setNewActionItem({ text: '', assigned: '', dueDate: '' });
								}
							}}
						>
							Add Action Item
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

// Main component
export default function OneOnOne() {	// State for meetings data
	// Was `const [meetings] = useState(...)` — setter never destructured, so
	// "Schedule New Meeting" had nothing to write to.
	const [meetings, setMeetings] = useState<Meeting[]>(initialMeetingsData);
	const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
	const [selectedTemplateId, setSelectedTemplateId] = useState('template1');
	const [showScheduleModal, setShowScheduleModal] = useState(false);
	const [newMeeting, setNewMeeting] = useState({ employeeName: '', managerName: '', scheduledDate: '', frequency: 'Weekly' });

	// State for meeting notes
	const [meetingNotes, setMeetingNotes] = useState<Record<string, string>>({});

	// State for action items
	const [actionItems, setActionItems] = useState<Record<string, ActionItem[]>>({});

	const handleScheduleMeeting = () => {
		if (!newMeeting.employeeName || !newMeeting.managerName || !newMeeting.scheduledDate) return;
		setMeetings(prev => [
			{ id: `meet-${Date.now()}`, ...newMeeting, status: 'Upcoming', agenda: '' },
			...prev,
		]);
		setShowScheduleModal(false);
		setNewMeeting({ employeeName: '', managerName: '', scheduledDate: '', frequency: 'Weekly' });
	};

	// Selecting an agenda template seeds that meeting's notes with the
	// template's section outline (only if notes are still empty, so it never
	// clobbers something the user already wrote).
	const handleSelectTemplate = (templateId: string) => {
		setSelectedTemplateId(templateId);
		if (!selectedMeeting) return;
		const template = agendaTemplates.find(t => t.id === templateId);
		if (!template || meetingNotes[selectedMeeting.id]) return;
		const outline = template.sections.map(s => `## ${s.title}\n${s.description}`).join('\n\n');
		setMeetingNotes(prev => ({ ...prev, [selectedMeeting.id]: outline }));
	};

	// Format date for display
	const formatDateTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString();
	};

	// Render status badge
	const renderStatus = (status: string) => {
		switch (status) {
			case 'Upcoming':
				return <Badge variant="warning" rounded>{status}</Badge>;
			case 'Completed':
				return <Badge variant="success" rounded>{status}</Badge>;
			case 'Cancelled':
				return <Badge variant="danger" rounded>{status}</Badge>;
			default:
				return <Badge variant="secondary" rounded>{status}</Badge>;
		}
	};

	// Handle meeting selection
	const handleMeetingSelect = (meeting: Meeting) => {
		setSelectedMeeting(meeting);

		// Initialize notes if not present
		if (!meetingNotes[meeting.id]) {
			setMeetingNotes({
				...meetingNotes,
				[meeting.id]: '',
			});
		}

		// Initialize action items if not present
		if (!actionItems[meeting.id]) {
			setActionItems({
				...actionItems,
				[meeting.id]: [],
			});
		}
	};

	// Handle adding an action item
	const handleAddActionItem = (item: ActionItem) => {
		if (selectedMeeting) {
			setActionItems({
				...actionItems,
				[selectedMeeting.id]: [
					...(actionItems[selectedMeeting.id] || []),
					item,
				],
			});
		}
	};

	// Handle updating an action item
	const handleUpdateActionItem = (index: number, item: ActionItem) => {
		if (selectedMeeting) {
			const updatedItems = [...(actionItems[selectedMeeting.id] || [])];
			updatedItems[index] = item;

			setActionItems({
				...actionItems,
				[selectedMeeting.id]: updatedItems,
			});
		}
	};

	// Prepare meetings data for display
	const formattedMeetings = meetings.map((meeting) => ({
		...meeting,
		scheduledDateFormatted: formatDateTime(meeting.scheduledDate),
		statusFormatted: renderStatus(meeting.status),
	}));

	return (
		<div>
			<PageHeader
				title="1:1 Meetings"
				subtitle="Schedule, prepare, and document one-on-one meetings"
				actionButton={<Button onClick={() => setShowScheduleModal(true)}>Schedule New Meeting</Button>}
			/>

			<div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
				<DataTable
					columns={meetingColumns}
					data={formattedMeetings}
					actions={(meeting) => {
						// Find the original meeting to pass to the handler
						const originalMeeting = meetings.find(m => m.id === meeting.id);
						return (
							<button
								className="text-blue-600 hover:text-blue-800 text-sm"
								onClick={() => originalMeeting && handleMeetingSelect(originalMeeting)}
							>
								View Agenda
							</button>
						);
					}}
				/>
			</div>

			{selectedMeeting && (
				<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Meeting Information */}
					<div className="bg-white shadow rounded-lg p-6">
						<h3 className="text-lg font-medium mb-4">Meeting Information</h3>
						<div className="space-y-4">
							{selectedMeeting && (
								<>
									<div className="flex justify-between">
										<span className="text-gray-600">Employee:</span>
										<span className="font-medium">
											{selectedMeeting.employeeName}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Manager:</span>
										<span className="font-medium">
											{selectedMeeting.managerName}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Scheduled:</span>
										<span className="font-medium">
											{formatDateTime(selectedMeeting.scheduledDate)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Frequency:</span>
										<span className="font-medium">
											{selectedMeeting.frequency}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Status:</span>
										<span>
											{renderStatus(selectedMeeting.status)}
										</span>
									</div>
								</>
							)}

							{/* Agenda Template Selection */}
							<div className="mt-6">
								<h4 className="font-medium mb-2">Agenda Template</h4>
								<div className="grid grid-cols-1 gap-2">
									{agendaTemplates.map((template) => (
										<button
											key={template.id}
											className={`p-2 border rounded text-left ${
												template.id === selectedTemplateId ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
											}`}
											onClick={() => handleSelectTemplate(template.id)}
										>
											{template.name}
										</button>
									))}
								</div>
							</div>
						</div>
					</div>

					{/* Meeting Agenda */}
					<div className="md:col-span-2 bg-white shadow rounded-lg p-6">
						<h3 className="text-lg font-medium mb-4">Meeting Agenda & Notes</h3>

						<MeetingDetails
							meeting={selectedMeeting}
							notes={meetingNotes[selectedMeeting.id] || ''}
							onNotesChange={(value) =>
								setMeetingNotes({ ...meetingNotes, [selectedMeeting.id]: value })
							}
							actionItems={actionItems[selectedMeeting.id] || []}
							onAddActionItem={handleAddActionItem}
							onUpdateActionItem={handleUpdateActionItem}
						/>
					</div>
				</div>
			)}

		{showScheduleModal && (
			<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
				<div className="bg-white rounded-lg p-6 w-full max-w-md">
					<h3 className="text-lg font-medium mb-4">Schedule New Meeting</h3>
					<div className="space-y-3">
						<input
							className="w-full border rounded px-3 py-2"
							placeholder="Employee Name"
							value={newMeeting.employeeName}
							onChange={e => setNewMeeting({ ...newMeeting, employeeName: e.target.value })}
						/>
						<input
							className="w-full border rounded px-3 py-2"
							placeholder="Manager Name"
							value={newMeeting.managerName}
							onChange={e => setNewMeeting({ ...newMeeting, managerName: e.target.value })}
						/>
						<input
							className="w-full border rounded px-3 py-2"
							type="datetime-local"
							value={newMeeting.scheduledDate}
							onChange={e => setNewMeeting({ ...newMeeting, scheduledDate: e.target.value })}
						/>
						<select
							className="w-full border rounded px-3 py-2"
							value={newMeeting.frequency}
							onChange={e => setNewMeeting({ ...newMeeting, frequency: e.target.value })}
						>
							<option>Weekly</option>
							<option>Bi-weekly</option>
							<option>Monthly</option>
						</select>
					</div>
					<div className="flex justify-end gap-2 mt-4">
						<Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
						<Button variant="primary" onClick={handleScheduleMeeting}>Schedule</Button>
					</div>
				</div>
			</div>
		)}
		</div>
	);
}
