# MosAIc Stack Telemetry Endpoint Specification

## Overview

MosAIc Stack CLI includes an **opt-in, privacy-first** telemetry system that sends anonymous usage statistics to help improve the platform. This document specifies the endpoint requirements for the landing page team.

## Endpoint Requirements

### URL
```
POST https://analytics.mosaicstack.dev/events
```

### Authentication
- **None required** - this is anonymous telemetry
- Rate limiting recommended: 100 requests/minute per IP

### Request Format

**Headers:**
```
Content-Type: application/json
User-Agent: MosAIc-Stack/{version}
```

**Body Schema:**
```typescript
interface TelemetryData {
  installationId: string;        // UUID v4 - persistent per installation
  event: 'installation' | 'initialization' | 'startup' | 'error';
  timestamp: string;             // ISO 8601 format
  version: string;               // CLI version (e.g., "0.1.0")
  mode?: 'local' | 'hybrid' | 'cloud';
  nodeVersion: string;           // Node.js version (e.g., "v18.17.0")
  platform: string;             // OS platform (e.g., "linux", "darwin", "win32")
  arch: string;                  // Architecture (e.g., "x64", "arm64")
  providers?: string[];          // Enabled providers (e.g., ["ollama", "claude"])
  error?: string;                // Error message (max 200 chars, for error events only)
}
```

### Example Requests

**Installation Event:**
```json
{
  "installationId": "550e8400-e29b-41d4-a716-446655440000",
  "event": "installation",
  "timestamp": "2025-01-20T15:30:00.000Z",
  "version": "0.1.0",
  "nodeVersion": "v18.17.0",
  "platform": "linux",
  "arch": "x64"
}
```

**Initialization Event:**
```json
{
  "installationId": "550e8400-e29b-41d4-a716-446655440000",
  "event": "initialization",
  "timestamp": "2025-01-20T15:32:15.000Z",
  "version": "0.1.0",
  "mode": "hybrid",
  "nodeVersion": "v18.17.0",
  "platform": "linux",
  "arch": "x64",
  "providers": ["ollama", "claude"]
}
```

**Startup Event:**
```json
{
  "installationId": "550e8400-e29b-41d4-a716-446655440000",
  "event": "startup",
  "timestamp": "2025-01-20T15:35:45.000Z",
  "version": "0.1.0",
  "mode": "hybrid",
  "nodeVersion": "v18.17.0",
  "platform": "linux",
  "arch": "x64"
}
```

**Error Event:**
```json
{
  "installationId": "550e8400-e29b-41d4-a716-446655440000",
  "event": "error",
  "timestamp": "2025-01-20T15:40:12.000Z",
  "version": "0.1.0",
  "nodeVersion": "v18.17.0",
  "platform": "linux",
  "arch": "x64",
  "error": "Configuration validation failed: missing required field 'providers'"
}
```

### Response Format

**Success (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T15:30:00.000Z"
}
```

**Error (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Invalid request format",
  "timestamp": "2025-01-20T15:30:00.000Z"
}
```

## Privacy Guarantees

### Data Collected
- ✅ Anonymous installation count (via UUID deduplication)
- ✅ Operation mode preferences (local/hybrid/cloud)
- ✅ Provider usage patterns (ollama, claude, etc.)
- ✅ System environment (Node.js version, platform)
- ✅ Error messages (for debugging, 200 char limit)

### Data NOT Collected
- ❌ Personal identifiers (name, email, IP address)
- ❌ Project code or file contents
- ❌ API keys or credentials
- ❌ Conversation content or prompts
- ❌ File paths or directory structures
- ❌ Network configuration details

### GUID-Based Deduplication
- Each installation generates a persistent UUID v4
- Stored locally in `~/.mosaic/telemetry/preferences.json`
- Prevents double-counting on reinstalls
- No cross-device tracking possible

## Implementation Requirements

### Minimal Endpoint Implementation

