import validator from 'validator';
import * as DB from './db.js';
import * as Login from './login.js';

export function ReturnError(res, error, errorCode=400) {
    res.status(errorCode);
    res.send(error);

    return true;
}

/* + ======================================================================== +
/* | General                                                                  |
/* + ========================================================================*/
export function CheckEmail(res, email) {
    if (email == undefined)
        return ReturnError(res, 'Specificeer de email');
    else if (email.length > 255)
        return ReturnError(res, 'Email  kan niet langer dan 255 karakters zijn');
    else if (!validator.isEmail(email))
        return ReturnError(res, 'Specificeer een valide email');

    return false;
}
export function CheckLink(res, link) {
    if (link == undefined)
        return ReturnError(res, 'Specificeer link');
    else if (link.length > 255)
        return ReturnError(res, 'Link mag niet langer zijn dan 255 karakters');
    else if(!validator.isURL(link))
        return ReturnError(res, 'Link moet valide zijn');

    return false;
}
export function CheckBoolean(res, boolean, canBeString=true) {
    if(boolean == undefined)
        return ReturnError(res, 'Specificeer boolean');
    else if(!canBeString &&  boolean !== true && boolean !== false)
        return ReturnError(res, 'Boolean moet true of false zijn');
    else if(boolean !== 'false' && boolean !== 'true' && boolean !== true && boolean !== false)
        return ReturnError(res, 'Boolean moet true of false zijn');

    return false;
}
export function CheckInteger(res, int, canBeString=false) {
    if(int == undefined)
        return ReturnError(res, 'Specificeer integer');
    else if(!canBeString && !Number.isInteger(int))
        return ReturnError(res, 'Integer moet een volledig getal zijn');
    else if(!Number.isInteger(int) && !validator.isInt(int))
        return ReturnError(res, 'Integer moet een volledig getal zijn');

    return false;
}


/* + ======================================================================== +
/* | User                                                                     |
/* + ========================================================================*/
export function CheckUsername(res, username) {
    if (username == undefined)
        return ReturnError(res, 'Specificeer een gebruikersnaam');
    else if (username.length > 255)
        return ReturnError(res, 'Gebruikersnaam kan niet langer dan 255 karakters zijn');

    return false;
}
export async function CheckUsernameU(res, username) {
    if (CheckUsername(res, username)) return;
    else if(await DB.DoesUsernameExist(username))
        return ReturnError(res, 'Gebruikersnaam al in gebruik');

    return false;
}
export async function CheckUsernameNS(res, username) {
    if(CheckUsername(res, username)) return;
    else if((await Login.GetSessionUsername(req)) == data.username) 
        return ReturnError(res, 'Can\'t modify self');
}
export function CheckPassword(res, password) {
    if (password == undefined)
        return ReturnError(res, 'Specificeer een wachtwoord');
    else if (password.length != 44)
        return ReturnError(res, 'Wachtwoord moet 44 karakters zijn');
    else if (!validator.isBase64(password))
        return ReturnError(res, 'Wachtwoord moet base64 encoded zijn');

    return false;
}
export function IsNotSelf(res, req, id) {
    if(Login.GetSessionUserID(req) == id) 
        return ReturnError(res, 'Kan niet eigen id aanpassen');

    return false;
}


