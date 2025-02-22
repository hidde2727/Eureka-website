import { Suspense, useContext, useEffect, useState } from 'react';

import Footer from '../components/footer.jsx';
import Project from '../components/project.jsx';
import Website from '../components/website.jsx';
import SplitWindow from '../components/split_window.jsx';

import { useInspiration, useProjectsSus } from '../utils/data_fetching.jsx';
import PopoverContext from '../popovers/context.jsx';

export default function Home({isActive}) {

    return (
        <div className="window" id="home" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <div>
                <h1>WELKOM OP DE ROBOTICA SITE</h1>
                <SplitWindow minColumnWidth={570}>
                    <div className="left">
                        <div className="text-center">
                            <h2>EUREKA PROJECTEN</h2>
                            <p>Alle projecten waar Eureka momenteel mee bezig is en waar mensen voor worden gezocht</p>
                        </div>
                    </div>
                    <div className="right projects">
                        <Suspense>
                            <ProjectsSus />
                        </Suspense>
                    </div>
                </SplitWindow>
                <SplitWindow minColumnWidth={570} reversedVertical={true}>
                    <div className="left inspiration">
                        <InspirationSus />
                    </div>
                    <div className="right inspiration">
                        <div className="text-center">
                            <h2>INSPIRATIE</h2>
                            <p>Voor al je inspiratie voor een nieuw robotica project</p>
                        </div>
                    </div>
                </SplitWindow>
                <SplitWindow minColumnWidth={570}>
                    <div className="left">
                        <div className="text-center">
                            <h2>TOM ZIJN LESMATERIAAL</h2>
                            <p>Tom plaatst alle opdrachten van de Robotica lessen hier</p>
                        </div>
                    </div>
                    <div className="right files">
                        <div>
                            <i className="far fa-folder" />
                            <i className="far fa-file-alt" />
                            <i className="far fa-folder" />
                            <i className="far fa-file" />
                            <i className="far fa-folder" />
                            <i className="far fa-file-pdf" />
                            <i className="far fa-folder" />
                            <i className="far fa-file-word" />
                        </div>
                    </div>
                </SplitWindow>
            </div>
            <Footer />
        </div>
    )
}

function ProjectsSus({}) {
    const { projects, isFetching, hasError } = useProjectsSus();
    const popoverContext = useContext(PopoverContext)

    const [randProjects, setRandProjects] = useState([0,0,0]);
    useEffect(() => {
        let choosenProjects = [];
        let choosenProjectIDs = [];
        while(projects.length-choosenProjects.length > 0 && choosenProjects.length < 3) {
            let randomNum = Math.floor(Math.random() * (projects.length - 1));
            if(!choosenProjectIDs.includes(randomNum)) {
                choosenProjectIDs.push(randomNum);
                choosenProjects.push(projects[randomNum]);
            }
        }
        if(choosenProjectIDs.length < 3) {
            while(choosenProjects.length < 3) {
                choosenProjects.push({
                    name: 'Schimmel doolhof',
                    description: 'Een doolhof voor schimmels, simpel en doorzichtig. Dit willen we graag  hebben voor x en y omdat dit een voorstrevend doel is en Lorem ipsum  dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,  quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo  consequat. Duis aute irure dolor in reprehenderit in voluptate velit  esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat  cupidatat non proident, sunt in culpa qui officia deserunt mollit anim  id est laborum.',
                    url1: { url: 'https://www.youtube.com/watch?v=YdOXS_9_P4U' },
                    requester: 'Eureka',
                    implementer: '-',
                    uuid: -choosenProjects.lenght
                });
            }
        }
        setRandProjects(choosenProjects);
    }, []);

    if(randProjects.length == 0) return <div></div>;

    return (
    <div>

        {
            randProjects.map((proj) => {
                return <Project projectData={proj} key={proj.uuid} onClick={ () => { 
                    if(proj.uuid < 0) return;
                    popoverContext.project.current.open(proj);
                } } />
            })
        }

    </div>
    )
}

function InspirationSus({}) {
    const { inspiration, isFetching, hasError } = useInspiration([]);
    const popoverContext = useContext(PopoverContext)

    const [randInspiration, setRandInspiration] = useState([0,0,0]);
    useEffect(() => {
        if(inspiration == undefined) return;
        if(inspiration.pages[0] == undefined) return;

        let choosenInspiration = [];
        let choosenInspirationIDs = [];
        while(inspiration.pages[0].data.length-choosenInspiration.length > 0 && choosenInspiration.length < 3) {
            let randomNum = Math.floor(Math.random() * (inspiration.pages[0].data.length - 1));
            if(!choosenInspirationIDs.includes(randomNum)) {
                choosenInspirationIDs.push(randomNum);
                choosenInspiration.push(inspiration.pages[0].data[randomNum]);
            }
        }
        if(choosenInspirationIDs.length < 3) {
            while(choosenInspiration.length < 3) {
                choosenInspiration.push({
                    isFiller: true,
                    uuid: -choosenInspiration.length
                });
            }
        }
        setRandInspiration(choosenInspiration);
    }, [inspiration]);

    if(randInspiration.length == 0) return <div></div>;

    return (
    <div>

        {
            randInspiration.map((inspiration) => {
                if(inspiration.isFiller) return <Website url="" key={inspiration.uuid} />
                return <Website data={inspiration.additionInfo} key={inspiration.uuid} onClick={ () => { 
                    if(inspiration.uuid < 0) return;
                    popoverContext.inspiration.current.open(inspiration);
                } } />
            })
        }

    </div>
    )
}