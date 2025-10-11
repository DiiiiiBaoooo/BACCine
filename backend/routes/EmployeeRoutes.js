import express from 'express';
import { createEmployee, deleteEmployee, getEmployeeOnline, getEmployees, getEmployeeStatistics, updateEmployeeRole } from '../controller/Employee.js';

const EmployeeRoute = express.Router();

// Route to get employees by cinema cluster
EmployeeRoute.get('/cinema-cluster/:cinema_cluster_id', getEmployees);
EmployeeRoute.get('/online', getEmployeeOnline);

// Route to create a new employee
EmployeeRoute.post('/', createEmployee);
EmployeeRoute.get('/statistics', getEmployeeStatistics);

// Route to update employee role/position
EmployeeRoute.put('/:id', updateEmployeeRole);

// Route to delete employee from cluster
EmployeeRoute.delete('/:id', deleteEmployee);

export default EmployeeRoute;