import { Fragment, lazy, Suspense, useContext, useEffect, useRef, useState } from 'react';

import Footer from '../components/footer.jsx';
import { Checkbox } from '../components/inputs.jsx';
import Loading from '../components/loading.jsx';
import Restricted from '../components/restricted.jsx';
import Website from '../components/website.jsx';
import PopoverContext from '../popovers/context.jsx'

import { useInspiration, useInspirationLabelsSus } from '../utils/data_fetching.jsx';

const ManagementSidebar = lazy(() => import('./management/inspiration_sidebar.jsx'));

export default function Inspiration({isActive}) {
    const sidebar = useRef();
    const [isEditing, setIsEditing] = useState(false);
    const [selectedLabels, setSelectedLabels] = useState([]);

    const [isSidebarOpened, setSidebarOpen] = useState(false);

    return (
        <div className="window" id="inspiration" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <div>
                <div className="content">
                    <h1>Inspiratie</h1>
                    <div className="websites">
                        <Suspense fallback={<Loading />}>
                            <InspirationSuspense />
                        </Suspense>
                    </div>
                </div>
                <div className="toggle-sidebar" onClick={() => setSidebarOpen(!isSidebarOpened)}><i className="fas fa-filter" /></div>
                <div className={'sidebar' + (isSidebarOpened?' open':' closed')}>
                    <Suspense fallback={<Loading />}>
                        <Restricted notLoggedIn={true}>
                            <div className="sidebar-wrapper" ref={sidebar}><Sidebar sidebar={sidebar} selectedLabels={selectedLabels} setSelectedLabels={setSelectedLabels} isActive={isActive} /></div>
                        </Restricted>
                        <Restricted to="modify_inspiration_labels">
                            <button onMouseDown={()=> {setIsEditing(!isEditing);}}>{isEditing?'Stop editen':'Start editen'}</button>
                            <div className="sidebar-wrapper" style={{display:!isEditing?'block':'none'}} ref={sidebar}><Sidebar sidebar={sidebar} isActive={isActive&&(!isEditing)} selectedLabels={selectedLabels} setSelectedLabels={setSelectedLabels} /></div>
                            <div className="sidebar-wrapper" style={{display:isEditing?'block':'none'}}><ManagementSidebar /></div>
                        </Restricted>
                    </Suspense>
                </div>
            </div>
            <Footer />
        </div>
    );
    // DO NOT DELETE, THESE ARE USED
    var requestedNextPage = false;
    // DO NOT DELETE, THESE ARE USED
    var hasNextPageGlobal = false;
    function InspirationSuspense({}) {
        const { inspiration, isFetching, hasError, hasNextPage, fetchNextPage } = useInspiration(selectedLabels);
        hasNextPageGlobal = hasNextPage;
        if(!isFetching) requestedNextPage=false;

        const popoverContext = useContext(PopoverContext);

        const observeElement = useRef();
        const previousElement = useRef();
        const visibilityObserver = useRef(
            new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if(entry.isIntersecting){ if(!requestedNextPage && hasNextPageGlobal) fetchNextPage(); requestedNextPage=true; }
                });
            })
        );
        useEffect(() => {
            if(previousElement.current != undefined) visibilityObserver.current.unobserve(previousElement.current);
            previousElement.current = observeElement.current;
            if(observeElement.current != undefined) visibilityObserver.current.observe(observeElement.current);
        });

        if (hasError) return <p>Error tijdens het ophalen van de inspiratie</p>;
        if(inspiration == undefined) return <Loading />;
        if(inspiration.pages[0].data.length == 0) return <p>Geen inspiratie gevonden met deze labels</p>;

        return (
            <>
                {
                    inspiration.pages.map((page, index) => {
                        return (
                        <Fragment key={inspiration.pageParams[index]}>{
                            page.data.map((inspirationData, websiteIndex) => { 
                                return (
                                <div className="website-wrapper" ref={index+1==inspiration.pages.length&&websiteIndex==0? observeElement : undefined} key={inspirationData.uuid}>
                                    <Website data={inspirationData.additionInfo} key={inspirationData.uuid} onClick={() => {
                                        popoverContext.inspiration.current.open(inspirationData)
                                    }}></Website>
                                </div>
                                ); 
                            })
                        }</Fragment>
                        );
                    })
                }

            </>
        )
    }
}

function Sidebar({sidebar, selectedLabels, setSelectedLabels, isActive}) {
    const { labels, isFetching, hasError } = useInspirationLabelsSus();
    const amountCategories = Object.entries(labels.labels).length;
    const [openedCategories, setOpenedCategories] = useState(Array(amountCategories).fill(true));
    const [categoryHeights, setCategoryHeights] = useState(Array(amountCategories).fill('auto'));

    const needsRerender = useRef(!isActive);
    if(isActive && needsRerender.current) needsRerender.current = false;
    
    useEffect(() => {
        if(!isActive) return;
        setCategoryHeights(
            [...sidebar.current.getElementsByClassName('category')].map((category) => {
            return category.clientHeight + 'px';
            })
        );
    }, [labels, needsRerender.current]);
    useEffect(() => {
        if(!isActive) {
            needsRerender.current = true;
            setCategoryHeights(Array(amountCategories).fill('auto'));
            setOpenedCategories(Array(amountCategories).fill(true));
        }
    }, [labels]);

    return (
        <>
            {
                labels.labels.map((category, index) => {
                    return (
                        <div className={'category' + (openedCategories[index]?' opened':' closed')} key={category.name}>
                            <div className="header" onClick={() => {
                                let copiedCategories = [...openedCategories];
                                copiedCategories[index] = !copiedCategories[index];
                                setOpenedCategories(copiedCategories);
                            }}>
                                <a>{category.name}</a>
                                <i className="fas fa-chevron-down" />
                            </div>
                            <div className="content" style={{height: openedCategories[index]?categoryHeights[index]:'0px'}}>
                                {
                                    category.labels.map(({ id, name }) => {
                                        return (
                                            <div className="inspiration-label" key={id}>
                                                <Checkbox name={id} label={name} checked={selectedLabels.includes(id)} onChange={() => {
                                                    let selectedLabelsCopy = [...selectedLabels];
                                                    const index = selectedLabelsCopy.indexOf(id);
                                                    if(index == -1) selectedLabelsCopy.push(id)
                                                    else selectedLabelsCopy.splice(index, 1);
                                                    setSelectedLabels(selectedLabelsCopy);
                                                }} />
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    )
                })
            }
        </>
    )
}