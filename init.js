import config from './config.json' assert {'type': 'json'}
import { auth } from './auth.js'

// override config file with environment variables
for (const param in config) {
    if (process.env[param] !== undefined) {
        config[param] = process.env[param]
    }
}

const auth_token = await auth(config, config.template)
if (!auth_token) {
    console.error('No auth token. Incorrect credentials or expired free trial?')
}

const issuerName = 'Kela'
const issuerImage = 'https://www.kela.fi/documents/20124/410402/logo-kela-rgb.png/50cdb366-b094-027e-2ac2-0439af6dc529?t=1643974848905'
const issuerUrl = 'https://kela.fi'
const verifierName = 'HSL'
const verifierUrl = 'https://hsl.fi'
const verifierImage = 'https://cdn-assets-cloud.frontify.com/s3/frontify-cloud-files-us/eyJwYXRoIjoiZnJvbnRpZnlcL2FjY291bnRzXC8yZFwvMTkyOTA4XC9wcm9qZWN0c1wvMjQ5NjY1XC9hc3NldHNcL2UzXC80NTY4ODQ2XC9lMjY2Zjg2NTU1Y2VjMGExZGM4ZmVkNDRiODdiMTNjNi0xNTk1NDI5MTAxLnN2ZyJ9:frontify:B-Us_1Aj3DJ5FKHvjZX1S0UOpg5wCFDIv4CNfy6rXQY?width=2400'

const jsonHeaders = {
    'Authorization': auth_token,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
}

export { config, jsonHeaders }