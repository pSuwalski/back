import { Cancelation, FinancialRecord, Fee, Payment } from './payments';
import { Address, emptyAddress } from "./address";
import { Resolution } from './resolution';
import { Parcel } from "./parcel";
import * as _ from 'lodash';
import * as db from '../db';

export class Owner {
  type: 'person' | 'company';
  evidenceNumber: number;
  name: string;
  surname?: string;
  pesel?: number;
  address: Address;
  krs?: number;
  nip?: number;
  regon?: number;
  email: string;
  deskPhoneNumber: number;
  cellPhoneNumber: number;
  authData: AuthData[];
  id: string;
  historicSaldo: Saldo; // !
  saldo?: Saldo;
  saldos?: { [key: number]: Saldo };
  parcelsData?: ParcelDataFull[];
  payments?: FinancialRecord[];
  fees?: Fee[];
  notes?: Note[];
}

export interface Note {
  id: string;
  text: string;
  date: string | Date;
}

export function emptyNote(): Note {
  return {
    id: null,
    text: null,
    date: null
  };
}


export interface PersonalData {
  type: 'person' | 'company';
  evidenceNumber: number;
  name: string;
  surname?: string;
  pesel?: number;
  address: Address;
  krs?: number;
  nip?: number;
  regon?: number;
}

export function emptyOwnerPersonal(): PersonalData {
  return {
    evidenceNumber: null, krs: null, name: null, nip: null, pesel: null,
    regon: null, surname: null, type: 'person', address: emptyAddress()
  };
}


export interface ContactData {
  address: Address;
  email: string;
  deskPhoneNumber: number;
  cellPhoneNumber: number;
}

export function emptyOwnerContact(): ContactData {
  return {
    cellPhoneNumber: null, deskPhoneNumber: null, email: null, address: emptyAddress()
  };
}

export interface AuthData {
  name: string;
  surname?: string;
  pesel: number;
  phoneNumber: number;
  email: string;
  correspondenceAddress: Address;
  authScope: string;
  validFrom: string;
  validTill: string;
}


export function emptyOwnerAuth(): AuthData {
  return {
    authScope: null, correspondenceAddress: emptyAddress(), email: null, name: null, surname: null, pesel: null,
    phoneNumber: null, validFrom: null, validTill: null
  };
}


export interface Saldo {
  capital: number;
  interest: number;
  costs: number;
  untilDate?: string;
}

export function emptySaldo(): Saldo {
  return {
    capital: 0,
    interest: 0,
    costs: 0
  };
}

export interface ParcelData {
  companyId?: string;
  sectionId?: string;
  id: string;
}

export interface ParcelDataFull extends ParcelData {
  percent: number;
  from: string;
  to: string;
  saldos: { [key: number]: Saldo };
  area?: number;
  number?: number;
  cityId?: string;
}

export function emptyParcelData(): ParcelData {
  return {
    id: null
  };
}

export function emptyParcelDataFull(): ParcelDataFull {
  return {
    id: null,
    percent: null,
    sectionId: null,
    companyId: null,
    from: null,
    to: null,
    saldos: {}
  };
}





