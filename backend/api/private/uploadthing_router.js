import { UploadThingError, UTFiles, UTApi } from "uploadthing/server";
import { createUploadthing } from "uploadthing/express";

import Config from '../../utils/config.js';
import * as DB from '../../utils/db.js';
import { CheckSession, HasUserPermission, GetSessionUserID, GetSessionUsername } from '../../utils/login.js';
import { RegenFileIndices } from '../../utils/files.js';
import { GetSemaphore } from '../../utils/adjancency_db_list.js';
import { accessTypes, accessUrgency, AddToAccessLogLoggedIn } from '../../utils/logs.js';

const f = createUploadthing();

export const utapi = new UTApi({
    token: Config.uploadthing.apiToken,
    defaultKeyType: 'fileKey'
});

// Can use a global variable because the uploading is protected by a semaphore
var fileRemaining = 0;
export const uploadRouter = {
    defaultRouter: f({
        image: {minFileCount:0, maxFileCount: 100},
        video: {minFileCount:0, maxFileCount: 100},
        audio: {minFileCount:0, maxFileCount: 100},
        blob:  {minFileCount:0, maxFileCount: 100},
        pdf:   {minFileCount:0, maxFileCount: Infinity},
        text:  {minFileCount:0, maxFileCount: Infinity}
    }).middleware(async ({ req, res, files }) => {
        if(!(await CheckSession(req, res))) throw new UploadThingError(JSON.stringify({ error:'Log in voor dit deel van de API' }));
        if(!(await HasUserPermission(req, 'modify_files'))) throw new UploadThingError(JSON.stringify({ error:'Je moet permissie hebben om de file API te gebruiken' }));
        if(req.body.input.parentID == undefined) throw new UploadThingError(JSON.stringify({ error:'Specificeer parentid' }));
        const parentID = req.body.input.parentID=='null'?null:req.body.input.parentID;
        if(req.body.input.override == undefined) throw new UploadThingError(JSON.stringify({ error: 'Specificeer of al bestaande bestaande overschreven moeten worden'}));
        const override = req.body.input.override;

        const [value, release] = await GetSemaphore('files').acquire();
        console.log('locked -> ' + value);
        fileRemaining = files.length;

        try {
            const containsDuplicates = files
                                        .map((file, index) => req.body.input.directories[index])
                                        .sort()
                                        .some((item, i, items) => item === items[i + 1]);
            if(containsDuplicates) throw new UploadThingError(JSON.stringify({ error:'Kan geen duplicaten namen uploaden'}));
            // Add the relative directory to the file info and check if any of the files already exist
            const checkOverridingPromises = [];
            const fileOverrides = files.map((file, index) => {
                const folderLocation = req.body.input.directories[index];
                checkOverridingPromises.push(DB.GetUploadthingIDFromPath(parentID, folderLocation));
                return { ...file, name: folderLocation };
            });
            const existingFiles = (await Promise.all(checkOverridingPromises)).sort();
            if(override) {
                try {
                    // Remove all the existing files:
                    var toBeDeleted = [];
                    existingFiles.forEach((file) => {
                        if(file == undefined) return;
                        toBeDeleted.push(file.uploadthing_id);
                    });
                    const { success, deletedCount } = await utapi.deleteFiles(toBeDeleted, { keyType: 'fileKey' });
                    if(!success) throw new UploadThingError(JSON.stringify({error: 'Failed to delete the old files'}));
                    if(deletedCount != toBeDeleted.length) { console.error('Deleted and to be deleted counts do not match'); throw new UploadThingError(JSON.stringify({error: 'Failed to delete the old files'})); }

                    var dbDeletionPromises = [];
                    existingFiles.forEach((file) => {
                        if(file == undefined) return;
                        dbDeletionPromises.push(DB.DeleteFile(file.id));
                    })
                    await Promise.all(dbDeletionPromises);
                } catch(err) {
                    console.error(err.message);
                    throw new UploadThingError(JSON.stringify({ error: 'Server error'}));
                }
            }
            else if(existingFiles[0] != existingFiles[existingFiles.length - 1] || existingFiles[0]!=undefined) {
                // There are files that shouldn't be overriden:
                throw new UploadThingError(JSON.stringify({ existingFiles: existingFiles.filter((val) => { return val!=undefined }).map((val) => { return {child: val}; }) }));
            }
            console.log('Uploading');
            return { 
                parentID: parentID,
                userID: GetSessionUserID(req),
                username: GetSessionUsername(req),
                [UTFiles]: fileOverrides 
            };
        } catch(err) {
            GetSemaphore('files').release();
            console.log('released');
            AddToAccessLogLoggedIn(accessUrgency.error, accessTypes.createFile, { names: files.map((file) => file.name), err: err.message }, req);
            throw new UploadThingError(err.message);
        }
    }).onUploadComplete(async ({ metadata, file }) => {
        console.log('Upload complete');
        if(!(await DB.CreateFileAtPath(metadata.parentID, file.name, file.key))) { 
            console.error('Failed to insert ' + file.name + ' with utid: ' + file.key);
            AddToAccessLogLoggedIn(accessUrgency.error, accessTypes.createFile, { name: file.name, utid: file.key, err: 'Failed to insert ' + file.name + ' with utid: ' + file.key }, req);
        }
        fileRemaining--;
        if(fileRemaining == 0) {
            await RegenFileIndices();
            GetSemaphore('files').release();
            console.log('released');
        }
        AddToAccessLogLoggedIn(accessUrgency.info, accessTypes.createFile, { name: file.name, utid: file.key }, req);
    })
};
export default uploadRouter;