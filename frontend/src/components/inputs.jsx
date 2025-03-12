import { useId, useState, useRef, useEffect  } from 'react';

export function Input({ inline, id=undefined, type, label, placeholder, value, name, noLabel=false, onChange=undefined, onEnter=undefined }) {
    const labelClassName = inline ? 'inline' : '';
    const idInternal = id != undefined ? id : useId();

    var onKeyDown = undefined;
    if(type == "text") {
        onKeyDown = (event) => {
            if(event.key === 'Enter') {
                event.preventDefault();
                event.target.blur();

                if(onEnter) onEnter(event);
            }
        };
    }

    return (
        <>
            { (!noLabel && label!=undefined) && <label htmlFor={idInternal} className={labelClassName}>{label}</label> }
            <input type={type} id={idInternal} placeholder={placeholder} defaultValue={value} name={name} onKeyDown={onKeyDown} onChange={onChange} />
        </>
    );
}

export function IconedInput({ iconClass, id, type, placeholder, value, name, onChange=undefined }) {
    const idInternal = id != undefined ? id : useId();

    var onKeyDown = undefined;
    if(type == "text") {
        onKeyDown = (event) => {
            if(event.key === 'Enter') {
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
export function Textarea({ inline, id=undefined, className, label, placeholder, value, name, rows=undefined, onChange }) {
    const labelClassName = inline ? 'inline' : '';
    const [current, setCurrent] = useState(value);
    const idInternal = id != undefined ? id : useId();

    return (
        <>
            { label!=undefined && <label htmlFor={idInternal} className={labelClassName}>{label}</label> }
            <div className="auto-grow" data-replicated-value={current}>
                <textarea onInput={(ev) => { setCurrent(ev.target.value) }} id={idInternal} className={className} placeholder={placeholder} defaultValue={value} name={name} rows={rows} onChange={onChange} />
            </div>
        </>
    );
}

export function Select({ items, defaultActive, onChange }) {
    function OnChange(item) {
        if(onChange) onChange(item);
    }
    const [selected, setSelected] = useState(defaultActive);
    const [opened, setOpened] = useState(false);
    var ref = useRef();
    useEffect(() => {
        if(opened) {
            const HandleOutsideClick = (ev) => {
                if(!ref.current.contains(ev.target)) setOpened(false);
            };
            window.addEventListener('click', HandleOutsideClick);
            return () => {
                window.removeEventListener('click', HandleOutsideClick);
            }
        }
    }, [opened, ref]);

    return (
        <div className={`select${opened?' open':''}`} onClick={() => {setOpened(!opened);}} ref={ref}>
            <div className="active">{ selected }</div>
            <div className="dropdown">
                { items.map((item) => <div onClick={() => {setOpened(false); setSelected(item); OnChange(item)}} key={item}>{item}</div>) }
            </div>
        </div>
    );
}

export function Checkbox({ id, className, name, label, checked, onChange }) {
    const idInternal = id != undefined ? id : useId();
    return (
        <>
            <span><input type="checkbox" className={className} id={idInternal} defaultChecked={checked} onChange={onChange} name={name}/></span>
            <label htmlFor={idInternal}>{label}</label>
        </>
    );
}

export function SliderToggle({ id, name, label, checked, onChange }) {
    const idInternal = id != undefined ? id : useId();

    return (
        <>
            <label className="slider-toggle" htmlFor={idInternal} >
                <input type="checkbox" id={idInternal} defaultChecked={checked} onChange={onChange} name={name} />
                <span className="internal-slider"></span>
            </label>
            <label htmlFor={idInternal}>{ label }</label>
        </>
    );
}