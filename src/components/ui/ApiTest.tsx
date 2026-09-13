// src/components/ui/ApiTest.tsx
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api/config';

export function ApiTest() {
  const [apiStatus, setApiStatus] = useState<string>('Checking API connection...');
  const [users, setUsers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check API connection
    fetch(`${API_BASE_URL}/`)
      .then(response => {
        if (response.ok) {
          setApiStatus('API connection successful!');
          return response.text();
        } else {
          throw new Error(`API returned status: ${response.status}`);
        }
      })
      .then(data => {
        console.log('API response:', data);
      })
      .catch(err => {
        setApiStatus(`API connection failed: ${err.message}`);
        setError(err.message);
      });
  }, []);

  // Function to fetch users
  const fetchUsers = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/users`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Function to fetch employees
  const fetchEmployees = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/employees`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.status}`);
      }
      
      const data = await response.json();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
      
      <div className={`p-4 mb-6 rounded ${
        apiStatus.includes('successful') 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {apiStatus}
      </div>
      
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-800 rounded">
          Error: {error}
        </div>
      )}
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Fetch Users
        </button>
        
        <button 
          onClick={fetchEmployees}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Fetch Employees
        </button>
      </div>
      
      {users.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Users</h2>
          <div className="bg-gray-50 p-4 rounded overflow-auto max-h-60">
            <pre>{JSON.stringify(users, null, 2)}</pre>
          </div>
        </div>
      )}
      
      {employees.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Employees</h2>
          <div className="bg-gray-50 p-4 rounded overflow-auto max-h-60">
            <pre>{JSON.stringify(employees, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
