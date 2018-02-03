"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
var pdf = require('html-pdf');
function generateCallPaper(id, union, owner, company, cashAddress, bankName, bankAccount, contactPhone, contactEmail, stampAuth, status) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileDirectory = `./wezwanie-${id}.pdf`;
        let resolve;
        const promise = new Promise((res, rej) => {
            resolve = res;
        });
        const html = `<!doctype html>
  <html lang="en">
  
  <head>
    <meta charset="utf-8">
    <title>MeliorWaterCompanies</title>
    <base href="/">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body {
        font-size: 12px;
        padding: 0px 8px 12px 8px;
      }
  
      .column {
        width: 48%;
        display: inline-block;
        vertical-align: top;
      }
  
      .right-column {
        margin-left: auto;
        text-align: right;
      }
  
      .left-column {
        padding-left: 2%;
      }
  
      .mini-header {
        font-size: 10px;
      }
  
      .title {
        padding-top: 16px;
        font-size: 16px;
        font-weight: 800;
        text-align: center;
      }
  
      .policy {
        padding: 16px 48px;
        font-size: 12px;
      }
  
      .date {
        padding: 8px 48px 16px;
        text-align: center;
      }
  
      .table-container {
        padding: 12px 30px;
        text-align: center;
      }
  
      .table {
        width: 95%;
        display: inline-table;
        text-align: left;
      }
  
      .table-left-big {
        width: 77%;
        border: solid 1px #000000;
        margin-top: -1px;
        padding: 4px;
        text-align: left;
        display: table-cell;
      }
  
      .table-right-small {
        width: 17%;
        border: solid 1px #000000;
        margin-top: -1px;
        margin-left: -1px;
        padding: 4px;
        display: table-cell;
      }
  
      .table-left-small {
        width: 22%;
        border: solid 1px #000000;
        margin-top: -1px;
        padding: 4px;
        text-align: left;
        display: table-cell;
      }
  
      .table-right-big {
        width: 72%;
        border: solid 1px #000000;
        margin-top: -1px;
        margin-left: -1px;
        padding: 4px;
        display: table-cell;
      }
  
      .table-left-quarter {
        width: 8.75%;
        border: solid 1px #000000;
        margin-top: -1px;
        margin-left: -1px;
        padding: 4px;
        display: table-cell;
      }
  
      .table-left-half {
        width: 25.5%;
        border: solid 1px #000000;
        margin-top: -1px;
        margin-left: -1px;
        padding: 4px;
        display: table-cell;
      }
  
      .policy {
        text-align: center;
      }
  
      .pieczatka {
        min-height: 66px;
        min-width: 180px;
        padding: 6px 18px;
        border: solid 1px #615f5f;
        margin-left: auto;
        display: inline-block;
        text-align: center;
      }
  
      .pieczatka-signature {
        font-size: 10px;
        text-align: left;
      }
  
      .top {
        margin-bottom: 26px;
      }
  
      .bottom {
        margin-top: 26px;
        text-align: center!important;
      }
  
      .pieczatka-title {
        padding: 0 8px;
        color: #d7d6d6;
      }
  
      .table-title {
        text-align: center;
        margin-top: -1px;
        padding: 4px;
        font-size: 600;
      }
  
      .bank {
        font-weight: bold;
        text-align: center;
      }

      table {
        border: solid 1px #000000;
      }
    </style>
  </head>
  
  <body>
    <div class="column left-column">
      <div class="mini-header" style="padding-right: 30px; color: white;">_</div>
      <div class="pieczatka-signature top" style="text-align: right; margin-bottom: 14px; color: white">_</div>
      <div>${owner.name + ' ' + owner.surname}</div>
      <div>${owner.address.streetAndNumber}</div>
      <div>${owner.address.city + ' ' + owner.address.postCode}</div>
      <div>${owner.id}</div>
    </div>
    <div class="column right-column">
      <div style="margin-top: 12px;">
        <div class="pieczatka-signature top" style="text-align: right; margin-bottom: 14px;">${new Date().getDate()}.${new Date().getMonth() + 1}.${new Date().getFullYear()} ${company.address.city}</div>
        <div>${company.name}</div>
        <div>${company.address.streetAndNumber}</div>
        <div>${company.address.city + ' ' + company.address.postCode}</div>
        <div>${company.nip + ' ' + company.regon ? company.regon : ''}</div>
      </div>
    </div>
    <div class="title">WEZWANIE DO ZAPŁATY</div>
    <div class="policy">
        Na podstawie art. 170 ust. 1 i  art. 171 ust. 1 Ustawy Prawo Wodne z dnia 18 lipca 2001r. ( Dz. U. nr 115, poz. 1229 z późniejszymi zmianami) oraz na podstawie Statutu Spółki Wodnej i uchwał Walnego Zgromadzenia zatwierdzonych decyzjami Starosty wzywamy do natychmiastowego uregulowania należnej sumy, zgodnie z poniższym zestawieniem.
    </div>
    <div class="table-container">
      <table class="table">
      <tr>  
        <th class="column table-left-half">Podstawa zobowiązania</th>
        <th class="column table-left-half">Termin wymagalności</th>
        <th class="column table-left-quarter">Kapitał</th>
        <th class="column table-left-quarter">Odsetki</th>
        <th class="column table-left-quarter">Koszty</th>
        <th class="column table-left-quarter">Suma</th>
      </tr>

        ${generateRows(owner.fees, (owner.payments ? owner.payments : []).filter((p) => p.type === 'additionalCosts'))}
              
      </table>
    </div>
  
    <div style="text-align: center; height: (74 + 14 + 116 + 24 + 106) - 24 * ( ${Math.max(owner.fees.length + (owner.payments ? owner.payments : []).length - 10, 0)}) px">...</div>
    <div class="policy">
        Wpłatę można dokonać w kasie Spółki Wodnej pod adresem ${cashAddress} bądź na konto bankowe Spółki Wodnej (w tytule imię i nazwisko osoby na, którą zostało wystwione wezwanie).
    </div>
    <div class="bank">${bankName + ' ' + bankAccount}</div>
    <div class="policy" style="margin-bottom: 24px;">
        Informujemy, że zgodnie z Ustawą Prawo Wodne, Spółki Wodne nie działają dla ZYSKU. Umorzenie zaległych świadczeń wiązałoby się z podniesieniem składki i pokryciem tych zobowiązań i braków w budżecie ze składek wpływających przez osoby wiązujące się ze swoich obowiązków wynikających z art. 170 ust. 1 i  art. 171 ust. 1 Ustawy Prawo Wodne z dnia 18 lipca 2001r.  oraz ze Statutu Spółki Wodnej zatwierdzonego decyzją Starosty Powiatu ${status}
    </div>
    <div class="column left-column">
      <div class="mini-header" style="padding-right: 30px; color: white;">_</div>
      <div>Kontakt</div>
      <div>Telefon: ${contactPhone}</div>
      <div>E-mail: ${contactEmail}</div>
    </div>
    <div class="column right-column">
      <div class="pieczatka">
        <div class="pieczatka-signature top"> Z upoważnienia Zarządu SW	</div>
        <div class="pieczatka-title">PIECZĄTKA IMIENNA I PODPIS</div>
        <div class="pieczatka-signature bottom">${stampAuth.name + ' ' + stampAuth.surname + ' ' + stampAuth.position}</div>
      </div>
    </div>
  </body>
  
  </html>`;
        console.log(html);
        pdf.create(html).toFile(fileDirectory, (err, res) => __awaiter(this, void 0, void 0, function* () {
            console.log(res);
            yield admin.storage().bucket("melior-wc.appspot.com").upload(fileDirectory);
            resolve(`wezwanie-${id}.pdf`);
        }));
        return promise;
    });
}
exports.generateCallPaper = generateCallPaper;
function generateRows(fees, additionalCosts) {
    let allFees = [].concat(fees).concat(additionalCosts);
    console.log('$$$$$$$$$$$$ fees: ', allFees);
    let sum = 0;
    allFees.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const feesHtml = allFees.map((f) => {
        sum += f.value + (f.type === 'fee' ? f.intrests : 0);
        return f.value + (f.type === 'fee' ? f.intrests : 0) ? `
    <tr>
    <td class="column table-left-half">${f.cause}</td>
  <td class="column table-left-half">${new Date(f.date).getDate()}.${(new Date(f.date).getMonth() + 1)}.${new Date(f.date).getFullYear()}</div>
  <td class="column table-left-quarter">${f.type === 'fee' ? f.value : 0} </td>
  <td class="column table-left-quarter" > ${f.type === 'fee' ? f.intrests : 0} </td>
  <td class="column table-left-quarter" > ${f.type === 'fee' ? 0 : f.value} </td>
  <td class="column table-left-quarter" > ${f.value + (f.type === 'fee' ? f.intrests : 0)} </td>
  </tr>` : '';
    }).join('');
    const sumHtml = `
  <tr>
    <td class="column table-left-half" style="width: 74.5%">Do zapłaty w sumie</td>
    <td class="column table-left-half" style="width: 74.5%"> &nbsp; </td>
    <td class="column table-left-half" style="width: 19.5%;"> &nbsp; </td>
    <td class="column table-left-half" style="width: 19.5%;"> &nbsp; </td>
    <td class="column table-left-half" style="width: 19.5%;"> &nbsp; </td>
    <td class="column table-left-quarter" style="width: 19.5%;">${Math.floor(sum * 100) / 100}</td>
  </tr>
  `;
    console.log(feesHtml + sumHtml);
    return feesHtml + sumHtml;
}
exports.generateRows = generateRows;
//# sourceMappingURL=call-paper.js.map