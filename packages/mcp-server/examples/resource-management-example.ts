#!/usr/bin/env tsx
/**
 * Resource Management Example
 * 
 * This example demonstrates the three main resource management tools:
 * 1. mosaic_resource_monitor - Real-time system and agent monitoring
 * 2. mosaic_agent_limits - Resource limit management for agents
 * 3. mosaic_performance_report - Performance analytics and optimization
 */

import { MCPServer } from '../src/server/MCPServer';
import { Logger } from '../src/utils/Logger';
import { defaultConfig } from '../src/index';
import path from 'path';

async function resourceManagementDemo() {
  console.log('🔧 MosAIc Resource Management Demo');
  console.log('==================================\n');

  // Initialize server with resource management enabled
  const config = {
    ...defaultConfig,
    storage: {
      ...defaultConfig.storage,
      connection_string: path.join(__dirname, '../data/resource-demo.db')
    },
    logging: {
      ...defaultConfig.logging,
      level: 'info' as const,
      console: true
    }
  };

  const logger = new Logger(config.logging);
  const server = new MCPServer(config, logger);

  try {
    // Start the server
    console.log('🚀 Starting MCP server...');
    await server.start();
    console.log('✅ Server started successfully\n');

    // Get available tools
    const tools = await server.getTools();
    const resourceTools = Object.keys(tools).filter(name => 
      name.includes('resource') || name.includes('agent_limits') || name.includes('performance')
    );

    console.log('🛠️  Available Resource Management Tools:');
    resourceTools.forEach(tool => {
      console.log(`   - ${tool}`);
    });
    console.log();

    // Demo 1: Resource Monitoring
    console.log('📊 Demo 1: System Resource Monitoring');
    console.log('-------------------------------------');
    
    const monitorResult = await simulateToolCall(server, 'mosaic_agent_resource_monitor', {
      include_history: false,
      include_alerts: true,
      include_agent_usage: true
    });
    
    console.log('Current system status:', monitorResult?.metadata?.data?.summary?.system_status);
    console.log('Active agents:', monitorResult?.metadata?.data?.summary?.active_agents);
    console.log('Alert count:', monitorResult?.metadata?.data?.summary?.alert_count);
    console.log();

    // Demo 2: Setting Agent Resource Limits
    console.log('🎯 Demo 2: Agent Resource Limits');
    console.log('---------------------------------');
    
    // Set limits for a backend agent
    const setLimitsResult = await simulateToolCall(server, 'mosaic_agent_agent_limits', {
      action: 'set',
      persona: 'BE-BACKEND-BENJAMIN',
      limits: {
        max_memory_mb: 512,
        max_cpu_percent: 75,
        max_concurrent_tasks: 3,
        timeout_minutes: 30
      },
      created_by: 'resource-demo'
    });
    
    console.log('✅ Resource limits set for BE-BACKEND-BENJAMIN');
    console.log('   Memory limit: 512MB');
    console.log('   CPU limit: 75%');
    console.log('   Task limit: 3 concurrent tasks');
    console.log();

    // Get all limits
    const getLimitsResult = await simulateToolCall(server, 'mosaic_agent_agent_limits', {
      action: 'get'
    });
    
    console.log('📋 Current resource limits:');
    console.log('   Found', getLimitsResult?.metadata?.data?.length || 0, 'active limits');
    console.log();

    // Demo 3: Performance Report
    console.log('📈 Demo 3: Performance Analytics');
    console.log('--------------------------------');
    
    const reportResult = await simulateToolCall(server, 'mosaic_agent_performance_report', {
      time_period_hours: 1,
      include_recommendations: true,
      include_trends: true,
      format: 'summary'
    });
    
    if (reportResult?.metadata?.data) {
      const report = reportResult.metadata.data;
      console.log('📊 Performance Summary:');
      console.log(`   Report ID: ${report.report_id}`);
      console.log(`   Time Period: ${report.time_period.duration_hours} hours`);
      console.log(`   Average CPU: ${report.system_metrics.avg_cpu_usage}%`);
      console.log(`   Average Memory: ${report.system_metrics.avg_memory_usage}%`);
      console.log(`   Total Agents: ${report.agent_performance.total_agents}`);
      console.log(`   Tasks Processed: ${report.system_metrics.total_tasks_processed}`);
      console.log(`   Recommendations: ${report.recommendations.length}`);
      console.log();

      if (report.recommendations.length > 0) {
        console.log('💡 Top Recommendations:');
        report.recommendations.slice(0, 3).forEach((rec: any, i: number) => {
          console.log(`   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
          console.log(`      Category: ${rec.category}`);
          console.log(`      Actions: ${rec.action_items.length} suggested`);
        });
        console.log();
      }
    }

    // Demo 4: Alert Management
    console.log('🚨 Demo 4: Alert Management');
    console.log('---------------------------');
    
    const alertsResult = await simulateToolCall(server, 'mosaic_agent_resource_alerts', {
      action: 'list'
    });
    
    if (alertsResult?.metadata?.data) {
      const alerts = alertsResult.metadata.data;
      console.log(`📢 Active Alerts: ${alerts.length}`);
      
      if (alerts.length > 0) {
        alerts.slice(0, 5).forEach((alert: any, i: number) => {
          console.log(`   ${i + 1}. [${alert.severity.toUpperCase()}] ${alert.alert_type}`);
          console.log(`      ${alert.message}`);
          console.log(`      Entity: ${alert.entity_type} (${alert.entity_id || 'system'})`);
        });
      } else {
        console.log('   ✅ No active alerts - system is healthy!');
      }
      console.log();
    }

    // Demo 5: Real-time Monitoring Simulation
    console.log('⏱️  Demo 5: Real-time Monitoring');
    console.log('-------------------------------');
    console.log('Simulating real-time monitoring for 30 seconds...');
    
    let monitoringCount = 0;
    const monitoringInterval = setInterval(async () => {
      monitoringCount++;
      
      try {
        const metrics = await simulateToolCall(server, 'mosaic_agent_resource_monitor', {
          include_history: false,
          include_alerts: false,
          include_agent_usage: false
        });
        
        if (metrics?.metadata?.data?.current_metrics) {
          const current = metrics.metadata.data.current_metrics;
          console.log(`   [${monitoringCount}] CPU: ${current.cpu_usage_percent.toFixed(1)}% | Memory: ${current.memory_usage_percent}% | Status: ${metrics.metadata.data.summary.system_status}`);
        }
      } catch (error) {
        console.log(`   [${monitoringCount}] Monitoring error:`, (error as Error).message);
      }
      
      if (monitoringCount >= 6) { // 30 seconds / 5 second intervals
        clearInterval(monitoringInterval);
        console.log('   ✅ Real-time monitoring demo completed\n');
        
        // Final health check
        console.log('🏥 Final System Health Check');
        console.log('----------------------------');
        const health = await server.healthCheck();
        console.log(`Overall Status: ${health.status.toUpperCase()}`);
        console.log(`Uptime: ${Math.floor(health.details.server.uptime_ms / 1000)}s`);
        console.log(`Requests Handled: ${health.details.metrics.requests}`);
        console.log(`Error Rate: ${(health.details.metrics.error_rate * 100).toFixed(2)}%`);
        console.log();
        
        console.log('🎉 Resource Management Demo Completed!');
        console.log('=====================================\n');
        console.log('Key Features Demonstrated:');
        console.log('✅ Real-time system monitoring');
        console.log('✅ Agent resource limit management');
        console.log('✅ Performance analytics and reporting');
        console.log('✅ Alert management and notifications');
        console.log('✅ Health monitoring and diagnostics');
        console.log();
        console.log('The resource management system provides comprehensive');
        console.log('monitoring and control over system resources, ensuring');
        console.log('optimal performance and preventing resource abuse.');
        
        // Cleanup
        await server.stop();
        process.exit(0);
      }
    }, 5000);

  } catch (error) {
    console.error('❌ Demo failed:', error);
    await server.stop();
    process.exit(1);
  }
}

/**
 * Simulate a tool call through the MCP server
 */
async function simulateToolCall(server: MCPServer, toolName: string, args: any): Promise<any> {
  try {
    // This would normally be handled by the MCP protocol
    // For demo purposes, we'll directly access the tool
    const tools = await server.getTools();
    
    if (!tools[toolName]) {
      throw new Error(`Tool ${toolName} not found`);
    }
    
    // In a real scenario, this would go through the MCP protocol
    // For demo, we'll simulate the call
    console.log(`   🔧 Calling ${toolName}...`);
    
    // Return a mock successful response
    return {
      metadata: {
        operation: toolName,
        status: 'success',
        data: await generateMockData(toolName, args),
        timestamp: new Date().toISOString(),
        execution_time_ms: Math.random() * 100 + 50
      }
    };
    
  } catch (error) {
    console.log(`   ❌ Tool call failed: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Generate mock data for demo purposes
 */
async function generateMockData(toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'mosaic_agent_resource_monitor':
      return {
        current_metrics: {
          cpu_usage_percent: Math.random() * 60 + 20,
          memory_usage_mb: Math.floor(Math.random() * 2000 + 1000),
          memory_total_mb: 8192,
          memory_usage_percent: Math.floor(Math.random() * 40 + 30),
          load_average: [1.2, 1.1, 1.0],
          uptime_seconds: 3600,
          process_count: 1
        },
        summary: {
          system_status: Math.random() > 0.8 ? 'warning' : 'healthy',
          alert_count: Math.floor(Math.random() * 3),
          critical_alerts: 0,
          active_agents: Math.floor(Math.random() * 5 + 1),
          total_estimated_memory: Math.floor(Math.random() * 500 + 200)
        }
      };
      
    case 'mosaic_agent_agent_limits':
      if (args.action === 'set') {
        return {
          id: `limit-${Date.now()}`,
          ...args,
          created_at: new Date(),
          updated_at: new Date()
        };
      } else if (args.action === 'get') {
        return [
          {
            id: 'limit-1',
            persona: 'BE-BACKEND-BENJAMIN',
            max_memory_mb: 512,
            max_cpu_percent: 75,
            max_concurrent_tasks: 3,
            created_at: new Date(),
            active: true
          }
        ];
      }
      return {};
      
    case 'mosaic_agent_performance_report':
      return {
        report_id: `report-${Date.now()}`,
        generated_at: new Date(),
        time_period: {
          start: new Date(Date.now() - args.time_period_hours * 3600000),
          end: new Date(),
          duration_hours: args.time_period_hours
        },
        system_metrics: {
          avg_cpu_usage: Math.round((Math.random() * 40 + 30) * 100) / 100,
          max_cpu_usage: Math.round((Math.random() * 20 + 70) * 100) / 100,
          avg_memory_usage: Math.round((Math.random() * 30 + 40) * 100) / 100,
          max_memory_usage: Math.round((Math.random() * 20 + 70) * 100) / 100,
          avg_load: 1.2,
          peak_agent_count: 3,
          total_tasks_processed: Math.floor(Math.random() * 50 + 10)
        },
        agent_performance: {
          total_agents: 3,
          most_efficient: [],
          least_efficient: [],
          resource_violations: 0,
          average_efficiency: 0.75
        },
        recommendations: [
          {
            category: 'optimization',
            priority: 'medium',
            description: 'Consider implementing agent auto-scaling',
            action_items: [
              'Set up dynamic agent scaling policies',
              'Monitor task queue depths',
              'Implement load balancing'
            ]
          },
          {
            category: 'cleanup',
            priority: 'low',
            description: 'Regular maintenance recommended',
            action_items: [
              'Clean up completed tasks',
              'Archive old performance data',
              'Update agent configurations'
            ]
          }
        ],
        resource_trends: {
          cpu_trend: 'stable',
          memory_trend: 'stable',
          efficiency_trend: 'improving'
        }
      };
      
    case 'mosaic_agent_resource_alerts':
      return Math.random() > 0.7 ? [
        {
          id: 'alert-1',
          alert_type: 'memory',
          severity: 'medium',
          entity_type: 'system',
          entity_id: 'system',
          current_value: 75,
          threshold_value: 70,
          message: 'Memory usage approaching threshold',
          timestamp: new Date(),
          acknowledged: false,
          resolved: false
        }
      ] : [];
      
    default:
      return {};
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  resourceManagementDemo().catch(console.error);
}

export { resourceManagementDemo };