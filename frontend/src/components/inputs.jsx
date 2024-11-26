import { useId, useState } from 'react';

export function Input({ inline, id=undefined, type, label, placeholder, name, onChange=undefined }) {
    const labelClassName = inline ? 'inline' : '';
    const idInternal = id != undefined ? id : useId();

    var onKeyDown = undefined;
    if(type == "text") {
        onKeyDown = (event) => {
            if(event.keyCode == 13) {
                event.preventDefault();
                event.target.blur();
            }
        };
    }

    return (
        <>
            <label htmlFor={idInternal} className={labelClassName}>{label}</label>
            <input type={type} id={idInternal} placeholder={placeholder} name={name} onKeyDown={onKeyDown} onChange={onChange} />
        </>
    );
}

export function IconedInput({ iconClass, id, type, placeholder, name, onChange=undefined }) {
    const idInternal = id != undefined ? id : useId();

    var onKeyDown = undefined;
    if(type == "text") {
        onKeyDown = (event) => {
            if(event.keyCode == 13) {
                event.preventDefault();
                event.target.blur();
            }
        };
    }

    return (
        <div className="iconed">
            <label htmlFor={idInternal}><i className={iconClass}></i></label>
            <input type={type} id={idInternal} placeholder={placeholder} name={name} onKeyDown={onKeyDown} onChange={onChange} />
        </div>
    );
}
export function Textarea({ inline, id=undefined, label, placeholder, name, rows=undefined }) {
    const labelClassName = inline ? 'inline' : '';
    const [value, setValue] = useState();
    const idInternal = id != undefined ? id : useId();

    return (
        <>
            <label htmlFor={idInternal} className={labelClassName}>{label}</label>
            <div className="auto-grow" data-replicated-value={value}><textarea onInput={(ev) => { setValue(ev.target.value) }} id={idInternal} placeholder={placeholder} name={name} rows={rows}></textarea></div>
        </>
    );
}

export function Select(props) {
    return;
}