import sqlite3 from 'sqlite3'
import config from './config.json' assert {'type': 'json'}
import { auth } from './auth.js'

const auth_token = await auth(config)

const issuerName = 'Kela'
const issuerImage = 'https://www.kela.fi/documents/20124/410402/logo-kela-rgb.png/50cdb366-b094-027e-2ac2-0439af6dc529?t=1643974848905'
const issuerUrl = 'https://kela.fi'
const verifierName = 'HSL'
const verifierUrl = 'https://hsl.fi'
const verifierImage = 'https://cdn-assets-cloud.frontify.com/s3/frontify-cloud-files-us/eyJwYXRoIjoiZnJvbnRpZnlcL2FjY291bnRzXC8yZFwvMTkyOTA4XC9wcm9qZWN0c1wvMjQ5NjY1XC9hc3NldHNcL2UzXC80NTY4ODQ2XC9lMjY2Zjg2NTU1Y2VjMGExZGM4ZmVkNDRiODdiMTNjNi0xNTk1NDI5MTAxLnN2ZyJ9:frontify:B-Us_1Aj3DJ5FKHvjZX1S0UOpg5wCFDIv4CNfy6rXQY?width=2400'

// override config file with environment variables
for (const param in config) {
    if (process.env[param] !== undefined) {
        config[param] = process.env[param]
    }
}

const jsonHeaders = {
    'Authorization': auth_token,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
}

const db = await openDB()
const roles = await initRoles()
export { config, db, roles, jsonHeaders }

function openDB() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(config.db_file, (err) => {
            if (err) reject(err.message)
            // console.log(`Connected to the database '${config.db_file}'.`)
            const create = `CREATE TABLE IF NOT EXISTS organizations (
                id INTEGER PRIMARY KEY,
                name varchar(50),
                role varchar(20),
                key INTEGER,
                did VARCHAR(500),
                url VARCHAR(500),
                image VARCHAR(500)
            );`
            db.run(create, (err) => {
                if (err) reject(err.message)
                resolve(db)
            })
        })
    })
}

function initRoles() {
    return new Promise((resolve, reject) => {
        const selectOrganizations = "SELECT id, name, role, key, did FROM organizations;"
        const roles = {}
        db.all(selectOrganizations, [], async (err, rows) => {
            if (err) throw err;
            rows.forEach((row) => {
                // row.key = JSON.parse(row.key)
                roles[row.role] = row
            })
            if (roles.issuer?.did && roles.verifier?.did) {
                resolve(roles)
                return
            }
            for (let role of ['issuer', 'verifier']) {
                if (!roles[role]) {
                    // console.log(`Creating ${role}`)
                    // console.log(`${config.issuer_api}/example-key`)
                    const resp = await fetch(`${config.issuer_api}/example-key`)
                    const jwk = await resp.json()
                    const org = {
                        name: role == 'issuer' ? issuerName : verifierName,
                        role: role,
                        key: jwk,
                        url: role == 'issuer' ? issuerUrl : verifierUrl,
                        image: role == 'issuer' ? issuerImage : verifierImage,
                    }
                    roles[role] = await createOrganization(org)
                }
                if (!roles[role].did) {
                    roles[role] = await createDid(roles[role])
                }
            }
            resolve(roles)
        })
    })
}

function createOrganization(org) {
    const insertOrganization = db.prepare("REPLACE INTO organizations (name, role, key, url, image) VALUES (?, ?, ?, ?, ?);")
    return new Promise((resolve, reject) => {
        const values = [
            org.name,
            org.role,
            JSON.stringify(org.key),
            org.url,
            org.image
        ]
        insertOrganization.run(values, function(err) {
            if (err) {
                reject(err)
                return
            }
            org.id = this.lastID
            resolve(org)
        })
    })
}

function createDid(org) {
    const updateOrganization = "UPDATE organizations SET did = ? WHERE id = ?;"
    return new Promise(async (resolve, reject) => {
        const headers = {
            key: JSON.stringify(org.key)
        }
        const resp = await fetch(`${config.issuer_api}/example-did`, { headers })
        org.did = await resp.text()
        console.log(org.did)
        db.run(updateOrganization, [org.did, org.id], function (err) {
            if (err) {
                reject(err)
                return
            }
            resolve(org)
        })
    })
}
