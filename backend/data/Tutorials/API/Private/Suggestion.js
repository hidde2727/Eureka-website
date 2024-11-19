const express = require('express');
const router = express.Router();

const DB = require("../../Utils/DB.js");
const Login = require("../../Utils/Login.js");

router.get("/GetAll", async (req, res) => {
    suggestions = await DB.GetVotableRequestsForUser(await Login.GetSessionUserID());

    var output = [];
    for(var i = 0; i < suggestions.length; i++) {
        output.push({ 
            id: suggestions[i].id,
            type: suggestions[i].type, 
            json: JSON.parse(suggestions[i].json)
        });
    }
    res.json(output);
});

module.exports = router;