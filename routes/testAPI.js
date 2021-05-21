var express = require("express");
var router = express.Router();

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send'
];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'config/token.json';

// boolean to check if oAuth2Client is configured or not
var oAuthClientExists = false;
var oAuth2Client = {};

// POST request 
// API to initiate process of obtaining Gmail user's credentials using OAuth 2.0
router.post("/getURL", (req, res) => {

    // Load client secrets from a local file.
    fs.readFile('config/credentials.json', (err, content) => {
        if (err) {
            console.log('Error loading client secret file:', err);
            res.status(400).send('Error loading client secret file');
        }

        else {
            // Authorize a client with credentials, then call the Gmail API.
            // authorize(JSON.parse(content), sendMessage);
            const credentials = JSON.parse(content)
            const { client_secret, client_id, redirect_uris } = credentials.installed;
            oAuth2Client = new google.auth.OAuth2(
                client_id, client_secret, redirect_uris[0]);
            
            // boolean is set true
            oAuthClientExists = true;

            // Check if we have previously stored a token.
            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) {
                    // return getNewToken(oAuth2Client, sendMessage);
                    const authUrl = oAuth2Client.generateAuthUrl({
                        access_type: 'offline',
                        scope: SCOPES,
                    });
                    res.status(200).json({ URL: authUrl });
                }
                else {
                    // set credentials of existing token
                    oAuth2Client.setCredentials(JSON.parse(token));
                    // sendMessage(oAuth2Client);
                    res.status(302).send('token.json already exists');
                }
            });
        }

    });

});

// POST request 
// API to complete OAuth 2.0 process by providing secretCode given by authorization URL
router.post("/secretCode", (req, res) => {
    
    if (!oAuthClientExists) {
        console.log('Configure OAuth2 Client before running this API');
        res.status(400).send('Configure OAuth2 Client before running this API');
    }

    else {
        // getting secet code from incoming json body 
        const secCode = req.body.code;
        oAuth2Client.getToken(secCode, (err, token) => {
            if (err) {
                console.log('Error retrieving access token', err);
                res.status(400).send('Error retrieving access token');
            }
            else {
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) {
                        console.log(err);
                        res.status(400).json(err);
                    }
                    else {
                        console.log('Token stored to', TOKEN_PATH);
                        res.status(200).send('Token stored successfully');
                    }
                });
            }
        });
    }


});

// POST request 
// API to send emails after OAuth 2.0 authentication process 
router.post("/sendEmail", (req, res) => {

    if (!oAuthClientExists) {
        console.log('Configure OAuth2 Client before running this API');
        res.status(400).send('Configure OAuth2 Client before running this API');
    }

    else {
        // getting mail details from incoming json body 
        to = req.body.to;
        from = req.body.from;
        subject = req.body.subject;
        message = req.body.message;

        // converting mail details to MIME message
        var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
            "MIME-Version: 1.0\n",
            "Content-Transfer-Encoding: 7bit\n",
            "to: ", to, "\n",
            "from: ", from, "\n",
            "subject: ", subject, "\n\n",
            message
        ].join('');

        // encoding in base64
        var encodedMail = new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');

        const gmail = google.gmail({ version: 'v1', oAuth2Client });
        // sending email
        gmail.users.messages.send({
            auth: oAuth2Client,
            userId: 'me',
            resource: {
                raw: encodedMail
            }

        }, (err, response) => {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            else {
                console.log(response);
                res.status(200).send(response);
            }
        });
    }

});

module.exports = router;
