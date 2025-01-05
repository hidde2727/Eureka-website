import { TimeToString } from '../utils/utils';
import Loading from './loading';

import '/public/components/versioning_sidebar.css';

export default function VersioningSidebar({ versions, selectedVersionUUID, setSelectedVersionUUID }) {
    if(versions == undefined) return <Loading />;
    return (
        <>
            {versions.map((version) => {
                const isSelected = version.uuid == selectedVersionUUID;
                var statusClass = '';
                var statusValue = '';
                if(version.voting_result == false) {
                    statusClass = ' denied';
                    statusValue = '(afgekeurd)'
                } else if(version.active_version == true) {
                    statusClass = ' active';
                    statusValue = '(huidige)';
                }
                return (
                    <div className={`version${isSelected?' current':''}`} onClick={()=>{setSelectedVersionUUID(version.uuid)}} key={version.uuid}>
                        <div className="top">
                            <p className="title">{version.version_name}</p>
                            <p className={`status${statusClass}`}>{statusValue}</p>
                        </div>
                        <div className="bottom">
                            <i className="fas fa-user-alt"></i>
                            <p>{version.version_proposer}</p>
                            <p className="time">{TimeToString(version.created_at)}</p>
                        </div>
                        <div className="description">{version.version_description}</div>
                    </div>
                );
            })}
        </>
    )
}