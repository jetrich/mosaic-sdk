# Resource Management System

This document describes the resource management system implemented for the MosAIc MCP Orchestrator, providing comprehensive monitoring and control over system resources and agent behavior.

## Overview

The Resource Management System provides four main tools for monitoring and controlling system resources:

1. **`mosaic_resource_monitor`** - Real-time system and agent resource monitoring
2. **`mosaic_agent_limits`** - Agent resource limit management and enforcement
3. **`mosaic_performance_report`** - Performance analytics and optimization recommendations
4. **`mosaic_resource_alerts`** - Alert management and notification system

## Architecture

### ResourceService

The core service that handles all resource monitoring and management operations:

- **System Metrics Collection**: CPU, memory, disk usage tracking
- **Agent Resource Estimation**: Per-agent resource usage calculation
- **Limit Enforcement**: Resource limit validation and violations
- **Performance Analytics**: Historical data analysis and reporting
- **Alert Management**: Threshold monitoring and notification system

### ResourceTools

MCP tools that expose the ResourceService functionality:

- Comprehensive input validation using Zod schemas
- Detailed output formatting for different use cases
- Integration with existing agent and workflow systems
- Support for multiple report formats (detailed, summary, JSON)

## Tools Reference

### 1. mosaic_resource_monitor

Monitor system and agent resource usage with real-time metrics.

**Parameters:**
```typescript
{
  include_history?: boolean;        // Include historical resource data
  history_minutes?: number;         // Minutes of history to include (1-1440)
  include_alerts?: boolean;         // Include active resource alerts
  include_agent_usage?: boolean;    // Include per-agent resource usage
}
```

**Example Usage:**
```json
{
  "include_history": true,
  "history_minutes": 60,
  "include_alerts": true,
  "include_agent_usage": true
}
```

**Response:**
- Current system metrics (CPU, memory, uptime)
- Historical resource data (optional)
- Active resource alerts (optional)
- Per-agent resource usage (optional)
- System status summary

### 2. mosaic_agent_limits

Set, get, check, or remove resource limits for agents.

**Parameters:**
```typescript
{
  action: 'set' | 'get' | 'check' | 'remove';
  agent_id?: string;                // Specific agent ID
  persona?: string;                 // Agent persona pattern
  limits?: {                        // Required for 'set' action
    max_memory_mb: number;          // Maximum memory usage in MB (10-8192)
    max_cpu_percent: number;        // Maximum CPU usage percentage (1-100)
    max_concurrent_tasks: number;   // Maximum concurrent tasks (1-50)
    timeout_minutes?: number;       // Task timeout in minutes (1-1440)
  };
  created_by?: string;              // User setting the limits
}
```

**Example - Set Limits:**
```json
{
  "action": "set",
  "persona": "BE-BACKEND-BENJAMIN",
  "limits": {
    "max_memory_mb": 512,
    "max_cpu_percent": 75,
    "max_concurrent_tasks": 3,
    "timeout_minutes": 30
  },
  "created_by": "devops-team"
}
```

**Example - Check Limits:**
```json
{
  "action": "check",
  "agent_id": "agent-123"
}
```

### 3. mosaic_performance_report

Generate comprehensive performance analytics with optimization recommendations.

**Parameters:**
```typescript
{
  time_period_hours?: number;       // Time period in hours (1-168)
  include_recommendations?: boolean; // Include optimization recommendations
  include_trends?: boolean;          // Include resource usage trends
  format?: 'detailed' | 'summary' | 'json'; // Report output format
  save_report?: boolean;            // Save report to database
}
```

**Example Usage:**
```json
{
  "time_period_hours": 24,
  "include_recommendations": true,
  "include_trends": true,
  "format": "detailed",
  "save_report": true
}
```

**Response:**
- System performance metrics
- Agent performance analysis
- Resource usage trends
- Optimization recommendations
- Historical comparison data

### 4. mosaic_resource_alerts

Manage resource alerts and notifications.

**Parameters:**
```typescript
{
  action: 'list' | 'acknowledge' | 'resolve';
  alert_id?: string;                // Required for acknowledge/resolve
  severity_filter?: 'low' | 'medium' | 'high' | 'critical';
  entity_type?: 'system' | 'agent';
}
```

**Example - List Critical Alerts:**
```json
{
  "action": "list",
  "severity_filter": "critical"
}
```

**Example - Resolve Alert:**
```json
{
  "action": "resolve",
  "alert_id": "alert-123"
}
```

## Resource Metrics

### System Metrics

The system continuously monitors:

