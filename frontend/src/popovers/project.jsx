import { useRef, forwardRef, useImperativeHandle, useState } from 'react';

import { Popover, Middle, Right } from '../components/popover.jsx';
import Project from '../components/project.jsx';
import Website from '../components/website.jsx';
import { Input, Checkbox } from '../components/inputs.jsx';

export const ProjectPopover = forwardRef(({}, ref) => {
    const internalRef = useRef();
    useImperativeHandle(ref, () => ({
        open: (projectData) => {
            setData(projectData);
            internalRef.current.open();
        },
        close: () => {
            internalRef.current.close();
        }
    }));
    const [data, setData] = useState();
    if(data == undefined) return <Popover ref={internalRef} id="project-popover" />;

    return (
        <Popover ref={internalRef} id="project-popover">
            <Middle>
                <div className="split-window">
                    <Project projectData={data} urls={false} />
                    <Website data={data.url1} />
                </div>
                <div className="split-window">
                    <Website data={data.url2} />
                    <Website data={data.url3} />
                </div>
            </Middle>
        </Popover>
    );
});
export default ProjectPopover;

/*
<Right>
    <h2 className="card-title">Meld je aan!</h2>

    <Input type="text" placeholder="Pietje jan" label="Naam*" name="projectExecutor" />
    <Input type="text" placeholder="pietje.jan@gmail.com" label="Email*" name="projectExecutorEmail" />
    <Checkbox label="Ik geef hierbij Eureka toestemming mij te mailen over dit project*" checked={false} />

    <input type="submit" value="Aanmelden" />
</Right>
*/