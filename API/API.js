const express = require('express');
const router = express.Router();
const validator = require('validator');

// Connect the private API
const PrivateAPI = require('./Private/Private.js');
router.use("/Private", PrivateAPI);

// Public API
const Login = require('../Utils/Login.js');
const DB = require('../Utils/DB.js');

function ReturnError(res, error) {
    res.status(400);
    res.send(error);
}

router.post('/Login', async (req, res) => {
    var data = req.body;

    if (data.username == undefined)
        return ReturnError(res, "Specificeer een gebruikersnaam");
    else if (data.username.length > 255)
        return ReturnError(res, "Gebruikersnaam kan niet langer dan 255 karakters zijn");
    else if (data.username.indexOf('"') > -1)
        return ReturnError(res, "Gebruikersnaam kan niet \" erin hebben");
    username = data.username;

    if (data.password == undefined)
        return ReturnError(res, "Specificeer een wachtwoord");
    else if (data.password.length != 44)
        return ReturnError(res, "Wachtwoord moet 44 karakters zijn");
    else if (!validator.isBase64(data.password))
        return ReturnError(res, "Wachtwoord moet base64 encoded zijn");
    password = data.password;

    if (!Login.ValidatePassword(username, atob(password))) {
        res.status(401);
        res.send("Verkeerde credentials");
        return;
    }
    // Correct password - give user the correct cookies
    if (await Login.CheckSession(req, res, false)) {
        res.status(401);
        res.send("Al ingelogd");
        return;
    }

    await Login.CreateSession(res, username);
    res.send("Correct!!!");
});
router.post('/SuggestProject', async (req, res) => {
    var data = req.body;

    if (data.projectName == undefined)
        return ReturnError(res, "Specificeer een project naam");
    else if (data.projectName.length > 255)
        return ReturnError(res, "Project naam kan niet langer dan 255 karakters zijn");
    else if (data.projectName.indexOf('"') > -1)
        return ReturnError(res, "Project naam kan niet \" erin hebben");
    projectName = data.projectName;

    if (data.projectDescription == undefined)
        return ReturnError(res, "Specificeer een project omschrijving");
    else if (data.projectDescription.length > 65535)
        return ReturnError(res, "Project omschrijving kan niet langer dan 65535 karakters zijn");
    else if (data.projectDescription.indexOf('"') > -1)
        return ReturnError(res, "Project omschrijving kan niet \" erin hebben");
    projectDescription = data.projectDescription;

    if (data.amountLinks == undefined)
        return ReturnError(res, "Specificeer de hoeveelheid linkjes");
    else if (!Number.isInteger(data.amountLinks))
        return ReturnError(res, "Hoeveelheid linkjes moet een nummer zijn");
    amountLinks = parseInt(data.amountLinks, 10);

    links = [];
    combinedLength = 0;
    for (var i = 1; i <= amountLinks; i++) {
        if (data["link" + i.toString()] == undefined)
            return ReturnError(res, "Specificeer link " + i);
        else if (data["link" + i.toString()].length > 255)
            return ReturnError(res, "Link mag niet langer zijn dan 255 karakters");
        else if (data["link" + i.toString()].indexOf('"') > -1)
            return ReturnError(res, "Link kan niet \" erin hebben");
        else if(!validator.isURL(data["link" + i.toString()]))
            return ReturnError(res, "Link moet valide zijn");
        links.push(data["link" + i.toString()]);

        combinedLength += data["link" + i.toString()].length + 3;
    }
    if (combinedLength > 65535)
        return ReturnError("Gecombineerde lengte van linkjes kan niet langer dan 65535 karakters zijn");

    if (data.projectSuggestor == undefined)
        return ReturnError(res, "Specificeer het persoon die dit voorsteld");
    else if (data.projectSuggestor.length > 255)
        return ReturnError(res, "Persoon die het voorsteld kan niet langer dan 255 karakters zijn");
    else if (data.projectSuggestor.indexOf('"') > -1)
        return ReturnError(res, "Persoon die het voorsteld kan niet \" erin hebben");
    projectSuggestor = data.projectSuggestor;

    if (data.projectSuggestorEmail == undefined)
        return ReturnError(res, "Specificeer de email van het persoon die dit voorsteld");
    else if (data.projectSuggestorEmail.length > 255)
        return ReturnError(res, "Email van het persoon die het voorsteld kan niet langer dan 255 karakters zijn");
    else if (!validator.isEmail(data.projectSuggestorEmail))
        return ReturnError(res, "Specificeer een valide email");
    else if (data.projectSuggestorEmail.indexOf('"') > -1)
        return ReturnError(res, "Email van het persoon die het voorsteld kan niet \" erin hebben");
    projectSuggestorEmail = data.projectSuggestorEmail;

    var json = JSON.stringify({
        projectName: projectName,
        projectDescription: projectDescription,
        links: links,
        projectSuggestor: projectSuggestor,
        projectSuggestorEmail: projectSuggestor
    });

    DB.CreateProjectSuggestion(json);

    res.send('Project is aangevraagd!');
});

module.exports = router;