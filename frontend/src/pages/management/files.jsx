import { Fragment, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useFilesSus, useFileStorageUsage, createFolder, createWebsiteFile, changeFileName, changeFileParent, deleteFile } from '../../utils/data_fetching.jsx';
import { IconByExtension } from '../../utils/utils.jsx';

import FileDropzone from '../../components/file_dropzone.jsx';
import FilePopover from '../../popovers/management/files.jsx';
import { FileConflictPopover } from '../../popovers/management/file_conflicts.jsx';
import ConformationPopover from '../../popovers/conformation_popover.jsx';
import { Popover } from '../../components/popover.jsx';
import { Link, FileArrowUp } from '../../components/icon_replacements.jsx';

import '/public/pages/files.css';
import { Input } from '../../components/inputs.jsx';


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
        for(let i = 1; i < currentFolder.length; i++) {
            if(currentFolderData[currentFolder[i].name] == undefined) {
                setCurrentFolder(currentFolder.splice(0, i));
                break;
            }
            currentFolderData = currentFolderData[currentFolder[i].name];
        }

        let newFolders = [];
        let newFiles = [];
        for(let [folderName, data] of Object.entries(currentFolderData)) {
            if(data.utid != undefined) newFiles.push({ name: folderName, utid: data.utid, id: data.id });
            else if(data.url != undefined) newFiles.push({ name: folderName, url: data.url, id: data.id });
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

    const addWebsiteURLPopoverRef = useRef();

    const draggedFile = useRef();
    const deleteWindow = useRef();
    const deleteConformationPopover = useRef();

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
                    conflictMap[conflict.child.id] = conflict.decision;
                });
                changeFileParent(queryClient, getCurrentFolder().id, toId, fileInfo.id, conflictMap);
            };
            fileConflictPopoverRef.current.open();
        }
    }
    function CreateFile({ name, id, isFolder, isURL, onDoubleClick  }) {
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
                { (() => {
                    if(isFolder) return <i className="file-type fas fa-folder"/>;
                    else if(isURL) return <i className="file-type fas fa-link"/>;
                    else return <IconByExtension extension={ name.split('.').pop() } />;
                })() }
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
                                    conflictMap[conflict.child.id] = conflict.decision;
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

                    <FileArrowUp style={{ width:"1.5rem", height:"1.5rem", cursor:"pointer", marginRight:"10px" }} viewBox="0 0 384 512" onClick={() => uploadPopoverRef.current.open()} />

                    <Link style={{ width:"1.5rem", height:"1.5rem", cursor:"pointer", color:"var(--prominent-text)" }} onClick={() => addWebsiteURLPopoverRef.current.open()} />

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
                                key={id} name={name} id={id} isFolder={true} isURL={false}
                                onDoubleClick={() => { 
                                    if(id == 'noid') return;
                                    addToCurrentFolder({name: name, id: id}); 
                                }}
                            />    
                        )
                    }
                </div>
                <div className="files">
                    {
                        files.map(({name, utid, url, id}) => {
                            if(url) {
                                return (
                                <CreateFile 
                                    key={id} name={name} id={id} isFolder={false} isURL={true}
                                    onDoubleClick={() => {
                                        var link = document.createElement('a');
                                        link.href = url;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                }} />);
                            }
                            return (
                            <CreateFile 
                                key={id} name={name} id={id} isFolder={false} isURL={false}
                                onDoubleClick={() => {
                                    var link = document.createElement('a');
                                    link.href = 'https://utfs.io/f/' + utid;
                                    link.download = name;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                            }} />);
                        })
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
                <ConformationPopover ref={deleteConformationPopover} />
                <Popover ref={addWebsiteURLPopoverRef} form={true} onSubmit={async (ev) => {
                    ev.preventDefault();
                    let url = '';
                    try {
                        url = new URL(ev.target.urlInput.value);
                        url = ev.target.urlInput.value;
                    } catch(err) {
                        try {
                            url = new URL('https://' + ev.target.urlInput.value);
                            url = 'https://' + ev.target.urlInput.value;
                        } catch(err) {
                            return;
                        }
                    }
                    addWebsiteURLPopoverRef.current.close();
                    const {name,id} = await createWebsiteFile(queryClient, getCurrentFolder().id, url);
                    await changeFileName(queryClient, getCurrentFolder(), id, name, (new URL(url)).host);
                }}>
                    <Input placeholder="website.url.com" name="urlInput" onEnter={(ev) => {
                        ev.target.form.submit();
                    }} />
                    <input type="submit" />
                </Popover>
            </div>
            <div 
            className="delete" ref={deleteWindow}
            onDrop={() => {
                if(draggedFile.current.isFolder) {
                    deleteConformationPopover.current.open(
                        'Deze actie zal de volledige folder verwijderen en dit kan niet ongedaan worden',
                        () => {
                            deleteFile(queryClient, currentFolder, draggedFile.current.id);
                            draggedFile.current = undefined;
                            deleteWindow.current.classList.remove('active');
                        }
                    );
                    return;
                }
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