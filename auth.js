export async function auth(config, template) {
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
    // console.log(resp.status, JSON.stringify(params, null, 1))
    if (resp.status != 200) {
        console.log(resp.status, JSON.stringify(params, null, 1))
        const json = await resp.json()
        console.log(json)
        return false
    }
    const token = resp.headers.get('token')
    const token_type = resp.headers.get('token_type')
    // console.log(resp.status, token_type, token)
    return `${token_type} ${token}`
}
