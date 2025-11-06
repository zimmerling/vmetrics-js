/**
 * Defines the configuration options for the VictoriaMetricsClient.
 */
export interface VMClientOptions {
    /**
     * The VictoriaMetrics url.
     * @example "http://0.0.0.0:8428"
     */
    url: string

    /**
     * Optional authentication configuration,
     * such as a Bearer token.
     */
    auth?: { bearer: string }

    /**
     * The maximum number of data points to hold in the buffer
     * before a flush is triggered automatically.
     * @defaultValue 1000
     */
    batchSize?: number

    /**
     * The time interval (in milliseconds) after which the buffer
     * will be flushed, even if `batchSize` has not been reached.
     * @defaultValue 5000
     */
    flushInterval?: number
}

/**
 * Represents a single data point to be sent to VictoriaMetrics,
 * formatted using the InfluxDB Line Protocol.
 */
export interface VMDataPoint {
    /**
     * The name of the measurement. This becomes the metric name (`__name__`)
     * in VictoriaMetrics.
     * @example "iot_telemetry"
     */
    measurement: string

    /**
     * An object of key/value pairs (tags) used for identifying
     * and filtering the time series.
     * Tags are indexed in VictoriaMetrics for fast queries.
     * @example \{ sensor_id: "a1-b2", room: "living_room" \}
     */
    tags: Record<string, string>

    /**
     * An object of key/value pairs (fields) representing the actual
     * measured values.
     *
     * NOTE: VictoriaMetrics treats each field as a separate time series
     * by automatically adding a `vm_field` tag.
     * @example \{ temperature: 21.5, humidity: 45.2 \}
     */
    fields: Record<string, number | string | boolean>

    /**
     * An optional timestamp for the data point.
     *
     * If omitted, VictoriaMetrics will assign a timestamp
     * automatically upon ingesting the data (ingest time).
     */
    timestamp?: Date
}

/**
 * Describes the standard Prometheus metric structure (a set of labels).
 * @example \{ __name__: "metric_name", label1: "value1" \}
 */
export type PrometheusMetric = Record<string, string>

/**
 * Defines the shape of a single time series in an "instant vector" response.
 */
export interface PrometheusVectorResult {
    metric: PrometheusMetric
    value: [number, string, boolean]
}

/**
 * Defines the shape of a single time series in a "range matrix" response.
 */
export interface PrometheusMetrixResult {
    metric: PrometheusMetric
    values: [number, string][]
}

/**
 * A union type representing all possible `data` block structures
 * in a Prometheus/VictoriaMetrics query response.
 */
export type PrometheusData =
    | {
          reultType: 'vector'
          result: PrometheusVectorResult[]
      }
    | {
          reultType: 'matrix'
          result: PrometheusMetrixResult[]
      }
    | {
          reultType: 'scalar'
          result: [number, string]
      }
    | {
          reultType: 'string'
          result: [number, string]
      }

/**
 * The complete top-level JSON response object from a
 * Prometheus-compatible query API.
 */
export interface PrometheusQueryResponse {
    status: 'success' | 'error'
    data: PrometheusData
    error?: string
    errorType?: string
    warnings?: string[]
}
