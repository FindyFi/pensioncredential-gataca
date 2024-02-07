import { createServer, request } from 'node:http'
import { pensionCredential } from './credential.js'
import {config, jsonHeaders } from './init.js'

// console.log(roles)
// console.log(JSON.stringify(pensionCredential, null, 2))

const statusMap = {
  'PENDING': 0,
  'READY': 1,
  'INVALID': 2,
  'ISSUED': 1,
}

async function createOffer() {
  const offerUrl = `${config.offer_url}`
  const offerBody = {
    "group": config.template
  }
  const offerParams = {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(offerBody)
  }
  // console.log(JSON.stringify(offerBody, null, 1))
  // console.log(offerUrl, JSON.stringify(offerParams, null, 1))
  const resp = await fetch(offerUrl, offerParams)
  if (resp.status == 403) {
    const init = import('./init.js')
    jsonHeaders = (await init).jsonHeaders
    return createOffer()
  }
  const offer = await resp.json()
  console.log(resp.status, offer)
  return offer
}

async function checkStatus(sessionId) {
  const statusUrl = `${config.admin_url}/${sessionId}`
  const statusParams = {
    method: 'GET',
    headers: jsonHeaders
  }
  // console.log(statusUrl, JSON.stringify(statusParams, null, 1))
  const statusResp = await fetch(statusUrl, statusParams)
  if (statusResp.status == 403) {
    const init = import('./init.js')
    jsonHeaders = (await init).jsonHeaders
    return checkStatus(sessionId)
  }
  const json = await statusResp.json()
  const status = json.status
  console.log(statusResp.status, status, statusMap[status])
  return { result: statusMap[status] }
}

async function issueCredential(sessionId) {
  const issueUrl = `${config.admin_url}/${sessionId}/credentials`
  const issueBody = pensionCredential
  const issueParams = {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify([issueBody])
  }
  // console.log(JSON.stringify(issueBody, null, 1))
  // console.log(issueUrl, JSON.stringify(issueParams, null, 1))
  const resp = await fetch(issueUrl, issueParams)
  if (resp.status == 403) {
    const init = import('./init.js')
    jsonHeaders = (await init).jsonHeaders
    return issueCredential(sessionId)
  }
  const processes = await resp.json()
  console.log(resp.status, processes)

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
  else if (match = req.url.match(/^\/issue\/(.*)/)) {
    const sessionId = match[1]
    await issueCredential(sessionId)
    res.setHeader("Content-Type", "text/html")
    res.writeHead(200)
    res.end(`<!DOCTYPE html>
<html>
 <meta charset="UTF-8">
 <title>Myöntö onnistui</title>
 <h1>Sehän sujui näppärästi!</h1>
 <p>Sinulla pitäisi nyt olla eläketodiste digikukkarossasi.</p>
 <p>Testaapa seuraavaksi <a href="https://verifier.gataca.pensiondemo.findy.fi/">todisteen esittämistä</a>!</p>
</html>`)
    return false
  }
  else if (req.url !== '/') {
    res.setHeader("Content-Type", "text/plain")
    res.writeHead(404)
    res.end(`Not Found`)
    return false
  }

  const offer = await createOffer()
  const offerUri = offer?.credential_offer_uri
  if (!offer || !offerUri) {
    console.warn('No credential offer!')
    res.setHeader("Content-Type", "text/html")
    res.writeHead(200)
    res.end(`<!DOCTYPE html>
<html>
 <meta charset="UTF-8">
 <title>Virhe</title>
 <h1>Virhe</h1>
</html>`)
    return false
  }
  const credOffer = new URL(offerUri)?.searchParams?.get('credential_offer_uri');
  // console.log(offer, offerUri, credOffer)
  const sessionId = new URL(credOffer)?.pathname?.split("/")?.pop()

  res.setHeader("Content-Type", "text/html")
  res.writeHead(200)
  res.end(`<!DOCTYPE html>
<html>
 <meta charset="UTF-8">
 <title>Eläketodiste Gatacan kautta myönnettynä</title>
 <script type="module" src="https://unpkg.com/@gataca/qr@2.0.4/dist/gatacaqr/gatacaqr.esm.js"></script>
 <script nomodule="" src="https://unpkg.com/@gataca/qr@2.0.4/dist/index.js"></script>
 <body style="text-align: center;">
  <img src="https://upload.wikimedia.org/wikipedia/en/thumb/6/67/Kela_suomi_kela-1-.jpg/220px-Kela_suomi_kela-1-.jpg" alt="Kela" />
  <h1>Heippa vahvasti tunnistettu asiakas!</h1>
  <p>Skannaapa oheinen QR-koodi digikukkarollasi niin laitetaan sinne eläketodistetta tulemaan...</p>
  <gataca-qr id="gataca-qr" polling-frequency="3" session-timeout="30" autostart="true" style="display: block; width: 256px; margin: 0 auto;" v-2="true"></gataca-qr>
  <script>
   const qr = document.getElementById('gataca-qr')
   var count = 0
   var ok = true
   qr.errorCallback = (e) => {
    console.error(e)
   }
   qr.successCallback = (data, token) => {
    document.location.href = '/issue/${sessionId}'
   }
   qr.createSession = () => {
    return {
     sessionId: '${sessionId}',
     authenticationRequest: '${offerUri}'
    }
   }
   qr.checkStatus = async () => {
    const statusUrl = '/status/${sessionId}'
    const response = await fetch(statusUrl)
    const obj = await response.json()
    return obj
   }
   // (async () => {
   //   await customElements.whenDefined('gataca-qr')
   // })()
  </script>
 </body>
</html>`)
}

const server = createServer(handleRequests);
server.listen(config.issuer_port, config.server_host, () => {
    console.log(`Issuer server is running on http://${config.server_host}:${config.issuer_port}`);
});