export async function calculateOwnerSaldos(owner: Owner, unionId: string) { // resolutions as an input
  owner.fees = owner.fees ? owner.fees : [];
  owner.saldos = owner.saldos ? owner.saldos : {};
  const resolutionsRef = await db.db.collection('unions').doc(unionId).collection('resolutions').get();
  const resolutions: Resolution[] = resolutionsRef.empty ? [] : resolutionsRef.docs.map((p) => p.data() as Resolution);
  const parcels: Parcel[] = [];
  for (let i = 0; i < owner.parcelsData.length; i++) {
    const pd = owner.parcelsData[i]
    const ref = await db.db.doc('unions/' + unionId + '/parcels/' + pd.id).get();
    if (ref.exists) {
      const parcel = ref.data() as Parcel;
      pd.number = parcel.number;
      pd.cityId = parcel.cityId;
      parcels.push(parcel);
    }
  }
  resolutions.forEach((r) => {
    const ownerParcels = owner.parcelsData.filter(
      r.wholeCompany ?
        ((pd) => pd.companyId === r.companyId) :
        ((pd) => pd.companyId === r.companyId && (_ as any).contains(r.sectionIds, pd.sectionId))
    );
    ownerParcels.forEach((p) => {
      const matchingParcel = parcels.find((parcel) => parcel.id === p.id);
      if (matchingParcel) {
        if (matchingParcel.foremanDecisions) {
          matchingParcel.foremanDecisions.forEach((fd) => {
            const fee: Fee = {
              value: fd.decisionNumber,
              type: 'fee',
              parcelId: p.id,
              id: Math.random().toString(36).substr(2, 5),
              date: fd.decisionDate,
              forYear: new Date(fd.decisionDate).getFullYear(),
              intrests: 0,
              cause: `obciążenie według decyzji starosty ${fd.decisionNumber} na rok ${new Date(fd.decisionDate).getFullYear()}`
            };
            if (owner.fees) {
              owner.fees.push(fee);
            } else {
              owner.fees = [fee];
            }
          })
        }
        p.area = matchingParcel ? matchingParcel.areaSurface : 0;
        if (r.year >= new Date(p.from).getFullYear()) {
          r.payments.forEach((payment, i) => {
            console.log('paymentpaymentpayment ', r.paymentMoreOneHour, 'surfacesurface ', matchingParcel.areaSurface);
            const fee: Fee = {
              value: p.percent * p.area > 1 ? r.paymentMoreOneHour * p.percent / 100 * p.area : r.paymentLessOneHour,
              type: 'fee',
              parcelId: p.id,
              id: Math.random().toString(36).substr(2, 5),
              date: payment.paymentDate,
              forYear: r.year,
              intrests: 0,
              cause: `obciążenie ${i + 1} według uchawały ${r.number} na rok ${r.year}`
            };
            console.log('feeeee value', r.paymentMoreOneHour * p.percent / 100 * p.area, r.paymentLessOneHour)
            if (owner.fees) {
              owner.fees.push(fee);
            } else {
              owner.fees = [fee];
            }
          });
        }
      }
    });
  });



  const addtionalCostsPayments = _.groupBy(_.cloneDeep(
    owner.payments.filter((p) => p.type === 'payment' && (p as Payment).for === 'costs')
  ), (ac) => ac.forYear);

  const addtionalCostsCancelations = _.groupBy(_.cloneDeep(
    owner.payments.filter((p) => p.type === 'cancelation' && (p as Cancelation).for === 'costs')
  ), (ac) => ac.forYear);

  const groupedAdditionalCosts = _.groupBy(owner.payments.filter((p) => p.type === 'additionalCosts'), (ac) => ac.forYear);
  _.keys(groupedAdditionalCosts).forEach((k) => {
    let addtionalCostsPaymentsSum = (addtionalCostsPayments[k] ? addtionalCostsPayments[k] : []).reduce((acc, v) => acc + v.value, 0);
    let addtionalCostsCancelationsSum = (addtionalCostsCancelations[k] ? addtionalCostsCancelations[k] : []).reduce((acc, v) => acc + v.value, 0);
    const additionalCosts = groupedAdditionalCosts[k];
    additionalCosts.forEach((ac) => {
      ac.value -= addtionalCostsCancelationsSum;
      addtionalCostsCancelationsSum = ac.value < 0 ? - ac.value : 0;
      if (addtionalCostsCancelationsSum) {
        ac.value = 0;
      }
      if (ac.value > 0) {
        ac.value -= addtionalCostsPaymentsSum;
        addtionalCostsPaymentsSum = ac.value < 0 ? - ac.value : 0;
        if (addtionalCostsPaymentsSum) {
          ac.value = 0;
        }
        if (ac.value > 0) {
          owner.saldos[k] = owner.saldos[k] ? owner.saldos[k] : { costs: 0, capital: 0, interest: 0 };
          owner.saldos[k].costs -= ac.value;
        }
      }
    });
    owner.saldos[k] = owner.saldos[k] ? owner.saldos[k] : { costs: 0, capital: 0, interest: 0 };
    owner.saldos[k].costs += addtionalCostsPaymentsSum;
    owner.saldos[k].costs += addtionalCostsCancelationsSum;
  });

  owner.parcelsData.forEach((pd) => {
    const payments = owner.payments.filter((p) => p.type === 'payment' && (p as Payment).parcelId === pd.id);
    const cancelations = owner.payments.filter((p) => p.type === 'cancelation' && (p as Cancelation).parcelId === pd.id);
    const fees = owner.fees.filter((f) => f.parcelId === pd.id);
    calculateParcelSaldos(fees, payments as Payment[], cancelations as Cancelation[], pd, owner);
  });
}



