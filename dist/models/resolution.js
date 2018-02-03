"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function emptyResolution() {
    return {
        companyId: null, sectionIds: null, year: null, number: null,
        paymentCount: null, payments: [], paymentMoreOneHour: null,
        paymentLessOneHour: null, id: null, wholeCompany: null
    };
}
exports.emptyResolution = emptyResolution;
function emptyPayment() {
    return {
        paymentDate: null,
        paymentPercent: null
    };
}
exports.emptyPayment = emptyPayment;
//# sourceMappingURL=resolution.js.map