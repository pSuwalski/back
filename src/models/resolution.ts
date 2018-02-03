export interface Resolution {
    companyId: string;
    sectionIds: string[];
    year: number;
    number: number;
    paymentCount: number;
    payments: Payment[];
    paymentMoreOneHour: number;
    paymentLessOneHour: number;
    id: string;
    wholeCompany?: boolean;
}

export function emptyResolution(): Resolution {
    return {
        companyId: null, sectionIds: null, year: null, number: null,
        paymentCount: null, payments: [], paymentMoreOneHour: null,
        paymentLessOneHour: null, id: null, wholeCompany: null
    };
}


export interface Payment {
    paymentDate: string;
    paymentPercent: number;
    paymentDone?: boolean;
}

export function emptyPayment() {
    return {
        paymentDate: null,
        paymentPercent: null
    };
}