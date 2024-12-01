import { forwardRef, useId, useImperativeHandle, useRef, useState } from "react";
import { Popover } from "../components/popover";

export const ConformationPopover = forwardRef(({}, ref) => {
    const popoverID = useId();
    const internalRef = useRef();
    useImperativeHandle(ref, () => ({
        open: (message, callbackArg) => {
            setMessage(message);
            callback.current = callbackArg;
            internalRef.current.open();
        },
        close: () => {
            internalRef.current.close();
        }
    }));

    const [message, setMessage] = useState();
    var callback = useRef();

    return (
        <Popover ref={internalRef} id={popoverID}>
            <p id="project-conformation-message">{message}</p>
            <div className="split-window">
                <button popovertarget={popoverID} popovertargetaction="hide" style={{backgroundColor: 'var(--denial)', borderColor: 'var(--denial)'}} onClick={callback.current}>Doe het</button>
                <button popovertarget={popoverID} popovertargetaction="hide">Annuleer</button>
            </div>
        </Popover>
    );
});
export default ConformationPopover;