import { useId, useState } from 'react';

export function Input(props) {
    const labelClassName = props.inline ? 'inline' : '';
    const id = props.id != undefined ? props.id : useId();

    var onKeyDown = undefined;
    if(props.type == "text") {
        onKeyDown = (event) => {
            if(event.keyCode == 13) {
                event.preventDefault();
                event.target.blur();
            }
        };
    }

    return (
        <>
            <label htmlFor={id} className={labelClassName}>{props.label}</label>
            <input type={props.type} id={id} placeholder={props.placeholder} name={props.name} onKeyDown={onKeyDown} onChange={props.onChange} />
        </>
    );
}

export function Textarea(props) {
    const labelClassName = props.inline ? 'inline' : '';
    const [value, setValue] = useState();
    const id = props.id != undefined ? props.id : useId();

    return (
        <>
            <label htmlFor={id} className={labelClassName}>{props.label}</label>
            <div className="auto-grow" data-replicated-value={value}><textarea onInput={(ev) => { setValue(ev.target.value) }} id={id} placeholder={props.placeholder} name={props.name} rows={props.rows}></textarea></div>
        </>
    );
}

export function Select(props) {
    return;
}