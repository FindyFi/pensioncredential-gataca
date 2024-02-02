import { createServer, request } from 'node:http'
import { config } from './init.js'

const requestCredential = async function (req, res) {
  if (req.url !== '/') {
    res.setHeader("Content-Type", "text/plain")
    res.writeHead(404)
    res.end(`Not Found`)
    return false
  }
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200);
  res.end(`<!DOCTYPE html>
<html>
 <meta charset="UTF-8">
 <body style="text-align: center;">
  <img src="https://cdn-assets-cloud.frontify.com/s3/frontify-cloud-files-us/eyJwYXRoIjoiZnJvbnRpZnlcL2FjY291bnRzXC8yZFwvMTkyOTA4XC9wcm9qZWN0c1wvMjQ5NjY1XC9hc3NldHNcLzAwXC80NTY4NzI2XC81MjA2ODk2MDdmZGRkYjBlMDEwMDhiOTVlMTk1OTRjMS0xNTk1NDI3ODE5LnN2ZyJ9:frontify:ToCDM7NDPWebZDLJcmAgDwA_EsA9XJBl3YroZI1XhA0?width=240" alt="HSL" />
  <h1>Heippa vahvasti tunnistettu asiakas!</h1>
  <p>Lähetäpä eläketodiste niin tsekataan, että sinulla on oikeus eläkealennukseen...</p>
 </body>
</html>`);
};

const server = createServer(requestCredential);
server.listen(config.verifier_port, config.server_host, () => {
    console.log(`Verifier server is running on http://${config.server_host}:${config.verifier_port}`);
});
