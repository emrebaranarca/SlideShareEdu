// Statistics.js - Page for displaying usage statistics
import React, { useState, useEffect } from 'react';
import { statsService } from '../services/api';
import {
  FaSpinner,
  FaExclamationCircle,
  FaChartBar,
  FaUsers,
  FaChalkboardTeacher,
  FaCalendarAlt
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell } from 'recharts';
import '../styles/Statistics.css';

const Statistics = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPresentations: 0,
    activeStudentsCount: 0,
    mostViewedPresentations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30');  // Default to last 30 days

  // Custom colors for charts
  const COLORS = ['#2979FF', '#FF7043', '#00C853', '#FFB74D', '#7E57C2'];

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await statsService.getOverallStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format data for bar chart
  const barChartData = stats.mostViewedPresentations?.map(item => ({
    name: item.title,
    views: item.viewCount
  })) || [];

  // Format data for pie chart
  const pieChartData = [
    { name: 'Active Students', value: stats.activeStudentsCount },
    { name: 'Inactive Students', value: stats.totalStudents - stats.activeStudentsCount }
  ];

  if (loading) {
    return (
      <div className="loading-state">
        <FaSpinner className="spinner" />
        <p>Loading statistics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <FaExclamationCircle />
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={fetchStatistics} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="page-header">
        <h1>Usage Statistics</h1>
        <div className="date-range-selector">
          <label htmlFor="dateRange">
            <FaCalendarAlt />
            <span>Time Period:</span>
          </label>
          <select 
            id="dateRange" 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="180">Last 6 Months</option>
            <option value="365">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>Total Students</h3>
            <div className="stat-value">{stats.totalStudents}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaChalkboardTeacher />
          </div>
          <div className="stat-content">
            <h3>Total Presentations</h3>
            <div className="stat-value">{stats.totalPresentations}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>Active Students</h3>
            <div className="stat-value">{stats.activeStudentsCount}</div>
            <div className="stat-subtext">in the selected period</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-container">
        {/* Most Viewed Presentations Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>
              <FaChartBar />
              Most Viewed Presentations
            </h2>
          </div>
          <div className="chart-body">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={barChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" name="Views" fill="#2979FF" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <p>No presentation data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Student Activity Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>
              <FaUsers />
              Student Activity
            </h2>
          </div>
          <div className="chart-body">
            {stats.totalStudents > 0 ? (
              <div className="pie-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Students']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-chart">
                <p>No student activity data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;