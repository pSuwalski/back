"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const typeDefinition = fs.readFileSync(`${__dirname}/../../graphql/schema.gql`).toString();
exports.default = [typeDefinition];
//# sourceMappingURL=schema.js.map