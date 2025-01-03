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

export default function Website({ id, data, url }) {
    const {fetchedData, hasError, isFetching} = useWebsiteInfo(url, data==undefined && url != undefined && url!=null && url != '' && IsValidURL(url));
    if(data == undefined) data = fetchedData;
    if(data ==undefined && (isFetching || hasError)) {
        return (
            <div className="website" id={id}>
                <div className="website-content"></div>
                <div className="website-author-icon"></div>
                <p className="website-author-name"></p>
                <p className="website-extra-info"></p>
            </div>
        );
    }

    if(data.type == InspirationTypes.None) throw new Error("Invalid website data");
    else if(data.type == InspirationTypes.YT_Video) {
        return (
            <div className="website" id={id}>
                <div className="website-content" style={{backgroundImage: `url(${data.json.thumbnails.medium.url})`}}></div>
                <div className="website-author-icon" style={{backgroundImage: `url(${data.json.channelThumbnails.medium.url})`}}></div>
                <p className="website-author-name" style={{backgroundColor: 'rgba(0,0,0,0)'}}>{data.name}</p>
                <p className="website-extra-info" style={{backgroundColor: 'rgba(0,0,0,0)'}}></p>
            </div>
        );
    } else if(data.type == InspirationTypes.YT_Channel) {

    } else if(data.type == InspirationTypes.Github_account) {

    } else if(data.type == InspirationTypes.Github_repository) {

    } else if(data.type == InspirationTypes.Website) {

    }
    return (<p>Failed to load website</p>)
}