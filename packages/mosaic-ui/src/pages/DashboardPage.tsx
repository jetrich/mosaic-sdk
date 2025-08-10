import React, { useState, useEffect } from 'react';
import { Navigation, TerminalWindow, TerminalContent, CodeBlock } from '../components';
import './DashboardPage.css';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', active: true },
  { label: 'Agents', href: '/agents' },
  { label: 'Deployments', href: '/deployments' },
  { label: 'Settings', href: '/settings' }
];

const recentCommands = [
  {
    command: 'mosaic agent create --name ReviewBot',
    output: '✓ Agent created: ReviewBot-2024-01-23-14:32:10'
  },
  {
    command: 'mosaic deploy production',
    output: '✓ Deployed to production (3.2s)'
  }
];

const agentConfig = `{
  "name": "CodeReviewer",
  "model": "claude-3-opus",
  "capabilities": ["code-review", "security-audit"],
  "active": true,
  "tasks_completed": 1247
}`;

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, trend }) => {
  return (
    <div className="metric-card">
      <h3 className="metric-title">{title}</h3>
      <div className="metric-value">{value}</div>
      {change && (
        <div className={`metric-change ${trend === 'up' ? 'positive' : 'negative'}`}>
          {trend === 'up' ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const [activeAgents, setActiveAgents] = useState(12);
  const [tasksCompleted, setTasksCompleted] = useState(3847);
  const [avgResponseTime, setAvgResponseTime] = useState(1.2);
  const [successRate, setSuccessRate] = useState(99.2);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartData, setChartData] = useState([60, 80, 70, 90, 85, 95, 88]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [agentFilter, setAgentFilter] = useState('all');

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTasksCompleted(prev => prev + Math.floor(Math.random() * 3));
      setAvgResponseTime(prev => Number((prev + (Math.random() - 0.5) * 0.1).toFixed(1)));
      setSuccessRate(prev => Number((prev + (Math.random() - 0.5) * 0.1).toFixed(1)));
      
      // Update chart data
      setChartData(prev => {
        const newData = [...prev];
        newData.push(Math.floor(Math.random() * 40) + 60); // Random data between 60-100
        if (newData.length > 7) newData.shift(); // Keep only last 7 points
        return newData;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setActiveAgents(Math.floor(Math.random() * 5) + 10);
    setIsRefreshing(false);
  };

  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
    // Simulate loading new data based on time range
    const newData = Array.from({ length: 7 }, () => Math.floor(Math.random() * 40) + 60);
    setChartData(newData);
  };

  const timeRanges = [
    { key: '24h', label: '24 Hours' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' }
  ];

  const agentFilters = [
    { key: 'all', label: 'All Agents' },
    { key: 'active', label: 'Active Only' },
    { key: 'idle', label: 'Idle Only' },
    { key: 'claude-opus', label: 'Claude Opus' },
    { key: 'claude-sonnet', label: 'Claude Sonnet' }
  ];

  return (
    <div className="dashboard-page">
      <Navigation 
        items={navItems}
        version="v0.1.0"
        onCommandPalette={() => console.log('Command palette opened')}
      />

      <div className="dashboard-container">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">Monitor your AI agents and deployments</p>
          </div>
          <div className="dashboard-actions">
            <div className="dashboard-controls">
              <select 
                className="dashboard-select"
                value={selectedTimeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
              >
                {timeRanges.map(range => (
                  <option key={range.key} value={range.key}>{range.label}</option>
                ))}
              </select>
              
              <select 
                className="dashboard-select"
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
              >
                {agentFilters.map(filter => (
                  <option key={filter.key} value={filter.key}>{filter.label}</option>
                ))}
              </select>
              
              <button 
                className="btn btn-secondary dashboard-refresh"
                onClick={handleRefreshData}
                disabled={isRefreshing}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="currentColor"
                  className={isRefreshing ? 'spinning' : ''}
                >
                  <path d="M1.705 8.005a.75.75 0 01.834.656 5.5 5.5 0 109.592-2.97l-1.204-1.204a.25.25 0 00-.427.177V7.5a.75.75 0 01-.75.75H4.5a.25.25 0 00-.177.427l1.204 1.204a.25.25 0 00.427-.177V8.739a.75.75 0 01.75-.75h2.19a4 4 0 11-6.62 3.417.75.75 0 01-.656-.834z"/>
                </svg>
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            <div className="dashboard-primary-actions">
              <button className="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM8 0a8 8 0 100 16A8 8 0 008 0zm.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"/>
                </svg>
                New Agent
              </button>
              <button className="btn btn-primary">Deploy</button>
            </div>
          </div>
        </header>

        {/* Metrics Grid */}
        <section className="metrics-grid">
          <MetricCard 
            title="Active Agents" 
            value={activeAgents.toString()} 
            change="2 from last week" 
            trend="up" 
          />
          <MetricCard 
            title="Tasks Completed" 
            value={tasksCompleted.toLocaleString()} 
            change="15% increase" 
            trend="up" 
          />
          <MetricCard 
            title="Avg Response Time" 
            value={`${avgResponseTime}s`} 
            change="0.3s faster" 
            trend="up" 
          />
          <MetricCard 
            title="Success Rate" 
            value={`${successRate}%`} 
            change="0.1%" 
            trend={successRate >= 99.0 ? "up" : "down"} 
          />
        </section>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Activity Feed */}
          <section className="dashboard-section">
            <h2 className="section-header">Recent Activity</h2>
            <TerminalWindow title="Command History">
              <TerminalContent commands={recentCommands} animated={false} />
            </TerminalWindow>
          </section>

          {/* Agent Status */}
          <section className="dashboard-section">
            <div className="section-header-with-controls">
              <h2 className="section-header">Agent Status</h2>
              <div className="agent-controls">
                <button className="agent-control-btn" title="Start all agents">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM6.5 5.5v5a.5.5 0 00.757.429l4-2.5a.5.5 0 000-.858l-4-2.5A.5.5 0 006.5 5.5z"/>
                  </svg>
                </button>
                <button className="agent-control-btn" title="Pause all agents">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM5 4.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v7a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-7zm4 0a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v7a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-7z"/>
                  </svg>
                </button>
                <button className="agent-control-btn" title="Add new agent">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM8 0a8 8 0 100 16A8 8 0 008 0zm.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="agent-list">
              <div className="agent-item active">
                <div className="agent-indicator"></div>
                <div className="agent-info">
                  <h3 className="agent-name">CodeReviewer</h3>
                  <p className="agent-status">Active • 3 tasks in queue</p>
                  <div className="agent-stats">
                    <span className="stat">127 tasks completed</span>
                    <span className="stat">98.5% success rate</span>
                  </div>
                </div>
                <div className="agent-actions">
                  <span className="agent-model">claude-3-opus</span>
                  <div className="agent-menu">
                    <button className="agent-menu-btn">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM1.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm13 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="agent-item active">
                <div className="agent-indicator"></div>
                <div className="agent-info">
                  <h3 className="agent-name">TestRunner</h3>
                  <p className="agent-status">Active • Idle</p>
                  <div className="agent-stats">
                    <span className="stat">89 tasks completed</span>
                    <span className="stat">100% success rate</span>
                  </div>
                </div>
                <div className="agent-actions">
                  <span className="agent-model">claude-3-sonnet</span>
                  <div className="agent-menu">
                    <button className="agent-menu-btn">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM1.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm13 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="agent-item">
                <div className="agent-indicator inactive"></div>
                <div className="agent-info">
                  <h3 className="agent-name">DocGenerator</h3>
                  <p className="agent-status">Inactive</p>
                  <div className="agent-stats">
                    <span className="stat">45 tasks completed</span>
                    <span className="stat">94.2% success rate</span>
                  </div>
                </div>
                <div className="agent-actions">
                  <span className="agent-model">claude-3-opus</span>
                  <div className="agent-menu">
                    <button className="agent-menu-btn">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM1.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm13 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Performance Chart */}
          <section className="dashboard-section chart-section">
            <div className="chart-header">
              <h2 className="section-header">Performance</h2>
              <div className="chart-info">
                <span className="chart-metric">Avg: {Math.round(chartData.reduce((a, b) => a + b, 0) / chartData.length)}%</span>
                <span className="chart-trend">↗ +12% vs last period</span>
              </div>
            </div>
            <div className="chart-placeholder">
              {chartData.map((value, index) => (
                <div 
                  key={index}
                  className="chart-bar" 
                  style={{ height: `${value}%` }}
                  title={`${value}%`}
                ></div>
              ))}
            </div>
            <div className="chart-labels">
              {(selectedTimeRange === '24h' ? 
                ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] :
                ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
              ).map((label, index) => (
                <span key={index}>{label}</span>
              ))}
            </div>
          </section>

          {/* Agent Configuration */}
          <section className="dashboard-section">
            <h2 className="section-header">Featured Agent</h2>
            <CodeBlock 
              code={agentConfig}
              language="json"
              filename="code-reviewer.json"
              showLineNumbers={false}
            />
          </section>
        </div>

        {/* Deployment Status */}
        <section className="deployment-section">
          <h2 className="section-header">Recent Deployments</h2>
          <div className="deployment-list">
            <div className="deployment-item">
              <div className="deployment-status success"></div>
              <div className="deployment-info">
                <h3 className="deployment-name">Production Deploy #142</h3>
                <p className="deployment-time">2 hours ago • 3 agents updated</p>
              </div>
              <span className="deployment-duration">3.2s</span>
            </div>
            <div className="deployment-item">
              <div className="deployment-status success"></div>
              <div className="deployment-info">
                <h3 className="deployment-name">Staging Deploy #483</h3>
                <p className="deployment-time">5 hours ago • 1 agent updated</p>
              </div>
              <span className="deployment-duration">2.8s</span>
            </div>
            <div className="deployment-item">
              <div className="deployment-status failed"></div>
              <div className="deployment-info">
                <h3 className="deployment-name">Production Deploy #141</h3>
                <p className="deployment-time">1 day ago • Rollback initiated</p>
              </div>
              <span className="deployment-duration">Failed</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};