"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function emptyCancelation() {
    return {
        id: null,
        value: null,
        type: null,
        for: null,
        date: null,
        reason: null,
        forYear: null,
        parcelId: null
    };
}
exports.emptyCancelation = emptyCancelation;
function emptyPayment() {
    return {
        id: null,
        value: null,
        type: null,
        for: null,
        date: null,
        from: null,
        forYear: null,
        parcelId: null
    };
}
exports.emptyPayment = emptyPayment;
function emptyAdditionalCosts() {
    return {
        id: null,
        value: null,
        type: null,
        forYear: null,
        date: null,
        cause: null
    };
}
exports.emptyAdditionalCosts = emptyAdditionalCosts;
//# sourceMappingURL=payments.js.map