const express = require('express');
const router = express.Router();
const validator = require('validator');

// Connect the private API
const PrivateAPI = require('./Private/Private.js');
router.use("/Private", PrivateAPI);

// Public API
const Login = require('../Utils/Login.js');
const DB = require('../Utils/DB.js');
const YT = require('../Utils/YT.js');

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
    else if (data.username.indexOf('"') > -1)
        return ReturnError(res, "Gebruikersnaam kan niet \" erin hebben");
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
    else if (data.projectName.indexOf('"') > -1)
        return ReturnError(res, "Project naam kan niet \" erin hebben");
    var projectName = data.projectName;

    if (data.projectDescription == undefined)
        return ReturnError(res, "Specificeer een project omschrijving");
    else if (data.projectDescription.length > 65535)
        return ReturnError(res, "Project omschrijving kan niet langer dan 65535 karakters zijn");
    else if (data.projectDescription.indexOf('"') > -1)
        return ReturnError(res, "Project omschrijving kan niet \" erin hebben");
    var projectDescription = data.projectDescription;

    if (data.amountLinks == undefined)
        return ReturnError(res, "Specificeer de hoeveelheid linkjes");
    else if (!Number.isInteger(data.amountLinks))
        return ReturnError(res, "Hoeveelheid linkjes moet een nummer zijn");
    var amountLinks = parseInt(data.amountLinks, 10);

    var links = [];
    var combinedLength = 0;
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
    var projectSuggestor = data.projectSuggestor;

    if (data.projectSuggestorEmail == undefined)
        return ReturnError(res, "Specificeer de email van het persoon die dit voorsteld");
    else if (data.projectSuggestorEmail.length > 255)
        return ReturnError(res, "Email van het persoon die het voorsteld kan niet langer dan 255 karakters zijn");
    else if (!validator.isEmail(data.projectSuggestorEmail))
        return ReturnError(res, "Specificeer een valide email");
    else if (data.projectSuggestorEmail.indexOf('"') > -1)
        return ReturnError(res, "Email van het persoon die het voorsteld kan niet \" erin hebben");
    var projectSuggestorEmail = data.projectSuggestorEmail;

    var json = JSON.stringify({
        projectName: projectName,
        projectDescription: projectDescription,
        links: links,
        projectSuggestor: projectSuggestor,
        projectSuggestorEmail: projectSuggestorEmail
    });

    DB.CreateProjectSuggestion(json);

    res.send('Project is aangevraagd!');
});

async function AddYoutubeJSON(json, videoID) {
    const value = await DB.DoesYTVideoExists(videoID);
    console.log(value);
    if(value) throw new Error("YT video already exists");

    const yt = await YT.GetGeneralInfo(videoID);
    json.videoID = videoID;
    json.title = yt.title;
    json.thumbnails = yt.thumbnails;
    json.channelTitle = yt.channelTitle;
    json.channelThumbnails = yt.channelThumbnails;
}

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

    var labels = [];
    if(data.labels == undefined)
        return ReturnError(res, "Specificeer labels");
    data.labels.forEach((label, index) => {
        if (label == undefined)
            return ReturnError(res, "Specificeer label " + index);
        else if(label.name == undefined)
            return ReturnError(res, "Specificeer een label naam");
        else if (label.name.length > 255)
            return ReturnError(res, "Label naam mag niet langer zijn dan 255 karakters");
        else if(label.category == undefined)
            return ReturnError(res, "Specificeer een label categorie");
        else if(label.category.length > 255)
            return ReturnError(res, "Label categorie mag niet langer zijn dan 255 karakters");
        labels.push({"name":label.name, "category":label.category});
    });

    var json = {
        url: urlString,
        labels: labels
    };
    // Modify the request if it is from a certain site
    try {
        var url = new URL(urlString);
        // Youtube based on: https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
        if(url.hostname === "youtube.be" || url.hostname === "www.youtube.be") 
            await AddYoutubeJSON(json, url.pathname);
        else if((url.hostname === "youtube.com" || url.hostname === "www.youtube.com" ) && (url.pathname.indexOf("/embed") == 0 || url.pathname.indexOf("/shorts") == 0))
            await AddYoutubeJSON(json, url.pathname.substring(url.pathname.indexOf('/')));
        else if((url.hostname === "youtube.com" || url.hostname === "www.youtube.com" ) && url.searchParams.has("v"))
            await AddYoutubeJSON(json, url.searchParams.get("v"));
        else if((url.hostname === "youtube.com" || url.hostname === "www.youtube.com" ) && url.searchParams.has("vi"))
            await AddYoutubeJSON(json, url.searchParams.get("vi"));
        else
            return ReturnError(res, "Illegale website string");
    } catch(err) { console.error(err); return ReturnError(res, "Bestaad al"); }

    DB.CreateInspirationSuggestion(JSON.stringify(json));

    res.send('Inspiratie is aangevraagd!');
});
router.put('/RetrieveVideoInfo', async (req, res) => {
    var data = req.body;

    if (data.videoID == undefined)
        return ReturnError(res, "Specificeer een videoID");

    res.send(JSON.stringify(await YT.GetGeneralInfo(data.videoID)));
});

module.exports = router;