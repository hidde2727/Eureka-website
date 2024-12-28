import { useRef, forwardRef, useImperativeHandle } from 'react';

export const Popover = forwardRef(({children, id, className, form, onSubmit}, ref) => {
    const internalRef = useRef(null);
    const internalContentRef = useRef();
    const eventHandler = useRef((event) => {
        // If the event targets the popover !and not the content! close the popover
        if(event.target == internalRef.current)
            ref.current.close();
    });
    useImperativeHandle(ref, () => ({
        open: () => {
            if(internalRef.current.showPopover == undefined) return alert('Popovers hebben geen support in deze browser!');
            internalRef.current.showPopover();
            window.addEventListener('click', eventHandler.current);
        },
        close: () => {
            internalRef.current.hidePopover();
            window.removeEventListener('click', eventHandler.current)
        },
        content: internalContentRef?.current
    }));

    if(form) {
        return (
            <div popover="true" id={id} ref={internalRef}>
                <form ref={internalContentRef} className={ "content " + className } onSubmit={onSubmit}>
                    {children}
                </form>
            </div>
        );
    }

    return (
        <div popover="true" id={id} ref={internalRef}>
            <div ref={internalContentRef} className={ "content " + className }>
                {children}
            </div>
        </div>
    );
});
export function Left({children}) {
    return (
        <div className="left">
            {children}
        </div>
    );
}
export function Middle({children}) {
    return (
        <div className="middle">
            {children}
        </div>
    );
}
export function Right({children}) {
    return (
        <div className="right">
            {children}
        </div>
    );
}
export function MiddleTop({children}) {
    return (
        <div className="top">
            {children}
        </div>
    );
}
export function MiddleBottom({children, className}) {
    return (
        <div className={`bottom ${className}`}>
            {children}
        </div>
    );
}