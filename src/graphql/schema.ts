import * as fs from 'fs';

const typeDefinition = fs.readFileSync(`${__dirname}/../../graphql/schema.gql`).toString();
export default [typeDefinition];
