import React from 'react';
import PropTypes from 'prop-types';
import { Users } from 'lucide-react';

const EmployeeList = ({ employees }) => {
  const handleDragStart = (e, employee) => {
    e.dataTransfer.setData('employee', JSON.stringify(employee));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-40 border-r border-gray-200 bg-white flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">Nhân Viên</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">Kéo thả vào lịch làm việc</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {employees.map((employee) => (
            <div
              key={employee.id}
              draggable
              onDragStart={(e) => handleDragStart(e, employee)}
              className="bg-gray-100 border border-gray-200 rounded-lg p-3 cursor-move hover:bg-gray-200 transition-colors"
            >
              <div className="font-medium text-gray-900 text-sm">{employee.name}</div>
              <div className="text-xs text-gray-500 mt-1">{employee.position}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

EmployeeList.propTypes = {
  employees: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      position: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default EmployeeList;