const apiKey = process.env.LOGFLARE_KEY
const sourceToken = process.env.LOGFLARE_SOURCE

import pino from 'pino'
import { createPinoBrowserSend, createWriteStream } from 'pino-logflare'
import * as Crypto from "crypto"

// create pino-logflare stream
const stream = createWriteStream({
    apiKey: apiKey,
    sourceToken: sourceToken
});

// create pino-logflare browser stream
const send = createPinoBrowserSend({
    apiKey: apiKey,
    sourceToken: sourceToken
});

// create pino loggger
const _logger = pino({
    level:"warn",
    browser: {
        transmit: {
            send: send,
        }
    }
}, stream);

export let runId = Crypto.randomUUID()
export let logger = _logger.child({runId:runId})