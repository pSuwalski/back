import * as firebase from 'firebase-admin';
import * as _ from 'lodash';




// Update the timestamp field with the value from the server


const serviceAccount = require(`${__dirname}/../mwc-production.json`);

export const app = firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: 'https://melior-wc.firebaseio.com'
});

export const db = firebase.firestore();

export const fieldValue = firebase.firestore.FieldValue;

export function ref(collection: string, document: string) {
  return db.collection(collection).doc(document);
}

function sanitizeValue(value: any) {
  if (_.isString(value) || _.isNumber(value) || _.isBoolean(value)) {
    return value
  } else {
    return _.omitBy(value, _.isUndefined);
  }
}

export function createUser(email: string, password: string, displayName?: string): Promise<firebase.auth.UserRecord> {
  return firebase.auth().createUser({
    email: email,
    emailVerified: true,
    password: password,
    displayName: displayName,
    // photoURL: "http://www.example.com/12345678/photo.png",
    disabled: false
  }) as Promise<firebase.auth.UserRecord>
}

export async function removeUser(uid: string): Promise<undefined> {
  await firebase.auth().deleteUser(uid);
  return
}

export async function changeUidPassword(uid, password): Promise<firebase.auth.UserRecord> {
  const user = await firebase.auth().getUser(uid);
  if (!user || !user.uid) {
    throw new Error(`User with uid ${uid} not found`);
  }
  return await firebase.auth().updateUser(user.uid, { password });
}

export async function changePassword(email, password): Promise<firebase.auth.UserRecord> {
  const user = await firebase.auth().getUserByEmail(email);
  if (!user || !user.uid) {
    throw new Error(`User with email ${email} not found`);
  }
  return await firebase.auth().updateUser(user.uid, { password });
}

export function generateKey() {
  return firebase.database().ref().push().key;
}


export async function getCollection(collection: string): Promise<any> {
  return await db.collection(collection).get();
}

export async function getDocument(path: string): Promise<any> {
  return await db.doc(path).get();
}

export async function removeDocument(path: string): Promise<any> {
  return await db.doc(path).delete();
}

export async function add(path: string, value: any): Promise<any> {
  return await db.doc(path).set(sanitizeValue(value), { merge: true });
}

export function set(path: string, value: any): Promise<any> {
  return firebase.database().ref(path).set(sanitizeValue(value)) as Promise<any>;
}

export function update(path: string, value: any): Promise<any> {
  return firebase.database().ref(path).update(sanitizeValue(value)) as Promise<any>;
}

export function updateTimestamp(docRef: FirebaseFirestore.DocumentReference) {
  docRef.update({
    timestamp: fieldValue.serverTimestamp()
  });
}

export function remove(path: string): Promise<any> {
  return firebase.database().ref(path).remove() as Promise<any>;
}
