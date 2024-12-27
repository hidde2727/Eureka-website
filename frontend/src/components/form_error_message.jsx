import { useState, useEffect, useRef } from 'react';

function CalculateOffsets(forElement) {
    var offsetParent = forElement;
    var style = getComputedStyle(offsetParent);
    var offsetTop = parseFloat(style.height, 10) - parseFloat(style.paddingTop, 10) - parseFloat(style.borderTop, 10);
    var offsetLeft = 0;
    while(offsetParent.nodeName != 'FORM') {
      style = getComputedStyle(offsetParent);
      offsetTop += offsetParent.offsetTop + parseFloat(style.paddingTop, 10) + parseFloat(style.marginTop, 10) + parseFloat(style.borderTop, 10);
      offsetLeft += offsetParent.offsetLeft + parseFloat(style.paddingLeft, 10) + parseFloat(style.marginLeft, 10) + parseFloat(style.borderLeft, 10);
      offsetParent = offsetParent.offsetParent;
      if(offsetParent.parentElement == undefined) throw new Error("Invalid faultmessage -> requested element isn't part of a FORM element");
    }
    return [offsetTop, offsetLeft];
}

export function SetFormErrorMessage(setError, errorMessage, errorInput) {
    const [offsetTop, offsetLeft] = CalculateOffsets(errorInput);
    setError({ message: errorMessage, atInput: {offsetTop, offsetLeft} });

    errorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    errorInput.focus();
}

export function FormErrorMessage({ error }) {
    const [isTriggered, setIsTriggered] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if(error?.atInput != undefined && error?.message != undefined)
            setIsTriggered(true);
    }, [error?.atInput, error?.message]);
    useEffect(() => {
        if(isTriggered) {
            const HandleOutsideClick = (ev) => {
                if(ev.target != ref.current) setIsTriggered(false);
            };
            window.addEventListener('click', HandleOutsideClick);
            window.addEventListener('keydown', HandleOutsideClick);
            return () => {
                window.removeEventListener('click', HandleOutsideClick);
                window.removeEventListener('keydown', HandleOutsideClick);
            }
        }
    }, [isTriggered, ref]);

    if(!isTriggered && !error?.atInput && !error?.message) return (<p className="tooltip js-controlled fault-message bottom"></p>);
    else if(!isTriggered) return (<p className="tooltip js-controlled fault-message bottom" style={{top: error?.atInput?.offsetTop, left: error?.atInput?.offsetLeft}}>{error?.message}</p>);

    return (
        <p className="tooltip js-controlled fault-message bottom open" style={{top: error?.atInput?.offsetTop, left: error?.atInput?.offsetLeft}} ref={ref}>
            {error?.message}
        </p>
    )
}