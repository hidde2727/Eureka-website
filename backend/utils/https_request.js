import https from 'https';

export default function SendRequest(options) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            res.setEncoding('utf8');
            
            var output = '';
            res.on('data', (chunk) => {
                output += chunk;
            });
            
            res.on('end', () => {
                var returnValue = JSON.parse(output);
                if(returnValue.error != undefined) { console.error(returnValue); reject(); }
                resolve(returnValue);
            });
        });
        req.on('error', (err) => {
            reject();
        });
        req.end();
    });
}