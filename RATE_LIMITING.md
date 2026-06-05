# Rate Limiting Documentation

## Overview

All API endpoints in the MCSR Ranked website are protected with rate limiting to ensure fair usage and service stability. The rate limit is set to **500 requests per 10 minutes** across all endpoints.

## Configuration

- **Limit**: 500 requests
- **Time Window**: 10 minutes (600 seconds)
- **Enforcement**: Per-IP address using `x-forwarded-for`, `x-real-ip`, or connection IP
- **Storage**: In-memory storage with automatic cleanup

## Protected Endpoints

All API routes have rate limiting enabled:

1. **GET** `/api/leaderboard` - Global leaderboard
2. **GET** `/api/player` - Player details
3. **GET** `/api/matches` - Match history
4. **GET** `/api/stats` - Global statistics

## Implementation Details

### Rate Limit Headers

Every API response includes three rate limit headers:

```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 498
X-RateLimit-Reset: 1780645464
```

- **X-RateLimit-Limit**: Maximum requests allowed in the time window (500)
- **X-RateLimit-Remaining**: Number of requests remaining in current window
- **X-RateLimit-Reset**: Unix timestamp (seconds) when the rate limit window resets

### Rate Limit Exceeded Response

When a client exceeds the rate limit, the API returns HTTP 429 (Too Many Requests):

```json
{
  "error": "Too many requests. Rate limit exceeded."
}
```

Response headers still include rate limit information for client consumption.

## Client Identification

Rate limiting is applied per client IP address. The following headers are checked in order:

1. `x-forwarded-for` - Used by proxies and load balancers
2. `x-real-ip` - Alternative proxy header
3. Connection IP - Fallback to direct connection IP

This ensures accurate rate limiting in both local and production environments.

## Storage Strategy

The rate limiting system uses in-memory storage with the following features:

- **Fast**: Minimal overhead for rate limit checks
- **Automatic Cleanup**: Old entries are purged every 60 seconds
- **Scalability**: Works well for single-instance deployments
- **No External Dependencies**: No Redis or database required

### Upgrade Path for Production

For multi-instance deployments, the implementation can be upgraded to use Redis:

```typescript
// Add redis dependency
import { createClient } from 'redis'

// Modify ratelimit.ts to use Redis backend
const redisClient = createClient({
  url: process.env.REDIS_URL,
})

// Use Redis for distributed rate limiting across instances
```

## Testing Rate Limits

### Test Basic Functionality

```bash
# Make a request and check rate limit headers
curl -i http://localhost:3000/api/leaderboard?season=current

# Verify headers in response
# X-RateLimit-Limit: 500
# X-RateLimit-Remaining: 499
# X-RateLimit-Reset: [timestamp]
```

### Simulate Rate Limit Breach

```bash
# Make 501 requests to trigger rate limit
for i in {1..501}; do
  curl http://localhost:3000/api/leaderboard?season=current
done

# Last request should return 429 with remaining: 0
```

## Best Practices

### Client-Side

1. **Check Headers**: Monitor `X-RateLimit-Remaining` to avoid hitting limits
2. **Implement Backoff**: When rate limited, wait until `X-RateLimit-Reset` before retrying
3. **Cache Results**: Store API responses to reduce request frequency
4. **Batch Requests**: Combine multiple data requests when possible

### Server-Side

1. **Monitor Usage**: Track API request patterns to identify problematic clients
2. **Adjust Limits**: Update `MAX_REQUESTS` and `WINDOW_MS` in `lib/ratelimit.ts` if needed
3. **Error Handling**: Implement graceful degradation when rate limits are hit
4. **Documentation**: Keep rate limits clearly documented for API consumers

## Customization

### Changing Rate Limits

To modify the rate limiting configuration, edit `/lib/ratelimit.ts`:

```typescript
// Change these constants:
const MAX_REQUESTS = 500      // Number of requests allowed
const WINDOW_MS = 10 * 60 * 1000  // Time window in milliseconds
```

### Per-Endpoint Limits

To implement different limits for specific endpoints, modify the rate limit check:

```typescript
// In route handler:
const rateLimitResult = await checkRateLimit(`leaderboard:${ip}:special`)
// This creates a separate rate limit bucket for that endpoint
```

## Monitoring and Debugging

### Check Rate Limit Status

The rate limit data is stored in memory. To monitor:

1. Check browser console for `X-RateLimit-*` headers in network requests
2. Use `curl -i` to see headers directly
3. Log requests to identify patterns

### Reset Rate Limits

To reset all rate limits during development:

1. Restart the development server: `pnpm dev`
2. All in-memory rate limit data will be cleared

## Performance Impact

- **Overhead**: < 1ms per request for rate limit check
- **Memory Usage**: ~100 bytes per unique IP per time window
- **Cleanup**: Automatic every 60 seconds, minimal impact

## Troubleshooting

### Getting 429 Errors

1. Check `X-RateLimit-Remaining` header
2. Wait until `X-RateLimit-Reset` timestamp before retrying
3. Implement exponential backoff in your client
4. Cache responses to reduce request frequency

### Rate Limits Not Working

1. Verify rate limit headers are present in responses
2. Check that client IP is being correctly identified
3. Ensure server has proper proxy headers configured
4. Review console logs for rate limit errors

## Migration to Production

For production deployment on Vercel:

1. Rate limiting works as-is with in-memory storage
2. For multi-region deployments, upgrade to Redis backend
3. Set `REDIS_URL` environment variable if using Redis
4. Monitor rate limit headers in production logs

## Related Files

- `lib/ratelimit.ts` - Rate limiting implementation
- `app/api/leaderboard/route.ts` - Example rate-limited endpoint
- `app/api/player/route.ts` - Example rate-limited endpoint
- `app/api/matches/route.ts` - Example rate-limited endpoint
- `app/api/stats/route.ts` - Example rate-limited endpoint
