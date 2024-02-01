export async function auth(config) {
    const pwStr = [config.api_id, config.api_password].join(':')
    const b64 = Buffer.from(pwStr).toString('base64')
    const params = {
        method: 'POST',
        headers: {
            tenant: config.tenant,
            ssiconfig: config.template,
            Authorization: `Basic ${b64}`
        }
    }
    
    // console.log(config.login_url, params)
    const resp = await fetch(config.login_url, params)
    const token = resp.headers.get('token')
    const token_type = resp.headers.get('token_type')
    // console.log(resp.status, token_type, token)
    return `${token_type} ${token}`
}
