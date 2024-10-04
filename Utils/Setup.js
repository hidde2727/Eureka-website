const fs = require('node:fs');
const crypto = require('node:crypto');

const DB = require('./DB.js');
const Login = require('./Login.js')

async function Setup() {
    await DB.ExecuteStatement(fs.readFileSync("./Utils/Schemas/projects.schema", { encoding:"ascii" }));
    await DB.ExecuteStatement(fs.readFileSync("./Utils/Schemas/inspiration_labels.schema", { encoding:"ascii" }));
    await DB.ExecuteStatement(fs.readFileSync("./Utils/Schemas/inspiration.schema", { encoding:"ascii" }));
    await DB.ExecuteStatement(fs.readFileSync("./Utils/Schemas/users.schema", { encoding:"ascii" }));
    if(await DB.IsTableEmpty("users")) {
        // Generate default user
        await Login.GenerateUser("admin", await crypto.subtle.digest("SHA-256", Buffer.from("password")));
        await Login.GiveUserPermissions("admin", true, true, true, true);
    }
    await DB.ExecuteStatement(fs.readFileSync("./Utils/Schemas/sessions.schema", { encoding:"ascii" }));
    await DB.ExecuteStatement(fs.readFileSync("./Utils/Schemas/suggestions.schema", { encoding:"ascii" }));
    await DB.ExecuteStatement(fs.readFileSync("./Utils/Schemas/suggestion_votes.schema", { encoding:"ascii" }));
}

module.exports = Setup;