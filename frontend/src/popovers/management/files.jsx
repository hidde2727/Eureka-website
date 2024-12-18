import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Popover } from '../../components/popover.jsx';
import { FileConflictPopover } from './file_conflicts.jsx';

import { DoesElementSupportProperty, IconByExtension, GetCookie } from '../../utils/utils.jsx';
import { useUploadThing } from '../../utils/generate_uploadthing.jsx';
import { invalidateFiles } from '../../utils/data_fetching.jsx';

import '/public/popovers/files.css';

export const FilePopover = forwardRef(({parentFolder, files, setFiles}, ref) => {
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
    const { startUpload, routeConfig } = useUploadThing("defaultRouter", {
        onClientUploadComplete: () => {
            alert("uploaded successfully!");
            setUploadstate('Upload');
            invalidateFiles(queryClient);
        },
        onUploadError: (err) => {
            const json = JSON.parse(err.message);
            if(json.error != undefined) { alert(json.error); errorPopover.current.close(); return; }
            // Some files already exist
            setErroringFiles(json.existingFiles);
            errorPopover.current.open();
            setUploadstate('Upload');
        },
        onUploadBegin: (fileName) => {
            setUploadstate('Uploading');
            console.log("upload has begun for ", fileName);
        },
        onUploadProgress: (progress) => {
            console.log('file: ' + ' & progress: ' + progress);
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
        startUpload(transformedFiles, {directories: directories, parentID: '' + parentFolder.id, override: override});
        setUploadstate('Getting file info');
    }

    function onOverlapResolved(erroringFiles) {
        let newFiles = files;
        erroringFiles.forEach((file) => {
            if(file.decision == 'ignore') {
                newFiles = removeFileWithName(file.path, newFiles);
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
        <Popover ref={ref} className="file-popover">
            <label className="file-chooser" htmlFor={fileInputID}>
                <i className="fas fa-cloud-arrow-up" />
                <label className="file" htmlFor={fileInputID}>Kies files om te uploaden</label>
                <input type="file" id={fileInputID} multiple={true} onChange={(ev)=>{
                    var newFileArray = [...files];
                    for(const file of ev.target.files) {
                        newFileArray.push(file);
                    }
                    setFiles(newFileArray);
                }} />
                {
                    // Make sure to only display an extra input for folders if the browser supports it
                    DoesElementSupportProperty('input', 'webkitdirectory') && (
                        <>
                            <label className="folder" htmlFor={folderInputID}>Of kies een folder...</label>
                            <input type="file" id={folderInputID} multiple={true} webkitdirectory="true"  
                            onChange={(ev)=>{
                                var newFileArray = [...files];

                                var folders = {};
                                for(const file of ev.target.files) {
                                    const folderName = file.webkitRelativePath.split('/')[0];
                                    if(!folders[folderName]) folders[folderName] = [];
                                    folders[folderName].push(file);
                                }
                                for(const [folderName, files] of Object.entries(folders)) {
                                    newFileArray.push({isFolder: true, name: folderName, files: files});
                                }

                                setFiles(newFileArray);
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
                                <p className="state">ready</p>
                                <i className="cancel fas fa-x fa-fw" onClick={() => { setFiles([...files].filter((file2) => file2.name!=file.name )); }} />
                                <div className="progres" />
                            </div>
                        );
                    }
                    return (
                        <div className="file" key={index}>
                            <IconByExtension extension={ file.name.split('.').pop() } fw={true} />
                            <p className="file-name">{file.name}</p>
                            <span className="dot" />
                            <p className="state">ready</p>
                            <i className="cancel fas fa-x fa-fw" onClick={() => { setFiles([...files].filter((file2) => file2.name!=file.name )); }} />
                            <div className="progres" />
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