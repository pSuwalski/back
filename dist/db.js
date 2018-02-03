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
const firebase = require("firebase-admin");
const _ = require("lodash");
// Update the timestamp field with the value from the server
const serviceAccount = require(`${__dirname}/../mwc-production.json`);
exports.app = firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: 'https://melior-wc.firebaseio.com'
});
exports.db = firebase.firestore();
exports.fieldValue = firebase.firestore.FieldValue;
function ref(collection, document) {
    return exports.db.collection(collection).doc(document);
}
exports.ref = ref;
function sanitizeValue(value) {
    if (_.isString(value) || _.isNumber(value) || _.isBoolean(value)) {
        return value;
    }
    else {
        return _.omitBy(value, _.isUndefined);
    }
}
function createUser(email, password, displayName) {
    return firebase.auth().createUser({
        email: email,
        emailVerified: true,
        password: password,
        displayName: displayName,
        // photoURL: "http://www.example.com/12345678/photo.png",
        disabled: false
    });
}
exports.createUser = createUser;
function removeUser(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        yield firebase.auth().deleteUser(uid);
        return;
    });
}
exports.removeUser = removeUser;
function changeUidPassword(uid, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield firebase.auth().getUser(uid);
        if (!user || !user.uid) {
            throw new Error(`User with uid ${uid} not found`);
        }
        return yield firebase.auth().updateUser(user.uid, { password });
    });
}
exports.changeUidPassword = changeUidPassword;
function changePassword(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield firebase.auth().getUserByEmail(email);
        if (!user || !user.uid) {
            throw new Error(`User with email ${email} not found`);
        }
        return yield firebase.auth().updateUser(user.uid, { password });
    });
}
exports.changePassword = changePassword;
function generateKey() {
    return firebase.database().ref().push().key;
}
exports.generateKey = generateKey;
function getCollection(collection) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield exports.db.collection(collection).get();
    });
}
exports.getCollection = getCollection;
function getDocument(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield exports.db.doc(path).get();
    });
}
exports.getDocument = getDocument;
function removeDocument(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield exports.db.doc(path).delete();
    });
}
exports.removeDocument = removeDocument;
function add(path, value) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield exports.db.doc(path).set(sanitizeValue(value), { merge: true });
    });
}
exports.add = add;
function set(path, value) {
    return firebase.database().ref(path).set(sanitizeValue(value));
}
exports.set = set;
function update(path, value) {
    return firebase.database().ref(path).update(sanitizeValue(value));
}
exports.update = update;
function updateTimestamp(docRef) {
    docRef.update({
        timestamp: exports.fieldValue.serverTimestamp()
    });
}
exports.updateTimestamp = updateTimestamp;
function remove(path) {
    return firebase.database().ref(path).remove();
}
exports.remove = remove;
//# sourceMappingURL=db.js.map