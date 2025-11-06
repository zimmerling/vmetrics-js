import { VictoriaMetricsClient } from '../src/client.js'
import type { VMDataPoint } from '../src/types.js'

const VM_WRITE_URL = 'http://0.0.0.0:8428'

async function main() {
    console.log('Start VictoriaMetricsClient example...')

    const client = new VictoriaMetricsClient({
        url: VM_WRITE_URL,
        batchSize: 100,
        flushInterval: 5_000, // 5 seconds
    })

    const exampleDataPoint: VMDataPoint = {
        measurement: 'iot_example',
        tags: { sensorId: 'sensor1', room: 'living_room' },
        fields: { temperature: 21.9, isHeating: true },
    }

    client.writePoint(exampleDataPoint)
    client.writePoint({
        ...exampleDataPoint,
        tags: { ...exampleDataPoint.tags, room: 'rest_room' },
    })

    console.log('Forcing flush...')
    await client.flush()

    console.log('Querying for metrics...')
    await client.query('iot_example_temperature')

    console.log('Shutting down. The example was successful:)')
}

main().catch((err) => {
    console.error('Example failed:', err)
    process.exit(1)
})
