import * as Express from 'express';
const basicAuth = require('basic-auth');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
import { verify } from 'jsonwebtoken';
import * as _ from 'lodash';
import * as db from './db';
import { apolloExpress, graphiqlExpress } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';
import schema from './graphql/schema';
import resolvers from './graphql/resolvers';
import * as crypto from 'crypto';
const SECRET = process.env.JWT_SECRET || 'skynet';


function unauthorized(res) {
  res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
  return res.sendStatus(401);
};

function bearerToken(req): string {
  const authorizationHeader: string = req.get('Authorization');
  if (_.isString(authorizationHeader)) {
    const [type, token] = authorizationHeader.split(' ');
    if (type.toLowerCase() === 'bearer') {
      return token || '';
    } else {
      return '';
    }
  } else {
    return '';
  }
}

async function tokenToUID(token) {
  try {
    // firebase 2.x
    const decodedToken: any = verify(token, SECRET);
    if (decodedToken && decodedToken.d && decodedToken.d.uid) {
      return decodedToken.d.uid;
    } else {
      throw new Error('this is not valid old firebase token');
    }
  } catch (error) {
    // firebase 3.x
    const decodedToken = await db.app.auth().verifyIdToken(token);
    return decodedToken.sub;
  }
}

const HASH_SECRET = 'a93_nd$.1%95qyRb';

async function uidFromHash(req): Promise<string> {
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
    } catch (e) {
      console.error('hash authorization error', e);
    }
  }
  return null;
}

async function setRootValue(req, res, next) {
  try {
    const token = bearerToken(req) || req.query.auth;
    const uid = token ? await tokenToUID(token) : await uidFromHash(req);
    // console.log('setRootValue uid', uid);
    if (!uid) {
      throw new Error('invalid token or hash');
    }
    const user = await db.getDocument('users/' + uid);
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
  } catch (error) {
    const user = basicAuth(req);
    if (user && user.name === '10' && user.pass === '6925') {
      req.rootValue = { roles: { admin: true } };
      // console.log({rootValue: req.rootValue});
    } else if (user && user.name === '71' && user.pass === '24') {
      req.rootValue = { roles: { admin: true } };
      // console.log({rootValue: req.rootValue});
    } else if (req.method === 'GET' && req.accepts('html')) {
      return unauthorized(res);
    } else {
      // console.log("setRootValue error", error);
      req.rootValue = { roles: {} };
      // console.log({ rootValue: req.rootValue });
    }
  }
  next();
}


function auth(req, res, next) {
  setRootValue(req, res, next).then(() => {
    // nothing more to do
  }, (error) => {
    next(error);
  });
};

const app = Express();

app.use(bodyParser.json());
app.use(cookieParser());

function filterOptions(req, res, next) {
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
}

app.get('/graphql', auth, graphiqlExpress({
  endpointURL: '/graphql'
}));


const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers: resolvers,
  allowUndefinedInResolve: true
});


function logGraphql(req, res, next) {
  if (req.body.query) {
    console.log(req.body.query);
  }
  next();
}

app.use('/graphql', cors(), filterOptions, auth, logGraphql, apolloExpress(req => ({
  schema: executableSchema
})));

function exitHandler(options, err) {
  if (options.cleanup) console.log('clean');
  if (err) console.log(err.stack);
  if (options.exit) process.exit();
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


export { app };
