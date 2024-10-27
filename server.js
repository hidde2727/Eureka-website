const express = require('express');
const cookieParser = require('cookie-parser');

const API = require('./API/API.js');
const DB = require('./Utils/DB.js');
const Login = require('./Utils/Login.js');

const app = express();
const port = 3000; // Change to be port 443 in production ======================================

await DB.CreateConnection();
Login.SetupLoginSystem();
await DB.SetupTables();
if(await DB.IsTableEmpty("users")) {
  // Generate default user (username: admin & password: password)
  const crypto = require('node:crypto');
  await Login.GenerateUser("admin", await crypto.subtle.digest("SHA-256", Buffer.from("password")));
  await Login.GiveUserPermissions("admin", true, true, true, true);
}

// Static content
app.use(express.static('Public'));
app.use('/Data/Inspiration.json', express.static('Data/Inspiration.json'));
app.use('/Data/Projects.json', express.static('Data/Projects.json'));
app.use('/Data/Tutorials', express.static('Data/Tutorials'));

// Routing
app.use(express.json());
app.use(cookieParser());
app.get('/', (req, res) => {
  res.sendFile("Public/index.html");
});
app.use('/API', API);

// Start the server
var connection = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

// !!!! DELETE IN PRODUCTION !!!!!
app.get('/terminate', (req, res) => {
  connection.close();
  res.send('Terminated');
  console.log("Terminated");
  process.exit(1);
});
app.get('/restart', async (req, res) => {
  await connection.close();
  connection = app.listen(port, () => {
    console.log(`Server restarted on port ${port}`);
  });
  res.send("Restarted")
});
// Delete along with the Setup.js file
// !!!! DELETE IN PRODUCTION !!!!!