**Simple Node.js/Express Example:**
```javascript
app.post('/events', (req, res) => {
  try {
    const { installationId, event, timestamp, version } = req.body;
    
    // Basic validation
    if (!installationId || !event || !timestamp || !version) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
        timestamp: new Date().toISOString()
      });
    }
    
    // Store in database (with installationId as unique key for deduplication)
    await storeEvent(req.body);
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});
```

### Database Schema Recommendations

**Events Table:**
```sql
CREATE TABLE telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID NOT NULL,
  event_type VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  version VARCHAR(20) NOT NULL,
  mode VARCHAR(10),
  node_version VARCHAR(20),
  platform VARCHAR(20),
  arch VARCHAR(20),
  providers JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for deduplication and analytics
CREATE INDEX idx_installation_id ON telemetry_events(installation_id);
CREATE INDEX idx_event_type ON telemetry_events(event_type);
CREATE INDEX idx_timestamp ON telemetry_events(timestamp);
```

### Analytics Queries

**Unique Installations:**
```sql
SELECT COUNT(DISTINCT installation_id) as unique_installations
FROM telemetry_events;
```

**Mode Distribution:**
```sql
SELECT mode, COUNT(DISTINCT installation_id) as installations
FROM telemetry_events 
WHERE event_type = 'initialization' AND mode IS NOT NULL
GROUP BY mode;
```

**Provider Popularity:**
```sql
SELECT 
  jsonb_array_elements_text(providers) as provider,
  COUNT(DISTINCT installation_id) as installations
FROM telemetry_events 
WHERE event_type = 'initialization' AND providers IS NOT NULL
GROUP BY provider
ORDER BY installations DESC;
```

**Platform Distribution:**
```sql
SELECT platform, COUNT(DISTINCT installation_id) as installations
FROM telemetry_events
GROUP BY platform
ORDER BY installations DESC;
```

## Client-Side Implementation

### Timeout and Failure Handling
- **5-second timeout** on all requests
- **Silent failure** - telemetry errors never block user experience
- **No retries** - fire-and-forget approach
- **Best effort delivery** - network issues are ignored

### User Control
- **Opt-in only** - disabled by default
- **Easy toggle**: `mosaic telemetry --enable/--disable`
- **Transparent**: `mosaic telemetry --info` shows all details
- **No surprise data** - users know exactly what's sent

### Rate Limiting Client-Side
- Events batched/deduplicated per session
- Maximum 1 event per type per CLI session
- Installation ID persists across reinstalls

## Security Considerations

### Server-Side
- **HTTPS only** - no plain HTTP
- **CORS headers** appropriate for web dashboard (if needed)
- **Input validation** on all fields
- **SQL injection protection** 
- **Rate limiting** to prevent abuse

### Data Retention
- **Recommended**: 2 years maximum retention
- **GDPR compliance**: Easy deletion by installation ID if requested
- **Anonymization**: No way to trace back to individual users

## Dashboard Integration

### Real-Time Metrics
- Installation count (total and daily)
- Mode distribution pie chart
- Provider popularity bar chart
- Platform/architecture breakdown
- Error rate monitoring

### Time Series
- Daily installation growth
- Weekly active startup counts
- Error trends over time
- Version adoption rates

## Testing

### Test Endpoint
```
POST https://analytics-test.mosaicstack.dev/events
```

### Test Installation ID
For testing: `00000000-0000-0000-0000-000000000000`

### Validation
- Schema validation against TypeScript interface
- Required field checking
- UUID format validation
- Timestamp format validation (ISO 8601)
- Version string format validation (semver)

## Support

### Questions
- Endpoint issues: Contact landing page team
- Client implementation: Contact CLI development team
- Privacy concerns: See `mosaic telemetry --info`

### Monitoring
- Monitor endpoint response times
- Track error rates for debugging
- Alert on endpoint downtime (non-critical)

---

**Note**: This telemetry system is designed to be **privacy-first** and **failure-tolerant**. The endpoint should prioritize user privacy and never impact the CLI user experience, even if analytics are temporarily unavailable.