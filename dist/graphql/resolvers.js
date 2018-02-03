"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const db = require("../db");
const company_1 = require("../models/company");
const mail_1 = require("../mail");
const owner_1 = require("../models/owner");
const authPaper = require("../documents/auth-paper");
const paymentPaper = require("../documents/payment-paper");
const callPaper = require("../documents/call-paper");
const noticePaper = require("../documents/notice");
// function allowAdmin(u: user.User) {
//   // if (process.env.DEV) { return };
//   user.hasToBeAdmin(u);
// };
const resolvers = {
    Mutation: {
        acceptJoinApplication(root, { unionId }, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const refrence = yield db.getDocument(`joinApplications/${unionId}`);
                if (!refrence || !refrence.exists) {
                    throw new Error('aplication doesnt exist');
                }
                else {
                    const promises = [];
                    const joinApplication = refrence.data();
                    joinApplication.union.nip = company_1.sanitizeNip(joinApplication.union.nip);
                    joinApplication.user.unionId = company_1.sanitizeNip(joinApplication.union.nip);
                    const user = yield db.createUser(joinApplication.user.email, joinApplication.password, joinApplication.user.name);
                    if (!user.uid) {
                        throw new Error('user creation failed');
                    }
                    const userRecord = _.assign(joinApplication.user, { id: user.uid, role: 'companyAdmin' });
                    promises.push(db.add(`users/${user.uid}`, userRecord));
                    const union = _.cloneDeep(_.assign(joinApplication.union, { lastPayment: Date.now() - 1000 * 60 * 60 * 24 * 335 }));
                    delete union.companies;
                    promises.push(db.add(`unions/${union.nip}`, union));
                    joinApplication.union.companies.forEach((c) => {
                        const id = db.generateKey();
                        promises.push(db.add(`unions/${union.nip}/companies/${id}`, _.assign(c, { id })));
                    });
                    yield mail_1.sendWelcomeEmail(user.email);
                    // TODO send email to user if doesn't exist send to admin
                    promises.push(db.removeDocument(`joinApplications/${union.nip}`));
                    return yield Promise.all(promises).then(() => { return "ok"; }).catch((e) => { throw new Error(e); });
                }
            });
        },
        addResolution(root, { unionId, resolutionId }, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const resolution = (yield db.getDocument(`unions/${unionId}/resolutions/${resolutionId}`)).data();
                const union = (yield db.getDocument(`unions/${unionId}`)).data();
                if (!union) {
                    throw new Error('union doesnt exist');
                }
                if (!resolution) {
                    throw new Error('selected resolution doesnt exist');
                }
                if ((new Date(resolution.payments[0].paymentDate)).getTime() > Date.now()) {
                    return;
                }
                let parcels = [];
                if (resolution.wholeCompany) {
                    (yield db.db.collection('unions').doc(unionId).collection('parcels').where('companyId', '==', resolution.companyId).get()).docs.forEach((parcel) => {
                        parcels.push(parcel.data());
                    });
                }
                else {
                    resolution.sectionIds.forEach((sid) => __awaiter(this, void 0, void 0, function* () {
                        (yield db.db.collection('unions').doc(unionId).collection('parcels').where('sectionId', '==', sid).get()).docs.forEach((parcel) => {
                            if (parcel.exists) {
                                parcels.push(parcel.data());
                            }
                        });
                    }));
                }
                if (!parcels || parcels.length < 1) {
                    throw new Error('there are no parcels for that resolution');
                }
                const parcelIds = parcels.map((p) => p.id);
                const owners = [];
                (yield db.db.collection('unions').doc(unionId).collection('owners').get()).docs.forEach((o) => {
                    const owner = o.data();
                    if (owner) {
                        owner.parcelsData.forEach((pd) => {
                            if (_.includes(parcelIds, pd.id)) {
                                const parcel = _.find(parcels, (p) => pd.id === p.id);
                                resolution.payments.forEach((p) => {
                                    if (new Date(owner.historicSaldo.untilDate).getTime() < new Date(p.paymentDate).getTime() && new Date(owner.historicSaldo.untilDate).getTime() < Date.now()) {
                                        owner.saldo.capital = owner.saldo.capital + pd.percent * (parcel.areaSurface > 1 ? resolution.paymentMoreOneHour : resolution.paymentMoreOneHour);
                                    }
                                });
                                owners.push(owner);
                            }
                        });
                    }
                });
                owners.forEach((o) => db.db.doc(`unions/${unionId}/owners/${o.id}`).update(omitNotDefined(o)));
                resolution.payments.forEach((p) => {
                    if (new Date(p.paymentDate).getTime() < Date.now()) {
                        p.paymentDone = true;
                    }
                });
                yield db.db.doc(`unions/${unionId}/resolution/${resolutionId}`).update(resolution);
                return 'ok';
            });
        },
        addWorksDone(root, { unionId, worksDoneId }, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const worksDone = (yield db.getDocument(`unions/${unionId}/works/${worksDoneId}`)).data();
                if (!worksDone) {
                    throw new Error('there are no works done with that id');
                }
                const parcels = [];
                worksDone.parcelsData.forEach((pd) => __awaiter(this, void 0, void 0, function* () { return parcels.push((yield db.db.doc(`unions/${unionId}/parcels/${pd.id}`).get()).data()); }));
                const parcelIds = parcels.map((p) => p.id);
                const owners = [];
                (yield db.db.collection('unions').doc(unionId).collection('owners').get()).docs.forEach((o) => {
                    const owner = o.data();
                    let modified = false;
                    if (owner) {
                        owner.parcelsData.forEach((pd) => {
                            if (_.includes(parcelIds, pd.id)) {
                                owner.saldo.costs = owner.saldo.costs + pd.percent * worksDone.totalCost / worksDone.parcelsData.length;
                                modified = true;
                            }
                        });
                    }
                    if (modified) {
                        owners.push(owner);
                    }
                });
                owners.forEach((o) => __awaiter(this, void 0, void 0, function* () { return yield db.db.doc(`unions/${unionId}/owners/${o.id}`).update(omitNotDefined(o)); }));
                return 'ok';
            });
        },
        applyJoinApplication(root, { user, union, password }, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const joinApplication = { user: omitNotDefined(user), union: omitNotDefined(union), password };
                const applicationRefrence = yield db.getDocument(`joinApplications/${company_1.sanitizeNip(union.nip)}`);
                if (applicationRefrence && applicationRefrence.exists) {
                    console.log(applicationRefrence.data());
                    throw new Error('aplication already added');
                }
                const companyRefrence = yield db.getDocument(`joinApplications/${company_1.sanitizeNip(union.nip)}`);
                if (companyRefrence && companyRefrence.exists) {
                    console.log(companyRefrence.data());
                    throw new Error('aplication already added');
                }
                yield db.add(`joinApplications/${company_1.sanitizeNip(union.nip)}`, joinApplication);
                return "ok";
            });
        },
        declineJoinApplication(root, { unionId }, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const refrence = yield db.getDocument(`joinApplications/${unionId}`);
                if (!refrence || !refrence.exists) {
                    throw new Error(`aplication doesn't exist`);
                }
                else {
                    yield db.removeDocument(`joinApplications/${unionId}`);
                    // await sendDeclineEmail(refrence.data().user.email);  check if sending decline email is really needed
                    return "ok";
                }
            });
        },
        removeParcel(root, { unionId, parcelId }, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const owners = (yield db.db.collection('unions').doc(unionId).collection('owners').get()).docs.map((d) => d.data()).filter((o) => _.includes(o.parcelsData.map((pd) => pd.id), parcelId));
                const parcel = (yield db.db.collection('unions').doc(unionId).collection('parcels').doc(parcelId).get()).data();
                const resolutions = (yield db.db.collection('unions').doc(unionId).collection('resolutions').get()).docs.map((d) => d.data());
                resolutions.filter((r) => (r) &&
                    ((r.companyId === parcel.companyId && r.wholeCompany)
                        ||
                            (r.companyId === parcel.companyId && _.includes(r.sectionIds, parcel.sectionId))));
                resolutions.forEach((r) => {
                    r.payments.forEach((p) => {
                        owners.forEach((o) => {
                            if (dateStringToNumber(p.paymentDate) < Date.now() && dateStringToNumber(p.paymentDate) > dateStringToNumber(o.historicSaldo.untilDate)) {
                                const parcelData = o.parcelsData.find((pd) => pd.id === parcelId);
                                if (parcelData) {
                                    o.saldo.capital = o.saldo.capital + parcelData.percent * p.paymentPercent * (parcel.areaSurface > 1 ? r.paymentMoreOneHour : r.paymentLessOneHour);
                                }
                            }
                        });
                    });
                });
                owners.forEach((o) => __awaiter(this, void 0, void 0, function* () { return yield db.db.collection('unions').doc(unionId).collection('owners').doc(o.id).update(o); }));
                yield db.db.collection('unions').doc(unionId).collection('parcels').doc(parcel.id).delete();
                return 'ok';
            });
        },
        // async removeSection(root: any, { unionId, companyId, sectionId }: { unionId: string, sectionId: string, companyId: string }, context: any) {
        //   await db.db.collection('unions').doc(unionId).collection('companies').doc(companyId).collection('sections').doc(sectionId).delete();
        //   return 'ok';
        // },
        removeWorksDone(root, { unionId, worksDoneId }, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const worksDone = (yield db.getDocument(`unions/${unionId}/works/${worksDoneId}`)).data();
                if (!worksDone) {
                    throw new Error('there are no works done with that id');
                }
                const parcels = [];
                worksDone.parcelsData.forEach((pd) => __awaiter(this, void 0, void 0, function* () { return parcels.push((yield db.db.doc(`unions/${unionId}/parcels/${pd.id}`).get()).data()); }));
                const parcelIds = parcels.map((p) => p.id);
                const owners = [];
                (yield db.db.collection('unions').doc(unionId).collection('owners').get()).docs.forEach((o) => __awaiter(this, void 0, void 0, function* () {
                    const owner = o.data();
                    let modified = false;
                    if (owner) {
                        owner.parcelsData.forEach((pd) => {
                            if (_.includes(parcelIds, pd.id)) {
                                owner.saldo.costs = owner.saldo.costs - pd.percent * worksDone.totalCost / worksDone.parcelsData.length;
                                modified = true;
                            }
                        });
                    }
                    if (modified) {
                        owners.push(owner);
                    }
                }));
                owners.forEach((o) => __awaiter(this, void 0, void 0, function* () { return yield db.db.doc(`unions/${unionId}/owners/${o.id}`).update(omitNotDefined(o)); }));
                yield db.db.doc(`unions/${unionId}/works/${worksDoneId}`).delete();
                return 'ok';
            });
        },
        sendMail(root, { email }, context) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(email);
                yield mail_1.sendWelcomeEmail(email);
                return "ok";
            });
        },
        generatePaymentPaper(root, { unionId, ownerId, unionBankAccount, payersBankAccount, amount, payerName, title }, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const union = (yield db.db.collection('unions').doc(unionId).get()).data();
                const id = '-' + Math.random().toString(36).substr(2, 9);
                const paperId = yield paymentPaper.generatePaymentPaper(id, union, unionBankAccount, amount, payersBankAccount, payerName, title);
                const note = {
                    id: paperId,
                    text: 'Wygenerowano polecenie zapłaty',
                    date: new Date()
                };
                yield db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('notes').doc(paperId).set(note);
                yield db.db.collection('unions').doc(unionId).collection('documents').doc(paperId).set({ timestamp: Date.now() });
                return paperId;
            });
        },
        generateNoticePaper(root, { unionId, ownerId, status, resolutionId, stampAuth, accountName, address, bankAccount, title }, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const resolution = (yield db.db.collection('unions').doc(unionId).collection('resolutions').doc(resolutionId).get()).data();
                const company = (yield db.db.collection('unions').doc(unionId).collection('companies').doc(resolution.companyId).get()).data();
                const union = (yield db.db.collection('unions').doc(unionId).get()).data();
                const ownerRef = yield db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).get();
                const paymentsRef = yield db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('payments').get();
                const notesRef = yield db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('notes').get();
                const parcelsDataRef = yield db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('parcels').get();
                const payments = [];
                const notes = [];
                const parcelsData = [];
                if (!paymentsRef.empty) {
                    paymentsRef.docs.forEach((p) => payments.push(p.data()));
                }
                if (!parcelsDataRef.empty) {
                    parcelsDataRef.docs.forEach((p) => parcelsData.push(p.data()));
                }
                if (!notesRef.empty) {
                    notesRef.docs.forEach((n) => notes.push(n.data()));
                }
                if (ownerRef.exists) {
                    const owner = ownerRef.data();
                    owner.payments = payments;
                    owner.notes = notes;
                    owner.parcelsData = parcelsData;
                    const area = owner.parcelsData.filter((pd) => resolution.wholeCompany ? pd.companyId === resolution.companyId : _.includes(resolution.sectionIds, pd.sectionId)).reduce((acc, v) => {
                        acc += v.area ? v.area : 0;
                        return acc;
                    }, 0);
                    yield owner_1.calculateOwnerSaldos(owner, unionId);
                    const id = '-' + Math.random().toString(36).substr(2, 9);
                    const paperId = yield noticePaper.generateNoticePaper(id, union, company, owner, resolution, stampAuth, area, accountName, address, bankAccount, title, status);
                    const note = {
                        id: paperId,
                        text: 'Wygenerowano zawiadomienie o naliczeniu opłaty',
                        date: new Date()
                    };
                    yield db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('notes').doc(paperId).set(note);
                    yield db.db.collection('unions').doc(unionId).collection('documents').doc(paperId).set({ timestamp: Date.now() });
                    return paperId;
                }
                else {
                    throw new Error('owner doesnt exist');
                }
            });
        },
        generateCallPaper(root, { unionId, ownerId, companyId, cashAddress, bankName, bankAccount, contactPhone, contactEmail, stampAuth, status }, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const company = (yield db.db.collection('unions').doc(unionId).collection('companies').doc(companyId).get()).data();
                const union = (yield db.db.collection('unions').doc(unionId).get()).data();
                const ownerRef = yield db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).get();
                const paymentsRef = yield db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('payments').get();
                const notesRef = yield db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('notes').get();
                const parcelsDataRef = yield db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('parcels').get();
                const payments = [];
                const notes = [];
                const parcelsData = [];
                if (!paymentsRef.empty) {
                    paymentsRef.docs.forEach((p) => payments.push(p.data()));
                }
                if (!parcelsDataRef.empty) {
                    parcelsDataRef.docs.forEach((p) => parcelsData.push(p.data()));
                }
                if (!notesRef.empty) {
                    notesRef.docs.forEach((n) => notes.push(n.data()));
                }
                console.log(parcelsData);
                if (ownerRef.exists) {
                    const owner = ownerRef.data();
                    owner.payments = payments;
                    owner.notes = notes;
                    owner.parcelsData = parcelsData;
                    yield owner_1.calculateOwnerSaldos(owner, unionId);
                    const id = '-' + Math.random().toString(36).substr(2, 9);
                    const paperId = yield callPaper.generateCallPaper(id, union, owner, company, cashAddress, bankName, bankAccount, contactPhone, contactEmail, stampAuth, status);
                    const note = {
                        id: paperId,
                        text: 'Wygenerowano wezwanie do zapłaty',
                        date: new Date()
                    };
                    yield db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('notes').doc(paperId).set(note);
                    yield db.db.collection('unions').doc(unionId).collection('documents').doc(paperId).set({ timestamp: Date.now() });
                    return paperId;
                }
                else {
                    throw new Error('owner doesnt exist');
                }
            });
        },
        generateAuthPaper(root, { unionId, authName, authAddress, authPesel, authedPesel, ownerId, authedName, authedSurname }, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const union = (yield db.db.collection('unions').doc(unionId).get()).data();
                const id = '-' + Math.random().toString(36).substr(2, 9);
                const paperId = yield authPaper.generateAuthPaper(id, union, authName, authAddress, authPesel, authedPesel, authedName, authedSurname);
                const note = {
                    id: paperId,
                    text: 'Wygenerowano upowanienie',
                    date: new Date()
                };
                yield db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('notes').doc(paperId).set(note);
                yield db.db.collection('unions').doc(unionId).collection('documents').doc(paperId).set({ timestamp: Date.now() });
                return paperId;
            });
        }
    },
    Query: {
        name() {
            return name;
        }
    }
};
// function djb2Code(str: string): number {
//   let hash = 5381;
//   for (let i = 0; i < str.length; i++) {
//     const char: number = str.charCodeAt(i);
//     hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
//   }
//   return hash;
// }
exports.default = resolvers;
function omitNotDefined(object) {
    return _.omitBy(object, (v) => _.isNull(v) || _.isUndefined(v));
}
exports.omitNotDefined = omitNotDefined;
function dateStringToNumber(dateString, starting) {
    if (dateString) {
        return new Date(dateString).getTime();
    }
    else if (starting) {
        return 0;
    }
    else {
        return 10000000000000;
    }
}
exports.dateStringToNumber = dateStringToNumber;
//# sourceMappingURL=resolvers.js.map