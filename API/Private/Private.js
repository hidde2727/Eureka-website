const express = require('express');

const router = express.Router();

// Make sure the API user is logged in
const Login = require('../../Utils/Login.js');
router.use(async (req, res, next) => {
    if(!(await Login.CheckSession(req, res))) {
        res.status(401);
        res.send('Log in voor dit deel van de API');
        return;
    }
    next();
});

// Connect the other APIS
const User = require('./User.js');
const Suggestion = require('./Suggestion.js');
const Files = require('./Files.js');
const Inspiration = require('./Inspiration.js');
const Project = require('./Project.js');
const Self = require('./Self.js');
const Settings = require('./Settings.js');
router.use('/User', User);
router.use('/Suggestion', Suggestion);
router.use('/Files', Files);
router.use('/Inspiration', Inspiration);
router.use('/Project', Project);
router.use('/Self', Self);
router.use('/Settings', Settings);

module.exports = router;