import { Link } from 'react-router-dom';

interface DashboardCardProps {
  title: string;
  value: string | number;
  bgColor: string;
  icon?: React.ReactNode;
  change?: {
    value: string;
    positive: boolean;
  };
}

export const DashboardCard = ({ title, value, bgColor, icon, change }: DashboardCardProps) => {
  return (
    <div className={`p-6 rounded-lg shadow-sm ${bgColor} border border-opacity-10`}>
      <div className="flex justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        {icon && <div>{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {change && (
        <p className={`text-sm mt-2 ${change.positive ? 'text-green-500' : 'text-red-500'}`}>
          {change.positive ? '↑' : '↓'} {change.value} from last month
        </p>
      )}
    </div>
  );
};

export const DataTable = ({ 
  columns, 
  data,
  actions
}: { 
  columns: { key: string; label: string }[];
  data: Record<string, any>[];
  actions?: (row: Record<string, any>) => React.ReactNode;
}) => {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(column => (
              <th 
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">            {data.map((row, index) => {
              // Generate a more unique key using column values if possible
              const rowKey = row.id || `row-${Object.values(row).join('-')}-${index}`;
              
              return (
                <tr key={rowKey}>
                  {columns.map(column => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
                      {row[column.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              );
            })}
          {data.length === 0 && (
            <tr>
              <td 
                colSpan={columns.length + (actions ? 1 : 0)} 
                className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export const PageHeader = ({ 
  title, 
  subtitle,
  actionButton 
}: { 
  title: string; 
  subtitle?: string;
  actionButton?: React.ReactNode;
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};

export const Breadcrumbs = ({ items }: { items: { label: string; path?: string }[] }) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
            </svg>
            Home
          </Link>
        </li>        {items.map((item) => (
          <li key={`breadcrumb-${item.label}`}>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              {item.path ? (
                <Link to={item.path} className="ml-1 text-sm text-gray-500 hover:text-gray-700 md:ml-2">{item.label}</Link>
              ) : (
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">{item.label}</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};