/* + ======================================================================== +
/* | Suggestions                                                              |
/* + ========================================================================*/
export function CheckSuggestionName(res, name) {
    if (name == undefined)
        return ReturnError(res, 'Specificeer een suggestie naam');
    else if (name.length > 255)
        return ReturnError(res, 'Suggestie naam kan niet langer dan 255 karakters zijn');

    return false;
}
export function CheckSuggestionDescription(res, description) {
    if (description == undefined)
        return ReturnError(res, 'Specificeer een suggestie omschrijving');
    else if (description.length > 65535)
        return ReturnError(res, 'Suggestie omschrijving kan niet langer dan 65535 karakters zijn');

    return false;
}
export function CheckSuggestorName(res, name) {
    if (name == undefined)
        return ReturnError(res, 'Specificeer het persoon die dit voorsteld');
    else if (name.length > 255)
        return ReturnError(res, 'Persoon die het voorsteld kan niet langer dan 255 karakters zijn');

    return false;
}
export function CheckSuggestorEmail(res, email) {
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
export function CheckLabelName(res, name) {
    if(name == undefined || name.length == 0) 
        return ReturnError(res, 'Specificeer een label naam');
    else if(name.length > 255)
        return ReturnError(res, 'Label naam kan maximaal 255 karakters zijn');

    return false;
}


/* + ======================================================================== +
/* | Files                                                                    |
/* + ========================================================================*/
export function CheckFilename(res, filename) {
    if(filename == undefined) 
        return ReturnError(res, 'Specificeer een file naam');
    else if(filename == 'id')
        return ReturnError(res, 'Naam kan niet id zijn');
    else if(filename == 'utid')
        return ReturnError(res, 'Naam kan niet utid zijn');
    else if(filename == 'placeholder')
        return ReturnError(res, 'Naam kan niet placeholder zijn');
    else if(filename.indexOf('/') > -1)
        return ReturnError(res, 'File naam kan niet / bevatten');
    else if(filename.length > 255)
        return ReturnError(res, 'File naam kan niet langer dan 255 karakters zijn');

    return false;
}


/* + ======================================================================== +
/* | ID's                                                                     |
/* + ========================================================================*/
export function CheckID(res, id, canBeNull=false) {
    if (id === undefined)
        return ReturnError(res, 'Specificeer een ID');
    else if(canBeNull && id == null) return false;
    else if(typeof id == 'number') return false;
    else if(!(typeof id === 'string') && !(id instanceof String))
        return ReturnError(res, 'ID moet een string of number zijn');
    else if(!validator.isInt(id) || id<0)
        return ReturnError(res, 'Specifier valide ID');

    return false;
}
export function CheckUUID(res, uuid) {
    if (uuid === undefined)
        return ReturnError(res, 'Specificeer een uuid');
    else if(typeof uuid == 'number') return false;
    else if(!(typeof uuid === 'string') && !(uuid instanceof String))
        return ReturnError(res, 'ID moet een string of number zijn');
    else if(!validator.isInt(uuid) || uuid<0) 
        return ReturnError(res, 'Specifier valide uuid');

    return false;
}


/* + ======================================================================== +
/* | Settings                                                                 |
/* + ========================================================================*/
export function CheckIntSettings(res, int, name) {
    if(int == undefined) 
        return ReturnError(res, 'Specificeer ' + name);
    else if(!validator.isInt(int)) 
        return ReturnError(res, name + ' moet een integer zijn');

    return false;
}
export function CheckPercentageSettings(res, percent, name) {
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
export function CheckSuggestionType(res, type) {
    if(type == undefined) 
        return ReturnError(res, 'Specificeer het type suggestie');
    else if(type != 'project' && type != 'inspiration') 
        return ReturnError(res, 'Specificeer valid type suggestie');

    return false;
}
export function CheckVoteValue(res, value) {
    if(value == undefined) 
        return ReturnError(res, 'Specificeer de vote');
    else if(value != 1 && value != -1) 
        return ReturnError(res, 'Specificeer valide vote');

    return false;
}
export function CheckIsAdminVote(res, admin) {
    if(admin == undefined) 
        return ReturnError(res, 'Specificeer of het een admin vote is');
    else if(admin != 0 && admin != 1) 
        return ReturnError(res, 'Specificeer valide admin');

    return false;
}


/* + ======================================================================== +
/* | Permissie                                                                |
/* + ========================================================================*/
export function CheckPermission(res, permission, name) {
    if(permission == undefined)
        return ReturnError(res, 'Specificeer permissie voor ' + name);
    else if(permission !== false && permission !== true)
        return ReturnError(res, 'Permissie moet true of false zijn');

    return false;
}