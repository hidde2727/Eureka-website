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
try {
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
    var [isValid, userID] = await Login.ValidatePassword(username, Buffer.from(password, 'base64'));
    if (!isValid) {
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

    await Login.CreateSession(res, userID);
    res.send("Correct!!!");
} catch(err) {
    res.status(500);
    res.send("Er is iets fout gegaan op de server");
    console.error(err.message);
}
});
router.post('/SuggestProject', async (req, res) => {
try {
    var data = req.body;
    if(data.length > 1000000) return ReturnError(res, "Aanvraag te groot");

    if (data.name == undefined)
        return ReturnError(res, "Specificeer een project naam");
    else if (data.name.length > 255)
        return ReturnError(res, "Project naam kan niet langer dan 255 karakters zijn");
    var name = data.name;

    if (data.description == undefined)
        return ReturnError(res, "Specificeer een project omschrijving");
    else if (data.description.length > 65535)
        return ReturnError(res, "Project omschrijving kan niet langer dan 65535 karakters zijn");
    var description = data.description;

    if(data.links.length > 3) return ReturnError(res, "Maximum hoeveelheid linkjes is 3");

    var links = [];
    for (var i = 1; i <= data.links.length; i++) {
        if (data.links[i] == undefined)
            continue;
        else if (data.links[i].length > 255)
            return ReturnError(res, "Link mag niet langer zijn dan 255 karakters");
        else if(!validator.isURL(data.links[i]))
            return ReturnError(res, "Link moet valide zijn");
        links.push(data.links[i]);
    }

    if (data.suggestorName == undefined)
        return ReturnError(res, "Specificeer het persoon die dit voorsteld");
    else if (data.suggestorName.length > 255)
        return ReturnError(res, "Persoon die het voorsteld kan niet langer dan 255 karakters zijn");
    var suggestor = data.suggestorName;

    if (data.suggestorEmail == undefined)
        return ReturnError(res, "Specificeer de email van het persoon die dit voorsteld");
    else if (data.suggestorEmail.length > 255)
        return ReturnError(res, "Email van het persoon die het voorsteld kan niet langer dan 255 karakters zijn");
    else if (!validator.isEmail(data.suggestorEmail))
        return ReturnError(res, "Specificeer een valide email");
    var suggestorEmail = data.suggestorEmail;

    await DB.CreateProject(
        "Origineel", "Originele suggestie", suggestor, null,
        name, description,
        links.length >= 1 ? JSON.stringify(await INS.GetURLInfo(links[0])) : null, 
        links.length >= 2 ? JSON.stringify(await INS.GetURLInfo(links[1])) : null, 
        links.length >= 3 ? JSON.stringify(await INS.GetURLInfo(links[2])) : null,
        suggestor, "-", suggestorEmail
    );

    res.send('Project is aangevraagd!');
} catch(err) {
    res.status(500);
    res.send("Er is iets fout gegaan op de server");
    console.error(err.message);
}
});

router.post('/SuggestInspiration', async (req, res) => {
try {
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

    var recommendations = [];
    if(data.recommendations.length > 3) return ReturnError(res, "Data mag niet meer dan 2 recommendaties bevatten");
    if(data.recommendations.length > 1) {
        if (data.recommendations[0] == undefined)
            return ReturnError(res, "Specificeer een url");
        else if (data.recommendations[0].length > 255)
            return ReturnError(res, "Url kan niet langer dan 255 karakters zijn");
        else if(!validator.isURL(data.recommendations[0]))
            return ReturnError(res, "Url moet valide zijn");
        recommendations.push(data.recommendations[0])
    }
    if(data.recommendations.length > 2) {
        if (data.recommendations[1] == undefined)
            return ReturnError(res, "Specificeer een url");
        else if (data.recommendations[1].length > 255)
            return ReturnError(res, "Url kan niet langer dan 255 karakters zijn");
        else if(!validator.isURL(data.recommendations[1]))
            return ReturnError(res, "Url moet valide zijn");
        recommendations.push(data.recommendations[1])
    }

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
    if(await DB.DoesInspirationExist(urlInfo.type, urlInfo.ID)) return ReturnError(res, "Inspiratie url zit al in onze database");
    await DB.CreateInspiration(
        "Origineel", "Originele suggestie", "-", null,
        urlInfo.type, urlInfo.name, description, urlInfo.ID, urlString, 
        recommendations.length >= 1 ? JSON.stringify(await INS.GetURLInfo(recommendations[0])) : null, 
        recommendations.length >= 2 ? JSON.stringify(await INS.GetURLInfo(recommendations[1])) : null, 
        JSON.stringify(urlInfo.json)
    );
    await DB.AddLabelsToLastInsertedInspiration(labels);

    res.send('Inspiratie is aangevraagd!');
} catch(err) {
    res.status(500);
    res.send("Er is iets fout gegaan op de server");
    console.error(err.message);
}
});
router.put('/RetrieveURLInfo', async (req, res) => {
try {
    var data = req.body;

    if (data.url == undefined)
        return ReturnError(res, "Specificeer een url");
    else if(data.url.length > 255)
        return ReturnError(res, "URL moet maximaal 255 karakters zijn");
    else if(!validator.isURL(data.url))
        return ReturnError(res, "Specificeer een valide url");

    try { res.send(JSON.stringify(await INS.GetURLInfo(data.url))); } 
    catch(err) { console.log(err.message); return ReturnError(res, err.message); }

} catch(err) {
    res.status(500);
    res.send("Er is iets fout gegaan op de server");
    console.error(err.message);
}
});

module.exports = router;