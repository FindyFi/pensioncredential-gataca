import { createServer, request } from 'node:http'
import { pensionCredential } from './credential.js'
import {config, jsonHeaders } from './init.js'

// console.log(roles)
// console.log(JSON.stringify(pensionCredential, null, 2))

const processBody = {
  "group": config.template
}
const processParams = {
  method: 'POST',
  headers: jsonHeaders,
  body: JSON.stringify(processBody)
}
// console.log(JSON.stringify(processBody, null, 1))
console.log(config.issuance_url, JSON.stringify(processParams, null, 1))
const resp = await fetch(config.issuance_url, processParams)
const json = await resp.json()
const sessionId = json.id
console.log(resp.status, sessionId)
console.log(json)

async function issueCredential(sessionId) {

  const statusUrl = `${config.admin_url}/${sessionId}`
  const statusParams = {
    method: 'GET',
    headers: jsonHeaders
  }
  console.log(statusUrl, JSON.stringify(statusParams, null, 1))
  const statusResp = await fetch(statusUrl, statusParams)
  const json = await statusResp.json()
  const status = json.status
  console.log(statusResp.status, status)
  if (status == 'REJECTED') {
    throw new Error('User rejected credential offer!')
  }

  const issueUrl = `${config.admin_url}/${sessionId}/credentials`
  const issueBody = pensionCredential
  const issueParams = {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify([issueBody])
  }
  // console.log(JSON.stringify(issueBody, null, 1))
  console.log(issueUrl, JSON.stringify(issueParams, null, 1))
  const resp = await fetch(issueUrl, issueParams)
  const processes = await resp.json()
  console.log(resp.status, processes)
  if (typeof processes == 'Array') {
    for (const process of processes) {
      if (process.id == sessionId) {
        console.log(JSON.stringify(process.data, null, 1))
      }
    }  
  }
}

const sendOffer = async function (req, res) {
  res.setHeader("Content-Type", "text/html")
  res.writeHead(200)
  res.end(`<!DOCTYPE html>
<html>
 <meta charset="UTF-8">
 <script type="module" src="https://unpkg.com/gatacaqr@1.4.2/dist/gatacaqr/gatacaqr.esm.js"></script>
 <script nomodule="" src="https://unpkg.com/gatacaqr@1.4.2/dist/gatacaqr/gatacaqr.js"></script>
 <body style="text-align: center;">
  <img src="https://upload.wikimedia.org/wikipedia/en/thumb/6/67/Kela_suomi_kela-1-.jpg/220px-Kela_suomi_kela-1-.jpg" alt="Kela" />
  <h1>Heippa vahvasti tunnistettu asiakas!</h1>
  <p>Skannaapa oheinen QR-koodi digikukkarollasi niin laitetaan sinne eläketodistetta tulemaan...</p>
  <gataca-qr id="gataca-qr" qrRole="connect" polling-frequency="1" session-timeout="5" autostart="false" size="256"></gataca-qr>
  <script>
   const qr = document.getElementById('gataca-qr');
   var count = 0;
   var ok = true;
   qr.successCallback = (data) => {
     alert("ALL OK" + data)
   };
   qr.errorCallback = () => {
     alert("some error")
   };
   qr.createSession = () => {
     return { sessionId: '${sessionId}' }
   }
   qr.checkStatus = () => {
     count++;
     if (count == 10) {
       return { result: ok ? 1 : 2, data: { "name": "test", "token": "x" } }
     }
     return { result: 0 }
   }
   // (async () => {
   //   await customElements.whenDefined('gataca-qr');
   // })();
  </script>
 </body>
</html>`)
  setTimeout(function() {
    issueCredential(sessionId)
  }, config.status_check_interval * 1000)
  console.log(`Waiting ${config.status_check_interval} seconds before trying to issue credential`)
}

const server = createServer(sendOffer);
server.listen(config.issuer_port, config.server_host, () => {
    console.log(`Issuer server is running on http://${config.server_host}:${config.issuer_port}`);
});
