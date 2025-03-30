import { useEffect } from "react";
import { useWebsiteInfo } from "../utils/data_fetching.jsx";
import { IsValidURL } from "../utils/utils.jsx";

export const InspirationTypes = Object.freeze({
    None: -1,
    YT_Video: 0,
    YT_Channel: 1,
    YT_Playlist: 2,
    Github_account: 3,
    Github_repository: 4,
    Website: 5,
});

export default function WebsiteInt({ id, data, url, onClick, onDataLoad, autoGrow=false, showIfNotLoaded=true }) {
    const {fetchedData, hasError, isFetching, isPlaceholderData} = useWebsiteInfo(url, data==undefined && url!=undefined && url!=null && url != '' && IsValidURL(url));
    
    useEffect(() => {
        if(isFetching || fetchedData==undefined || isPlaceholderData) return;
        if(onDataLoad!=undefined) onDataLoad(fetchedData);
    }, [fetchedData]);

    if(data == undefined) data = fetchedData;
    if(typeof(data) == 'string') data=JSON.parse(data);
    
    if(showIfNotLoaded && data==undefined&&url==undefined) return <div></div>;
    if(data ==undefined && (isFetching || hasError)) {
        return (
            <div className={"website loading"+(autoGrow?" auto-grow":"")} id={id} onClick={onClick}>
                <div className="website-content"></div>
                <div className="website-author-icon"></div>
                <div className="info">
                    <p className="website-name"></p>
                    <p className="loader"></p>
                    <p className="website-author-name"></p>
                </div>
            </div>
        );
    }

    if(data.type == InspirationTypes.None) {
        return (
            <div className={"website"+(autoGrow?" auto-grow":"")} id={id} onClick={onClick}>
                <div className="website-content">Invalide url</div>
                <div className="website-author-icon"></div>
                <div className="info">
                    <p className="website-name"></p>
                    <p className="website-author-name"></p>
                </div>
            </div>
        );
    }
    else if(data.type == InspirationTypes.YT_Video) {
        return (
            <div className={"website video"+(autoGrow?" auto-grow":"")} id={id} onClick={onClick}>
                <div className="website-content" style={{backgroundImage: `url(${data.json.thumbnails.medium.url})`}}></div>
                <div className="website-author-icon" style={{backgroundImage: `url(${data.json.channelThumbnails.medium.url})`}}></div>
                <div className="info">
                    <p className="website-name" style={{backgroundColor: 'rgba(0,0,0,0)'}}>{data.name}</p>
                    <p className="website-author-name" style={{backgroundColor: 'rgba(0,0,0,0)'}}>{data.json.channelTitle}</p>
                </div>
                <a className="website-clickable" href={onClick==undefined?data.url:undefined} target="_blank"></a>
            </div>
        );
    } else if(data.type == InspirationTypes.YT_Channel) {
        return (
            <div className={"website channel"+(autoGrow?" auto-grow":"")} id={id} onClick={onClick}>
                <div className="website-content" style={{backgroundImage: `url(${data.json.thumbnails.medium.url})`}}></div>
                <p className="website-name" style={{backgroundColor: 'rgba(0,0,0,0)'}}>{data.name}</p>
                <a className="website-clickable" href={onClick==undefined?data.url:undefined} target="_blank"></a>
            </div>
        );
    } else if(data.type == InspirationTypes.YT_Playlist) {
        return (
            <div className={"website video"+(autoGrow?" auto-grow":"")} id={id} onClick={onClick}>
                <div className="website-content" style={{backgroundImage: `url(${data.json.thumbnails.medium.url})`}}></div>
                <div className="website-author-icon" style={{backgroundImage: `url(${data.json.channelThumbnails.medium.url})`}}></div>
                <div className="info">
                    <p className="website-name" style={{backgroundColor: 'rgba(0,0,0,0)'}}>{data.name}</p>
                    <p className="website-author-name" style={{backgroundColor: 'rgba(0,0,0,0)'}}>{data.json.channelTitle}</p>
                </div>
                <a className="website-clickable" href={onClick==undefined?data.url:undefined} target="_blank"></a>
            </div>
        );
    } else if(data.type == InspirationTypes.Github_account) {

    } else if(data.type == InspirationTypes.Github_repository) {

    } else if(data.type == InspirationTypes.Website) {

    }
    return (<p>Failed to load website</p>)
}
export const Website = WebsiteInt;