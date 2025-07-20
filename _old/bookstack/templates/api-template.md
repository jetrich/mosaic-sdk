---
title: "API Endpoint Name"
order: 01
category: "api-category"
tags: ["api", "rest", "endpoint-type"]
last_updated: "2025-01-19"
author: "system"
version: "1.0"
api_version: "v1"
status: "published"
---

# API Endpoint Name

## Endpoint Overview

**Method**: `GET|POST|PUT|DELETE`  
**Path**: `/api/v1/resource/{id}`  
**Description**: Brief description of what this endpoint does.

## Authentication

This endpoint requires authentication via:
- [ ] API Key
- [ ] OAuth 2.0
- [ ] JWT Token
- [ ] Basic Auth

Include token in header:
```http
Authorization: Bearer YOUR_TOKEN_HERE
```

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Resource identifier |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Items per page |
| `sort` | string | No | created_at | Sort field |

### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `X-Request-ID` | No | Unique request identifier |

### Request Body

```json
{
  "field1": "value1",
  "field2": {
    "nested1": "value2",
    "nested2": 123
  },
  "field3": ["item1", "item2"]
}
```

#### Field Descriptions

- **field1** (string, required): Description of field1
- **field2** (object, optional): Description of field2
  - **nested1** (string): Description of nested1
  - **nested2** (integer): Description of nested2
- **field3** (array[string], optional): Description of field3

## Response

### Success Response

**Status Code**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "id": "123456",
    "field1": "value1",
    "field2": {
      "nested1": "value2",
      "nested2": 123
    },
    "created_at": "2025-01-19T10:00:00Z",
    "updated_at": "2025-01-19T10:00:00Z"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request body is invalid",
    "details": {
      "field1": "This field is required"
    }
  }
}
```

#### 401 Unauthorized
```json
{
  "status": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 404 Not Found
```json
{
  "status": "error",
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

#### 500 Internal Server Error
```json
{
  "status": "error",
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "request_id": "req_123456"
  }
}
```

## Examples

### Example 1: Basic Request

```bash
curl -X GET "https://api.mosaicstack.dev/api/v1/resource/123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Example 2: With Query Parameters

```bash
curl -X GET "https://api.mosaicstack.dev/api/v1/resource?page=2&limit=50&sort=-created_at" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Example 3: POST Request

```bash
curl -X POST "https://api.mosaicstack.dev/api/v1/resource" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field1": "value1",
    "field2": {
      "nested1": "value2",
      "nested2": 123
    }
  }'
```

## Rate Limiting

This endpoint is subject to rate limiting:
- **Rate Limit**: 100 requests per minute
- **Headers Returned**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

## Webhooks

This endpoint can trigger webhooks for the following events:
- `resource.created`
- `resource.updated`
- `resource.deleted`

## SDK Examples

### JavaScript/TypeScript

```typescript
import { MosaicClient } from '@mosaic/sdk';

const client = new MosaicClient({ apiKey: 'YOUR_API_KEY' });

// GET request
const resource = await client.resources.get('123');

// POST request
const newResource = await client.resources.create({
  field1: 'value1',
  field2: {
    nested1: 'value2',
    nested2: 123
  }
});
```

### Python

```python
from mosaic_sdk import MosaicClient

client = MosaicClient(api_key='YOUR_API_KEY')

# GET request
resource = client.resources.get('123')

# POST request
new_resource = client.resources.create({
    'field1': 'value1',
    'field2': {
        'nested1': 'value2',
        'nested2': 123
    }
})
```

## Notes

- All timestamps are in UTC ISO 8601 format
- Empty arrays and null values are omitted from responses
- Use pagination for large result sets
- Consider using webhooks for real-time updates

## Related Endpoints

- [List Resources](./02-list-resources.md)
- [Update Resource](./03-update-resource.md)
- [Delete Resource](./04-delete-resource.md)

---

*API Version: v1 | Last updated: 2025-01-19*