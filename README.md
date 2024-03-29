# Gataca PensionCredential demo
Demo: issue and verify pension credential using Gataca Studio

Following instructions at [How to issue your own credentials](https://gataca.atlassian.net/wiki/spaces/DOCS/pages/1005584418/How+to+issue+your+own+credentials) and [Studio Integration - Credential Issuance Process](https://gataca.atlassian.net/wiki/spaces/DOCS/pages/1112834295/Studio+Integration+-+Credential+Issuance+Process) in [Gataca Documentation](https://gataca.atlassian.net/wiki/spaces/DOCS/overview?homepageId=1004667112)

## Test
Test a [running instance](https://issuer.gataca.pensiondemo.findy.fi/) with the [Gataca wallet](https://gataca.io/products/wallet/) ([App Store](https://apps.apple.com/us/app/gataca/id1498607616), [Google Play](https://play.google.com/store/apps/details?id=com.gataca.identity))

## Setup
1. Create a Gataca account on [Gataca Studio](https://studio.gataca.io/login) log in page.
2. Go to [API Keys](https://studio.gataca.io/api_keys) and generate an API key.
3. Create an [Issuance template](https://studio.gataca.io/issuance_templates) for `PensionCredentialIssuance`.
4. Connect your API key to the Issuance template. (Docs)

## Run locally
Edit [config.json](config.json) and set your API id, API password, tenant ID, and issuance template name.

## Deploy to Azure
Click on the button below and follow the wizard. You need your API id, API password, tenant ID, and issuance template name.

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FFindyFi%2Fpensioncredential-gataca%2Fmain%2FARMTemplate%2Ftemplate.json)

