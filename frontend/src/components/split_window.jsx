import { useEffect, useRef, useState } from "react";

export function SplitWindow({ children, minColumnWidth, seperator, smallVerticalGap }) {
    const ref = useRef();
    const [horizontal, setHorizontal] = useState(true);
    useEffect(() => {
        window.addEventListener('resize', (ev) => {
            if(ref.current.clientWidth <= minColumnWidth * ref.current.childElementCount) {
                setHorizontal(false);
                return;
            }
            setHorizontal(true);
        });
    }, []);
    useEffect(() => {
        if(ref.current.clientWidth <= minColumnWidth * ref.current.childElementCount) {
            setHorizontal(false);
            return;
        }
        setHorizontal(true);
    })

    return (
        <div ref={ref} className={'split-window' + (seperator?' seperator':'') + (horizontal?' horizontal':' vertical') + (smallVerticalGap?' small-gap':'')}>
            {children}
        </div>
    );
}