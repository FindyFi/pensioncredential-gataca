import { createServer, request } from 'node:http'
import { config, jsonHeaders } from './init.js'
import { auth } from './auth.js'

const auth_token = await auth(config, config.verificationTemplate)
jsonHeaders.Authorization = auth_token

async function checkStatus(sessionId) {
  const statusUrl = `${config.sessions_url}/${sessionId}`
  const statusParams = {
    method: 'GET',
    headers: jsonHeaders
  }
  // console.log(statusUrl, JSON.stringify(statusParams, null, 1))
  const statusResp = await fetch(statusUrl, statusParams)
  if (statusResp.status == 403) {
    const { auth } = await import('./auth.js')
    jsonHeaders.Authorization = await auth(config, config.verificationTemplate)
    return checkStatus(sessionId)
  }
  let status = 2
  const json = await statusResp.json()
  if (statusResp.status == 202) {
    status = 0
  }
  else if (statusResp.status == 200) {
    status = 1
  }
  // console.log(statusResp.status, status, JSON.stringify(json, null, 1))
  const statusObj = {
    result: status,
    data: json
  }
  return statusObj
}

async function showVerifierPage(res) {
  if (!jsonHeaders.Authorization) {
    res.setHeader("Content-Type", "text/html")
    res.writeHead(500)
    res.end(`<!DOCTYPE html>
<html>
 <meta charset="UTF-8">
 <title>Virhe</title>
 <h1>Tunnistustiedot eivät kelpaa!</h1>
 <p>Olisikohan ilmainen kokeilujakso päättynyt?</p>
</html>`)
    return false
  }
  const sessionsUrl = config.sessions_url
  const sessionsBody = {
    "ssiConfigId": config.verificationTemplate
  }
  const sessionsParams = {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(sessionsBody)
  }
  // console.log(sessionsUrl, JSON.stringify(sessionsParams, null, 1))
  const sessionsResp = await fetch(sessionsUrl, sessionsParams)
  console.log(sessionsResp.status, sessionsUrl)
  if (sessionsResp.status == 403) {
    const { auth } = await import('./auth.js')
    jsonHeaders.Authorization = await auth(config, config.verificationTemplate)
    return showVerifierPage(res)
  }
  else if (sessionsResp.status == 400 || sessionsResp.status == 500) {
    const error = await sessionsResp.text()
    console.error(error)
    console.log(JSON.stringify(sessionsParams, null, 2))
    res.setHeader("Content-Type", "text/plain")
    res.writeHead(200)
    res.end(error)
    return false
  }
  else if (sessionsResp != 200 || !json) {
    console.log(JSON.stringify(sessionsParams, null, 2))
  }
  const json = await sessionsResp.json()
  // console.log(JSON.stringify(json.data, null, 1))
  const sessionId = json.presentation_definition.id
  const authRequest = json.authentication_request
  console.log(sessionsResp.status, sessionId, authRequest)
  res.setHeader("Content-Type", "text/html")
  res.writeHead(200)
  res.end(`<!DOCTYPE html>
<html>
 <meta charset="UTF-8">
 <title>Gataca tarkastaa eläketodisteen</title>
 <script type="module" src="https://unpkg.com/@gataca/qr@2.0.4/dist/gatacaqr/gatacaqr.esm.js"></script>
 <script nomodule="" src="https://unpkg.com/@gataca/qr@2.0.4/dist/index.js"></script>
 <style>
  table {
    max-width: 30em;
    margin: 1em auto;
  }
  th, td {
    text-align: left;
  }
  pre {
    background-color: black;
    color: green;
    display: none;
    text-align: left;
  }
  #content.full pre {
    display: block;
  }
 </style>
 <body style="text-align: center;">
  <img src="https://cdn-assets-cloud.frontify.com/s3/frontify-cloud-files-us/eyJwYXRoIjoiZnJvbnRpZnlcL2FjY291bnRzXC8yZFwvMTkyOTA4XC9wcm9qZWN0c1wvMjQ5NjY1XC9hc3NldHNcLzAwXC80NTY4NzI2XC81MjA2ODk2MDdmZGRkYjBlMDEwMDhiOTVlMTk1OTRjMS0xNTk1NDI3ODE5LnN2ZyJ9:frontify:ToCDM7NDPWebZDLJcmAgDwA_EsA9XJBl3YroZI1XhA0?width=240" alt="HSL" />
  <h1>Heippa vahvasti tunnistettu asiakas!</h1>
  <div id="content">
   <p>Lähetäpä eläketodiste niin tsekataan, että sinulla on oikeus eläkealennukseen...</p>
   <gataca-qr id="gataca-qr" polling-frequency="3" session-timeout="300" autostart="true" style="display: block; width: 256px; margin: 0 auto;" v-2="true"></gataca-qr>
  </div>

  <script>
   const qr = document.getElementById('gataca-qr')
   var count = 0
   var ok = true
   /*

   const processData = (data) => {
    // console.log(JSON.stringify(data, null, 2))
    let result = {}
    for (let vc of data?.verifiableCredential) {
      for (let key of Object.keys(vc.credentialSubject)) {
        if (key != "id") {
          result[key] = vc.credentialSubject[key]
        }
      }
    }
    return result
   }
   */
   qr.errorCallback = (e) => {
    console.error(e)
   }
   qr.successCallback = (data, token) => {
    const c = document.querySelector('#content')
    console.log(JSON.stringify(data, null, 2))
    // console.log(JSON.stringify(qr.sessionData, null, 4))
    console.log(JSON.stringify(data.PresentationSubmission.verifiableCredential, null, 4))
    for (let vc of data?.PresentationSubmission?.verifiableCredential) {
     console.log(JSON.stringify(vc, null, 1))
     const credential = vc.credentialSubject
     const html = \`<p>Todisteen tarkistuksen tila: <strong>OK</strong></p>
      <table>
       <tr><th>Nimi</th><td>\${credential.person?.firstName} \${credential.person?.lastName}</td></tr>
       <tr><th>Eläke</th><td>\${credential.pension?.type} \${credential.pension?.startDate}–\${credential.pension?.endDate || ''}</td></tr>
      </table>
      <pre>\${JSON.stringify(status, null, 2)}</pre>\`
     c.innerHTML = html
     c.ondblclick = function(e) {
      this.classList.toggle('full')
     }
    }
   }
   qr.createSession = () => {
    return {
     sessionId: '${sessionId}',
     authenticationRequest: '${authRequest}'
    }
   }
   qr.checkStatus = async () => {
    const statusUrl = '/status/${sessionId}'
    const response = await fetch(statusUrl)
    const obj = await response.json()
    // console.log(JSON.stringify(obj, null, 2))
    console.log(response.status, obj.result)
    if (obj.result == 1) {
     // qr.sessionData = processData(obj)
     qr.sessionData = obj
    }
    return obj
   }
  </script>
 </body>
</html>`)
}

const handleRequests = async function (req, res) {
  let match
  if (match = req.url.match(/^\/status\/(.*)/)) {
    const sessionId = match[1]
    const statusObject = await checkStatus(sessionId)
    // console.log(statusObject)
    res.setHeader("Content-Type", "'application/json'")
    res.writeHead(200)
    res.end(JSON.stringify(statusObject))
    return false
  }
  if (req.url !== '/') {
    res.setHeader("Content-Type", "text/plain")
    res.writeHead(404)
    res.end(`Not Found`)
    return false
  }
  await showVerifierPage(res)
}

const server = createServer(handleRequests)
server.listen(config.verifier_port, config.server_host, () => {
    console.log(`Verifier server is running on http://${config.server_host}:${config.verifier_port}`)
})
