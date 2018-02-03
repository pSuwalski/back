import { Address } from "./address";
import { Owner } from './owner';
import { Parcel } from './parcel';
import { Resolution } from './resolution';
import * as _ from 'lodash';

export interface Union {
  name: string;
  nip: string;
  email: string;
  phone: string;
  address: Address;
  companies?: Company[];
  lastPayment?: number;
}

export interface FirestoreUnion {
  name: string;
  nip: string;
  email: string;
  phone: string;
  address: Address;
  lastPayment?: number;
}


export interface Company {
  id?: string;
  name: string;
  nip: string;
  email: string;
  phone: string;
  address: Address;
  parcels?: Parcel[];
  leesees?: Owner[];
  resolutions?: Resolution[];
  regon?: string;
}


export function covertToFireStoreUnion(union: Union): FirestoreUnion {
  return _.reduce(_.keys(union), (object, key) => {
    if (key !== 'companies') {
      return _.assign(object, { [key]: union[key] });
    } else {
      return object;
    }
  }, {}) as FirestoreUnion
}

export function sanitizeNip(nip: string): string {
  if (nip) {
    return nip.replace(/\D/, '');
  } else {
    return nip;
  }
}

export const emptyCompany = {
  id: null,
  name: null,
  nip: null,
  email: null,
  phone: null,
  address: null
};
