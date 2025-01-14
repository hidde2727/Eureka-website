import { useEffect } from "react";
import { useWebsiteInfo } from "../utils/data_fetching.jsx";
import { IsValidURL } from "../utils/utils.jsx";

const InspirationTypes = Object.freeze({
    None: -1,
    YT_Video: 0,
    YT_Channel: 1,
    Github_account: 2,
    Github_repository: 3,
    Website: 4,
});

export default function Website({ id, data, url, onClick, onDataLoad }) {
    const {fetchedData, hasError, isFetching} = useWebsiteInfo(url, data==undefined && url!=undefined && url!=null && url != '' && IsValidURL(url));
    
    useEffect(() => {
        if(isFetching || fetchedData==undefined) return;
        if(onDataLoad!=undefined) onDataLoad(fetchedData);
    }, [fetchedData])

    if(data == undefined) data = fetchedData;
    if(typeof(data) == 'string') data=JSON.parse(data);
    if(data ==undefined && (isFetching || hasError)) {
        return (
            <div className="website" id={id} onClick={onClick}>
                <div className="website-content"></div>
                <div className="website-author-icon"></div>
                <p className="website-author-name"></p>
                <p className="website-extra-info"></p>
            </div>
        );
    }

    if(data.type == InspirationTypes.None) {
        return (
            <div className="website" id={id} onClick={onClick}>
                <div className="website-content">Invalide url</div>
                <div className="website-author-icon"></div>
                <p className="website-author-name"></p>
                <p className="website-extra-info"></p>
            </div>
        );
    }
    else if(data.type == InspirationTypes.YT_Video) {
        return (
            <div className="website video" id={id} onClick={onClick}>
                <div className="website-content" style={{backgroundImage: `url(${data.json.thumbnails.medium.url})`}}></div>
                <div className="website-author-icon" style={{backgroundImage: `url(${data.json.channelThumbnails.medium.url})`}}></div>
                <p className="website-author-name" style={{backgroundColor: 'rgba(0,0,0,0)'}}>{data.name}</p>
                <p className="website-extra-info" style={{backgroundColor: 'rgba(0,0,0,0)'}}></p>
                <a className="website-clickable" href={onClick==undefined?data.url:undefined}></a>
            </div>
        );
    } else if(data.type == InspirationTypes.YT_Channel) {
        return (
            <div className="website channel" id={id} onClick={onClick}>
                <div className="website-content" style={{backgroundImage: `url(${data.json.thumbnails.medium.url})`}}></div>
                <p className="website-author-name" style={{backgroundColor: 'rgba(0,0,0,0)'}}>{data.name}</p>
                <a className="website-clickable" href={onClick==undefined?data.url:undefined}></a>
            </div>
        );
    } else if(data.type == InspirationTypes.Github_account) {

    } else if(data.type == InspirationTypes.Github_repository) {

    } else if(data.type == InspirationTypes.Website) {

    }
    return (<p>Failed to load website</p>)
}