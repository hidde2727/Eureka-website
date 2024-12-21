import { Fragment, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useFilesSus, useFileStorageUsage, createFolder, changeFileName, changeFileParent, deleteFile } from '../../utils/data_fetching.jsx';
import { IconByExtension } from '../../utils/utils.jsx';

import FileDropzone from '../../components/file_dropzone.jsx';
import FilePopover from '../../popovers/management/files.jsx';

import '/public/pages/files.css';
import { FileConflictPopover } from '../../popovers/management/file_conflicts.jsx';

export default function Files() {
    useEffect(() => {
        let timeout = undefined;
        document.addEventListener('drag', () => {
            if(timeout != undefined) clearTimeout(timeout);
            timeout = setTimeout(() => {
                deleteWindow.current.classList.remove('active');
            }, 500);
        });
    }, []);
    const queryClient = useQueryClient();

    const { storageUsage, isFetching: isFetchingUsage, hasError: hasErrorUsage } = useFileStorageUsage();
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

    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    useEffect(() => {
        if(fileData == undefined) return;

        let currentFolderData = fileData;
        for(let i = 1; i < currentFolder.length; i++) currentFolderData = currentFolderData[currentFolder[i].name];

        let newFolders = [];
        let newFiles = [];
        for(let [folderName, data] of Object.entries(currentFolderData)) {
            if(data.utid != undefined) newFiles.push({ name: folderName, utid: data.utid, id: data.id });
            else if(folderName != 'id') newFolders.push({ name: folderName, id: data.id});
        }
        setFolders(newFolders);
        setFiles(newFiles);
    }, [currentFolder, fileData]);

    const [uploadingFiles, setUploadingFiles] = useState([]);
    const uploadPopoverRef = useRef();

    const [fileConflicts, setFileConflicts] = useState();
    const [conflictParentName, setConflictParentName] = useState();
    const onRenamingConflictResolved = useRef();
    const fileConflictPopoverRef = useRef();

    const draggedFile = useRef();
    const deleteWindow = useRef();

    if(hasError || hasErrorUsage || fileData==undefined) return <p>Error tijdens het ophalen van de files</p>;

    async function handleFileDrop(ev, toId, toName) {
        if(draggedFile.current?.name == undefined || draggedFile.current?.name == toName || draggedFile.current?.id == undefined) return;
        deleteWindow.current.classList.remove('active');

        const fileInfo = draggedFile.current;
        draggedFile.current = undefined;
        const { hasConflicts, conflicts } = await changeFileParent(queryClient, getCurrentFolder().id, toId, fileInfo.id);
        if (hasConflicts) {
            setFileConflicts(conflicts);
            setConflictParentName(ev.target.innerText);
            onRenamingConflictResolved.current = (resolvedConflicts) => {
                fileConflictPopoverRef.current.close();

                var conflictMap = {};
                resolvedConflicts.forEach((conflict) => {
                    conflictMap[conflict.id] = conflict.decision;
                });
                changeFileParent(queryClient, getCurrentFolder().id, toId, fileInfo.id, conflictMap);
            };
            fileConflictPopoverRef.current.open();
        }
    }
    function CreateFile({ name, id, isFolder, onDoubleClick  }) {
        const ref = useRef();
        useEffect(() => {
            if(id == 'noid') { 
                ref.current.focus();

                var range = document.createRange();
                range.selectNodeContents(ref.current);
                var currentSelection = window.getSelection();
                currentSelection.removeAllRanges();
                currentSelection.addRange(range);
            }
        });
        return (
            <div 
            className={isFolder?'folder':'file'} onDoubleClick={id=='noid'?undefined:onDoubleClick}
            draggable="true"
            onDragStart={(ev) => {
                deleteWindow.current.classList.add('active');
                draggedFile.current = { name: name, id: id, isFolder: isFolder };
                ev.dataTransfer.dropEffect = "move";
            }}
            onDrop={!isFolder? undefined : ((ev) => { handleFileDrop(ev, id, name); })}
            onDragEnter={!isFolder? undefined : ((ev) => {
                if(draggedFile.current?.name == undefined || draggedFile.current?.name == name) return;
                ev.preventDefault();
            })}
            onDragOver={!isFolder? undefined : ((ev) => { 
                if(draggedFile.current?.name == undefined || draggedFile.current?.name == name) return;
                ev.preventDefault();
            })}
            >
                { isFolder ? <i className="file-type fas fa-folder"/> : <IconByExtension extension={ name.split('.').pop() } /> }
                <p  
                    ref={ref}
                    suppressContentEditableWarning={true}
                    contentEditable={true}
                    onPointerDown={(e)=>{
                        e.stopPropagation();
                    }}
                    onKeyDown={(ev) => {
                        ev.stopPropagation();
                        ev.target.isChanged = true;
                        if (ev.key === 'Enter') {
                            ev.preventDefault();
                            ev.target.blur();
                        }
                    }}
                    onFocus={(ev) => {
                        ev.target.parentNode.draggable = false;
                    }}
                    onBlur={async (ev) => {
                        ev.target.parentNode.draggable = true;
                        if (!ev.target.isChanged) return;
                        ev.target.isChanged = false;
                        if (ev.target.innerText == 'id')
                            ev.target.innerText = 'ID';
                        else if(ev.target.innerText == 'utid')
                            ev.target.innerText = 'utID';
                        else if(ev.target.innerText == 'placeholder')
                            ev.target.innerText = 'Placeholder';
                        ev.target.innerText = ev.target.innerText.replace('/', '\\');
                        let newName = ev.target.innerText;
                        if(id == 'noid') {
                            const {id:assignedID, name: assignedName} = await createFolder(queryClient, getCurrentFolder().id);
                            id = assignedID;
                            name = assignedName;
                        }
                        const { hasConflicts, conflicts } = await changeFileName(queryClient, currentFolder, id, name, newName);
                        if (hasConflicts) {
                            setFileConflicts(conflicts);
                            setConflictParentName(ev.target.innerText);
                            onRenamingConflictResolved.current = (resolvedConflicts) => {
                                fileConflictPopoverRef.current.close();

                                var conflictMap = {};
                                resolvedConflicts.forEach((conflict) => {
                                    conflictMap[conflict.id] = conflict.decision;
                                });
                                changeFileName(queryClient, currentFolder, id, name, ev.target.innerText, conflictMap);
                                ev.target.innerText = name;
                            };
                            fileConflictPopoverRef.current.open();
                        }
                    }}
                >{name}</p>
            </div>
        );
    }

    return (
        <>
            <div className="navigation">
                {
                    currentFolder.map((folder, index) => {
                        if(index == 0) { return (
                            <Fragment key={index}>
                                <i className="fas fa-home" 
                                onClick={()=>{ setCurrentFolderToIndex(0); }}
                                onDrop={(ev) => { handleFileDrop(ev, null, undefined); }}
                                onDragEnter={(ev) => { if(draggedFile.current?.name == undefined) { return; } ev.preventDefault(); }}
                                onDragOver={(ev) => { if(draggedFile.current?.name == undefined) { return; } ev.preventDefault(); }}
                                ></i>
                                <i className="fas fa-greater-than"/>
                            </Fragment>
                            ); 
                        }
                        return (
                        <Fragment key={index} >
                            <p 
                            onClick={()=>{ setCurrentFolderToIndex(index); }}
                            onDrop={(ev) => { handleFileDrop(ev, folder.id, undefined); }}
                            onDragEnter={(ev) => { if(draggedFile.current?.name == undefined) { return; } ev.preventDefault(); }}
                            onDragOver={(ev) => { if(draggedFile.current?.name == undefined) { return; } ev.preventDefault(); }}
                            >{folder.name}</p>
                            <i className="fas fa-greater-than"/>
                        </Fragment>
                        );
                    })
                }
                <div className="navigation-right">
                    <i className="fas fa-folder-plus" onClick={()=>{
                        (async () => { 
                            let newFolders = [...folders]; 
                            newFolders.push({ name: 'newFolder', id:'noid' }); 
                            setFolders(newFolders); 
                        })(); 
                    }}/>
                    {
                    // <!--! Font Awesome Free 6.7.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2024 Fonticons, Inc. -->
                    // Below is a replacement for the not working <i className="fa-solid fa-file-arrow-up" />
                    }
                    <svg style={{ width:"1.5rem", height:"1.5rem", cursor:"pointer" }} viewBox="0 0 384 512" onClick={()=> {
                        uploadPopoverRef.current.open();
                    }}                 
                    ><path fill="#EEE" d="M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM216 408c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-102.1-31 31c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l72-72c9.4-9.4 24.6-9.4 33.9 0l72 72c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-31-31L216 408z"/></svg>

                    <p className="storage-usage" onClick={(ev) => { ev.target.parentNode.classList.toggle('clicked'); }}> 
                        <a className="first">{(Math.ceil(storageUsage?.appTotalBytes / 100000000) / 10) + 'GB / 2GB'}</a>
                        <a className="second">{(Math.round(storageUsage?.appTotalBytes / 100000) / 10) + 'MB / 2000MB'}</a>
                    </p>
                
                </div>
            </div>
            <div className="files-folders">
                <div className="folders">
                    {
                        folders.map(({name, id}) =>
                            <CreateFile 
                                key={id} name={name} id={id} isFolder={true} 
                                onDoubleClick={() => { addToCurrentFolder({name: name, id: id}); }}
                            />    
                        )
                    }
                </div>
                <div className="files">
                    {
                        files.map(({name, utid, id}) => 
                            <CreateFile 
                                key={id} name={name} id={id} isFolder={false} 
                                onDoubleClick={() => {
                                var link = document.createElement('a');
                                link.href = 'https://utfs.io/f/' + utid;
                                link.download = name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }} />
                        )
                    }
                </div>
                <FileDropzone />
                <FilePopover parentFolder={getCurrentFolder()} files={uploadingFiles} setFiles={setUploadingFiles} ref={uploadPopoverRef} />
                <FileConflictPopover 
                ref={fileConflictPopoverRef} 
                parentFolder={conflictParentName} 
                conflictingFiles={fileConflicts} 
                setConflictingFiles={setFileConflicts} 
                onResolved={onRenamingConflictResolved.current} 
                nameProperty="path"                
                />
            </div>
            <div 
            className="delete" ref={deleteWindow}
            onDrop={() => {
                deleteFile(queryClient, currentFolder, draggedFile.current.id);
                draggedFile.current = undefined;
                deleteWindow.current.classList.remove('active');
            }}
            onDragEnter={(ev) => { ev.preventDefault(); }}
            onDragOver={(ev) => { ev.preventDefault(); }}
            >
                <i className="far fa-trash-alt" />
                <p>Delete de file</p>
            </div>
        </>
    );
}