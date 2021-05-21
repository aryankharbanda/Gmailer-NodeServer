# Gmailer-NodeServer
This is a NodeJS server using express to send emails using the Gmail REST API.

## To Run
```
npm install
nodemon server
``` 

## About
- Obtains a Gmail user's credentials using OAuth 2.0. The OAuth 2.0 process is initiated by getURL API call, which returns an authURL link.
- Google provides a secret code on running the authURL, which has to be given to secretCode API call.
- The obtained credentials in config/token.json
- sendEmail API endpoint is used to execute send email using the credentials previously stored.

