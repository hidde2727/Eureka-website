import { Router } from 'express';
const router = Router();

import { createRouteHandler } from "uploadthing/express";
import uploadRouter from './uploadthing_router.js';
import Config from '../../utils/config.js';
router.use('/uploadthing', createRouteHandler({
    router: uploadRouter,
    config: { 
        token: Config.uploadthing.apiToken,
        isDev: Config.isDev,
        callbackUrl: Config.isDev||Config.hostURL==undefined? undefined : 'https://' + Config.hostURL + '/api/private/uploadthing'
    }
}));

// Make sure the API user is logged in
import * as Login from '../../utils/login.js';
router.use(async (req, res, next) => {
    if(!(await Login.CheckSession(req, res))) {
        res.status(401);
        res.send('Log in voor dit deel van de API');
        return;
    }
    next();
});

// Connect the other APIS
import User from './user.js';
import Suggestion from './suggestion.js';
import Files from './files.js';
import Labels from './inspiration_labels.js';
import Inspiration from './inspiration.js';
import Project from './project.js';
import Self from './self.js';
import Settings from './settings.js';
import Logs from './logs.js';
router.use('/users', User);
router.use('/suggestion', Suggestion);
router.use('/files', Files);
router.use('/labels', Labels);
router.use('/inspiration', Inspiration);
router.use('/project', Project);
router.use('/self', Self);
router.use('/settings', Settings);
router.use('/logs', Logs);

export default router;