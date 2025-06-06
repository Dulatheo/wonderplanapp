import {type ClientSchema, a, defineData} from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/

const schema = a.schema({
  Project: a
    .model({
      name: a.string().required(),
      tasks: a.hasMany('Task', 'projectId'),
    })
    .authorization(allow => [allow.guest()]),

  Task: a
    .model({
      name: a.string().required(),
      priority: a.integer().required(),
      projectId: a.string(),
      project: a.belongsTo('Project', 'projectId'),
      contexts: a.hasMany('ContextTask', 'taskId'),
    })
    .authorization(allow => [allow.owner()]),

  Context: a
    .model({
      name: a.string().required(),
      tasks: a.hasMany('ContextTask', 'contextId'),
    })
    .authorization(allow => [allow.owner()]),

  ContextTask: a
    .model({
      contextId: a.string().required(),
      taskId: a.string().required(),
      context: a.belongsTo('Context', 'contextId'),
      task: a.belongsTo('Task', 'taskId'),
    })
    .authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'iam',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
