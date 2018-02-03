import { ParcelData } from './owner';


export interface Works {
  startedFromDate: string;
  finishedDate: string;
  protocolNumber: number;
  type: string;
  additionalDesc: string;
  totalCost: number;
  id: string;
  parcelsData: ParcelData[];
}

export function emptyWorks(): Works {
  return {
    startedFromDate: null,
    finishedDate: null,
    protocolNumber: null,
    type: null,
    additionalDesc: null,
    totalCost: null,
    id: null,
    parcelsData: []
  };
}

