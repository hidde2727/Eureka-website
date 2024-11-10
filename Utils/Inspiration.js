const YT = require('./YT.js');
const DB = require('./DB.js');

async function GetURLInfo(urlString) {
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
    else
        throw new Error('Illegale website string: ' + urlString);
    return info;
}

async function SetYoutubeVideoInfo(videoID, info) {
    const yt = await YT.GetGeneralInfo(videoID);

    info.type = DB.InspirationTypes.YT_Video;
    info.name = yt.title;
    info.ID = videoID;
    info.url = 'https://www.youtube.com/watch?v=' + videoID;

    info.json.videoID = videoID;
    info.json.title = yt.title;
    info.json.thumbnails = yt.thumbnails;
    info.json.channelTitle = yt.channelTitle;
    info.json.channelThumbnails = yt.channelThumbnails;
}

module.exports = {
    GetURLInfo
};