- **CPU Usage**: Percentage utilization based on load average
- **Memory Usage**: Physical memory consumption and availability
- **Load Average**: System load metrics over time
- **Uptime**: System operational time
- **Process Count**: Active process monitoring

### Agent Resource Estimation

For each agent, the system estimates:

- **Memory Usage**: Base memory (50MB) + task memory (25MB per task)
- **CPU Usage**: Dynamic based on agent status and task load
- **Task Count**: Current active tasks in agent queue
- **Resource Efficiency**: Tasks processed per MB ratio

### Alert Thresholds

Default alert thresholds (configurable):

- **CPU Warning**: 70%
- **CPU Critical**: 85%
- **Memory Warning**: 80%
- **Memory Critical**: 90%
- **Disk Warning**: 80%
- **Disk Critical**: 95%

## Performance Reports

### Report Components

1. **System Metrics**:
   - Average and peak CPU usage
   - Average and peak memory usage
   - Agent count trends
   - Task processing statistics

2. **Agent Performance**:
   - Most/least efficient agents
   - Resource violation counts
   - Agent utilization metrics

3. **Recommendations**:
   - Optimization suggestions
   - Scaling recommendations
   - Configuration improvements
   - Cleanup actions

4. **Trends Analysis**:
   - CPU usage trends
   - Memory usage trends
   - Efficiency improvements

### Recommendation Categories

- **Optimization**: Performance improvement suggestions
- **Scaling**: Infrastructure scaling recommendations
- **Configuration**: System configuration changes
- **Cleanup**: Maintenance and housekeeping actions

## Integration

### Database Schema

The resource management system uses three main tables:

1. **resource_limits**: Store agent resource limits
2. **resource_alerts**: Track system alerts and their status
3. **performance_reports**: Store generated performance reports
4. **metrics**: Store time-series resource metrics

### Service Integration

The ResourceService integrates with:

- **AgentService**: For agent lifecycle and status information
- **StateService**: For database operations and persistence
- **Logger**: For operational logging and debugging

### Monitoring Integration

- Automatic monitoring every 30 seconds
- Real-time alert generation
- Historical data maintenance (last 1000 readings)
- Configurable alert thresholds

## Best Practices

### Resource Limits

1. **Set Conservative Limits**: Start with lower limits and increase as needed
2. **Monitor Violations**: Regular checking for limit violations
3. **Persona-Based Limits**: Set limits based on agent personas rather than individual agents
4. **Regular Review**: Periodic review and adjustment of limits

### Performance Monitoring

1. **Regular Reports**: Generate daily/weekly performance reports
2. **Trend Analysis**: Monitor resource usage trends over time
3. **Proactive Optimization**: Act on recommendations before issues occur
4. **Historical Comparison**: Compare performance across different time periods

### Alert Management

1. **Acknowledge Promptly**: Acknowledge alerts when investigating
2. **Root Cause Analysis**: Investigate critical alerts immediately
3. **Resolution Tracking**: Mark alerts as resolved when fixed
4. **Threshold Tuning**: Adjust thresholds based on operational experience

## Troubleshooting

### Common Issues

1. **High CPU Usage**:
   - Check agent task load
   - Review concurrent agent count
   - Consider agent optimization

2. **Memory Issues**:
   - Monitor agent memory consumption
   - Check for memory leaks in long-running agents
   - Consider memory limit enforcement

3. **Performance Degradation**:
   - Generate performance report
   - Review efficiency trends
   - Check for resource violations

### Diagnostic Commands

```bash
# Check current system status
curl -X POST /tools/call -d '{"name": "mosaic_agent_resource_monitor", "arguments": {}}'

# Get performance report
curl -X POST /tools/call -d '{"name": "mosaic_agent_performance_report", "arguments": {"time_period_hours": 24}}'

# List active alerts
curl -X POST /tools/call -d '{"name": "mosaic_agent_resource_alerts", "arguments": {"action": "list"}}'
```

## Future Enhancements

### Planned Features

1. **Predictive Analytics**: Machine learning for resource usage prediction
2. **Auto-Scaling**: Automatic agent scaling based on resource usage
3. **Custom Metrics**: User-defined performance metrics
4. **Integration APIs**: External monitoring system integration
5. **Advanced Alerting**: Webhook and notification integrations

### Configuration Options

Future versions will support:

- Configurable monitoring intervals
- Custom alert thresholds
- External notification systems
- Resource usage quotas
- Agent priority systems

---

This resource management system provides comprehensive monitoring and control capabilities, ensuring optimal performance and preventing resource abuse in the MosAIc environment.