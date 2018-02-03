"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createEmptyJoinApplication() {
    const user = {
        name: null,
        phone: null,
        email: null,
        unionName: null,
        unionId: null
    };
    const union = {
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
exports.createEmptyJoinApplication = createEmptyJoinApplication;
function acceptJoinApplication() { }
exports.acceptJoinApplication = acceptJoinApplication;
function applyJoinApplication() { }
exports.applyJoinApplication = applyJoinApplication;
function declineJoinApplication() { }
exports.declineJoinApplication = declineJoinApplication;
//# sourceMappingURL=join-aplication.js.map