export function calculateParcelSaldos(fs: Fee[], ps: Payment[], cs: Cancelation[], parcel: ParcelDataFull, owner: Owner) {
  const fees: { [key: number]: Fee[] } = _.groupBy(fs, (f) => f.forYear);
  const payments: { [key: number]: Payment[] } = _.cloneDeep(_.groupBy(ps, (p) => p.forYear));
  const cancelations: { [key: number]: Cancelation[] } = _.cloneDeep(_.groupBy(cs, (c) => c.forYear));
  let leftovers = 0;
  _.keys(fees).forEach((k) => {
    const financialRecords = [];
    financialRecords.concat(fees[k]).concat(payments[k] ? payments[k] : []).concat(cancelations[k] ? cancelations[k] : []);
    let cancelationsSum = (cancelations[k] ? cancelations[k] : [])
      .filter((c) => c.for === 'capital')
      .reduce((acc, v) => acc += v.value, 0);
    let interetsCancelationsSum = (cancelations[k] ? cancelations[k] : [])
      .filter((c) => c.for === 'interests')
      .reduce((acc, v) => acc += v.value, 0);
    let everythingCancelationsSum = (cancelations[k] ? cancelations[k] : [])
      .filter((c) => c.for === 'everything')
      .reduce((acc, v) => acc += v.value, 0);
    fees[k].forEach((f) => {
      parcel.saldos[k] = parcel.saldos[k] ? parcel.saldos[k] : { interest: 0, costs: 0, capital: 0 }
      const firstValue = f.value;
      let lastPaymentDate;
      if (cancelationsSum) {
        f.value -= cancelationsSum;
        cancelationsSum = f.value < 0 ? - f.value : 0;
        if (cancelationsSum) {
          f.value = 0;
        }
      }
      if (everythingCancelationsSum) {
        f.value -= everythingCancelationsSum;
        everythingCancelationsSum = f.value < 0 ? - f.value : 0;
        if (everythingCancelationsSum) {
          f.value = 0;
        }
      }
      if (leftovers) {
        f.value -= leftovers;
        leftovers = f.value < 0 ? - f.value : 0;
        if (leftovers) {
          f.value = 0;
        }
      }
      if (payments[k] && f.value) {
        payments[k].sort((a, b) => new Date(a.date).getTime() - new Date(a.date).getTime()).forEach((p, pi) => {

          if (f.value > 0) {
            const timeDifference = Math.floor(
              (new Date(p.date).getTime() - new Date(f.date).getTime()) / (1000 * 60 * 60 * 24)
            )
            if (timeDifference > 0) {
              parcel.saldos[k].interest = parcel.saldos[k].interest ?
                parcel.saldos[k].interest - getIntrests(timeDifference, new Date(f.date).getTime(), f.value) :
                - getIntrests(timeDifference, new Date(f.date).getTime(), firstValue);
            }
            f.value -= p.value;
            p.value = f.value < 0 ? - f.value : 0;
            if (p.value) {
              f.value = 0;
              leftovers += p.value;
            }
            lastPaymentDate = p.date;
          }
        });
      }
      f.value -= everythingCancelationsSum;
      everythingCancelationsSum = f.value < 0 ? - f.value : 0;
      if (everythingCancelationsSum) {
        f.value = 0;
      }
      if (f.value > 0) {
        parcel.saldos[k] = parcel.saldos[k] ? parcel.saldos[k] : { capital: 0, interest: 0, costs: 0 };
        parcel.saldos[k].capital = parcel.saldos[k].capital ? parcel.saldos[k].capital - f.value : -f.value;
        const timeDifference = (Date.now() - new Date(lastPaymentDate ? lastPaymentDate : f.date).getTime()) / (1000 * 60 * 60 * 24);
        let intrests = getIntrests(timeDifference, new Date(f.date).getTime(), f.value);
        intrests -= interetsCancelationsSum;
        interetsCancelationsSum = intrests < 0 ? - intrests : 0;
        if (interetsCancelationsSum) {
          intrests = 0;
        }
        intrests -= everythingCancelationsSum;
        everythingCancelationsSum = intrests < 0 ? - intrests : 0;
        if (everythingCancelationsSum) {
          intrests = 0;
        }
        f.intrests = intrests;
        parcel.saldos[k].interest = parcel.saldos[k].interest ?
          parcel.saldos[k].interest - intrests : -intrests;
      }
    });
    // if (parcel.saldos[k].interest && interetsCancelationsSum) {
    //   parcel.saldos[k].interest -= interetsCancelationsSum;
    //   interetsCancelationsSum = parcel.saldos[k].interest < 0 ? - parcel.saldos[k].interest : 0;
    //   if (interetsCancelationsSum) {
    //     parcel.saldos[k].interest = 0;
    //   }
    // }
    // if (parcel.saldos[k].interest && interetsCancelationsSum) {
    //   parcel.saldos[k].interest -= everythingCancelationsSum;
    //   everythingCancelationsSum = parcel.saldos[k].interest < 0 ? - parcel.saldos[k].interest : 0;
    //   if (everythingCancelationsSum) {
    //     parcel.saldos[k].interest = 0;
    //   }
    // }
    parcel.saldos[k].capital = parcel.saldos[k].capital + everythingCancelationsSum + cancelationsSum;
    owner.saldos[k] = owner.saldos[k] ? owner.saldos[k] : { capital: 0, interest: 0, costs: 0 }
    owner.saldos[k].capital = owner.saldos[k].capital ? owner.saldos[k].capital + parcel.saldos[k].capital : parcel.saldos[k].capital;
    owner.saldos[k].interest = owner.saldos[k].interest ?
      owner.saldos[k].interest + parcel.saldos[k].interest :
      parcel.saldos[k].interest;
    for (let i = 0; i < 3; i++) {
      if (leftovers > 0) {
        leftovers = leftoversToSaldo(owner.saldos[k], leftovers);
      }
    }
    if (leftovers > 0) {
      owner.saldos[k].capital += leftovers;
      leftovers = 0;
    }
  });
}

