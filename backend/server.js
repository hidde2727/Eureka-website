import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import path from 'path';
import url from 'node:url';

import API from './api/api.js';
import * as DB from './utils/db.js';
import * as Login from './utils/login.js';
import * as Settings from './utils/settings.js';
import { GenerateProjectJSON } from './utils/projects.js';
import { RegenFileIndices } from './utils/files.js';
import { RegenLabels } from './utils/inspiration_labels.js';
import Config from './utils/config.js';
import { OverrideDefaultLogging, accessTypes, accessUrgency, AddToAccessLog } from './utils/logs.js';
import SendRequest from './utils/https_request.js';

const app = express();
const port = Config.isDev ? 3000 : process.env.PORT;

(async () => {

await OverrideDefaultLogging();
Settings.LoadSettings();
await DB.CreateConnection();
Login.SetupLoginSystem();
await DB.SetupTables();

await GenerateProjectJSON();
await RegenFileIndices();
await RegenLabels();

if(Config.isDev) {
    console.info('In development mode!');
    if(await DB.IsTableEmpty('users')) {
        console.info('Regenerated the admin user');
        // Generate default user (username: admin & password: password)
        await Login.GenerateUser('admin', await crypto.subtle.digest('SHA-256', Buffer.from('password')));
        await Login.GiveUserPermissions((await DB.GetUserByName('admin')).id, true, true, true, true, true, true);
    }
}

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
// Static content
if(Config.isDev) { 
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    app.use('/data/files.json', express.static('data/files.json'));
    app.use('/data/labels.json', express.static('data/labels.json'));
    app.use('/data/projects.json', express.static('data/projects.json'));
    app.use('/data/tutorials', express.static('data/tutorials'));
}
else { 
    app.use(express.static(path.join(__dirname, '/frontend/')));
    app.use('/data/files.json', express.static(path.join(__dirname, '/data/files.json')));
    app.use('/data/labels.json', express.static(path.join(__dirname, '/data/labels.json')));
    app.use('/data/projects.json', express.static(path.join(__dirname, '/data/projects.json')));
    app.use('/data/tutorials', express.static(path.join(__dirname, '/data/tutorials')));
}

// Routing
app.use(express.json());
app.use(cookieParser());
app.get('/', (req, res) => {
    if(Config.isDev) res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    else res.sendFile('/frontend/index.html');
});
app.use('/api', API);

// Error handeling
app.use((req, res, next) => {
    res.status(404).send("Sorry, die konden we niet vinden!")
})
app.use((err, req, res, next) => {
    console.error('Error ontvangen tijdens uitvoeren server:\n')
    console.error(err.stack);
    res.status(500).send('Er is iets fout gegaan op de server!');
    AddToAccessLog(accessUrgency.error, accessTypes.general, 'Unknown', null, { userAgent: req.headers['user-agent'], ip: req.ip, error: err.message });
});

// Prod
app.disable('x-powered-by');
const cloudflareIPs = await SendRequest({
    host:'api.cloudflare.com',
    path:'/client/v4/ips',
    method:'GET',
    headers: { Authorization: 'Bearer ' + Config.cloudflare.token }
});
if(!cloudflareIPs.success) console.error('Retrieving cloudflare ips failed: ' + JSON.stringify(cloudflareIPs?.errors));
app.set('trust proxy', cloudflareIPs?.result?.ipv4_cidrs);

// Start the server
var connection = app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

})()