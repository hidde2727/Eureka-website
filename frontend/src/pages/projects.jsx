import { Suspense, useContext } from 'react';

import { useProjectsSus } from '../utils/data_fetching.jsx'

import Project from '../components/project.jsx';
import Loading from '../components/loading.jsx';
import PopoverContext from '../popovers/context.jsx';
import Footer from '../components/footer.jsx';

export default function Projects({isActive}) {
    return (
        <div className="window" id="projects" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <div>
                <h1>Projecten</h1>
                <Suspense fallback={<Loading />}>
                    <ProjectsSuspense />
                </Suspense>
            </div>
            <Footer />
        </div>
    )
}

function ProjectsSuspense() {
    const { projects, isFetching, hasError } = useProjectsSus();
    const popoverContext = useContext(PopoverContext)

    if(isFetching) return;
    if(hasError || projects==undefined) return <p>Error tijdens het ophalen van de projecten</p>;
    return (
        <>
        {
            projects.map((projectData) => <Project projectData={projectData} key={projectData.uuid} onClick={ () => { 
                popoverContext.project.current.open(projectData)
            } } ></Project>)
        }
        </>
    )
}