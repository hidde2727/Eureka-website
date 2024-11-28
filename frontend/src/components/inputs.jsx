import { useId, useState } from 'react';

export function Input({ inline, id=undefined, type, label, placeholder, value, name, onChange=undefined }) {
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
            <input type={type} id={idInternal} placeholder={placeholder} defaultValue={value} name={name} onKeyDown={onKeyDown} onChange={onChange} />
        </>
    );
}

export function IconedInput({ iconClass, id, type, placeholder, value, name, onChange=undefined }) {
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
            <input type={type} id={idInternal} placeholder={placeholder} defaultValue={value} name={name} onKeyDown={onKeyDown} onChange={onChange} />
        </div>
    );
}
export function Textarea({ inline, id=undefined, label, placeholder, value, name, rows=undefined }) {
    const labelClassName = inline ? 'inline' : '';
    const [current, setCurrent] = useState(value);
    const idInternal = id != undefined ? id : useId();

    return (
        <>
            <label htmlFor={idInternal} className={labelClassName}>{label}</label>
            <div className="auto-grow" data-replicated-value={current}><textarea onInput={(ev) => { setCurrent(ev.target.value) }} id={idInternal} placeholder={placeholder} defaultValue={value} name={name} rows={rows}></textarea></div>
        </>
    );
}

export function Select(props) {
    return;
}