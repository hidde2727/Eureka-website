const express = require('express');
const router = express.Router();
const fs = require('node:fs/promises');
const path = require("path");
const validator = require('validator');

const DB = require("../../Utils/DB.js");
const Login = require("../../Utils/Login.js");

router.use(async (req, res, next) => {
    if(!(await Login.HasUserPermission("add_files"))) {
        res.status(401);
        res.send("Geen permissie voor dit deel van de API");
        return;
    }
    next();
});

function ReturnError(res, error) {
    res.status(400);
    res.send(error);
}

router.put('/Add', async (req, res) => {
    var data = req.body;

    if (data.filePath == undefined)
        return ReturnError(res, "Specificeer een file pad");
    else if (data.filePath.length > 255)
        return ReturnError(res, "File pad kan niet langer dan 255 karakters zijn");
    else if (data.filePath.indexOf('"') > -1)
        return ReturnError(res, "File pad kan niet \" erin hebben");
    else if(data.filePath.indexOf('../') > -1)
        return ReturnError(res, "File pad kan niet ../ erin hebben");
    else if(data.filePath.indexOf('..\\') > -1)
        return ReturnError(res, "File pad kan niet ..\\ erin hebben");
    var filePath = data.filePath;

    if (data.blob == undefined)
        return ReturnError(res, "Specificeer een blob");
    else if (data.blob.length > 1333333)
        return ReturnError(res, "Blob mag niet groter dan 1Mb zijn");
    else if (!validator.isBase64(data.blob))
        return ReturnError(res, "Blob moet base64 encoded zijn");
    var blob = Buffer.from(data.blob, 'base64');

    var dir = path.dirname('./Data/Tutorials/' + filePath);
    try {
        try { await fs.access(dir, fs.constants.X_OK); }
        catch(err) { await fs.mkdir(dir, { recursive: true }); }
        await fs.writeFile('./Data/Tutorials' + filePath, blob);
    } catch (err) {
        console.log(err);
        return ReturnError(res, "Mislukt");
    }
    res.send("Toegevoegd!!!");
});
router.put('/RegenIndex', async (req, res) => {
    var allFiles = await fs.readdir("./Data/Tutorials/", {withFileTypes: true, recursive: true});
    var folderDict = {};
    allFiles.forEach((value, index) => {
        if(value.name == "contents.json")
            return;
        if(folderDict[value.parentPath] == undefined)
            folderDict[value.parentPath] = [];
        folderDict[value.parentPath].push(value.name);
    });
    for (var [key, value] of Object.entries(folderDict)) {
        fs.writeFile(key + "/contents.json", JSON.stringify(value));
    }
});

module.exports = router;