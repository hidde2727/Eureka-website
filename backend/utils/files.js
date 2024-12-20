import * as fs from 'node:fs';

import * as DB from './db.js';

export async function RegenFileIndices() {
    console.log('regenerating the file indices');
    let files = {};
    (await DB.GetAllFullFilePaths()).forEach(path => {
        path.path.split('/').reduce((r, name, index, arr) => {
            if(!r[name]) {
                r[name] = {};
                if(arr.length == index + 1) {
                    // Is it a folder:
                    if(path.uploadthing_id === null) r[name] = { id: path.id };
                    // Is it a file:
                    else { r[name] = { utid: path.uploadthing_id, id: path.id } }
                }
            }
            
            return r[name];
        }, files);
    });
    fs.writeFileSync('./data/files.json', JSON.stringify(files));
}