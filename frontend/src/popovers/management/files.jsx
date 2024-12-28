import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Popover } from '../../components/popover.jsx';
import { FileConflictPopover } from './file_conflicts.jsx';

import { DoesElementSupportProperty, IconByExtension, GetCookie } from '../../utils/utils.jsx';
import { useUploadThing } from '../../utils/generate_uploadthing.jsx';
import { invalidateFiles } from '../../utils/data_fetching.jsx';

import '/public/popovers/files.css';

export const FilePopover = forwardRef(({parentFolder, files, setFiles}, ref) => {
    const selfRef = useRef();
    useImperativeHandle(ref, () => ({
        open: () => {
            const fileCopy = [...files];
            setFiles(fileCopy.filter((file) => {
                return file.progress==undefined || file?.progress<100;
            }));
            selfRef.current.open();
        },
        close: () => {
            selfRef.current.close();
        }
    }));
    const queryClient = useQueryClient();

    const errorPopover = useRef();
    const [erroringFiles, setErroringFiles] = useState();
    useEffect(() => {
        // Upload the files when the existingFiles array is empty
        if(erroringFiles == undefined || erroringFiles.length > 0) return;
        prepareUpload(undefined, true);
        errorPopover.current.close();
        setErroringFiles(undefined);
    }, [erroringFiles]);

    const fileInputID = useId();
    const folderInputID = useId();

    const [uploadState, setUploadstate] = useState('Upload');
    const { startUpload } = useUploadThing('/api/private/uploadthing', 'defaultRouter', {
        onClientUploadComplete: () => {
            //alert("uploaded successfully!");
            setUploadstate('Upload');
            invalidateFiles(queryClient);
        },
        onUploadError: (err) => {
            setUploadstate('Upload');
            if(err?._tag == 'UploadThingError' && !(err?.code == 'INTERNAL_SERVER_ERROR' && err?.message[0] == '{')) {
                alert(err.message);
                return;
            }

            const json = JSON.parse(err.message);
            if(json?.error != undefined) { alert(json.error); errorPopover.current.close(); return; }
            // Some files already exist
            setErroringFiles(json.existingFiles);
            errorPopover.current.open();
        },
        onUploadBegin: (fileName) => {
            setUploadstate('Uploading');
            console.log("upload has begun for ", fileName);
        },
        onUploadProgress: (file, progress, delta) => {
            if(file.name == undefined) return;
            const path = file?.webkitRelativePath!='' ? file.webkitRelativePath : file.name;
            console.log('file: ' + path + ' & progress: ' + progress + ' & delta: ' + delta);

            const locationInArray = files.findIndex((file) => {
                if (file.isFolder) return file.files.findIndex((file2) => file2.webkitRelativePath == path) != -1;
                return file.name == path;
            });
            if (locationInArray == -1) throw new Error('Cant find the file in the files array to update the progress');
            if(delta == 0) return;
            setFiles((previousFiles) => {
                let fileCopy = [...previousFiles];
                if(previousFiles[locationInArray].isFolder) fileCopy[locationInArray].progress = Math.min((previousFiles[locationInArray].progress ?? 0) + delta/previousFiles[locationInArray].files.length, 100);
                else fileCopy[locationInArray].progress = Math.min(progress, 100);
                return fileCopy;
            })
        },
        headers: { sessionCredentialRepeat: decodeURI(GetCookie("sessionCredential")) }
    });
    function prepareUpload(ev, override=false) {
        // transform files into a array of only files
        if(files.length == 0) return;
        if(!override && uploadState != 'Upload') return;
        setUploadstate('Preparing');
        let transformedFiles = [];
        let directories = [];
        for(const file of files) {
            if(file.progress >= 100) continue;
            if(file.isFolder) {
                for(const file2 of file.files) {
                    transformedFiles.push(file2);
                    directories.push(file2.webkitRelativePath);
                }
            } else {
                transformedFiles.push(file);
                directories.push(file.name);
            }
        }
        if(directories.length == 0 || transformedFiles.length == 0) { setUploadstate('Upload'); return; }
        startUpload(transformedFiles, {directories: directories, parentID: '' + parentFolder.id, override: override});
        setUploadstate('Getting file info');
    }

    function onOverlapResolved(erroringFiles) {
        let newFiles = files;
        erroringFiles.forEach((file) => {
            if(file.decision == 'ignore') {
                newFiles = removeFileWithName(file.child.path, newFiles);
            }
        });
        setFiles(newFiles);
        setErroringFiles([]);
    }

    function removeFileWithName(path, files) {
        const locationInArray = files.findIndex((file) => {
            if (file.isFolder) return file.files.findIndex((file2) => file2.webkitRelativePath == path) != -1;
            return file.name == path;
        });
        if (locationInArray == -1) return files;
        let newFiles = undefined;
        if (files[locationInArray].isFolder) {
            newFiles = [...files];
            newFiles[locationInArray].files = [...newFiles[locationInArray].files].filter((file2) => file2.webkitRelativePath != path);
            if (newFiles[locationInArray].files.length == 0) newFiles = files.slice(0, locationInArray).concat(files.slice(locationInArray + 1));
        } else {
            newFiles = files.slice(0, locationInArray).concat(files.slice(locationInArray + 1));
        }
        return newFiles;
    }
    
    return (
        <Popover ref={selfRef} className="file-popover">
            <label className="file-chooser" htmlFor={fileInputID}>
                <i className="fas fa-cloud-arrow-up" />
                <label className="file" htmlFor={fileInputID}>Kies files om te uploaden</label>
                <input type="file" id={fileInputID} multiple={true} onChange={(ev)=>{
                    let newFileArray = [...files];
                    let giveError = false;
                    for(const file of ev.target.files) {
                        const doesExist = newFileArray.findIndex((file2) => file2.name == file.name);
                        if(doesExist != -1) { giveError = true; continue; }
                        newFileArray.push(file);
                    }
                    setFiles(newFileArray);
                    if(giveError)
                        alert('Een deel van de files is niet toegevoegd aangezien de naam overeen kwam met een andere file/folder');
                }} />
                {
                    // Make sure to only display an extra input for folders if the browser supports it
                    DoesElementSupportProperty('input', 'webkitdirectory') && (
                        <>
                            <label className="folder" htmlFor={folderInputID}>Of kies een folder...</label>
                            <input type="file" id={folderInputID} multiple={true} webkitdirectory="true"  
                            onChange={(ev)=>{
                                let newFileArray = [...files];

                                let folders = {};
                                for(const file of ev.target.files) {
                                    const folderName = file.webkitRelativePath.split('/')[0];
                                    if(!folders[folderName]) folders[folderName] = [];
                                    folders[folderName].push(file);
                                }
                                let giveError = false;
                                for(const [folderName, files] of Object.entries(folders)) {
                                    const doesExist = newFileArray.findIndex((file2) => file2.name == folderName);
                                    if(doesExist != -1) { giveError = true; continue; }
                                    newFileArray.push({isFolder: true, name: folderName, files: files});
                                }

                                setFiles(newFileArray);
                                if(giveError)
                                    alert('Een deel van de folders is niet toegevoegd aangezien de naam overeen kwam met een andere file/folder');
                            }} />
                        </>
                    )
                }
            </label>

            { files.length!=0 && (<p className="selected-files">Geselecteerde files:</p>) }
            <div className="selected-files">
            {
                files.map((file, index) => {
                    // Check if it is a folder entry
                    if(file.isFolder) {
                        return (
                            <div className="file" key={index}>
                                <i className="file-type fas fa-folder fa-fw"/>
                                <p className="file-name">{file.name}</p>
                                <span className="dot" />
                                <p className="state">{(() => {
                                    if(file.progress == undefined) return 'ready';
                                    else if(file.progress < 100) return 'uploading';
                                    else return 'uploaded';
                                })()}</p>
                                { (() => {
                                    if(file.progress == undefined && uploadState != 'Upload') return;
                                    else if(file.progress >= 100) return <i className='reupload fas fa-sync-alt' onClick={() => { const newFiles = [...files]; newFiles[index].progress = undefined; setFiles(newFiles); }} />;
                                    else return <i className="cancel fas fa-x fa-fw" onClick={() => { setFiles([...files].filter((file2) => file2.name!=file.name )); }} />;
                                })() }
                                <div className={'progress' + (file.progress!=undefined?' animate':'')}><div className="inner-progress" style={{ width: (file.progress ?? 0) + '%' }} /></div>
                            </div>
                        );
                    }
                    return (
                        <div className="file" key={index}>
                            <IconByExtension extension={ file.name.split('.').pop() } fw={true} />
                            <p className="file-name">{file.name}</p>
                            <span className="dot" />
                            <p className="state">{(() => {
                                if(file.progress == undefined) return 'ready';
                                else if(file.progress < 100) return 'uploading';
                                else return 'uploaded';
                            })()}</p>
                            { (() => {
                                if(file.progress == undefined && uploadState != 'Upload') return;
                                else if(file.progress >= 100) return <i className='reupload fas fa-sync-alt' onClick={() => { const newFiles = [...files]; newFiles[index].progress = undefined; setFiles(newFiles); }} />;
                                else return <i className="cancel fas fa-x fa-fw" onClick={() => { setFiles([...files].filter((file2) => file2.name!=file.name )); }} />;
                            })() }
                            <div className={'progress' + (file.progress!=undefined?' animate':'')}><div className="inner-progress" style={{ width: (file.progress ?? 0) + '%' }} /></div>
                        </div>
                    );
                })
            }
            </div>

            <button className="upload" onClick={prepareUpload}>{uploadState}</button>
            
            <FileConflictPopover ref={errorPopover} parentFolder={parentFolder.name} conflictingFiles={erroringFiles} setConflictingFiles={setErroringFiles} onResolved={onOverlapResolved} />
        </Popover>
    );
});
export default FilePopover;