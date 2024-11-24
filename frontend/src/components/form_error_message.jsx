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

export function SetFormErrorMessage(errorMessaging, errorMessage, errorInput) {
    errorMessaging.setProjectError(errorMessage);
    const [offsetTop, offsetLeft] = CalculateOffsets(errorInput);
    errorMessaging.setProjectErrorInput({offsetTop, offsetLeft});

    errorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    errorInput.focus();
}

export function FormErrorMessage({atInput, message}) {
    const [isTriggered, setIsTriggered] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if(atInput != undefined && message != undefined)
            setIsTriggered(true);
    }, [atInput, message]);
    useEffect(() => {
        if(isTriggered) {
            const HandleOutsideClick = (ev) => {
                if(ev.target != ref.current) setIsTriggered(false);
            };
            window.addEventListener('click', HandleOutsideClick);
            window.addEventListener('keydown', HandleOutsideClick);
            return () => {
                window.removeEventListener('click', HandleOutsideClick);
                window.addEventListener('keydown', HandleOutsideClick);
            }
        }
    }, [isTriggered, ref]);

    if(!isTriggered && !atInput && !message) return (<p className="tooltip js-controlled fault-message bottom"></p>);
    else if(!isTriggered) return (<p className="tooltip js-controlled fault-message bottom" style={{top: atInput.offsetTop, left: atInput.offsetLeft}}>{message}</p>);

    return (
        <p className="tooltip js-controlled fault-message bottom open" style={{top: atInput.offsetTop, left: atInput.offsetLeft}} ref={ref}>
            {message}
        </p>
    )
}