import type {
    PrometheusQueryResponse,
    VMClientOptions,
    VMDataPoint,
} from './types.js'
import { Mutex } from 'async-mutex'

/**
 * A TypeScript client for sending time-series data to VictoriaMetrics.
 *
 * This client is designed for high-throughput scenarios (like IoT) and uses
 * internal buffering and batching to reduce network load.
 *
 * Data is not sent immediately but is collected in a buffer, which is
 * flushed automatically based on `batchSize` or `flushInterval`.
 *
 * @example
 * ```typescript
 * const client = new VictoriaMetricsClient({
 * url: 'http://0.0.0.0:8428',
 * batchSize: 100,
 * flushInterval: 1000
 * });
 *
 * client.writePoint({
 * measurement: 'iot_telemetry',
 * tags: { sensor_id: 'A1' },
 * fields: { temperature: 21.5 }
 * });
 *
 * // ... later, on application shutdown ...
 * await client.shutdown();
 * ```
 */
export class VictoriaMetricsClient {
    private options: Required<Omit<VMClientOptions, 'auth'>> & {
        auth?: VMClientOptions['auth']
    }

    private buffer: string[] = []
    private bufferMutex = new Mutex()

    private timerId: NodeJS.Timeout

    /**
     * Creates a new VictoriaMetricsClient instance.
     * @param options - The configuration for the client.
     */
    constructor(options: VMClientOptions) {
        this.options = {
            auth: options.auth,
            batchSize: options.batchSize ?? 1000,
            flushInterval: options.flushInterval ?? 5000,
            url: options.url,
        }

        this.timerId = setInterval(
            () =>
                this.flush().catch((error) =>
                    console.error('[VMClient] Flush error:', error),
                ),
            this.options.flushInterval,
        )
    }

    /**
     * Adds a new data point to the internal buffer.
     *
     * This method is synchronous and returns immediately. It does *not*
     * perform a network request. The data will be sent later
     * as part of a batch.
     *
     * If the buffer reaches `batchSize`, a flush will be
     * triggered asynchronously in the background.
     *
     * @param point - The `VMDataPoint` object to write.
     */
    public writePoint(point: VMDataPoint): void {
        try {
            const line = this.formatLineProtocol(point)
            this.buffer.push(line)

            if (this.buffer.length >= this.options.batchSize) {
                this.flush().catch((error) =>
                    console.error('[VMClient] Flush error: ', error),
                )
            }
        } catch (error) {
            console.error('[VMClient] Failed to format data point:', error)
        }
    }

    /**
     * Converts a `VMDataPoint` object into a single string
     * formatted according to the InfluxDB Line Protocol,
     * including all necessary escaping.
     *
     * @param point - The data point to format.
     * @returns A string in line protocol format.
     * @throws Will throw an error if no fields are provided.
     */
    private formatLineProtocol(point: VMDataPoint): string {
        const escapeTag = (s: string) => s.replace(/([,= ])/g, '\\$1')
        const escapeStringField = (s: string) =>
            s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

        const tags = Object.entries(point.tags)
            .map(([k, v]) => `${escapeTag(k)}=${escapeTag(v)}`)
            .join(',')

        const fields = Object.entries(point.fields)
            .map(([k, v]) => {
                const key = escapeTag(k) // Field-Keys müssen auch escaped werden

                if (typeof v === 'string') {
                    return `${key}="${escapeStringField(v)}"`
                }
                if (typeof v === 'boolean') {
                    return `${key}=${v ? 't' : 'f'}`
                }
                if (typeof v === 'number') {
                    return `${key}=${v}`
                }
                return null
            })
            .filter(Boolean)
            .join(',')

        if (fields.length === 0) {
            throw new Error('Data point must have at least one field')
        }
        const measurement = point.measurement.replace(/([, ])/g, '\\$1')

        const timestamp = point.timestamp
            ? (point.timestamp.getTime() * 1_000_000).toString()
            : ''
        const measurementAndTags =
            tags.length > 0 ? `${measurement},${tags}` : measurement
        return `${measurementAndTags} ${fields} ${timestamp}`.trim()
    }

    /**
     * Manually triggers a flush of the internal buffer.
     *
     * This method is asynchronous and thread-safe. It will acquire a lock,
     * send all currently buffered data, and re-queue the data if
     * the send operation fails.
     */
    public async flush() {
        await this.bufferMutex.runExclusive(async () => {
            if (this.buffer.length === 0) {
                return
            }

            const dataToSend = this.buffer.splice(0)
            try {
                await this.send(dataToSend)
            } catch (error) {
                console.error('[VMClient] Flush failed:', error)
                this.buffer.unshift(...dataToSend)
            }
        })
    }

    /**
     * The core send operation.
     * Sends an array of line protocol strings to VictoriaMetrics.
     *
     * @param points - An array of data points (strings) to send.
     * @throws Throws an error if the server responds with a non-204 status code.
     */
    private async send(points: string[]): Promise<void> {
        const body = points.join('\n')
        const headers: Record<string, string> = {
            'Content-Type': 'text/plain',
        }
        if (this.options.auth?.bearer) {
            headers['Authorization'] = `Bearer ${this.options.auth.bearer}`
        }

        const response = await fetch(`${this.options.url}/write`, {
            method: 'POST',
            headers: headers,
            body: body,
        })

        if (response.status !== 204) {
            throw new Error(
                `[VMClient] Server responded with status ${response.status}: ${await response.text()}`,
            )
        }
    }

    /**
     * Executes a PromQL/MetricsQL query against the VictoriaMetrics server.
     * This method logs the JSON response directly to the console.
     *
     * @param query - The PromQL/MetricsQL query string to execute.
     * @returns a PrometheusQueryResponse
     * @throws Will throw an error if the query fails or the server
     * responds with a non-OK status.
     */
    public async query(query: string): Promise<PrometheusQueryResponse> {
        const body = `query=${query}`
        const headers: Record<string, string> = {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        if (this.options.auth?.bearer) {
            headers['Authorization'] = `Bearer ${this.options.auth.bearer}`
        }

        const response = await fetch(
            `${this.options.url}/prometheus/api/v1/query`,
            {
                method: 'POST',
                headers: headers,
                body: body,
            },
        )
        if (!response.ok) {
            throw Error(
                `[VMClient] Query failed with status ${response.status}: ${await response.text()}`,
            )
        }
        const data = (await response.json()) as PrometheusQueryResponse
        return data
    }

    /**
     * Gracefully shuts down the client.
     *
     * This stops the periodic flush timer and performs one final
     * flush to ensure all buffered data is sent.
     *
     * Call this method before your application exits.
     */
    public async shutdown(): Promise<void> {
        clearInterval(this.timerId)
        await this.flush()
    }
}
