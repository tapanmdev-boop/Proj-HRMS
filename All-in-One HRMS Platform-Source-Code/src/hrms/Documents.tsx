import { useState } from 'react';
import { PageHeader, DataTable } from '../components/ui/Dashboard';
import { Button, Input } from '../components/ui/Form';
import { Badge } from '../components/ui/Notifications';

// Mock document data
const initialDocuments = [
  {
    id: '1',
    title: 'Employment Contract Template',
    category: 'Contract',
    lastUpdated: '2025-04-15',
    owner: 'HR Department',
    status: 'Active'
  },
  {
    id: '2',
    title: 'Offer Letter Template',
    category: 'Onboarding',
    lastUpdated: '2025-04-10',
    owner: 'HR Department',
    status: 'Active'
  },
  {
    id: '3',
    title: 'Non-Disclosure Agreement',
    category: 'Legal',
    lastUpdated: '2025-03-22',
    owner: 'Legal Department',
    status: 'Active'
  },
  {
    id: '4',
    title: 'Employee Handbook',
    category: 'Policy',
    lastUpdated: '2025-01-05',
    owner: 'HR Department',
    status: 'Under Review'
  },
  {
    id: '5',
    title: 'Exit Interview Form',
    category: 'Offboarding',
    lastUpdated: '2024-11-12',
    owner: 'HR Department',
    status: 'Active'
  }
];

// Document categories for filtering
const documentCategories = [
  'All',
  'Contract',
  'Onboarding',
  'Offboarding',
  'Policy',
  'Legal'
];

// Column definitions for the document table
const documentColumns = [
  { key: 'title', label: 'Document Title' },
  { key: 'category', label: 'Category' },
  { key: 'lastUpdated', label: 'Last Updated' },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: 'Status' }
];

const LETTER_TEMPLATES = [
  'Offer Letter',
  'Labour Contract (MOHRE)',
  'Experience Certificate',
  'Salary Certificate',
  'No Objection Certificate (NOC)',
  'Relieving Letter',
];

function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Simple, generic letter body — Phase 2 (Documents & HR Letters module) is
// where real per-template, per-employee letter generation lands.
function generateLetterText(letterType: string): string {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return `${letterType}\n\nDate: ${today}\n\n[Company Letterhead]\n\nThis is a placeholder ${letterType.toLowerCase()} generated from the HR Documents module. Fill in employee-specific details before issuing.\n`;
}

