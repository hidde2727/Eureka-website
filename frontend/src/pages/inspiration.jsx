import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import Footer from '../components/footer.jsx';
import { Checkbox } from '../components/inputs.jsx';
import Loading from '../components/loading.jsx';
import Restricted from '../components/restricted.jsx';

import { useInspirationLabelsSus } from '../utils/data_fetching.jsx';

const ManagementSidebar = lazy(() => import('./management/inspiration_sidebar.jsx'));

export default function Inspiration({isActive}) {
    const sidebar = useRef();
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="window" id="inspiration" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <div>
                <div className="content">
                    <h1>Inspiratie</h1>

                </div>
                <div className="sidebar" ref={sidebar}>
                    <Suspense fallback={<Loading />}>
                        <Restricted notLoggedIn={true}>
                            <Sidebar sidebar={sidebar} />
                        </Restricted>
                        <Restricted to="modify_inspiration_labels">
                            <button onMouseDown={()=> {setIsEditing(!isEditing);}}/>
                            <div style={{display:!isEditing?'block':'none'}}><Sidebar sidebar={sidebar} display={!isEditing} /></div>
                            <div className="management" style={{display:isEditing?'block':'none'}}><ManagementSidebar sidebar={sidebar} display={isEditing} /></div>
                        </Restricted>
                    </Suspense>
                </div>
            </div>
            <Footer />
        </div>
    );

    function Sidebar({sidebar}) {
        const { labels, isFetching, hasError } = useInspirationLabelsSus();
        const amountCategories = Object.entries(labels.labels).length;
        const [openedCategories, setOpenedCategories] = useState(Array(amountCategories).fill(true));
        const [categoryHeights, setCategoryHeights] = useState(Array(amountCategories).fill('undefined'));
        useEffect(() => {
            setCategoryHeights(
                [...sidebar.current.getElementsByClassName('category')].map((category) => {
                return category.clientHeight;
                })
            );
        }, []);

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
                                <div className="content" style={{height: openedCategories[index]?`${categoryHeights[index]}px`:'0px'}}>
                                    {
                                        category.labels.map(({ id, name }) => {
                                            return (
                                                <div className="inspiration-label" key={id}>
                                                    <Checkbox name={id} label={name} />
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
}