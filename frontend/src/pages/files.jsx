import { Fragment, lazy, Suspense, useEffect, useRef, useState } from 'react';

import { useFilesSus } from '../utils/data_fetching.jsx'

var ManagementFilesSuspense = lazy(() => import('./management/files'));
import Restricted from '../components/restricted.jsx';
import Loading from '../components/loading.jsx';
import Footer from '../components/footer.jsx';
import { IconByExtension } from '../utils/utils.jsx';

export default function Files({isActive}) {
    return (
        <div className="window" id="files" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <div>
                <h1>Files</h1>
                <Suspense fallback={<Loading />}>
                    <Restricted notTo="modify_files">
                        <FilesSuspense />
                    </Restricted>
                    <Restricted to="modify_files">
                        <ManagementFilesSuspense />
                    </Restricted>
                </Suspense>
            </div>
            <Footer />
        </div>
    );
}

function FilesSuspense() {
    const { files: fileData, isFetching, hasError } = useFilesSus();
    const [currentFolder, setCurrentFolder] = useState('');

    const folders = useRef([]);
    const files = useRef([]);

    const [forceUpdate, setForceUpdate] = useState(false);

    useEffect(() => {
        if(fileData == undefined) return;

        let currentFolderData = fileData;
        let currentFolderExpanded = currentFolder.split('/');
        for(let i = 1; i < currentFolderExpanded.length; i++) currentFolderData = currentFolderData[currentFolderExpanded[i]];

        folders.current = [];
        files.current = [];
        for(let [folderName, data] of Object.entries(currentFolderData)) {
            if(data.utid != undefined) files.current.push({ name: folderName, utid: data.utid });
            else if(folderName != 'id') folders.current.push({ name: folderName });
        }
        setForceUpdate(!forceUpdate);
    }, [currentFolder, fileData]);

    if(hasError || fileData==undefined) return <p>Error tijdens het ophalen van de files</p>;

    var navigationFolder = '';
    return (
        <>
            <div className="navigation">
                {
                    currentFolder.split('/').map((folderName, index) => {
                        if(index == 0) return <Fragment key={index}><i className="fas fa-home" onClick={()=>{setCurrentFolder('')}}></i><i className="fas fa-greater-than"/></Fragment>;
                        navigationFolder += '/' + folderName;
                        var deepCopyNavigationFolder = (' ' + navigationFolder).slice(1);
                        return (
                        <Fragment key={index}>
                            <p onClick={()=>{setCurrentFolder(deepCopyNavigationFolder)}}>{folderName}</p>
                            <i className="fas fa-greater-than"/>
                        </Fragment>
                        );
                    })
                }
            </div>
            <div className="files-folders">
                <div className="folders">
                    {
                        folders.current.map(({name}) => {
                            return (
                            <div className="folder" key={name} onClick={() => {setCurrentFolder(currentFolder + '/' + name)}}>
                                <i className="file-type fas fa-folder"></i>
                                <p>{name}</p>
                            </div>
                            );
                        })
                    }
                </div>
                <div className="files">
                    {
                        files.current.map(({name, utid}) => {
                            return (
                            <a className="file" key={utid} href={'https://utfs.io/f/' + utid} download={name}>
                                <IconByExtension extension={ name.split('.').pop() } />
                                <p>{name}</p>
                            </a>
                            );
                        })
                    }
                </div>
            </div>
        </>
    );
}