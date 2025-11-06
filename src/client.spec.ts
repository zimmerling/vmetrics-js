import { VictoriaMetricsClient } from './client.js'
import type { VMDataPoint } from './types.js'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

class TestableClient extends VictoriaMetricsClient {
    public testFormatLine(point: VMDataPoint): string {
        return this['formatLineProtocol'](point)
    }

    public async shutdown(): Promise<void> {
        await super.shutdown()
    }
}

describe('formatLineProtocol', () => {
    let client: TestableClient

    beforeEach(async () => {
        client = new TestableClient({ url: 'http://dummy.com' })
    })

    afterEach(async () => {
        await client.shutdown()
    })

    it('should format numbers correctly', () => {
        const point: VMDataPoint = {
            measurement: 'logs',
            tags: { app: 'main' },
            fields: {
                level: 'info',
                active: true,
                count: 2,
            },
        }

        const line = client.testFormatLine(point)
        expect(line).toBe('logs,app=main level="info",active=t,count=2')
    })
})
