"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
function covertToFireStoreUnion(union) {
    return _.reduce(_.keys(union), (object, key) => {
        if (key !== 'companies') {
            return _.assign(object, { [key]: union[key] });
        }
        else {
            return object;
        }
    }, {});
}
exports.covertToFireStoreUnion = covertToFireStoreUnion;
function sanitizeNip(nip) {
    if (nip) {
        return nip.replace(/\D/, '');
    }
    else {
        return nip;
    }
}
exports.sanitizeNip = sanitizeNip;
exports.emptyCompany = {
    id: null,
    name: null,
    nip: null,
    email: null,
    phone: null,
    address: null
};
//# sourceMappingURL=company.js.map