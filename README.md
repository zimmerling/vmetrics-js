# vmetrics-js

[![npm version](https://badge.fury.io/js/vmetrics-js.svg)](https://www.npmjs.com/package/vmetrics-js)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A high-performance TypeScript/JavaScript client for [VictoriaMetrics](https://victoriametrics.com/), optimized for IoT and high-throughput time-series data ingestion.

---

> **⚠️ EARLY STAGE PROJECT - NOT PRODUCTION READY**
>
> This project is in very early development and should **NOT** be used in production environments yet. Currently, only a rudimentary push API is implemented. Many features are missing, and the API may change significantly. Use at your own risk!
>
> **Project Focus:** We are concentrating on the **push API** (actively sending metrics to VictoriaMetrics). For exposing a `/metrics` endpoint that VictoriaMetrics can scrape (pull API), use [prom-client](https://www.npmjs.com/package/prom-client) instead.
>
> Contributions and feedback are welcome to help make this library production-ready.

---

## Features

- **Automatic Batching**: Efficiently groups data points into batches to minimize network overhead
- **Smart Buffering**: Configurable buffer with automatic flushing based on size or time intervals
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **InfluxDB Line Protocol**: Uses the standard InfluxDB line protocol format
- **Thread-Safe**: Built-in mutex protection for concurrent write operations
- **Zero Dependencies**: Only one lightweight dependency (`async-mutex`)
- **Error Resilient**: Automatic retry mechanism with buffer re-queueing on failures
- **Easy Integration**: Simple, intuitive API for quick adoption

## Installation

```bash
npm install vmetrics-js
```

```bash
yarn add vmetrics-js
```

```bash
pnpm add vmetrics-js
```

## Quick Start

```typescript
import { VictoriaMetricsClient } from 'vmetrics-js'

// Create a client instance
const client = new VictoriaMetricsClient({
    url: 'http://0.0.0.0:8428',
    batchSize: 1000, // Flush after 1000 points
    flushInterval: 5000, // Flush every 5 seconds
})

// Write data points
client.writePoint({
    measurement: 'temperature',
    tags: {
        sensor_id: 'sensor-001',
        location: 'warehouse-a',
    },
    fields: {
        value: 23.5,
        humidity: 65.2,
    },
    timestamp: new Date(), // Optional, uses server time if omitted
})

// Graceful shutdown (flushes remaining buffer)
await client.shutdown()
```

### Multiple Field Types

```typescript
client.writePoint({
    measurement: 'system_stats',
    tags: {
        host: 'server-01',
        region: 'us-east-1',
    },
    fields: {
        cpu_usage: 45.2, // number
        memory_used: 8589934592, // number (bytes)
        disk_full: false, // boolean
        status: 'healthy', // string
    },
})
```

## Configuration Guide

### Choosing `batchSize`

- **High-frequency data** (IoT, sensors): Use larger batches (1000-5000) to reduce network overhead
- **Low-frequency data** (application metrics): Use smaller batches (100-500) for more frequent updates
- **Rule of thumb**: Set to expected points per `flushInterval`

### Choosing `flushInterval`

- **Real-time monitoring**: 1000-5000ms (1-5 seconds)
- **Background analytics**: 10000-60000ms (10-60 seconds)
- **Trade-off**: Shorter intervals = fresher data but more network requests

## Architecture

### How It Works

```
┌─────────────┐
│ Application │
└──────┬──────┘
       │ writePoint()
       ▼
┌─────────────────┐
│  Write Buffer   │◄─── Mutex Protected
└──────┬──────────┘
       │
       ├─► Batch Size Reached? ──► Flush ───┐
       └─► Time Interval? ───────► Flush ───┐
                                            │
                                            ▼
                                     ┌─────────────────┐
                                     │ VictoriaMetrics │
                                     └─────────────────┘
```

1. **Write**: `writePoint()` adds data to an in-memory buffer (instant return)
2. **Trigger**: Flush happens when buffer reaches `batchSize` OR `flushInterval` expires
3. **Send**: All buffered points are sent in a single HTTP POST request
4. **Retry**: On failure, data is re-queued to the buffer

## VictoriaMetrics Setup

For local development, you can run VictoriaMetrics with Podman/Docker:

```bash
docker run -d --name victoriametrics \
  -p 8428:8428 \
  victoriametrics/victoria-metrics:latest
```

Access the UI at: http://0.0.0.0:8428

## Troubleshooting

### Data Not Appearing in VictoriaMetrics

1. **Verify VictoriaMetrics is running**: `curl http://0.0.0.0:8428/health`
2. **Check for errors**: Look for `[VMClient]` error logs in your console
3. **Force a flush**: Call `await client.flush()` to send data immediately

### Performance Issues

1. **Increase batch size**: Larger batches = fewer HTTP requests
2. **Increase flush interval**: Less frequent network I/O
3. **Use tags wisely**: Too many unique tag combinations = high cardinality = slow queries

### Authentication Errors

Ensure you're using the correct authentication method:

```typescript
const client = new VictoriaMetricsClient({
    url: 'http://0.0.0.0:8428',
    auth: { bearer: 'your-token-here' },
})
```

## Testing

Run the test suite:

```bash
npm test
```

Run the example:

```bash
npm run example
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone the repository
git clone git@github.com:zimmerling/vmetrics-js.git

cd vmetrics-js

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint

# Format code
npm run format
```

## Current Limitations

This library is in **early development** and currently provides only basic functionality:

**What's implemented:**

- ✅ Basic push API using InfluxDB Line Protocol (client pushes metrics to VictoriaMetrics)
- ✅ Buffering and batching
- ✅ Basic error handling and retry (re-queue on failure)
- ✅ Bearer token authentication

**What's missing:**

- ❌ Pull API (`/metrics` endpoint) - **Use [prom-client](https://www.npmjs.com/package/prom-client) for this**
- ❌ Compression support
- ❌ Circuit breaker / exponential backoff
- ❌ Connection pooling
- ❌ Prometheus remote write protocol
- ❌ Comprehensive error handling
- ❌ Browser support
- ❌ Production-grade reliability features
- ❌ Performance metrics and observability

### Scope & Focus

**This library focuses exclusively on the push API** - actively sending metrics from your application to VictoriaMetrics.

**For pull-based metrics** (exposing a `/metrics` endpoint that VictoriaMetrics scrapes), use:

- [prom-client](https://www.npmjs.com/package/prom-client) - The standard library for exposing Prometheus-compatible metrics endpoints

## Roadmap

**Push API improvements:**

- [ ] Compression support (gzip)
- [ ] Circuit breaker for failed endpoints
- [ ] Retry with exponential backoff
- [ ] Connection pooling and keep-alive
- [ ] Prometheus remote write protocol support
- [ ] Metrics about client performance (points buffered, flush duration, etc.)
- [ ] Browser support (via fetch API)
- [ ] Comprehensive test coverage
- [ ] Production hardening

**Not planned (use other tools):**

- Pull API / `/metrics` endpoint → Use [prom-client](https://www.npmjs.com/package/prom-client)
- Query API for reading data → Use VictoriaMetrics HTTP API directly

## Links

- [VictoriaMetrics Documentation](https://docs.victoriametrics.com/)
- [InfluxDB Line Protocol](https://docs.influxdata.com/influxdb/latest/reference/syntax/line-protocol/)
- [Report Issues](https://github.com/zimmerling/vmetrics-js/issues)
- [NPM Package](https://www.npmjs.com/package/vmetrics-js)

**Star this repo if you find it useful!**
