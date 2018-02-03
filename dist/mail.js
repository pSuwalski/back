"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_key = 'key-f284fa6b8b11378a31bf9888fbe1a53e';
const domain = 'melior24.pl';
const mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });
const ourMail = 'kontakt@melior24.pl';
function sendWelcomeEmail(mail) {
    const mailData = welcomeMailData;
    mailData.to = mail;
    let resolve;
    const promise = new Promise((res, rej) => { resolve = res; });
    mailgun.messages().send(mailData, (error, body) => {
        if (body) {
            console.log('body ', body);
            resolve(body);
        }
        else {
            console.log('error', error);
            resolve(error);
        }
    });
    return promise;
}
exports.sendWelcomeEmail = sendWelcomeEmail;
;
const welcomeMailData = {
    from: `Kontakt Melior24.pl <${ourMail}>`,
    subject: 'Hello',
    text: 'Testing some Mailgun awesomness!'
};
//# sourceMappingURL=mail.js.map