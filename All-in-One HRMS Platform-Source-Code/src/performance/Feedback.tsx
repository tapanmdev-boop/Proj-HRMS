import { useState } from 'react';
import { useFeedback, useFeedbackRequests } from './api';

// People you work with for giving feedback
const mockPeople = [
	{
		id: 1,
		name: 'Alex Johnson',
		avatar: 'AJ',
		avatarColor: 'bg-yellow-200 text-yellow-700',
		role: 'Frontend Developer',
	},
	{
		id: 2,
		name: 'Emily Davis',
		avatar: 'ED',
		avatarColor: 'bg-indigo-200 text-indigo-700',
		role: 'UX Designer',
	},
	{
		id: 3,
		name: 'Mark Wilson',
		avatar: 'MW',
		avatarColor: 'bg-red-200 text-red-700',
		role: 'Project Manager',
	},
	{
		id: 4,
		name: 'Sophia Lee',
		avatar: 'SL',
		avatarColor: 'bg-emerald-200 text-emerald-700',
		role: 'Backend Developer',
	},
	{
		id: 5,
		name: 'James Taylor',
		avatar: 'JT',
		avatarColor: 'bg-amber-200 text-amber-700',
		role: 'DevOps Engineer',
	},
];

export default function Feedback() {
	const [activeTab, setActiveTab] = useState('received');
	const [feedbackType, setFeedbackType] = useState('all');
	const [isGivingFeedback, setIsGivingFeedback] = useState(false);
	const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
	const [respondingToRequestId, setRespondingToRequestId] = useState<number | null>(null);
	const [formFeedbackType, setFormFeedbackType] = useState<'praise' | 'constructive'>('praise');
	const [formMessage, setFormMessage] = useState('');
	// Use our API hooks
	const { feedback: receivedFeedback, setFeedback: setReceivedFeedback, loading: feedbackLoading, error: feedbackError } =
		useFeedback();
	const { feedbackRequests, setFeedbackRequests, loading: requestsLoading, error: requestsError } =
		useFeedbackRequests();

	// Handle loading and error states
	const isLoading = feedbackLoading || requestsLoading;
	const hasError = feedbackError || requestsError;

	if (isLoading) {
		return <div className="text-center py-10">Loading feedback data...</div>;
	}

	if (hasError) {
		return (
			<div className="text-center py-10 text-red-600">
				Error loading feedback data:{' '}
				{feedbackError?.message ?? requestsError?.message}
			</div>
		);
	}

	// Filter feedback by type
	const filteredFeedback =
		feedbackType === 'all'
			? receivedFeedback
			: receivedFeedback.filter((feedback) => feedback.type === feedbackType);

	// "Provide Feedback" on a pending request jumps to the give-feedback flow,
	// pre-selecting the matching person (matched by name) and remembering
	// which request to clear once feedback is actually submitted.
	const handleProvideFeedback = (requestId: number, forName: string) => {
		const person = mockPeople.find((p) => p.name === forName);
		setRespondingToRequestId(requestId);
		setSelectedPerson(person?.id ?? null);
		setIsGivingFeedback(true);
		setActiveTab('give');
	};

	const handleSubmitFeedback = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedPerson || !formMessage) return;
		const person = mockPeople.find((p) => p.id === selectedPerson);
		if (!person) return;

		setReceivedFeedback((prev) => [
			{
				id: Date.now(),
				from: 'You',
				avatar: 'ME',
				avatarColor: 'bg-gray-200 text-gray-700',
				message: formMessage,
				date: new Date().toISOString().split('T')[0],
				type: formFeedbackType,
			},
			...prev,
		]);

		if (respondingToRequestId !== null) {
			setFeedbackRequests((prev) => prev.filter((r) => r.id !== respondingToRequestId));
		}

		setIsGivingFeedback(false);
		setSelectedPerson(null);
		setRespondingToRequestId(null);
		setFormMessage('');
		setFormFeedbackType('praise');
		setActiveTab('received');
	};

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
				<h2 className="font-display text-[26px] font-medium leading-tight tracking-[-0.02em] text-ink-900 mb-4">Feedback</h2>

				<div className="border-b border-gray-200 mb-4">
					<nav className="-mb-px flex space-x-8">
						<button
							onClick={() => setActiveTab('received')}
							className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
								activeTab === 'received'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							}`}
						>
							Feedback Received
						</button>
						<button
							onClick={() => setActiveTab('requests')}
							className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
								activeTab === 'requests'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							}`}
						>
							Pending Requests{' '}
							{feedbackRequests.length > 0 && (
								<span className="bg-blue-100 text-blue-600 text-xs px-2 rounded-full ml-1">
									{feedbackRequests.length}
								</span>
							)}
						</button>
						<button
							onClick={() => setActiveTab('give')}
							className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
								activeTab === 'give'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							}`}
						>
							Give Feedback
						</button>
					</nav>
				</div>

				{activeTab === 'received' && (
					<>
						<div className="mb-6">
							<div className="flex space-x-4">
								<button
									onClick={() => setFeedbackType('all')}
									className={`px-4 py-2 text-sm font-medium rounded-md ${
										feedbackType === 'all'
											? 'bg-gray-100 text-gray-900'
											: 'text-gray-500 hover:bg-gray-50'
									}`}
								>
									All Feedback
								</button>
								<button
									onClick={() => setFeedbackType('praise')}
									className={`px-4 py-2 text-sm font-medium rounded-md ${
										feedbackType === 'praise'
											? 'bg-green-100 text-green-900'
											: 'text-gray-500 hover:bg-gray-50'
									}`}
								>
									Praise
								</button>
								<button
									onClick={() => setFeedbackType('constructive')}
									className={`px-4 py-2 text-sm font-medium rounded-md ${
										feedbackType === 'constructive'
											? 'bg-blue-100 text-blue-900'
											: 'text-gray-500 hover:bg-gray-50'
									}`}
								>
									Constructive Feedback
								</button>
							</div>
						</div>

						<div className="space-y-4">
							{filteredFeedback.length > 0 ? (
								filteredFeedback.map((feedback) => (
									<div
										key={feedback.id}
										className={`p-4 rounded-md border ${
											feedback.type === 'praise'
												? 'bg-green-50 border-green-100'
												: 'bg-blue-50 border-blue-100'
										}`}
									>
										<div className="flex items-start">
											<div
												className={`h-10 w-10 rounded-full ${feedback.avatarColor} flex items-center justify-center mr-3`}
											>
												{feedback.avatar}
											</div>
											<div>
												<p className="font-medium">{feedback.from}</p>
												<p className="text-sm text-gray-600 mb-2">
													{feedback.message}
												</p>
												<p className="text-xs text-gray-400">
													{new Date(feedback.date).toLocaleDateString(
														'en-US',
														{
															year: 'numeric',
															month: 'long',
															day: 'numeric',
														}
													)}
												</p>
											</div>
										</div>
									</div>
								))
							) : (
								<p className="text-gray-500 text-center py-6">
									No feedback found for the selected category.
								</p>
							)}
						</div>
					</>
				)}
				{activeTab === 'requests' && (
					<div className="space-y-4">
						{feedbackRequests.length > 0 ? (
							feedbackRequests.map((request) => (
								<div
									key={request.id}
									className="p-4 bg-white rounded-xl border border-ivory-300 shadow-premium-sm hover:border-gold-300 transition-colors"
								>
									<div className="flex justify-between">
										<div className="flex items-center">
											<div
												className={`h-10 w-10 rounded-full ${request.avatarColor} flex items-center justify-center mr-3`}
											>
												{request.avatar}
											</div>
											<div>
												<p className="font-medium">{request.for}</p>
												<p className="text-sm text-gray-500">
													Project: {request.project} • Due:{' '}
													{new Date(request.dueDate).toLocaleDateString()}
												</p>
											</div>
										</div>
										<button
											onClick={() => handleProvideFeedback(request.id, request.for)}
											className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
										>
											Provide Feedback
										</button>
									</div>
								</div>
							))
						) : (
							<p className="text-gray-500 text-center py-6">
								No pending feedback requests.
							</p>
						)}
					</div>
				)}

				{activeTab === 'give' && !isGivingFeedback && (
					<div>
						<p className="text-gray-600 mb-4">
							Select a colleague to provide feedback to:
						</p>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{mockPeople.map((person) => (
								<button
									key={person.id}
									className="w-full text-left p-4 border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gold-400"
									onClick={() => {
										setSelectedPerson(person.id);
										setIsGivingFeedback(true);
									}}
								>
									<div className="flex items-center">
										<div
											className={`h-10 w-10 rounded-full ${person.avatarColor} flex items-center justify-center mr-3`}
										>
											{person.avatar}
										</div>
										<div>
											<p className="font-medium">{person.name}</p>
											<p className="text-sm text-gray-500">
												{person.role}
											</p>
										</div>
									</div>
								</button>
							))}
						</div>
					</div>
				)}
				{activeTab === 'give' && isGivingFeedback && selectedPerson && (
					<div>
						<button
							onClick={() => setIsGivingFeedback(false)}
							className="mb-4 flex items-center text-sm text-blue-600 hover:text-blue-800"
						>
							<svg
								className="w-5 h-5 mr-1"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
									clipRule="evenodd"
								/>
							</svg>
							Back to people
						</button>

						<div className="mb-6">
							<div className="flex items-center mb-6">
								<div
									className={`h-12 w-12 rounded-full ${mockPeople.find(
										(p) => p.id === selectedPerson
									)?.avatarColor} flex items-center justify-center mr-3`}
								>
									{mockPeople.find((p) => p.id === selectedPerson)?.avatar}
								</div>
								<div>
									<p className="font-medium text-lg">
										{mockPeople.find((p) => p.id === selectedPerson)?.name}
									</p>
									<p className="text-sm text-gray-500">
										{mockPeople.find((p) => p.id === selectedPerson)?.role}
									</p>
								</div>
							</div>

							<form onSubmit={handleSubmitFeedback}>
								<fieldset className="mb-4">
									<legend className="block text-sm font-medium text-gray-700 mb-1">
										Feedback Type
									</legend>
									<div className="flex space-x-4">
										<label
											className="inline-flex items-center"
											htmlFor="feedback-type-praise"
										>
											<input
												type="radio"
												id="feedback-type-praise"
												name="feedbackType"
												value="praise"
												className="h-4 w-4 text-blue-600 border-gray-300 rounded"
												checked={formFeedbackType === 'praise'}
												onChange={() => setFormFeedbackType('praise')}
											/>
											<span className="ml-2 text-sm">Praise</span>
										</label>

										<label
											className="inline-flex items-center"
											htmlFor="feedback-type-constructive"
										>
											<input
												type="radio"
												id="feedback-type-constructive"
												name="feedbackType"
												value="constructive"
												className="h-4 w-4 text-blue-600 border-gray-300 rounded"
												checked={formFeedbackType === 'constructive'}
												onChange={() => setFormFeedbackType('constructive')}
											/>
											<span className="ml-2 text-sm">
												Constructive Feedback
											</span>
										</label>
									</div>
								</fieldset>

								<div className="mb-4">
									<label
										htmlFor="feedback-message"
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Your Feedback
									</label>
									<textarea
										id="feedback-message"
										className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-gold-400 focus:border-gold-500 sm:text-sm"
										rows={5}
										placeholder="What would you like to share with your colleague?"
										value={formMessage}
										onChange={(e) => setFormMessage(e.target.value)}
										required
									></textarea>
								</div>

								<div className="flex justify-end space-x-3">
									<button
										type="button"
										onClick={() => { setIsGivingFeedback(false); setRespondingToRequestId(null); }}
										className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm rounded-md hover:bg-gray-50"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
									>
										Submit Feedback
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
