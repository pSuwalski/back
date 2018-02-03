export interface Address {
  apartment?: string;
  city: string;
  postCode: string;
  streetAndNumber: string;
}

export function emptyAddress(): Address {
  return {
    apartment: null,
    city: null,
    postCode: null,
    streetAndNumber: null
  };
}