export default function Documents() {
  // Was `const [documents] = useState(...)` — setter never destructured, so
  // Upload/Edit had nothing to write to.
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', category: 'Contract' });
  const [viewDoc, setViewDoc] = useState<typeof initialDocuments[number] | null>(null);
  const [editDoc, setEditDoc] = useState<typeof initialDocuments[number] | null>(null);

  // Format date values
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render document status with appropriate styling
  const renderDocumentStatus = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success" rounded>{status}</Badge>;
      case 'Under Review':
        return <Badge variant="warning" rounded>{status}</Badge>;
      case 'Archived':
        return <Badge variant="secondary" rounded>{status}</Badge>;
      default:
        return <Badge variant="info" rounded>{status}</Badge>;
    }
  };

  // Filter documents based on category and search query
  const filteredDocuments = documents.filter(doc => {
    return (
      (selectedCategory === 'All' || doc.category === selectedCategory) &&
      (searchQuery === '' || doc.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Format documents for display
  const formattedDocuments = filteredDocuments.map(doc => ({
    ...doc,
    lastUpdated: formatDate(doc.lastUpdated),
    status: renderDocumentStatus(doc.status)
  }));

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUpload = () => {
    if (!newDoc.title) return;
    setDocuments(prev => [
      {
        id: Date.now().toString(),
        title: newDoc.title,
        category: newDoc.category,
        lastUpdated: new Date().toISOString().split('T')[0],
        owner: 'You',
        status: 'Active',
      },
      ...prev,
    ]);
    setShowUploadModal(false);
    setNewDoc({ title: '', category: 'Contract' });
  };

  const findDoc = (id: string) => documents.find(d => d.id === id);

  const renderDocumentActions = (row: Record<string, any>) => {
    const doc = findDoc(row.id);
    if (!doc) return null;
    return (
      <div className="flex gap-1">
        <Button variant="ghost-primary" size="sm" onClick={() => setViewDoc(doc)}>View</Button>
        <Button variant="ghost-success" size="sm" onClick={() => setEditDoc(doc)}>Edit</Button>
        <Button
          variant="ghost-secondary"
          size="sm"
          onClick={() => downloadTextFile(`${doc.title.replace(/\s+/g, '-').toLowerCase()}.txt`, `${doc.title}\n\nCategory: ${doc.category}\nOwner: ${doc.owner}\nStatus: ${doc.status}\nLast Updated: ${formatDate(doc.lastUpdated)}\n`)}
        >
          Download
        </Button>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="HR Documents & Templates"
        subtitle="Manage HR letters, templates, and document generation"
        actionButton={
          <Button onClick={() => setShowUploadModal(true)}>Upload New Document</Button>
        }
      />

      <div className="mt-6 bg-white p-4 rounded-xl border border-ivory-300 shadow-premium-sm">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={handleSearchChange}
              label=""
            />
          </div>
          <div className="w-40">
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gold-400 focus:border-gold-500"
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              {documentCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          columns={documentColumns}
          data={formattedDocuments}
          actions={renderDocumentActions}
        />
      </div>

      <div className="mt-6 bg-white p-4 rounded-xl border border-ivory-300 shadow-premium-sm">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Generate HR Letters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {LETTER_TEMPLATES.map((letter) => (
            <button
              key={letter}
              onClick={() => downloadTextFile(`${letter.replace(/\s+/g, '-').toLowerCase()}.txt`, generateLetterText(letter))}
              className="border rounded-md p-4 hover:shadow-md hover:border-brand-300 cursor-pointer transition-shadow text-left"
            >
              <div className="flex items-center mb-2">
                <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h4 className="text-md font-medium">{letter}</h4>
              </div>
              <p className="text-sm text-gray-500">Generate a customized {letter.toLowerCase()} for employees</p>
            </button>
          ))}
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-ink-950/50 backdrop-blur-[2px] z-50">
          <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-lg p-6 w-full max-w-md">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Upload New Document</h3>
            <div className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Document Title"
                value={newDoc.title}
                onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
              />
              <select
                className="w-full border rounded px-3 py-2"
                value={newDoc.category}
                onChange={e => setNewDoc({ ...newDoc, category: e.target.value })}
              >
                {documentCategories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleUpload}>Upload</Button>
            </div>
          </div>
        </div>
      )}

      {viewDoc && (
        <div className="fixed inset-0 flex items-center justify-center bg-ink-950/50 backdrop-blur-[2px] z-50">
          <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-lg p-6 w-full max-w-md">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">{viewDoc.title}</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Category:</span> {viewDoc.category}</p>
              <p><span className="font-semibold">Owner:</span> {viewDoc.owner}</p>
              <p><span className="font-semibold">Status:</span> {viewDoc.status}</p>
              <p><span className="font-semibold">Last Updated:</span> {formatDate(viewDoc.lastUpdated)}</p>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setViewDoc(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {editDoc && (
        <div className="fixed inset-0 flex items-center justify-center bg-ink-950/50 backdrop-blur-[2px] z-50">
          <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-lg p-6 w-full max-w-md">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Edit Document</h3>
            <div className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2"
                value={editDoc.title}
                onChange={e => setEditDoc({ ...editDoc, title: e.target.value })}
              />
              <select
                className="w-full border rounded px-3 py-2"
                value={editDoc.category}
                onChange={e => setEditDoc({ ...editDoc, category: e.target.value })}
              >
                {documentCategories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                className="w-full border rounded px-3 py-2"
                value={editDoc.status}
                onChange={e => setEditDoc({ ...editDoc, status: e.target.value })}
              >
                {['Active', 'Under Review', 'Archived'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditDoc(null)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setDocuments(prev => prev.map(d => d.id === editDoc.id ? { ...editDoc, lastUpdated: new Date().toISOString().split('T')[0] } : d));
                  setEditDoc(null);
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
