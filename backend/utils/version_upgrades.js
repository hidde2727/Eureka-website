import fs from 'node:fs';

import * as DB from './db.js';
import Config from './config.js';

function IsLaterVersion(timepoint, version) {
    const timepointSplit = timepoint.split('.').map((part) => parseInt(part));
    if(timepointSplit[0] > version[0]) return true;
    if(timepointSplit[1] > version[1]) return true;
    if(timepointSplit[2] > version[2]) return true;
    return false;
}

export default async function Upgrade() {
    let currentSoftwareVersion = JSON.parse(fs.readFileSync('./package.json')).version;

    let version = '';
    if (!fs.existsSync('./data/')) fs.mkdirSync('./data');
    if (!fs.existsSync('./data/private')) fs.mkdirSync('./data/private');
    if (fs.existsSync('./data/private/version.txt')) {
        version = fs.readFileSync('./data/private/version.txt');
    } else {
        fs.writeFileSync('./data/private/version.txt', currentSoftwareVersion);
        version = currentSoftwareVersion;
    }

    try {
        version = version.toString().split('.').map((part) => parseInt(part));
        if(version.length != 3) throw new Error('Current version is illegal!');
    } catch(err) {
        throw new Error('Current version is illegal!');
    }

    if(IsLaterVersion('1.0.1', version)) version = [1,0,1];
    if(IsLaterVersion('1.1.0', version)) {
        DB.ExecuteStatement(`ALTER DATABASE ${Config.db.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        DB.ExecuteStatement(`ALTER TABLE files CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        DB.ExecuteStatement(`ALTER TABLE inspiration CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        DB.ExecuteStatement(`ALTER TABLE labels_to_inspiration CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        DB.ExecuteStatement(`ALTER TABLE labels CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        DB.ExecuteStatement(`ALTER TABLE logs CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        DB.ExecuteStatement(`ALTER TABLE projects CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        DB.ExecuteStatement(`ALTER TABLE sessions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        DB.ExecuteStatement(`ALTER TABLE suggestion_votes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        DB.ExecuteStatement(`ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        version = [1,1,0];
    }

    if(currentSoftwareVersion != version.join('.')) throw new Error('Versie upgrade mislukt!');
    fs.writeFileSync('./data/private/version.txt', version.join('.'));
}