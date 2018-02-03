import { Address } from '../models/address';
import * as _ from 'lodash';
import * as db from '../db';
import { User } from '../models/user';
import { Company, sanitizeNip, Union } from '../models/company';
import { JoinApplication } from '../models/join-aplication';
import { sendWelcomeEmail } from '../mail';
import { Resolution } from '../models/resolution';
import { Parcel } from '../models/parcel';
import { Note, Owner, calculateOwnerSaldos } from '../models/owner';
import { Works } from '../models/works';
import * as authPaper from '../documents/auth-paper';
import * as paymentPaper from '../documents/payment-paper';
import * as callPaper from '../documents/call-paper';
import * as noticePaper from '../documents/notice';

// function allowAdmin(u: user.User) {
//   // if (process.env.DEV) { return };
//   user.hasToBeAdmin(u);
// };

const resolvers = {

  Mutation: {
    async acceptJoinApplication(root: any, { unionId }: { unionId: string }, context: any): Promise<string> {
      const refrence = await db.getDocument(`joinApplications/${unionId}`);
      if (!refrence || !refrence.exists) {
        throw new Error('aplication doesnt exist');
      } else {
        const promises: Promise<any>[] = [];
        const joinApplication: JoinApplication = refrence.data();
        joinApplication.union.nip = sanitizeNip(joinApplication.union.nip);
        joinApplication.user.unionId = sanitizeNip(joinApplication.union.nip);
        const user = await db.createUser(joinApplication.user.email, joinApplication.password, joinApplication.user.name);
        if (!user.uid) {
          throw new Error('user creation failed');
        }
        const userRecord: User = _.assign(joinApplication.user, { id: user.uid, role: 'companyAdmin' });
        promises.push(db.add(`users/${user.uid}`, userRecord));
        const union: Union = _.cloneDeep(_.assign(joinApplication.union, { lastPayment: Date.now() - 1000 * 60 * 60 * 24 * 335 }));
        delete union.companies;
        promises.push(db.add(`unions/${union.nip}`, union));
        joinApplication.union.companies.forEach((c) => {
          const id = db.generateKey()
          promises.push(db.add(`unions/${union.nip}/companies/${id}`, _.assign(c, { id })));
        });
        await sendWelcomeEmail(user.email);
        // TODO send email to user if doesn't exist send to admin
        promises.push(db.removeDocument(`joinApplications/${union.nip}`));
        return await Promise.all(promises).then(() => { return "ok" }).catch((e) => { throw new Error(e) });
      }
    },
    async addResolution(root: any, { unionId, resolutionId }: { unionId: string, resolutionId: string }, context: any) {
      const resolution: Resolution = (await db.getDocument(`unions/${unionId}/resolutions/${resolutionId}`)).data();
      const union: Union = (await db.getDocument(`unions/${unionId}`)).data();
      if (!union) {
        throw new Error('union doesnt exist');
      }
      if (!resolution) {
        throw new Error('selected resolution doesnt exist');
      }
      if ((new Date(resolution.payments[0].paymentDate)).getTime() > Date.now()) {
        return
      }
      let parcels: Parcel[] = [];
      if (resolution.wholeCompany) {
        (await db.db.collection('unions').doc(unionId).collection('parcels').where('companyId', '==', resolution.companyId).get()).docs.forEach((parcel) => {
          parcels.push(parcel.data() as Parcel);
        });
      } else {
        resolution.sectionIds.forEach(async (sid) => {
          (await db.db.collection('unions').doc(unionId).collection('parcels').where('sectionId', '==', sid).get()).docs.forEach((parcel) => {
            if (parcel.exists) {
              parcels.push(parcel.data() as Parcel);
            }
          });
        })
      }
      if (!parcels || parcels.length < 1) {
        throw new Error('there are no parcels for that resolution')
      }
      const parcelIds = parcels.map((p) => p.id);
      const owners: Owner[] = [];
      (await db.db.collection('unions').doc(unionId).collection('owners').get()).docs.forEach((o) => {
        const owner = o.data() as Owner;
        if (owner) {
          owner.parcelsData.forEach((pd) => {
            if (_.includes(parcelIds, pd.id)) {
              const parcel = _.find(parcels, (p) => pd.id === p.id);
              resolution.payments.forEach((p) => {
                if (new Date(owner.historicSaldo.untilDate).getTime() < new Date(p.paymentDate).getTime() && new Date(owner.historicSaldo.untilDate).getTime() < Date.now()) {
                  owner.saldo.capital = owner.saldo.capital + pd.percent * (parcel.areaSurface > 1 ? resolution.paymentMoreOneHour : resolution.paymentMoreOneHour);
                }
              })
              owners.push(owner);
            }
          })
        }
      });
      owners.forEach((o) => db.db.doc(`unions/${unionId}/owners/${o.id}`).update(omitNotDefined(o)));
      resolution.payments.forEach((p) => {
        if (new Date(p.paymentDate).getTime() < Date.now()) {
          p.paymentDone = true;
        }
      })
      await db.db.doc(`unions/${unionId}/resolution/${resolutionId}`).update(resolution);
      return 'ok';
    },
    async addWorksDone(root: any, { unionId, worksDoneId }: { unionId: string, worksDoneId: string }, context: any) {
      const worksDone: Works = (await db.getDocument(`unions/${unionId}/works/${worksDoneId}`)).data();
      if (!worksDone) {
        throw new Error('there are no works done with that id')
      }
      const parcels: Parcel[] = [];
      worksDone.parcelsData.forEach(async (pd) => parcels.push(((await db.db.doc(`unions/${unionId}/parcels/${pd.id}`).get()).data() as Parcel)));
      const parcelIds = parcels.map((p) => p.id);
      const owners: Owner[] = [];
      (await db.db.collection('unions').doc(unionId).collection('owners').get()).docs.forEach((o) => {
        const owner = o.data() as Owner;
        let modified = false;
        if (owner) {
          owner.parcelsData.forEach((pd) => {
            if (_.includes(parcelIds, pd.id)) {
              owner.saldo.costs = owner.saldo.costs + pd.percent * worksDone.totalCost / worksDone.parcelsData.length;
              modified = true;
            }
          })
        }
        if (modified) {
          owners.push(owner);
        }
      });
      owners.forEach(async (o) => await db.db.doc(`unions/${unionId}/owners/${o.id}`).update(omitNotDefined(o)));
      return 'ok';
    },
    async applyJoinApplication(root: any, { user, union, password }: { user: User, union: Union, password: string }, context: any): Promise<string> {
      const joinApplication: JoinApplication = { user: omitNotDefined(user), union: omitNotDefined(union), password };
      const applicationRefrence = await db.getDocument(`joinApplications/${sanitizeNip(union.nip)}`);
      if (applicationRefrence && applicationRefrence.exists) {
        console.log(applicationRefrence.data());
        throw new Error('aplication already added');
      }
      const companyRefrence = await db.getDocument(`joinApplications/${sanitizeNip(union.nip)}`);
      if (companyRefrence && companyRefrence.exists) {
        console.log(companyRefrence.data());
        throw new Error('aplication already added');
      }
      await db.add(`joinApplications/${sanitizeNip(union.nip)}`, joinApplication);
      return "ok";
    },
    async declineJoinApplication(root: any, { unionId }: { unionId: string }, context: any): Promise<string> {
      const refrence = await db.getDocument(`joinApplications/${unionId}`);
      if (!refrence || !refrence.exists) {
        throw new Error(`aplication doesn't exist`);
      } else {
        await db.removeDocument(`joinApplications/${unionId}`)
        // await sendDeclineEmail(refrence.data().user.email);  check if sending decline email is really needed
        return "ok"
      }
    },
    async removeParcel(root: any, { unionId, parcelId }: { unionId: string, parcelId: string }, context: any) {
      const owners: Owner[] = (await db.db.collection('unions').doc(unionId).collection('owners').get()).docs.map((d) => d.data() as Owner).filter((o) => _.includes(o.parcelsData.map((pd) => pd.id), parcelId));
      const parcel: Parcel = (await db.db.collection('unions').doc(unionId).collection('parcels').doc(parcelId).get()).data() as Parcel;
      const resolutions: Resolution[] = (await db.db.collection('unions').doc(unionId).collection('resolutions').get()).docs.map((d) => d.data() as Resolution);
      resolutions.filter((r) =>
        (r) &&
        (
          (r.companyId === parcel.companyId && r.wholeCompany)
          ||
          (r.companyId === parcel.companyId && _.includes(r.sectionIds, parcel.sectionId))
        )
      );
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
      owners.forEach(async (o) => await db.db.collection('unions').doc(unionId).collection('owners').doc(o.id).update(o));
      await db.db.collection('unions').doc(unionId).collection('parcels').doc(parcel.id).delete();
      return 'ok';
    },
    // async removeSection(root: any, { unionId, companyId, sectionId }: { unionId: string, sectionId: string, companyId: string }, context: any) {
    //   await db.db.collection('unions').doc(unionId).collection('companies').doc(companyId).collection('sections').doc(sectionId).delete();
    //   return 'ok';
    // },
    async removeWorksDone(root: any, { unionId, worksDoneId }: { unionId: string, worksDoneId: string }, context: any) {
      const worksDone: Works = (await db.getDocument(`unions/${unionId}/works/${worksDoneId}`)).data();
      if (!worksDone) {
        throw new Error('there are no works done with that id')
      }
      const parcels: Parcel[] = [];
      worksDone.parcelsData.forEach(async (pd) => parcels.push(((await db.db.doc(`unions/${unionId}/parcels/${pd.id}`).get()).data() as Parcel)));
      const parcelIds = parcels.map((p) => p.id);
      const owners: Owner[] = [];
      (await db.db.collection('unions').doc(unionId).collection('owners').get()).docs.forEach(async (o) => {
        const owner = o.data() as Owner;
        let modified = false;
        if (owner) {
          owner.parcelsData.forEach((pd) => {
            if (_.includes(parcelIds, pd.id)) {
              owner.saldo.costs = owner.saldo.costs - pd.percent * worksDone.totalCost / worksDone.parcelsData.length;
              modified = true;
            }
          })
        }
        if (modified) {
          owners.push(owner);
        }
      });
      owners.forEach(async (o) => await db.db.doc(`unions/${unionId}/owners/${o.id}`).update(omitNotDefined(o)));
      await db.db.doc(`unions/${unionId}/works/${worksDoneId}`).delete();
      return 'ok';
    },
    async sendMail(root: any, { email }: { email: string }, context: any): Promise<string> {
      console.log(email)
      await sendWelcomeEmail(email);
      return "ok"
    },
    async generatePaymentPaper(root: any, { unionId, ownerId, unionBankAccount, payersBankAccount, amount, payerName, title }: { unionId: string, ownerId: string, unionBankAccount: string, amount: string, payersBankAccount: string, payerName: string, title: string }, context: any) {
      const union = (await db.db.collection('unions').doc(unionId).get()).data() as Union;
      const id = '-' + Math.random().toString(36).substr(2, 9);
      const paperId = await paymentPaper.generatePaymentPaper(id, union, unionBankAccount, amount, payersBankAccount, payerName, title);
      const note: Note = {
        id: paperId,
        text: 'Wygenerowano polecenie zapłaty',
        date: new Date()
      };
      await db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('notes').doc(paperId).set(note);
      await db.db.collection('unions').doc(unionId).collection('documents').doc(paperId).set({ timestamp: Date.now() });
      return paperId;
    },
    async generateNoticePaper(root: any, { unionId, ownerId, status, resolutionId, stampAuth, accountName, address, bankAccount, title }: { unionId: string, ownerId: string, status: string, resolutionId: string, stampAuth: InputStampAuth, accountName: string, address: string, bankAccount: string, title: string }, context: any) {
      const resolution = (await db.db.collection('unions').doc(unionId).collection('resolutions').doc(resolutionId).get()).data() as Resolution;
      const company = (await db.db.collection('unions').doc(unionId).collection('companies').doc(resolution.companyId).get()).data() as Company;
      const union = (await db.db.collection('unions').doc(unionId).get()).data() as Union;
      const ownerRef = await db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).get();
      const paymentsRef = await db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('payments').get();
      const notesRef = await db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('notes').get();
      const parcelsDataRef = await db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('parcels').get();
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
        const owner = ownerRef.data() as Owner;
        owner.payments = payments;
        owner.notes = notes;
        owner.parcelsData = parcelsData;
        const area = owner.parcelsData.filter((pd) => resolution.wholeCompany ? pd.companyId === resolution.companyId : _.includes(resolution.sectionIds, pd.sectionId)).reduce((acc, v) => {
          acc += v.area ? v.area : 0; return acc;
        }, 0);
        await calculateOwnerSaldos(owner, unionId);
        const id = '-' + Math.random().toString(36).substr(2, 9);
        const paperId = await noticePaper.generateNoticePaper(id, union, company, owner, resolution, stampAuth, area, accountName, address, bankAccount, title, status);
        const note: Note = {
          id: paperId,
          text: 'Wygenerowano zawiadomienie o naliczeniu opłaty',
          date: new Date()
        };
        await db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('notes').doc(paperId).set(note);
        await db.db.collection('unions').doc(unionId).collection('documents').doc(paperId).set({ timestamp: Date.now() });
        return paperId;
      } else {
        throw new Error('owner doesnt exist');
      }
    },
    async generateCallPaper(root: any, { unionId, ownerId, companyId, cashAddress, bankName, bankAccount, contactPhone, contactEmail, stampAuth, status }: { unionId: string, ownerId: string, companyId: string, cashAddress: string, bankName: string, bankAccount: string, contactPhone: string, contactEmail: string, stampAuth: InputStampAuth, status: string }, context: any) {
      const company = (await db.db.collection('unions').doc(unionId).collection('companies').doc(companyId).get()).data() as Company;
      const union = (await db.db.collection('unions').doc(unionId).get()).data() as Union;
      const ownerRef = await db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).get();
      const paymentsRef = await db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('payments').get();
      const notesRef = await db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('notes').get();
      const parcelsDataRef = await db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('parcels').get();
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
      console.log(parcelsData)
      if (ownerRef.exists) {
        const owner = ownerRef.data() as Owner;
        owner.payments = payments;
        owner.notes = notes;
        owner.parcelsData = parcelsData;
        await calculateOwnerSaldos(owner, unionId);
        const id = '-' + Math.random().toString(36).substr(2, 9);
        const paperId = await callPaper.generateCallPaper(id, union, owner, company, cashAddress, bankName, bankAccount, contactPhone, contactEmail, stampAuth, status);
        const note: Note = {
          id: paperId,
          text: 'Wygenerowano wezwanie do zapłaty',
          date: new Date()
        }
        await db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('notes').doc(paperId).set(note);
        await db.db.collection('unions').doc(unionId).collection('documents').doc(paperId).set({ timestamp: Date.now() });
        return paperId;
      } else {
        throw new Error('owner doesnt exist');
      }
    },
    async generateAuthPaper(root: any, { unionId, authName, authAddress, authPesel, authedPesel, ownerId, authedName, authedSurname }: { unionId: string, authName: string, authAddress: string, authPesel: string, authedPesel: string, ownerId: string, authedName: string, authedSurname: string }, context: any) {
      const union = (await db.db.collection('unions').doc(unionId).get()).data() as Union;
      const id = '-' + Math.random().toString(36).substr(2, 9);
      const paperId = await authPaper.generateAuthPaper(id, union, authName, authAddress, authPesel, authedPesel, authedName, authedSurname);
      const note: Note = {
        id: paperId,
        text: 'Wygenerowano upowanienie',
        date: new Date()
      }
      await db.db.collection('unions').doc(unionId).collection('owners').doc(ownerId).collection('notes').doc(paperId).set(note);
      await db.db.collection('unions').doc(unionId).collection('documents').doc(paperId).set({ timestamp: Date.now() });
      return paperId;
    }
  },

  Query: {
    name() {
      return name;
    }
  }
}


// function djb2Code(str: string): number {
//   let hash = 5381;
//   for (let i = 0; i < str.length; i++) {
//     const char: number = str.charCodeAt(i);
//     hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
//   }
//   return hash;
// }

export default resolvers;


export function omitNotDefined<T>(object: T): T {
  return _.omitBy(object, (v) => _.isNull(v) || _.isUndefined(v))
}

export function dateStringToNumber(dateString: string, starting?: boolean): number {
  if (dateString) {
    return new Date(dateString).getTime();
  } else if (starting) {
    return 0;
  } else {
    return 10000000000000;
  }
}


export interface InputCompany {
  name: string;
  nip: string;
  email: string;
  phone: string;
  address: Address;
  regon: String;
}

export interface InputUser {
  email: string;
  name: string;
  unionName: string;
  unionId: string;
  lastPayment: number;
  phone: String;
}

export interface InputStampAuth {
  name: string;
  surname: string;
  position: string;
}
