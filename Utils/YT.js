const https = require('https');
const config = require('./Config.js');

function SendRequest(options) {
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

async function GetGeneralInfo(videoID) {
    var videoSnippet = await SendRequest({
        host:'www.googleapis.com',
        path:'/youtube/v3/videos?part=snippet&id=' + videoID + '&key=' + config.google.apiKey,
        method:'GET'
    });
    if(videoSnippet.pageInfo.totalResults == 0) { console.error('0 results found for this id'); return ''; }
    videoSnippet = videoSnippet.items[0].snippet;
    var channelSnippet = await SendRequest({
        host:'www.googleapis.com',
        path:'/youtube/v3/channels?part=snippet&id=' + videoSnippet.channelId + '&key=' + config.google.apiKey,
        method:'GET'
    });
    if(channelSnippet.pageInfo.totalResults == 0) { console.error('0 results found for this id'); return ''; }
    channelSnippet = channelSnippet.items[0].snippet;
    return {
        'title': videoSnippet.title,
        'thumbnails': videoSnippet.thumbnails,
        'channelTitle': videoSnippet.channelTitle,
        'channelThumbnails': channelSnippet.thumbnails
    }
}

module.exports = {
    GetGeneralInfo
};