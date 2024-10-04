const express = require('express');
const cookieParser = require('cookie-parser');

const API = require('./API/API.js');
const DB = require('./Utils/DB.js');
const Login = require('./Utils/Login.js');

const app = express();
const port = 3000;

DB.InitDatabase();
Login.SetupLoginSystem();

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
app.get('/setup', async (req, res) => {
  const Setup = require('./Utils/Setup');
  await Setup();
  res.send("Setup done!");
});
// Delete along with the Setup.js file
// !!!! DELETE IN PRODUCTION !!!!!