const validator = require('validator');
const DB = require('../Utils/DB.js');

function ReturnError(res, error) {
    res.status(400);
    res.send(error);

    return true;
}

/* + ======================================================================== +
/* | General                                                                  |
/* + ========================================================================*/
function CheckEmail(res, email) {
    if (email == undefined)
        return ReturnError(res, 'Specificeer de email');
    else if (email.length > 255)
        return ReturnError(res, 'Email  kan niet langer dan 255 karakters zijn');
    else if (!validator.isEmail(email))
        return ReturnError(res, 'Specificeer een valide email');

    return false;
}
function CheckLink(res, link) {
    if (link == undefined)
        return ReturnError(res, 'Specificeer link');
    else if (link.length > 255)
        return ReturnError(res, 'Link mag niet langer zijn dan 255 karakters');
    else if(!validator.isURL(link))
        return ReturnError(res, 'Link moet valide zijn');

    return false;
}


/* + ======================================================================== +
/* | User                                                                     |
/* + ========================================================================*/
function CheckUsername(res, username) {
    if (username == undefined)
        return ReturnError(res, 'Specificeer een gebruikersnaam');
    else if (username.length > 255)
        return ReturnError(res, 'Gebruikersnaam kan niet langer dan 255 karakters zijn');

    return false;
}
async function CheckUsernameU(res, username) {
    if (CheckUsername(res, username)) return;
    else if(await DB.DoesUsernameExist(username))
        return ReturnError(res, 'Gebruikersnaam al in gebruik');

    return false;
}
async function CheckUsernameNS(res, username) {
    if(CheckUsername(res, username)) return;
    else if((await Login.GetSessionUsername(req)) == data.username) 
        return ReturnError(res, 'Can\'t modify self');
}
function CheckPassword(res, password) {
    if (password == undefined)
        return ReturnError(res, 'Specificeer een wachtwoord');
    else if (password.length != 44)
        return ReturnError(res, 'Wachtwoord moet 44 karakters zijn');
    else if (!validator.isBase64(password))
        return ReturnError(res, 'Wachtwoord moet base64 encoded zijn');

    return false;
}


/* + ======================================================================== +
/* | Suggestions                                                              |
/* + ========================================================================*/
function CheckSuggestionName(res, name) {
    if (name == undefined)
        return ReturnError(res, 'Specificeer een suggestie naam');
    else if (name.length > 255)
        return ReturnError(res, 'Suggestie naam kan niet langer dan 255 karakters zijn');

    return false;
}
function CheckSuggestionDescription(res, description) {
    if (description == undefined)
        return ReturnError(res, 'Specificeer een suggestie omschrijving');
    else if (description.length > 65535)
        return ReturnError(res, 'Suggestie omschrijving kan niet langer dan 65535 karakters zijn');

    return false;
}
function CheckSuggestorName(res, name) {
    if (name == undefined)
        return ReturnError(res, 'Specificeer het persoon die dit voorsteld');
    else if (name.length > 255)
        return ReturnError(res, 'Persoon die het voorsteld kan niet langer dan 255 karakters zijn');

    return false;
}
function CheckSuggestorEmail(res, email) {
    if (email == undefined)
        return ReturnError(res, 'Specificeer de email van het persoon die dit voorsteld');
    else if (email.length > 255)
        return ReturnError(res, 'Email van het persoon die het voorsteld kan niet langer dan 255 karakters zijn');
    else if (!validator.isEmail(email))
        return ReturnError(res, 'Specificeer een valide email');

    return false;
}


/* + ======================================================================== +
/* | Inspiration                                                              |
/* + ========================================================================*/
function CheckLabelID(res, labelID) {
    if (labelID == undefined) 
        return ReturnError(res, 'Specificeer label id ' + labelID);
    else if(!validator.isInt(labelID)) 
        return ReturnError(res, 'Specifier valide label id');

    return false;
}


