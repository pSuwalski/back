import { Union } from '../models/company';
import * as admin from 'firebase-admin';

var pdf = require('html-pdf');



export async function generateAuthPaper(id: string, union: Union, authName: string, authAddress: string, authPesel: string, authedPesel: string, authedName: string, authedSurname: string): Promise<string> {
  const fileDirectory = `./upowaznienie-${id}.pdf`;
  let resolve;
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
  })
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
      }
  
      .table-left-half {
        width: 25.5%;
        border: solid 1px #000000;
        margin-top: -1px;
        margin-left: -1px;
        padding: 4px;
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
  
      .bank {
        font-weight: bold;
        text-align: center;
      }
    </style>
  </head>
  
  <body>
    <div class="column left-column">
      <div class="mini-header" style="padding-right: 30px; color: white;">_</div>
      <div class="pieczatka-signature top" style="text-align: right; margin-bottom: 14px; color: white">_</div>
      <div>${authName}</div>
      <div>${authAddress}</div>
      <div>${authPesel}</div>
      <div>Nr. ewidencyjne</div>
    </div>
    <div class="column right-column">
      <div style="margin-top: 12px;">
        <div class="pieczatka-signature top" style="text-align: right; margin-bottom: 14px;">${union.address.city}, ${new Date().getDate()}.${new Date().getMonth() + 1}.${new Date().getFullYear()}.</div>
      </div>
    </div>
    <div class="title">UPOWAŻNIENIE</div>
    <div class="policy">
      Upoważniam - ${authedName} ${authedSurname} - weryfikującego/cej się numerem PESEL ${authedPesel}. do przetwarzania informacji na temat płatności,
      planowanych prac i moich danych osobowych. Upoważnienie obowiązywć będzie do momentu pisemnego wycofania zgody na przetwarzanie.
    </div>
    <div class="table-container">
      <div class="table">
        <div class="column table-left-half" style="width: 91%; text-align: left;">Adres do korespodencji - Proszę wpisać adres osoby upoważnionej jeżeli to na ten adres ma być wysyłana cała korespodencja
          dotycząca płatności.</div>
  
        <div class="column table-left-quarter" style="height: 16px;">Kod</div>
        <div class="column table-left-half" style="height: 16px;">Miast</div>
        <div class="column table-left-half" style="height: 16px;">Ulica i numer</div>
        <div class="column table-left-half" style="height: 16px;">Numer lokalu</div>
  
        <div class="column table-left-quarter" style="height: 16px;"></div>
        <div class="column table-left-half" style="height: 16px;"></div>
        <div class="column table-left-half" style="height: 16px;"></div>
        <div class="column table-left-half" style="height: 16px;"></div>
  
      </div>
    </div>
    <div class="policy" style="margin-bottom: 24px;">
      Zgodnie z obowiązującymi przepisami informujemy, że pomimo upoważnienia, odpowiedzialność za zobowiązania w stosunku do ${union.name} w dalszym ciągu spoczywa na właścicielu nieruchomości.
    </div>
    <div style="text-align: center;">
      <div class="pieczatka" style="margin-right: -2px; vertical-align: top;">
        <div style="padding-bottom: 29px; margin-bottom: 4px; border-bottom: dotted 1px">
          <div class="pieczatka-signature">Podpis właściciela</div>
        </div>
        <div style="padding-bottom: 29px; border-bottom: dotted 1px">
            <div class="pieczatka-signature">Podpis upoważnionego</div>
        </div>
      </div>
      <div class="pieczatka" style="margin-left: -2px">
        <div class="pieczatka-signature top">Imię, nazwisko .....................................</div>
        <div class="pieczatka-title">PIECZĄTKA I PODPIS</div>
        <div class="pieczatka-signature bottom">Stanowisko .........................................</div>
      </div>
    </div>
  </body>
  </html>`;

  pdf.create(html).toFile(fileDirectory, async (err, res) => {
    console.log(res)
    await admin.storage().bucket("melior-wc.appspot.com").upload(fileDirectory);
    resolve(`upowaznienie-${id}.pdf`);
  });

  return promise;
}