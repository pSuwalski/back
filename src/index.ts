// const FirebaseQueue = require('firebase-queue');
// import * as _ from 'lodash';
// import * as fs from 'fs';
// import * as db from './db';
import { app } from './server';
// import * as sms from './sms';
// import { monitorQueue } from './controllers/tasks';

// function loadActions(controllersDir) {
//   const controllerNames = loadControllerNames(controllersDir);
//   const actionArrays = controllerNames.map((name) => {
//     const controllerModule = require(`${controllersDir}/${name}`);
//     const actions = controllerModule.actions || {};
//     return Object.keys(actions).map((actionName) => {
//       const snakeCaseName = _.snakeCase(actionName);
//       const { worker, spec } = actionConfig(snakeCaseName, actions[actionName].config);
//       return { snakeCaseName, handler: actions[actionName], worker, spec };
//     });
//   });
//   return _.flatten(actionArrays);
// }

// function loadControllerNames(dir): string[] {
//   return fs.readdirSync(dir).filter((filename) => {
//     // skip files starting with _ and select only .js files
//     return filename.indexOf('_') !== 0 && filename.indexOf('.js') === filename.length - 3;
//   }).map((filename) => {
//     // remove file extensions
//     return filename.split('.')[0];
//   });
// }

// function actionConfig(eventName: string, config: any = {}) {
//   const start_state = config.start_state || eventName;
//   config = _.defaults(config, {
//     start_state,
//     in_progress_state: `${start_state}_in_progress`,
//     finished_state: `${start_state}_finished`,
//     error_state: `${start_state}_error`,
//     specId: start_state,
//     suppressStack: false,
//     numWorkers: 3
//   });
//   return {
//     spec: _.pick<any, any>(config, [
//       'start_state',
//       'in_progress_state',
//       'finished_state',
//       'error_state',
//       'timeout',
//       'retries'
//     ]),
//     worker: _.pick<any, any>(config, [
//       'specId',
//       'numWorkers',
//       'sanitize',
//       'suppressStack'
//     ])
//   };
// }

// function getSpecs(controllers) {
//   return controllers.map((controller) => {
//     return [controller.worker.specId, controller.spec];
//   }).reduce((specs, [id, spec]) => {
//     specs[id] = spec;
//     return specs;
//   }, {});
// }

// function controllerHandlerToQueueWorker(handler) {
//   return (data, progress, resolve, reject) => {
//     try {
//       const result = handler(data);
//       if (!result) {
//         // synchronous without result
//         resolve(data);
//       } else {
//         if (typeof result.then === 'function') {
//           // asynchronous
//           const timeout = setTimeout(() => {
//             console.log('timeout 1m for', JSON.stringify(data, null, 2));
//             sms.send('+48793130308', `Timeout 1m na zadaniu ${JSON.stringify(data)}`);
//           }, 1000 * 60);
//           result.then(resolvedResult => {
//             clearTimeout(timeout);
//             resolve(data);
//           }).catch((error) => {
//             clearTimeout(timeout);
//             sms.send('+48793130308', `Błąd w tasku ${JSON.stringify(data)}`);
//             console.error(error);
//             reject(error);
//           });
//         } else {
//           // synchronous with result
//           resolve(data);
//         }
//       }
//     } catch (error) {
//       console.error(error);
//       reject(error);
//     }
//   };
// }

async function main() {
  // const controllersDir = `${__dirname}/controllers`;
  // const actions = loadActions(controllersDir);

  if (!process.env.DISABLE_GRAPHQL) {
    const httpPort = process.env.PORT || 3000;
    app.listen(httpPort, () => {
      console.log(`-----> HTTP Server is listening on ${httpPort}`);
    });
  }

  // if (!process.env.DISABLE_QUEUE) {
  //   const specs = getSpecs(actions);
  //   await db.update('v1/queue/specs', specs);
  //   console.log('-----> Specs updated');

  //   const queues = actions.map((action) => {
  //     const queue = new FirebaseQueue(
  //       db.ref('v1/queue'),
  //       action.worker,
  //       controllerHandlerToQueueWorker(action.handler)
  //     );
  //     console.log(`-----> Listening on ${action.spec.start_state}`);
  //     return queue;
  //   });

  //   monitorQueue(1000 * 30, 1000 * 70);

  process.on('SIGINT', () => {
    console.log('-----> Starting queue shutdown');
    // const shutdownAll = Promise.all(queues.map((queue) => queue.shutdown()));
    // shutdownAll.then(() => {
    //   console.log('-----> Finished queue shutdown');
    //   process.exit(0);
    // });
  });
}



if (require.main === module) {
  main().then(() => {
    console.log('=====> All systems go');
  }).catch((error) => {
    console.error(error);
  });
}
