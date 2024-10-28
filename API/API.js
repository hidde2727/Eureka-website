const express = require('express');
const validator = require('validator');

const router = express.Router();

// Connect the private API
const PrivateAPI = require('./Private/Private.js');
router.use("/Private", PrivateAPI);

// Public API
const Login = require('../Utils/Login.js');
const DB = require('../Utils/DB.js');
const INS = require('../Utils/Inspiration.js');

function ReturnError(res, error) {
    res.status(400);
    res.send(error);
}

router.post('/Login', async (req, res) => {
    var data = req.body;
    if(data.length > 255+29+14) return ReturnError(res, "Aanvraag te groot");

    if (data.username == undefined)
        return ReturnError(res, "Specificeer een gebruikersnaam");
    else if (data.username.length > 255)
        return ReturnError(res, "Gebruikersnaam kan niet langer dan 255 karakters zijn");
    var username = data.username;

    if (data.password == undefined)
        return ReturnError(res, "Specificeer een wachtwoord");
    else if (data.password.length != 44)
        return ReturnError(res, "Wachtwoord moet 44 karakters zijn");
    else if (!validator.isBase64(data.password))
        return ReturnError(res, "Wachtwoord moet base64 encoded zijn");
    var password = data.password;

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
    if(data.length > 1000000) return ReturnError(res, "Aanvraag te groot");

    if (data.projectName == undefined)
        return ReturnError(res, "Specificeer een project naam");
    else if (data.projectName.length > 255)
        return ReturnError(res, "Project naam kan niet langer dan 255 karakters zijn");
    var projectName = data.projectName;

    if (data.projectDescription == undefined)
        return ReturnError(res, "Specificeer een project omschrijving");
    else if (data.projectDescription.length > 65535)
        return ReturnError(res, "Project omschrijving kan niet langer dan 65535 karakters zijn");
    var projectDescription = data.projectDescription;

    if(data.links.length > 3) return ReturnError(res, "Maximum hoeveelheid linkjes is 3");

    var links = [null, null, null];
    for (var i = 1; i <= data.links.length; i++) {
        if (data.links[i] == undefined)
            return ReturnError(res, "Specificeer link " + i);
        else if (data.links[i].length > 255)
            return ReturnError(res, "Link mag niet langer zijn dan 255 karakters");
        else if(!validator.isURL(data.links[i]))
            return ReturnError(res, "Link moet valide zijn");
        links[i] = data.links[i];
    }

    if (data.projectSuggestor == undefined)
        return ReturnError(res, "Specificeer het persoon die dit voorsteld");
    else if (data.projectSuggestor.length > 255)
        return ReturnError(res, "Persoon die het voorsteld kan niet langer dan 255 karakters zijn");
    var projectSuggestor = data.projectSuggestor;

    if (data.projectSuggestorEmail == undefined)
        return ReturnError(res, "Specificeer de email van het persoon die dit voorsteld");
    else if (data.projectSuggestorEmail.length > 255)
        return ReturnError(res, "Email van het persoon die het voorsteld kan niet langer dan 255 karakters zijn");
    else if (!validator.isEmail(data.projectSuggestorEmail))
        return ReturnError(res, "Specificeer een valide email");
    var projectSuggestorEmail = data.projectSuggestorEmail;

    DB.CreateProject(
        "Origineel", "Originele suggestie", projectSuggestor, null,
        projectName, projectDescription,
        urls[0], urls[1], urls[2],
        projectSuggestor, "-", projectSuggestorEmail
    );

    res.send('Project is aangevraagd!');
});

router.post('/SuggestInspiration', async (req, res) => {
    var data = req.body;
    if(data.length > 1000000) return ReturnError(res, "Aanvraag te groot");

    if (data.url == undefined)
        return ReturnError(res, "Specificeer een url");
    else if (data.url.length > 255)
        return ReturnError(res, "Url kan niet langer dan 255 karakters zijn");
    else if(!validator.isURL(data.url))
        return ReturnError(res, "Url moet valide zijn");
    var urlString = data.url;

    if(data.description == undefined)
        return ReturnError(res, "Specificeer een omschrijving");
    else if (data.description.length > 65535)
        return ReturnError(res, "Omschrijving kan niet langer dan 65535 karakters zijn");
    var description = data.description;

    if (data.recommendation1 == undefined)
        return ReturnError(res, "Specificeer een url");
    else if (data.recommendation1.length > 255)
        return ReturnError(res, "Url kan niet langer dan 255 karakters zijn");
    else if(!validator.isURL(data.recommendation1))
        return ReturnError(res, "Url moet valide zijn");
    var recommendation1 = data.recommendation1;

    if (data.recommendation2 == undefined)
        return ReturnError(res, "Specificeer een url");
    else if (data.recommendation2.length > 255)
        return ReturnError(res, "Url kan niet langer dan 255 karakters zijn");
    else if(!validator.isURL(data.recommendation2))
        return ReturnError(res, "Url moet valide zijn");
    var recommendation2 = data.recommendation2;

    var labels = [];
    if(data.labels == undefined)
        return ReturnError(res, "Specificeer labels");
    data.labels.forEach((label, index) => {
        if (label == undefined) 
            return ReturnError(res, "Specificeer label id " + index);
        else if(Number.isInteger(label)) 
            return ReturnError(res, "Specifier valide label id");
        labels.push(label);
    });

    var urlInfo = await INS.GetURLInfo(urlString);
    DB.CreateInspiration(
        "Origineel", "Originele suggestie", "-", null,
        urlInfo.type, urlInfo.name, description, urlInfo.ID, urlString, 
        (await INS.GetURLInfo(recommendation1)).json, 
        (await INS.GetURLInfo(recommendation2)).json, 
        urlInfo.json
    );

    res.send('Inspiratie is aangevraagd!');
});
router.put('/RetrieveURLInfo', async (req, res) => {
    var data = req.body;

    if (data.url == undefined)
        return ReturnError(res, "Specificeer een url");
    else if(data.url.length > 255)
        return ReturnError(res, "URL moet maximaal 255 karakters zijn");
    else if(!validator.isURL(data.url))
        return ReturnError(res, "Specificeer een valide url");

    res.send(JSON.stringify(await INS.GetURLInfo(data.url)));
});

module.exports = router;