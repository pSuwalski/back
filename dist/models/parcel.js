"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function emptyNumbered() {
    return {
        number: null
    };
}
exports.emptyNumbered = emptyNumbered;
function emptyAppliance() {
    return {
        numbering: null,
        applianceType: null,
        applianceDescription: null,
    };
}
exports.emptyAppliance = emptyAppliance;
function emptyForemanDecision() {
    return {
        decisionNumber: null,
        decisionDate: null
    };
}
exports.emptyForemanDecision = emptyForemanDecision;
function emptyParcel() {
    return {
        companyId: null,
        cityId: null,
        sectionId: null, number: null, areaType: null, areaSurface: null, trenches: [],
        drainages: [], appliances: [], membership: true, membershipActive: true,
        legalBasis: null, SwMembershipStartDate: null, SwMembershipTerminationDate: null,
        foremanDecisions: [], id: null
    };
}
exports.emptyParcel = emptyParcel;
//# sourceMappingURL=parcel.js.map