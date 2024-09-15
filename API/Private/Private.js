const express = require('express');
const router = express.Router();

// Make sure the API user is logged in
const Login = require("../../Utils/Login.js");
router.use(async (req, res, next) => {
    if(!(await Login.CheckSession(req, res))) {
        res.status(401);
        res.send("Log in voor dit deel van de API");
        return;
    }
    next();
});

// Connect the other APIS
const Permission = require('./Permission.js');
const User = require('./User.js');
const Suggestion = require('./Suggestion.js');
router.use("/Permission", Permission);
router.use("/User", User);
router.use("/Suggestion", Suggestion);

// General Private API
router.get("/LogOut", async (req, res) => {
    await Login.RemoveSession(req, res);
    res.send("Succes");
});

module.exports = router;