/* + ======================================================================== +
/* | Files                                                                    |
/* + ========================================================================*/
function CheckFilePath(res, filepath) {
    if (filepath == undefined)
        return ReturnError(res, 'Specificeer een file pad');
    else if (filepath.length > 255)
        return ReturnError(res, 'File pad kan niet langer dan 255 karakters zijn');
    else if(filepath.indexOf('../') > -1)
        return ReturnError(res, 'File pad kan niet ../ erin hebben');
    else if(filepath.indexOf('..\\') > -1)
        return ReturnError(res, 'File pad kan niet ..\\ erin hebben');

    return false;
}
function CheckBlob(res, blob, maxSize=1333333) {
    if (blob == undefined)
        return ReturnError(res, 'Specificeer een blob');
    else if (blob.length > maxSize)
        return ReturnError(res, 'Blob mag niet groter dan 1Mb zijn');
    else if (!validator.isBase64(blob))
        return ReturnError(res, 'Blob moet base64 encoded zijn');

    return false;
}


/* + ======================================================================== +
/* | ID's                                                                     |
/* + ========================================================================*/
function CheckID(res, projectID) {
    if (projectID == undefined)
        return ReturnError(res, 'Specificeer een project ID');
    else if(typeof(uuid) == 'number') return false;
    else if(!validator.isInt(projectID)) 
        return ReturnError(res, 'Specifier valide project ID');

    return false;
}
function CheckUUID(res, uuid) {
    if (uuid == undefined)
        return ReturnError(res, 'Specificeer een uuid');
    else if(typeof(uuid) == 'number') return false;
    else if(!validator.isInt(uuid)) 
        return ReturnError(res, 'Specifier valide uuid');

    return false;
}


/* + ======================================================================== +
/* | Settings                                                                 |
/* + ========================================================================*/
function CheckIntSettings(res, int, name) {
    if(int == undefined) 
        return ReturnError(res, 'Specificeer ' + name);
    else if(!validator.isInt(int)) 
        return ReturnError(res, name + ' moet een integer zijn');

    return false;
}
function CheckPercentageSettings(res, percent, name) {
    if(percent == undefined) return ReturnError(res, 'Specificeer ' + name);
    else if(
        (percent.substr(percent.length - 1) != '%' && !validator.isInt(percent)) || 
        (percent.substr(percent.length - 1) == '%' && !validator.isDecimal(percent.substr(0, percent.length - 1)))) 
    return ReturnError(res, name + ' moet een integer of percentage zijn');

    return false;
}


/* + ======================================================================== +
/* | Suggestions                                                              |
/* + ========================================================================*/
function CheckProjectType(res, type) {
    if(type == undefined) 
        return ReturnError(res, 'Specificeer het type suggestie');
    else if(type != 'project' && type != 'inspiration') 
        return ReturnError(res, 'Specificeer valid type suggestie');

    return false;
}
function CheckVoteValue(res, value) {
    if(value == undefined) 
        return ReturnError(res, 'Specificeer de vote');
    else if(value != 'accept' && value != 'deny') 
        return ReturnError(res, 'Specificeer valide vote');

    return false;
}
function CheckIsAdminVote(res, admin) {
    if(admin == undefined) 
        return ReturnError(res, 'Specificeer of het een admin vote is');
    else if(admin != 0 && admin != 1) 
        return ReturnError(res, 'Specificeer valide admin');

    return false;
}


/* + ======================================================================== +
/* | Permissie                                                                |
/* + ========================================================================*/
function CheckPermission(res, permission, name) {
    if(permission == undefined)
        return ReturnError(res, 'Specificeer permissie voor ' + name);
    else if(permission != '1' && permission != '0')
        return ReturnError(res, 'Permissie moet 1 of 0 zijn');

    return false;
}



module.exports = {
    ReturnError,

    CheckUsername, CheckUsernameU, CheckUsernameNS, CheckPassword, CheckEmail,
    CheckSuggestionName, CheckSuggestionDescription, CheckLink, CheckSuggestorName, CheckLabelID,
    CheckFilePath, CheckBlob,
    CheckID, CheckUUID,
    CheckIntSettings, CheckPercentageSettings,
    CheckProjectType, CheckVoteValue, CheckIsAdminVote,
    CheckPermission
};