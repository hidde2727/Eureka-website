import https from 'https';
import Config from './config.js';

export default function SendRequest(options) {
    return new Promise((resolve, reject) => {
        const req = https.request({...options, headers:{...options?.headers, Referer: Config.hostURL }}, (res) => {
            res.setEncoding('utf8');
            
            var output = '';
            res.on('data', (chunk) => {
                output += chunk;
            });
            
            res.on('end', () => {
                try {
                    var returnValue = JSON.parse(output);
                } catch(err) {
                    console.error('Result is not JSON:\n\n' + output);
                    reject(err);
                    return;
                }
                if(returnValue.error != undefined) { console.error(returnValue); reject(); }
                resolve(returnValue);
            });
        });
        req.on('error', (err) => {
            reject(err);
        });
        req.end();
    });
}