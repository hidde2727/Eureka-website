const express = require('express');
const router = express.Router();

const DB = require("../../Utils/DB.js");
const Login = require("../../Utils/Login.js");

function GetById(suggestions, id) {
    for(var [key, value] of suggestions) {
        if(value.id == id)
            return value;
    }
}
router.get("/GetAll", async (req, res) => {
    suggestions = await DB.GetVotableRequestsForUser(await Login.GetSessionUserID());

    var output = [];
    for(var i = 0; i < suggestions.length; i++) {
        var originalJSON = null;
        var suggestionType = "";
        if(suggestions[i].original_suggestion != null) {
            originalJSON = GetById(suggestions, suggestions[i].original_suggestion).json;
            suggestionType = "New" + suggestions[i].type + "+change";
        }
        //else if(suggestions[i].original_inspiration != null) {
        //    originalJSON = (await DB.GetInspirationByID(suggestions[i].original_inspiration)).json;
        //    suggestionType = "ChangeInspiration";
        // }
        //else if(suggestions[i].original_project != null) {
        //    originalJSON = GetById(suggestions, suggestions[i].original_suggestion).json;
        //    suggestionType = "ChangeProject";
        // }
        else {
            originalJSON = suggestions[i].json;
            suggestionType = "New" + suggestions[i].type;
        }

        output.push({ 
            id: suggestions[i].id,
            type: suggestions[i].type,
            suggestionType: suggestionType,
            json: JSON.parse(suggestions[i].json),
            originalJSON: JSON.parse(originalJSON)
        });
    }
    res.json(output);
});

module.exports = router;