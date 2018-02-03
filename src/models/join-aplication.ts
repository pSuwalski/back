import { User } from './user';
import { Union } from './company';

export interface JoinApplication {
  user: User;
  password: string;
  union: Union;
}

export function createEmptyJoinApplication(): JoinApplication {
  const user: User = {
    name: null,
    phone: null,
    email: null,
    unionName: null,
    unionId: null
  };
  const union: Union = {
    name: null,
    nip: null,
    email: null,
    phone: null,
    address: {
      streetAndNumber: null,
      postCode: null,
      city: null
    },
    companies: [],
  };
  return {
    user,
    union,
    password: null
  };
}



export function acceptJoinApplication() { }

export function applyJoinApplication() { }

export function declineJoinApplication() { }
