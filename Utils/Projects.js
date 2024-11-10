const fs = require('node:fs');

const DB = require('./DB.js');

async function GenerateProjectJSON() {
    const projects = await DB.GetAllActiveProjects();
    const fileInfo = [];
    for(var i = 0; i < projects.length; i++) {
        fileInfo.push({
            uuid: projects[i].uuid,
            original_id: projects[i].original_id,
            name: projects[i].name,
            description: projects[i].description,
            url1: JSON.parse(projects[i].url1),
            url2: JSON.parse(projects[i].url2),
            url3: JSON.parse(projects[i].url3),
            requester: projects[i].requester,
            implementer: projects[i].requester
        });
    }
    if (!fs.existsSync('./Data/')) fs.mkdirSync('./Data');
    fs.writeFileSync('./Data/Projects.json', JSON.stringify(fileInfo));
}

module.exports = {
    GenerateProjectJSON
}