import * as DB from './db.js';
import Config from './config.js';
import SendRequest from './https_request.js';

export async function GetURLInfo(urlString) {
    var url = '';
    try {
        url = new URL(urlString)
    } catch(err) {
        urlString = 'https://' + urlString;
        url = new URL(urlString);
    }

    var info = {
        type: DB.InspirationTypes.None,
        url: urlString,
        name:'None',
        ID:'None',
        json:{}
    }
    // Youtube based on: https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
    if(url.hostname === 'youtube.be' || url.hostname === 'www.youtube.be')
        await SetYoutubeVideoInfo(url.pathname, info);
    else if((url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com' ) && (url.pathname.indexOf('/embed') == 0 || url.pathname.indexOf('/shorts') == 0))
        await SetYoutubeVideoInfo(url.pathname.substring(url.pathname.indexOf('/')), info);
    else if((url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com' ) && url.searchParams.has('v'))
        await SetYoutubeVideoInfo(url.searchParams.get('v'), info);
    else if((url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com' ) && url.searchParams.has('vi'))
        await SetYoutubeVideoInfo(url.searchParams.get('vi'), info);
    else if((url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com' ) && url.pathname.split('/')[1][0] == '@')
        await SetYoutubeChannelInfo(undefined, url.pathname.substring(1), info);
    else if((url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com' ) && url.pathname.indexOf('/channel') == 0)
        await SetYoutubeChannelInfo(url.pathname.substring(url.pathname.indexOf('/')), undefined, info);
    else
        throw new Error('Illegale website string: ' + urlString);
    return info;
}

async function SetYoutubeVideoInfo(videoID, info) {
    var videoSnippet = await SendRequest({
        host:'www.googleapis.com',
        path:'/youtube/v3/videos?part=snippet&id=' + videoID + '&key=' + Config.google.apiKey,
        method:'GET'
    });
    if(videoSnippet.pageInfo.totalResults == 0) { console.error('0 results found for this id'); return ''; }
    videoSnippet = videoSnippet.items[0].snippet;
    var channelSnippet = await SendRequest({
        host:'www.googleapis.com',
        path:'/youtube/v3/channels?part=snippet&id=' + videoSnippet.channelId + '&key=' + Config.google.apiKey,
        method:'GET'
    });
    if(channelSnippet.pageInfo.totalResults == 0) { console.error('0 results found for this id'); return ''; }
    channelSnippet = channelSnippet.items[0].snippet;

    info.type = DB.InspirationTypes.YT_Video;
    info.name = videoSnippet.title;
    info.ID = videoID;
    info.url = 'https://www.youtube.com/watch?v=' + videoID;

    info.json.videoID = videoID;
    info.json.title = videoSnippet.title;
    info.json.thumbnails = videoSnippet.thumbnails;
    info.json.channelTitle = videoSnippet.channelTitle;
    info.json.channelThumbnails = channelSnippet.thumbnails
}

async function SetYoutubeChannelInfo(channelID, channelHandle, info) {
    var channelSnippet = await SendRequest({
        host:'www.googleapis.com',
        path:`/youtube/v3/channels?part=snippet${channelID==undefined?`&forHandle=${channelHandle}`:`&id=${channelID}`}&key=${Config.google.apiKey}`,
        method:'GET'
    });
    if(channelSnippet.pageInfo.totalResults == 0) { console.error('0 results found for this id'); return ''; }
    channelSnippet = channelSnippet.items[0];

    info.type = DB.InspirationTypes.YT_Channel;
    info.name = channelSnippet.snippet.title;
    info.ID = channelSnippet.id;
    info.url = 'https://www.youtube.com/channel/' + channelSnippet.id;

    info.json.channelID = channelSnippet.id;
    info.json.name = channelSnippet.snippet.title;
    info.json.description = channelSnippet.snippet.description;
    info.json.thumbnails = channelSnippet.snippet.thumbnails
}