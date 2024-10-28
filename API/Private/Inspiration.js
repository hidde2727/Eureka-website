const express = require('express');
const fs = require('node:fs/promises');

const DB = require("../../Utils/DB.js");
const Login = require("../../Utils/Login.js");

const router = express.Router();

router.use(async (req, res, next) => {
    if(!(await Login.HasUserPermission("modify_inspiration"))) {
        res.status(401);
        res.send("Geen permissie voor dit deel van de API");
        return;
    }
    next();
});

// Absolutely copied from https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-an-array-of-objects
// When the host upgrades to nodejs 21 then you can use Object.groupBy
function Groupby(list) {
    return list.reduce(function(rv, x) {
        (rv[x["category"]] = rv[x["category"]] || []).push({"name":x["name"], color:x["color"]});
        return rv;
    }, {});
};
  
async function GetAllSortedLabels() {
    labels = await DB.GetAllLabels();
    return Groupby(labels);
}
async function RegenerateInspiration() {
    [labels, inspiration] = await Promise.all([
        GetAllSortedLabels(),
        DB.GetAllInspiration()
    ]);
    await fs.writeFile("./Data/Inspiration.json", JSON.stringify({"labels":labels, "inspiration":inspiration}));
}

function ReturnError(res, error) {
    res.status(400);
    res.send(error);
}

router.put("/AddCategory", async (req, res) => {
    const body = req.body;
    if(body.name == undefined)
        return ReturnError(res, "Specificeer een naam");
    else if(body.name.length > 255)
        return ReturnError(res, "Naam kan niet langer dan 255 karakters zijn");

    if(await DB.DoesCategoryExist(body.name))
        return ReturnError(res, "Bestaad al");

    await DB.CreateCategory(body.name);
    await RegenerateInspiration();

    res.send("succes!");
});
router.put("/AddLabel", async (req, res) => {
    const body = req.body;

    if(body.category == undefined)
        return ReturnError(res, "Specificeer een categorie");
    else if(body.category.length > 255)
        return ReturnError(res, "Categorie kan niet langer dan 255 karakters zijn");
    else if(!(await DB.DoesCategoryExist(body.category)))
        return ReturnError(res, "Categorie bestaad niet");

    if(body.name == undefined)
        return ReturnError(res, "Specificeer een naam");
    else if(body.name.length > 255)
        return ReturnError(res, "Naam kan niet langer dan 255 karakters zijn");
    else if(await DB.DoesLabelExist(body.category, body.name))
        return ReturnError(res, "Naam bestaad al in deze categorie");

    if(body.color == undefined)
        return ReturnError(res, "Specificeer een naam");
    else if(body.color.length > 3)
        return ReturnError(res, "Kleur kan niet langer dan 3 karakters zijn");
    else if(body.color < 0 || body.color > 360)
        return ReturnError(res, "Kleur moet tussen 0 en 360 zijn");

    await DB.CreateLabel(body.category, body.name, body.color);
    await RegenerateInspiration();

    res.send("succes!");
});
router.put("/EditLabel", async (req, res) => {
    const body = req.body;

    if(body.category == undefined)
        return ReturnError(res, "Specificeer een categorie");
    else if(body.category.length > 255)
        return ReturnError(res, "Categorie kan niet langer dan 255 karakters zijn");
    else if(!(await DB.DoesCategoryExist(body.category)))
        return ReturnError(res, "Categorie bestaad niet");

    if(body.name == undefined)
        return ReturnError(res, "Specificeer een naam");
    else if(body.name.length > 255)
        return ReturnError(res, "Naam kan niet langer dan 255 karakters zijn");
    else if(!(await DB.DoesLabelExist(body.category, body.name)))
        return ReturnError(res, "Label bestaad niet");

    if(body.newName == undefined)
        return ReturnError(res, "Specificeer inhoud");
    else if(body.newName.length > 255)
        return ReturnError(res, "Inhoud kan niet langer dan 255 karakters zijn");

    await DB.SetLabelName(body.category, body.name, body.newName);
    await RegenerateInspiration();

    res.send("succes!");
});
router.put("/DeleteLabel", async (req, res) => {
    const body = req.body;

    if(body.category == undefined)
        return ReturnError(res, "Specificeer een categorie");
    else if(body.category.length > 255)
        return ReturnError(res, "Categorie kan niet langer dan 255 karakters zijn");
    else if(!(await DB.DoesCategoryExist(body.category)))
        return ReturnError(res, "Categorie bestaad niet");

    if(body.name == undefined)
        return ReturnError(res, "Specificeer een naam");
    else if(body.name.length > 255)
        return ReturnError(res, "Naam kan niet langer dan 255 karakters zijn");
    else if(!(await DB.DoesLabelExist(body.category, body.name)))
        return ReturnError(res, "Label bestaad niet");

    await DB.DeleteLabel(body.category, body.name, body.color);
    await RegenerateInspiration();

    res.send("succes!");
});

module.exports = router;