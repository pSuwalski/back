import { Union } from '../models/company';
import * as admin from 'firebase-admin';

var pdf = require('html-pdf');


export async function generatePaymentPaper(id: string, union: Union, unionBankAccount: string, amount: string, payersBankAccount: string, payerName: string, title: string): Promise<string> {
  const fileDirectory = `./polecenie-zaplaty-${id}.pdf`;
  let resolve;
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
  })

  const unionNameHtml = `<div class="row">` + union.name.slice(0, 27).split('').map(splitIntoFieldsAndRows).reduce((acc, s) => { acc += s; return acc }, '') + '</div> <div class="row">' + (union.name.slice(27).split('').map(splitIntoFieldsAndRows).reduce((acc, s) => { acc += s; return acc }, '') || '&nbsp;') + `</div>`
  const unionBankAccountHtml = `<div class="row">` + unionBankAccount.split(' ').join('').split('').map(splitIntoFieldsAndRows).reduce((acc, s) => { acc += s; return acc }, '') + '</div>'
  const payersBankAccountHtml = `<div class="row">` + payersBankAccount.split(' ').join('').split('').map(splitIntoFieldsAndRows).reduce((acc, s) => { acc += s; return acc }, '') + '</div>'
  const amountHtml = `<div class="money-row">` + String(amount).split('').map(splitIntoFieldsAndRows).reduce((acc, s) => { acc += s; return acc }, '') + `</div>`
  const payerNameHtml = `<div class="row">` + payerName.slice(0, 27).split('').map(splitIntoFieldsAndRows).reduce((acc, s) => { acc += s; return acc }, '') + '</div> <div class="row">' + (payerName.slice(27).split('').map(splitIntoFieldsAndRows).reduce((acc, s) => { acc += s; return acc }, '') || '&nbsp;') + `</div>`
  const titleHtml = `<div class="row">` + title.slice(0, 27).split('').map(splitIntoFieldsAndRows).reduce((acc, s) => { acc += s; return acc }, '') + '</div> <div class="row">' + (title.slice(27).split('').map(splitIntoFieldsAndRows).reduce((acc, s) => { acc += s; return acc }, '') || '&nbsp;') + `</div>`
  const html = `<!doctype html>
  <html lang="en">
  
  <head>
    <meta charset="utf-8">
    <title>MeliorWaterCompanies</title>
    <base href="/">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body {
        background: url(https://firebasestorage.googleapis.com/v0/b/melior-wc.appspot.com/o/polecenie.jpg?alt=media&token=ef89302b-4fa3-4864-9e2d-9ea9ea15301a);
        background-size: 100%;
        font-size: 12px;
      }
  
      .spacer {
        padding-top: 45px;
      }
  
      .second-spacer {
        padding-top: 91px;
      }
  
      .row {
        padding-left: 95px;
        margin-bottom: 13px;
      }
  
      .money-row {
        padding-left: 311px;
        margin-bottom: 9px;
        margin-top: -1px;
      }
  
      .letter {
        width: 14.3px;
        display: inline-block;
        text-transform: uppercase;
      }
  
      .space {
        color:white;
      }
  
      .bottom {
        margin-bottom: 12.5px;
      }
  
    </style>
  </head>
  
  <body>
    <div class="spacer"></div>
      ${unionNameHtml}
      ${unionBankAccountHtml}
      ${amountHtml}
      ${payersBankAccountHtml}
      ${payerNameHtml}
      ${titleHtml}
      <div class="second-spacer"></div>
      ${unionNameHtml}
      ${unionBankAccountHtml}
      ${amountHtml}
      ${payersBankAccountHtml}
      ${payerNameHtml}
      ${titleHtml}
      <div class="second-spacer"></div>
      <div class="spacer"></div>
  </body>
  
  </html>`;

  pdf.create(html).toFile(fileDirectory, async (err, res) => {
    console.log(res)
    await admin.storage().bucket("melior-wc.appspot.com").upload(fileDirectory);
    resolve(`upowaznienie-${id}.pdf`);
  });
  return promise;
}

export function splitIntoFieldsAndRows(l: string, i: number) {
  if (l !== ' ') {
    return `<span class="letter">${l}</span>`
  } else {
    return `<span class="letter space">_</span>`
  }
}