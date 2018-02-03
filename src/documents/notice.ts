import { Saldo, Owner } from '../models/owner';
import { Union, Company } from '../models/company';
import * as admin from 'firebase-admin';
import { InputStampAuth } from '../graphql/resolvers';
import { Fee, AdditionalCosts } from '../models/payments';
import { Resolution } from '../models/resolution';

var pdf = require('html-pdf');


export async function generateNoticePaper(id: string, union: Union, company: Company, owner: Owner, resolution: Resolution, stampAuth: InputStampAuth, area: number, accountName: string, address: string, bankAccount: string, title: string, status: string): Promise<string> {
  console.log(1, arguments);
  owner.fees.forEach((f) => console.log(f.cause, `uchawały ${resolution.number} na rok ${resolution.year}`, f.cause.indexOf(`uchawały ${resolution.number} na rok ${resolution.year}`) !== -1, f));
  const fileDirectory = `./zawiadomienie-${id}.pdf`;
  let resolve;
  const promise = new Promise<string>((res, rej) => {
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
        padding: 12px 8px;
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
      }
  
      .table-left-big {
        width: 77%;
        border: solid 1px #000000;
        margin-top: -1px;
        padding: 4px;
        text-align: left;
      }
  
      .table-right-small {
        width: 17%;
        border: solid 1px #000000;
        margin-top: -1px;
        margin-left: -1px;
        padding: 4px;
      }
  
      .table-left-small {
        width: 22%;
        border: solid 1px #000000;
        margin-top: -1px;
        padding: 4px;
        text-align: left;
      }
  
      .table-right-big {
        width: 72%;
        border: solid 1px #000000;
        margin-top: -1px;
        margin-left: -1px;
        padding: 4px;
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

      table {
        border: solid 1px #000000;
      }

    </style>
  </head>
  
  <body>
    <div class="column left-column">
      <div class="mini-header" style="padding-right: 30px; color: white;">_</div>
      <div>${owner.name + ' ' + owner.surname}</div>
      <div>${owner.address.streetAndNumber}</div>
      <div>${owner.address.city + ' ' + owner.address.postCode}</div>
      <div>${owner.id}</div>
    </div>
    <div class="column right-column">
      <div class="pieczatka" style="margin-top: 12px;">
        <div class="pieczatka-signature top" style="text-align: center; margin-bottom: 14px;">${new Date().getDate()}.${new Date().getMonth() + 1}.${new Date().getFullYear()} ${company.address.city}</div>
        <div class="pieczatka-title" style="padding: 2px 8px 10px;">PIECZĄTKA SW</div>
      </div>
    </div>
    <div class="title">Zawiadomienie o naliczeniu</div>
    <div class="policy">
      Na podstawie art. 170 ust. 1 i art. 171 ust. 1 Ustawy Prawo Wodne z dnia 18 lipca 2001r. ( Dz. U. nr 115, poz. 1229 z późniejszymi
      zmianami) oraz na podstawie Statutu ${status}. i uchwały Walnego Zgromadzenia zatwierdzonych decyzją Starosty,
      ZAWIADAMIAMY o naliczeniu
    </div>
    <div class="date">Prosimy o wpłatę, na podstawie poniższego zestawienia, do dnia ${new Date().getDate()}.${new Date().getMonth() + 1}.${new Date().getFullYear()}</div>
    <div class="table-container">
      <div class="table">
        <div class="column table-left-big">Uchwalona stawka za 1 hektar</div>
        <div class="table-right-small column">${resolution.paymentMoreOneHour}</div>
        <div class="column table-left-big">Uchwalona stała stawka poniżej 1 hektara</div>
        <div class="table-right-small column">${resolution.paymentLessOneHour}</div>
        <div class="column table-left-big">Obszar uwzględniany do naliczeń </div>
        <div class="table-right-small column">${area}</div>
        <div class="column table-left-big">Wymagana opłata za rok bieżący </div>
        <div class="table-right-small column">${owner.fees.filter((f) => f.cause.indexOf(`uchawały ${resolution.number} na rok ${resolution.year}`) !== -1).reduce((acc, v) => { acc += v.value; return acc; }, 0)}</div>
      </div>
    </div>
  
  
    <div class="table-container">
      <div class="table-title">Zaległości</div>  
      <table class="table">
      <tr>  
        <th class="column table-left-half">Rok wystawienia</th>
        <th class="column table-left-half">Termin wymagalności</th>
        <th class="column table-left-quarter">Kapitał</th>
        <th class="column table-left-quarter">Odsetki</th>
        <th class="column table-left-quarter">Koszty</th>
        <th class="column table-left-quarter">Suma</th>
      </tr>
        ${generateRows(owner.fees.filter((f) => f.cause.indexOf(`uchawały ${resolution.number} na rok ${resolution.year}`) === -1), ((owner.payments ? owner.payments : []).filter((p) => p.type === 'additionalCosts') as AdditionalCosts[]))}   
      </table>
    </div>
  
    <div style="height: (74 + 116 + 24 + 106) - 24 * ${Math.max(owner.fees.length + (owner.payments ? owner.payments : []).length - 5, 0)} px"></div>
    <div class="policy">
      W przypadku płatności przelewem proszę w tytule wpisać Imię, nazwisko i adres osoby, na ktorą wystawione było zawiadomienie.
      Dane do przelewu znajdują się poniżej.
    </div>
    <div class="table-container" style="margin-bottom: 24px;">
      <div class="table">
        <div class="column table-left-small">Nazwa</div>
        <div class="table-right-big column">${accountName}</div>
        <div class="column table-left-small">Adres</div>
        <div class="table-right-big column">${address}</div>
        <div class="column table-left-small">Numer konta</div>
        <div class="table-right-big column">${bankAccount}</div>
        <div class="column table-left-small">Tytuł przelewu</div>
        <div class="table-right-big column">${title}</div>
      </div>
    </div>
    <div class="column left-column">
      <div class="mini-header" style="padding-right: 30px; color: white;">_</div>
      <div>${company.name}</div>
      <div>${company.address.streetAndNumber}</div>
      <div>${company.address.city + ' ' + company.address.postCode}</div>
      <div>${company.nip + ' ' + company.regon ? company.regon : ''}</div>
      ${company.phone ? '<div>Numer telefonu: ' + company.phone + '</div>' : ''}
      <div>E-mail: ${company.email}</div>
    </div>
    <div class="column right-column">
      <div class="pieczatka">
        <div class="pieczatka-signature top" style="color: white;">_</div>
        <div class="pieczatka-title">PIECZĄTKA IMIENNA I PODPIS</div>
        <div class="pieczatka-signature bottom">${stampAuth.name + ' ' + stampAuth.surname + ' ' + stampAuth.position}</div>
      </div>
    </div>
  </body>
  
  </html>
  `;


  pdf.create(html).toFile(fileDirectory, async (err, res) => {
    console.log(res)
    await admin.storage().bucket("melior-wc.appspot.com").upload(fileDirectory);
    resolve(`zawiadomienie-${id}.pdf`);
  });

  return promise;
}



export function generateRows(fees: Fee[], additionalCosts: AdditionalCosts[]): string {
  let allFees = [].concat(fees).concat(additionalCosts);
  const lessThanThreeYears = allFees.filter((f) => 3 <= new Date().getFullYear() - f.forYear);
  let sum = 0;
  lessThanThreeYears.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const feesHtml = allFees.map((f) => {
    sum += f.value + (f.type === 'fee' ? f.intrests : 0);
    return f.value + (f.type === 'fee' ? f.intrests : 0) ? `
    <tr>
    <td class="column table-left-half">${f.forYear}</td>
  <td class="column table-left-half">${new Date(f.date).getDate()}.${(new Date(f.date).getMonth() + 1)}.${new Date(f.date).getFullYear()}</div>
  <td class="column table-left-quarter">${f.type === 'fee' ? f.value : 0} </td>
  <td class="column table-left-quarter" > ${f.type === 'fee' ? f.intrests : 0} </td>
  <td class="column table-left-quarter" > ${f.type === 'fee' ? 0 : f.value} </td>
  <td class="column table-left-quarter" > ${ f.value + (f.type === 'fee' ? f.intrests : 0)} </td>
  </tr>` : '';
  }).join('');
  const moreThanThreeYearsSum: Saldo = allFees.filter((f) => 3 > new Date().getFullYear() - f.forYear).reduce((acc, v) => {
    if (v.type === 'fee') {
      acc.capital += v.value;
      acc.interest += v.intrests;
      sum += v.value + v.intrests;
    } else {
      sum += v.value;
      acc.costs += v.value;
    }
    return acc;
  }, { interest: 0, costs: 0, capital: 0 });
  const moreThanThreeYearsSumHtml = `
    <tr>
      <td class="column table-left-half">Suma starszych niż 3 lata</td>
      <td class="column table-left-half">-</div>
      <td class="column table-left-quarter">${moreThanThreeYearsSum.capital} </td>
      <td class="column table-left-quarter" > ${moreThanThreeYearsSum.interest} </td>
      <td class="column table-left-quarter" > ${moreThanThreeYearsSum.costs} </td>
      <td class="column table-left-quarter" > ${moreThanThreeYearsSum.capital + moreThanThreeYearsSum.interest + moreThanThreeYearsSum.costs} </td>
    </tr>
  `
  const sumHtml = `
  <tr>
    <td class="column table-left-half" style="width: 74.5%">Do zapłaty w sumie</td>
    <td class="column table-left-half" style="width: 74.5%"> &nbsp; </td>
    <td class="column table-left-half" style="width: 19.5%;"> &nbsp; </td>
    <td class="column table-left-half" style="width: 19.5%;"> &nbsp; </td>
    <td class="column table-left-half" style="width: 19.5%;"> &nbsp; </td>
    <td class="column table-left-quarter" style="width: 19.5%;">${Math.floor(sum * 100) / 100}</td>
  </tr>
  `
  return feesHtml + moreThanThreeYearsSumHtml + sumHtml;
}