# Gmailer-NodeServer
This is a NodeJS server using express to send emails using the Gmail REST API.

## To Run
```
npm install
npm start
``` 

## About
- Obtains a Gmail user's credentials using OAuth 2.0. The OAuth 2.0 process is initiated by getURL API call, which returns an authURL link.
- Google provides a secret code on running the authURL, which has to be included in json body to secretCode POST API call.
- The obtained credentials are stored config/token.json
- sendEmail API endpoint is used to execute send email using the credentials previously stored.
- Usage of these APIs(in order) is shown in screenshots directory
- nodejsfile directory contains a nodejs application used for the same functionality.
