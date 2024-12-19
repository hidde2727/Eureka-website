import { forwardRef, useId, useImperativeHandle, useRef, useState } from "react";

import { Popover } from "../../components/popover.jsx";
import { Checkbox } from "../../components/inputs.jsx";

import '/public/popovers/file_conflicts.css';

export const FileConflictPopover = forwardRef(({parentFolder, conflictingFiles, setConflictingFiles, onResolved, nameProperty='name'}, ref) => {
    const internalPopoverRef = useRef();
    const [currentFile, setCurrentFile] = useState(0);

    useImperativeHandle(ref, () => ({
        open: () => {
            internalPopoverRef.current.open();
            setCurrentFile(0);
        },
        close: () => {
            internalPopoverRef.current.close();
        }
    }));

    function replaceFrontErroringFile() {
        if (document.getElementById(checkboxID).checked) {
            const newFiles = [...conflictingFiles].map((file) => {
                return { ...file, decision: 'replace' };
            });
            setConflictingFiles(newFiles);
            setCurrentFile(0);
            onResolved(newFiles);
            return;
        }

        const newFiles = [...conflictingFiles];
        newFiles[currentFile].decision = 'replace';
        setConflictingFiles(newFiles);

        if(currentFile + 1 >= conflictingFiles.length) {
            setCurrentFile(0);
            onResolved(newFiles);
            return;
        }

        setCurrentFile(currentFile + 1);
    }
    function ignoreFrontErroringFile() {
        if (document.getElementById(checkboxID).checked) {
            const newFiles = [...conflictingFiles].map((file) => {
                return { ...file, decision: 'ignore' };
            });
            setConflictingFiles(newFiles);
            setCurrentFile(0);
            onResolved(newFiles);
            return;
        }

        const newFiles = [...conflictingFiles];
        newFiles[currentFile].decision = 'ignore';
        setConflictingFiles(newFiles);

        if(currentFile + 1 >= conflictingFiles.length) {
            setCurrentFile(0);
            onResolved(newFiles);
            return;
        }

        setCurrentFile(currentFile + 1);
    }

    const checkboxID = useId();

    return (
        <Popover className="file-conflicts-popover" ref={internalPopoverRef}>
            { (()=>{
                if(conflictingFiles == undefined || conflictingFiles.length == 0) return;
                return (
                <>
                    <p className="existing-files"><a>{conflictingFiles[currentFile][nameProperty].split('/').pop()}</a><a> bestaat al in </a><a>{parentFolder}</a></p>
                    {
                        (currentFile <= conflictingFiles.length) && <p className="amount-same"><a>Net als </a><a>{conflictingFiles.length - 1 - currentFile}</a><a> andere files</a></p>
                    }
                    <div className="replace-button" onClick={replaceFrontErroringFile}><i className="fas fa-trash-alt" /><a>Vervang de huidige file</a></div>
                    <div className="skip-button" onClick={ignoreFrontErroringFile}><i className="fas fa-reply" /><a>Sla deze file over</a></div>
                    <Checkbox id={checkboxID} label="Pas toe op alle files" checked={false} />
                </>
                );
            })() }
        </Popover>
    );
});