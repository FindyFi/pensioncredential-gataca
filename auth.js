import config from './config.json' assert {'type': 'json'}
export default async function auth(config, template) {
    const pwStr = [config.api_id, config.api_password].join(':')
    const b64 = Buffer.from(pwStr).toString('base64')
    const params = {
        method: 'POST',
        headers: {
            tenant: config.tenant,
            ssiconfig: template,
            Authorization: `Basic ${b64}`
        }
    }
    // console.log(config.login_url, params)
    const resp = await fetch(config.login_url, params)
    if (resp.status == 409) {
        return false
    }
    const token = resp.headers.get('token')
    const token_type = resp.headers.get('token_type')
    // console.log(resp.status, token_type, token)
    return `${token_type} ${token}`
}