export function leftoversToSaldo(saldo: Saldo, leftovers: number): number {
  if (saldo.capital <= saldo.interest && saldo.capital <= saldo.costs && saldo.capital < 0) {
    saldo.capital += leftovers;
    if (saldo.capital > 0) {
      leftovers = saldo.capital;
      saldo.capital = 0;
    } else {
      leftovers = 0;
    }
  }
  if (saldo.interest <= saldo.capital && saldo.interest <= saldo.costs && saldo.interest < 0) {
    console.log('saldo.interest', saldo.interest, 'leftovers', leftovers);
    saldo.interest += leftovers;
    if (saldo.interest > 0) {
      leftovers = saldo.interest;
      saldo.interest = 0;
    } else {
      leftovers = 0;
    }
    console.log('saldo.interest', saldo.interest, 'leftovers', leftovers);
  }
  if (saldo.costs <= saldo.interest && saldo.costs <= saldo.capital && saldo.costs < 0) {
    saldo.costs += leftovers;
    if (saldo.costs > 0) {
      leftovers = saldo.costs;
      saldo.costs = 0;
    } else {
      leftovers = 0;
    }
  }
  return leftovers;
}




export function getIntrests(days: number, date: number, value: number) {
  if (date >= new Date('01-01-2016').getTime()) {
    return Math.floor(value * 0.07 * days / 365 * 100) / 100;
  } else if (date >= new Date('12-23-2014').getTime()) {
    return Math.floor(value * 0.08 * days / 365 * 100) / 100;
  } else if (date > new Date('12-15-2008').getTime()) {
    return Math.floor(value * 0.13 * days / 365 * 100) / 100;
  } else if (date > new Date('10-15-2005').getTime()) {
    return Math.floor(value * 0.115 * days / 365 * 100) / 100;
  } else if (date > new Date('01-10-2005').getTime()) {
    return Math.floor(value * 0.135 * days / 365 * 100) / 100;
  } else if (date > new Date('09-25-2003').getTime()) {
    return Math.floor(value * 0.125 * days / 365 * 100) / 100;
  } else if (date > new Date('02-01-2003').getTime()) {
    return Math.floor(value * 0.13 * days / 365 * 100) / 100;
  } else if (date > new Date('07-25-2002').getTime()) {
    return Math.floor(value * 0.16 * days / 365 * 100) / 100;
  } else {
    return Math.floor(value * 0.16 * days / 365 * 100) / 100;
  }
}