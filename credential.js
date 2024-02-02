import { createHash } from 'node:crypto'
import { config } from './init.js'

const hash = createHash('sha256')
const salt = config.ns_prefix

export const pensionCredential = {
  "credentialSubject": {
    "pension": {
      "type": "Varhennettu kansaneläke",
      "startDate": "2024-02-01",
      "endDate": "2024-08-01",
      "status": "Väliaikainen"
    },
    "person": {
      "firstName": "Matti",
      "lastName": "Meikäläinen",
      "dateOfBirth": "1960-07-31"
    },
    "identityObject": {
      "hashed": true,
      "identityHash": `sha256$${hash.update('Matti Meikäläinen'+salt).digest('hex')}`,
      "identityType": "name",
      "salt": salt
    }
  },
  "type": [
    "VerifiableCredential",
    "pensionCertificateCredential"
  ]
}
