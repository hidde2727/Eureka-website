import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import ConformationPopover from '../../popovers/conformation_popover';

import { RenameLabel, useInspirationLabelsSus } from "../../utils/data_fetching";

import '/public/pages/inspiration_sidebar.css';

export default function Sidebar({ sidebar }) {
    const queryClient = useQueryClient();
    const { labels, isFetching, hasError } = useInspirationLabelsSus();

    const [draggedLabel, setDraggedLabel] = useState();
    useEffect(() => {
        let timeout = undefined;
        document.addEventListener('drag', () => {
            if(timeout != undefined) clearTimeout(timeout);
            timeout = setTimeout(() => {
                setDraggedLabel(undefined);
            }, 500);
        });
    }, []);

    const conformationPopover = useRef();

    return (
        <>
            {
                labels.labels.map((category, index) => {
                    return (
                        <div className="category" key={category.name}>
                            <div className="header">
                                <a
                                    onDoubleClick={(ev) => {
                                        ev.target.contentEditable = true;
                                        ev.target.oldName = ev.target.innerText;
                                    }}
                                    onKeyDown={(ev) => {
                                        if(ev.key === 'Enter') {
                                            ev.preventDefault();
                                            ev.target.blur();
                                        }
                                    }}
                                    onBlur={async (ev) => {
                                        ev.target.contentEditable = false;
                                        if(ev.target.oldName != ev.target.innerText) {
                                            const hasConflicts = await RenameLabel(queryClient, null, category.id, ev.target.innerText, false);
                                            if(hasConflicts.hasConflicts) {
                                                conformationPopover.current.open(`Deze actie zal de huidige categorie met de naam '${ev.target.innerText}' combineren met '${ev.target.oldName}' en dit kan niet ongedaan worden`,
                                                    () => {
                                                        RenameLabel(queryClient, null, category.id, ev.target.innerText, true);
                                                    }
                                                )
                                            }
                                        }
                                    }}
                                >{category.name}</a>
                            </div>
                            <div className="content">
                                <DropZone show={draggedLabel != undefined} type="label" />
                                {
                                    category.labels.map(({ id, name }) => {
                                        return (
                                        <>
                                            <div className="inspiration-label" key={id} draggable={true}
                                                onDragStart={(ev) => {
                                                    setDraggedLabel({ id: id, name: name, type:'label' });
                                                }}>
                                                <i className="fas fa-grip-vertical" />
                                                <label 
                                                onDoubleClick={(ev) => {
                                                    ev.target.contentEditable = true;
                                                    ev.target.parentNode.draggable = false;
                                                    ev.target.oldName = ev.target.innerText;
                                                }}
                                                onKeyDown={(ev) => {
                                                    if(ev.key === 'Enter') {
                                                        ev.preventDefault();
                                                        ev.target.blur();
                                                    }
                                                }}
                                                onBlur={async (ev) => {
                                                    ev.target.contentEditable = false;
                                                    ev.target.parentNode.draggable = true;
                                                    if(ev.target.oldName != ev.target.innerText) {
                                                        const hasConflicts = await RenameLabel(queryClient, category.id, id, ev.target.innerText, false);
                                                        if(hasConflicts.hasConflicts) {
                                                            conformationPopover.current.open(`Deze actie zal de huidige label met de naam '${ev.target.innerText}' combineren met '${ev.target.oldName}' en dit kan niet ongedaan worden`,
                                                                () => {
                                                                    RenameLabel(queryClient, category.id, id, ev.target.innerText, true);
                                                                }
                                                            )
                                                        }
                                                    }
                                                }}
                                                >{name}</label>
                                            </div>
                                            <DropZone show={draggedLabel != undefined} type="label" />
                                        </>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    )
                })
            }
            <ConformationPopover ref={conformationPopover} />
        </>
    )
    function DropZone({ show, type, onDrop, onDropData }) {
        return(
            <div className="drop-zone" style={{display: show?'block':'none'}}>
                <div className="internal-drop-zone" 
                    onDragEnter={(ev) => {
                        if(draggedLabel?.name == undefined || draggedLabel?.type != type) return;
                        ev.preventDefault();
                        ev.target.classList.add('hovered');
                    }}
                    onDragOver={(ev) => {
                        if(draggedLabel?.name == undefined || draggedLabel?.type != type) return;
                        ev.preventDefault();
                    }}
                    onDragLeave={(ev) => {
                        ev.target.classList.remove('hovered');
                    }} 
                    onDrop={() => {
                        ev.target.classList.remove('hovered');
                        onDrop(draggedLabel, onDropData);
                        setDraggedLabel(undefined);
                    }}
                />
            </div>
        );
    }
}