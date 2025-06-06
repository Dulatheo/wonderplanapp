import {Amplify} from 'aws-amplify';
import {generateClient} from 'aws-amplify/data';
import type {Schema} from '../../amplify/data/resource'; // Adjusted path
import outputs from '../../amplify_outputs.json';

// Configure Amplify (Generation 2 style)
Amplify.configure(outputs);

// Generate the Data client
export const client = generateClient<Schema>();
