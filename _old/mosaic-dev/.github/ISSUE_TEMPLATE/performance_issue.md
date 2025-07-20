---
name: Performance Issue
about: Report a performance problem
title: '[PERFORMANCE] '
labels: ['performance', 'needs-triage']
assignees: []

---

## Performance Issue Description
A clear and concise description of the performance issue.

## Current Performance
Describe the current performance characteristics:
- Response time: [e.g. 5 seconds]
- Throughput: [e.g. 10 requests/second]
- Resource usage: [e.g. 80% CPU, 2GB RAM]

## Expected Performance
Describe the expected performance:
- Response time: [e.g. < 1 second]
- Throughput: [e.g. 100 requests/second]
- Resource usage: [e.g. < 50% CPU, < 1GB RAM]

## Steps to Reproduce
1. Go to '...'
2. Perform action '...'
3. Observe performance issue

## Environment
- OS: [e.g. Windows 10, macOS 11.0, Ubuntu 20.04]
- Browser: [e.g. Chrome 95, Firefox 94, Safari 15] (if applicable)
- Node.js version: [e.g. 18.17.0]
- Application version: [e.g. 1.0.0]
- Hardware: [e.g. 4 CPU cores, 8GB RAM]
- Network: [e.g. 100 Mbps, WiFi, Ethernet]

## Performance Metrics
If you have specific metrics, please provide them:

### Frontend Performance
- First Contentful Paint (FCP): [e.g. 2.5s]
- Largest Contentful Paint (LCP): [e.g. 4.0s]
- First Input Delay (FID): [e.g. 300ms]
- Cumulative Layout Shift (CLS): [e.g. 0.2]

### Backend Performance
- API Response Time: [e.g. 2000ms]
- Database Query Time: [e.g. 500ms]
- Memory Usage: [e.g. 512MB]
- CPU Usage: [e.g. 85%]

## User Impact
How does this performance issue affect users?
- [ ] Users are unable to complete tasks
- [ ] Users experience significant delays
- [ ] Users experience minor delays
- [ ] Users don't notice but metrics are suboptimal

## Traffic Patterns
When does this performance issue occur?
- [ ] Under normal load
- [ ] Under high load
- [ ] During specific time periods
- [ ] With specific user actions
- [ ] With specific data sets

## Component
- [ ] Frontend (React)
- [ ] Backend (NestJS)
- [ ] Database queries
- [ ] API endpoints
- [ ] Authentication
- [ ] File uploads/downloads
- [ ] Third-party integrations

## Browser/Network Details
If applicable:
- Browser DevTools Performance tab results
- Network tab results
- Console errors or warnings

## Profiling Data
If you have profiling data, please attach it or provide key insights:
- CPU profiler results
- Memory profiler results
- Network profiler results

## Potential Root Causes
If you have insights into what might be causing this:
- [ ] Database query optimization needed
- [ ] API endpoint optimization needed
- [ ] Frontend bundle size too large
- [ ] Memory leaks
- [ ] CPU-intensive operations
- [ ] Network latency
- [ ] Third-party service delays

## Additional Context
Add any other context about the performance issue here.

## Screenshots/Videos
If applicable, add screenshots or videos demonstrating the performance issue.

## Priority
- [ ] Critical (significantly impacts user experience)
- [ ] High (noticeable impact on user experience)
- [ ] Medium (minor impact on user experience)
- [ ] Low (optimization opportunity)