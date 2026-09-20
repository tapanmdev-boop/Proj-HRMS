import { useState } from 'react';
import { PageHeader } from '../components/ui/Dashboard';
import { Button, Input, Textarea } from '../components/ui/Form';

// Helper function to determine button text based on upload/parsing state
const getButtonText = (isUploading: boolean, isParsing: boolean): string => {
  if (isUploading) return 'Uploading...';
  if (isParsing) return 'Parsing...';
  return 'Parse Resume';
};

type ParsedResume = {
  name: string;
  email: string;
  phone: string;
  education: string[];
  experience: string[];
  skills: string[];
  summary: string;
  parsedText: string;
};

const initialParsedResume: ParsedResume = {
  name: '',
  email: '',
  phone: '',
  education: [],
  experience: [],
  skills: [],
  summary: '',
  parsedText: ''
};

export default function ResumeParser() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [resumeData, setResumeData] = useState<ParsedResume>(initialParsedResume);
  const [successMessage, setSuccessMessage] = useState('');
  const [parseHistory, setParseHistory] = useState<{name: string, email: string, date: string}[]>([
    { name: "John Smith", email: "john.smith@example.com", date: "2025-06-01" },
    { name: "Maria Garcia", email: "maria.garcia@example.com", date: "2025-06-02" },
    { name: "David Kim", email: "david.kim@example.com", date: "2025-06-05" }
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setSuccessMessage('');
    }
  };

  const handleUpload = () => {
    if (!file) return;
    
    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      setIsParsing(true);
      
      // Simulate parsing process with mock data
      setTimeout(() => {
        // Mock result after "parsing"
        setResumeData({
          name: 'Alex Johnson',
          email: 'alex.johnson@example.com',
          phone: '(123) 456-7890',
          education: [
            'M.S. Computer Science, Stanford University, 2022-2024',
            'B.S. Computer Engineering, MIT, 2018-2022'
          ],
          experience: [
            'Software Engineer, Tech Solutions Inc., 2024-Present',
            'Software Development Intern, InnovateCorp, 2022-2024',
            'Research Assistant, MIT AI Lab, 2021-2022'
          ],
          skills: [
            'JavaScript', 'TypeScript', 'React', 'Node.js',
            'Python', 'Machine Learning', 'AWS', 'Docker',
            'Git', 'Agile Development', 'REST APIs'
          ],
          summary: 'Experienced software engineer with a strong background in full-stack development and machine learning. Passionate about creating efficient, scalable solutions to complex problems.',
          parsedText: 'Full resume content would appear here...'
        });
        
        setParseHistory(prev => [{
          name: 'Alex Johnson',
          email: 'alex.johnson@example.com',
          date: new Date().toISOString().split('T')[0]
        }, ...prev]);
        
        setIsParsing(false);
        setSuccessMessage('Resume parsed successfully! You can now review the extracted information.');
      }, 2000);
    }, 1500);
  };

  const handleSaveToCandidate = () => {
    // Simulate saving to candidate database
    setTimeout(() => {
      setSuccessMessage('Candidate information saved to the database!');
    }, 800);
  };
  
  // Refactor deeply nested functions to reduce nesting in ResumeParser
  // Extract inner functions to top-level or use helper functions
  const renderUploadSection = () => (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop your file here, or{' '}
          <label htmlFor="file-upload" className="text-indigo-600 hover:text-indigo-500 cursor-pointer">
            browse                      <Input 
              label="Resume File"
              id="file-upload" 
              type="file" 
              accept=".pdf,.doc,.docx" 
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PDF, DOC or DOCX up to 5MB
        </p>
      </div>
      
      {file && (
        <div className="flex items-center justify-between bg-gray-50 rounded p-3">
          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleUpload}
            disabled={isUploading || isParsing}
          >
            {getButtonText(isUploading, isParsing)}
          </Button>
        </div>
      )}
    </div>
  );

  const renderSuccessMessage = () => (
    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      </div>
    </div>
  );

  const renderParseHistory = () => (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Recently Parsed</h4>
      <ul className="space-y-2">              {parseHistory.map((item) => (
          <li key={`${item.email}-${item.date}`} className="text-sm p-2 hover:bg-gray-50 rounded flex justify-between">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-gray-500 text-xs">{item.email}</p>
            </div>
            <span className="text-xs text-gray-500">{item.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderParsingStats = () => (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Accuracy Rate</span>
          <span className="text-sm text-gray-700">93%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full" style={{ width: '93%' }}></div>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Parsed This Month</span>
          <span className="text-sm text-gray-700">124/150</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '83%' }}></div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 p-3 rounded">
          <p className="text-xs text-indigo-700">Average Parse Time</p>
          <p className="text-lg font-semibold text-indigo-900">4.2s</p>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <p className="text-xs text-green-700">Success Rate</p>
          <p className="text-lg font-semibold text-green-900">98.5%</p>
        </div>
      </div>
    </div>
  );

  const renderParsedResumeData = () => (
    <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
      <div className="flex justify-between mb-4">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">Parsed Resume Data</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setResumeData(initialParsedResume)}>
            Reset
          </Button>
          <Button variant="primary" size="sm" onClick={handleSaveToCandidate}>
            Save to Candidates
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              Name
            </label>                    <Input
              label="Name"
              id="name"
              type="text"
              value={resumeData.name}
              onChange={(e) => setResumeData({...resumeData, name: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email
            </label>                    <Input
              label="Email"
              id="email"
              type="email"
              value={resumeData.email}
              onChange={(e) => setResumeData({...resumeData, email: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
              Phone
            </label>                    <Input
              label="Phone"
              id="phone"
              type="text"
              value={resumeData.phone}
              onChange={(e) => setResumeData({...resumeData, phone: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="summary">
              Summary
            </label>                    <Textarea
              label="Summary"
              id="summary"
              rows={4}
              value={resumeData.summary}
              onChange={(e) => setResumeData({...resumeData, summary: e.target.value})}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>                    <label htmlFor="skills-section" className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <div id="skills-section" className="bg-gray-50 p-3 rounded border border-gray-200 min-h-[100px]">
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill) => (
                  <span key={`skill-${skill}`} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div>                    <label htmlFor="education-section" className="block text-sm font-medium text-gray-700 mb-1">Education</label>
            <div id="education-section" className="bg-gray-50 p-3 rounded border border-gray-200 min-h-[100px]">
              <ul className="list-disc list-inside text-sm space-y-1">
                {resumeData.education.map((edu) => (
                  <li key={`edu-${edu.substring(0, 20)}`}>{edu}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div>                    <label htmlFor="experience-section" className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
            <div id="experience-section" className="bg-gray-50 p-3 rounded border border-gray-200 min-h-[100px]">
              <ul className="list-disc list-inside text-sm space-y-1">
                {resumeData.experience.map((exp) => (
                  <li key={`exp-${exp.substring(0, 20)}`}>{exp}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
        <div className="mt-6">
        <label htmlFor="raw-parsed-text" className="block text-sm font-medium text-gray-700 mb-1">Raw Parsed Text</label>
        <div id="raw-parsed-text" className="bg-gray-50 p-3 rounded border border-gray-200 h-32 overflow-y-auto">
          <pre className="text-xs text-gray-600">{resumeData.parsedText || 'No content parsed yet.'}</pre>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Resume Parser" 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Upload Resume</h3>
            
            {!resumeData.name && renderUploadSection()}
            
            {successMessage && renderSuccessMessage()}
            
            {renderParseHistory()}
          </div>
          
          <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900 mb-4">Parsing Stats</h3>
            {renderParsingStats()}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          {resumeData.name ? renderParsedResumeData() : (
            <div className="bg-white rounded-xl border border-ivory-300 shadow-premium-sm p-6 flex flex-col items-center justify-center h-full">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600 text-center max-w-md">
                Upload a resume to automatically extract candidate information. 
                Our AI-powered parser will identify key details like contact information, 
                education, experience, and skills.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
