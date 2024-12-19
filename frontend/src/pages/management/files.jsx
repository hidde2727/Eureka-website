import { Fragment, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useFilesSus, createFolder, changeFileName } from '../../utils/data_fetching.jsx';
import { IconByExtension } from '../../utils/utils.jsx';

import FileDropzone from '../../components/file_dropzone.jsx';
import FilePopover from '../../popovers/management/files.jsx';

import '/public/pages/files.css';
import { FileConflictPopover } from '../../popovers/management/file_conflicts.jsx';

export default function Files() {
    const queryClient = useQueryClient();

    const { files: fileData, isFetching, hasError } = useFilesSus();
    const [currentFolder, setCurrentFolder] = useState([{name: 'root', id: null}]);
    function addToCurrentFolder({name, id}) {
        setCurrentFolder([...currentFolder, {name: name, id: id}]);
    }
    function setCurrentFolderToIndex(index) {
        setCurrentFolder(currentFolder.splice(0, index+1));
    }
    function getCurrentFolder() {
        return currentFolder[currentFolder.length - 1];
    }

    const folders = useRef([]);
    const files = useRef([]);
    const [forceUpdate, setForceUpdate] = useState(false);
    useEffect(() => {
        if(fileData == undefined) return;

        let currentFolderData = fileData;
        for(let i = 1; i < currentFolder.length; i++) currentFolderData = currentFolderData[currentFolder[i].name];

        folders.current = [];
        files.current = [];
        for(let [folderName, data] of Object.entries(currentFolderData)) {
            if(data.utid != undefined) files.current.push({ name: folderName, utid: data.utid, id: data.id });
            else if(folderName != 'folderID') folders.current.push({ name: folderName, folderID: data.folderID});
        }
        setForceUpdate(!forceUpdate);
    }, [currentFolder, fileData]);

    const [uploadingFiles, setUploadingFiles] = useState([]);
    const uploadPopoverRef = useRef();

    const [renamingConflicts, setRenamingConflicts] = useState();
    const [renamedFile, setRenamedFile] = useState();
    const onRenamingConflictResolved = useRef();
    const renamingConflictsPopoverRef = useRef();

    if(hasError || fileData==undefined) return <p>Error tijdens het ophalen van de files</p>;

    const CreateFile = ({ name, id, isFolder }) => {
        return (
            <>
                { isFolder ? <i className="file-type fas fa-folder"/> : <IconByExtension extension={ name.split('.').pop() } /> }
                <p
                    suppressContentEditableWarning={true}
                    contentEditable={true}
                    onKeyDown={(ev) => {
                        ev.target.isChanged = true;
                        if (ev.keyCode == 13) {
                            //ev.target.innerText = ev.target.innerText.slice(0, -1);
                            ev.preventDefault();
                            ev.target.blur();
                        }
                    }}
                    onBlur={async (ev) => {
                        if (!ev.target.isChanged) return;
                        ev.target.isChanged = false;
                        if (ev.target.innerText == 'folderID')
                            ev.target.innerText = 'folderid';
                        ev.target.innerText = ev.target.innerText.replace('/', '\\');
                        const { hasConflicts, conflicts } = await changeFileName(queryClient, currentFolder, id, name, ev.target.innerText);
                        if (hasConflicts) {
                            setRenamingConflicts(conflicts);
                            setRenamedFile(ev.target.innerText);
                            onRenamingConflictResolved.current = (resolvedConflicts) => {
                                renamingConflictsPopoverRef.current.close();

                                var conflictMap = {};
                                resolvedConflicts.forEach((conflict) => {
                                    conflictMap[conflict.id] = conflict.decision;
                                });
                                changeFileName(queryClient, currentFolder, id, name, ev.target.innerText, conflictMap);
                                ev.target.innerText = name;
                            };
                            renamingConflictsPopoverRef.current.open();
                        }
                    }}
                >{name}</p>
            </>
        );
    };

    return (
        <>
            <div className="navigation">
                {
                    currentFolder.map((folder, index) => {
                        if(index == 0) return <Fragment key={index}><i className="fas fa-home" onClick={()=>{ setCurrentFolderToIndex(0); }}></i><i className="fas fa-greater-than"/></Fragment>;
                        return (
                        <Fragment key={index}>
                            <p onClick={()=>{ setCurrentFolderToIndex(index); }}>{folder.name}</p>
                            <i className="fas fa-greater-than"/>
                        </Fragment>
                        );
                    })
                }
                <div className="navigation-right">
                    <i className="fas fa-folder-plus" onClick={()=>{
                        (async () => { var {id} = await createFolder(queryClient, getCurrentFolder().id); })(); 
                    }}/>
                    {
                    // <!--! Font Awesome Free 6.7.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2024 Fonticons, Inc. -->
                    // Below is a replacement for the not working <i className="fa-solid fa-file-arrow-up" />
                    }
                    <svg style={{ width:"1.5rem", height:"1.5rem", cursor:"pointer" }} viewBox="0 0 384 512" onClick={()=> {
                        uploadPopoverRef.current.open();
                    }}                 
                    ><path fill="#EEE" d="M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM216 408c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-102.1-31 31c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l72-72c9.4-9.4 24.6-9.4 33.9 0l72 72c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-31-31L216 408z"/></svg>
                </div>
            </div>
            <div className="files-folders">
                <p>Folders:</p>
                <div className="folders">
                    {
                        folders.current.map(({name, folderID}) => {
                            if(name == 'folderID') return;
                            return (
                            <div 
                                className="folder" key={name} 
                                onDoubleClick={() => { addToCurrentFolder({name: name, id: folderID}); }}
                            >
                                <CreateFile name={name} id={folderID} isFolder={true} />
                            </div>
                            );
                        })
                    }
                </div>
                <p>Files:</p>
                <div className="files">
                    {
                        files.current.map(({name, utid, id}) => {
                            return (
                            <div className="file" key={id} onDoubleClick={() => {
                                var link = document.createElement('a');
                                link.href = 'https://utfs.io/f/' + utid;
                                link.download = name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}>
                                <CreateFile name={name} id={id} isFolder={false} />
                            </div>
                            );
                        })
                    }
                </div>
                <FileDropzone />
                <FilePopover parentFolder={getCurrentFolder()} files={uploadingFiles} setFiles={setUploadingFiles} ref={uploadPopoverRef} />
                <FileConflictPopover 
                ref={renamingConflictsPopoverRef} 
                parentFolder={renamedFile} 
                conflictingFiles={renamingConflicts} 
                setConflictingFiles={setRenamingConflicts} 
                onResolved={onRenamingConflictResolved.current} 
                nameProperty="path"                
                />
            </div>
        </>
    );
}