import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import path from 'path';
import url from 'node:url';

import API from './api/api.js';
import * as DB from './utils/db.js';
import * as Login from './utils/login.js';
import * as Settings from './utils/settings.js';

const app = express();
const port = 3000; // Change to be port 443 in production ======================================

(async () => {

Settings.LoadSettings();
await DB.CreateConnection();
Login.SetupLoginSystem();
await DB.SetupTables();

// !!!! DELETE IN PRODUCTION !!!!!
if(process.env.NODE_ENV.trim() == 'development') {
  if(await DB.IsTableEmpty('users')) {
    console.log('Regenerated the admin user')
    // Generate default user (username: admin & password: password)
    await Login.GenerateUser('admin', await crypto.subtle.digest('SHA-256', Buffer.from('password')));
    await Login.GiveUserPermissions((await DB.GetUserByName('admin')).id, true, true, true, true, true, true);
  }
}
// !!!! DELETE IN PRODUCTION !!!!!

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Static content
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use('/data/labels.json', express.static('data/labels.json'));
app.use('/data/projects.json', express.static('data/projects.json'));
app.use('/data/tutorials', express.static('data/tutorials'));

// Routing
app.use(express.json());
app.use(cookieParser());
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
app.use('/api', API);

// Error handeling
app.use((err, req, res, next) => {
  console.error('Error ontvangen tijdens uitvoeren server:\n')
  console.error(err.stack);
  res.status(500).send('Er is iets fout gegaan op de server!');
})

// Start the server
var connection = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

})()