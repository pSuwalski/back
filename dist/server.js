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
const Express = require("express");
const basicAuth = require('basic-auth');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const jsonwebtoken_1 = require("jsonwebtoken");
const _ = require("lodash");
const db = require("./db");
const apollo_server_1 = require("apollo-server");
const graphql_tools_1 = require("graphql-tools");
const schema_1 = require("./graphql/schema");
const resolvers_1 = require("./graphql/resolvers");
const crypto = require("crypto");
const SECRET = process.env.JWT_SECRET || 'skynet';
function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
}
;
function bearerToken(req) {
    const authorizationHeader = req.get('Authorization');
    if (_.isString(authorizationHeader)) {
        const [type, token] = authorizationHeader.split(' ');
        if (type.toLowerCase() === 'bearer') {
            return token || '';
        }
        else {
            return '';
        }
    }
    else {
        return '';
    }
}
function tokenToUID(token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // firebase 2.x
            const decodedToken = jsonwebtoken_1.verify(token, SECRET);
            if (decodedToken && decodedToken.d && decodedToken.d.uid) {
                return decodedToken.d.uid;
            }
            else {
                throw new Error('this is not valid old firebase token');
            }
        }
        catch (error) {
            // firebase 3.x
            const decodedToken = yield db.app.auth().verifyIdToken(token);
            return decodedToken.sub;
        }
    });
}
const HASH_SECRET = 'a93_nd$.1%95qyRb';
function uidFromHash(req) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('uid from hash', req.headers);
        if (req.headers.u && req.headers.t && req.headers.h) {
            try {
                const uid = req.headers.u;
                const timestamp = Number.parseInt(String(req.headers.t));
                const hash = req.headers.h;
                console.log('hash headers', { uid, timestamp, hash });
                const now = Date.now();
                const allowedTimestampDifference = 1000 * 60 * 60 * 6; // 6h
                if (timestamp <= now + allowedTimestampDifference && timestamp >= now - allowedTimestampDifference) {
                    const correctHash = crypto.createHash('sha256').update(`${uid}${timestamp}${HASH_SECRET}`, 'utf8')
                        .digest().toString('hex');
                    console.log(`correctHash ${correctHash}`);
                    console.log(`realHash ${hash}`);
                    // const correctHash = await bcrypt.compare(`${uid}${timestamp}${HASH_SECRET}`, hash);
                    if (correctHash.startsWith(hash)) {
                        console.log('Correct hash', correctHash);
                        return uid;
                    }
                    console.log(`Incorect hash for ${uid}, ${timestamp}, ${hash}`);
                }
            }
            catch (e) {
                console.error('hash authorization error', e);
            }
        }
        return null;
    });
}
function setRootValue(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = bearerToken(req) || req.query.auth;
            const uid = token ? yield tokenToUID(token) : yield uidFromHash(req);
            // console.log('setRootValue uid', uid);
            if (!uid) {
                throw new Error('invalid token or hash');
            }
            const user = yield db.getDocument('users/' + uid);
            if (!user) {
                throw new Error('user not found');
            }
            let authData = {
                uid: uid
            };
            // obsolete permission system
            authData = _.merge(authData, _.pick(user, ['email', 'phone', 'name']));
            req.rootValue = authData;
            // console.log({rootValue: req.rootValue});
        }
        catch (error) {
            const user = basicAuth(req);
            if (user && user.name === '10' && user.pass === '6925') {
                req.rootValue = { roles: { admin: true } };
                // console.log({rootValue: req.rootValue});
            }
            else if (user && user.name === '71' && user.pass === '24') {
                req.rootValue = { roles: { admin: true } };
                // console.log({rootValue: req.rootValue});
            }
            else if (req.method === 'GET' && req.accepts('html')) {
                return unauthorized(res);
            }
            else {
                // console.log("setRootValue error", error);
                req.rootValue = { roles: {} };
                // console.log({ rootValue: req.rootValue });
            }
        }
        next();
    });
}
function auth(req, res, next) {
    setRootValue(req, res, next).then(() => {
        // nothing more to do
    }, (error) => {
        next(error);
    });
}
;
const app = Express();
exports.app = app;
app.use(bodyParser.json());
app.use(cookieParser());
function filterOptions(req, res, next) {
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
    }
    else {
        next();
    }
}
app.get('/graphql', auth, apollo_server_1.graphiqlExpress({
    endpointURL: '/graphql'
}));
const executableSchema = graphql_tools_1.makeExecutableSchema({
    typeDefs: schema_1.default,
    resolvers: resolvers_1.default,
    allowUndefinedInResolve: true
});
function logGraphql(req, res, next) {
    if (req.body.query) {
        console.log(req.body.query);
    }
    next();
}
app.use('/graphql', cors(), filterOptions, auth, logGraphql, apollo_server_1.apolloExpress(req => ({
    schema: executableSchema
})));
function exitHandler(options, err) {
    if (options.cleanup)
        console.log('clean');
    if (err)
        console.log(err.stack);
    if (options.exit)
        process.exit();
}
//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
//# sourceMappingURL=server.js.map