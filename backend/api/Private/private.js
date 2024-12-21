import { Router } from 'express';
const router = Router();

import { createRouteHandler } from "uploadthing/express";
import uploadRouter from './uploadthing_router.js';
import Config from '../../utils/config.js';
router.use("/uploadthing", createRouteHandler({
    router: uploadRouter,
    config: { 
        token: Config.uploadthing.apiToken,
        isDev: process.env.NODE_ENV.trim() == 'development'
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
import Inspiration from './inspiration.js';
import Project from './project.js';
import Self from './self.js';
import Settings from './settings.js';
router.use('/user', User);
router.use('/suggestion', Suggestion);
router.use('/files', Files);
router.use('/inspiration', Inspiration);
router.use('/project', Project);
router.use('/self', Self);
router.use('/settings', Settings);

export default router;