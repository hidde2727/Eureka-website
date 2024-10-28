const YT = require("./YT.js");

async function GetURLInfo(urlString) {
    try {
        var url = new URL(urlString);

        var type = "None";
        var name = "None";
        var ID = "None";
        var json = {};
        // Youtube based on: https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
        if(url.hostname === "youtube.be" || url.hostname === "www.youtube.be")
            await SetYoutubeVideoInfo(url.pathname, type, name, ID, json);
        else if((url.hostname === "youtube.com" || url.hostname === "www.youtube.com" ) && (url.pathname.indexOf("/embed") == 0 || url.pathname.indexOf("/shorts") == 0))
            await SetYoutubeVideoInfo(url.pathname.substring(url.pathname.indexOf('/')), type, name, ID, json);
        else if((url.hostname === "youtube.com" || url.hostname === "www.youtube.com" ) && url.searchParams.has("v"))
            await SetYoutubeVideoInfo(url.searchParams.get("v"), type, name, ID, json);
        else if((url.hostname === "youtube.com" || url.hostname === "www.youtube.com" ) && url.searchParams.has("vi"))
            await SetYoutubeVideoInfo(url.searchParams.get("vi"), type, name, ID, json);
        else
            return ReturnError(res, "Illegale website string");
    } catch(err) { console.error(err); return ReturnError(res, "Bestaad al"); }

    return {
        "type": type,
        "name": name,
        "ID": ID,
        "json": json
    };
}

async function SetYoutubeVideoInfo(videoID, type, name, ID, json) {
    const value = await DB.DoesYTVideoExists(videoID);
    console.log(value);
    if(value) throw new Error("YT video already exists");

    const yt = await YT.GetGeneralInfo(videoID);

    type = DB.InspirationTypes.YT_video;
    name = yt.title;
    ID = videoID;

    json.videoID = videoID;
    json.title = yt.title;
    json.thumbnails = yt.thumbnails;
    json.channelTitle = yt.channelTitle;
    json.channelThumbnails = yt.channelThumbnails;
}

module.exports = {
    GetURLInfo
};