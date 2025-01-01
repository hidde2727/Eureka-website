import { Fragment, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import ConformationPopover from '../../popovers/conformation_popover';

import { moveLabel, renameLabel, useInspirationLabelsSus, addLabel, deleteLabel } from "../../utils/data_fetching";

import '/public/pages/inspiration_sidebar.css';

export default function Sidebar({ display }) {
    const queryClient = useQueryClient();
    const { labels, isFetching, hasError } = useInspirationLabelsSus();

    const [draggedLabel, setDraggedLabel] = useState();
    useEffect(() => {
        let timeout = undefined;
        document.addEventListener('drag', () => {
            console.log('drag')
            if(timeout != undefined) clearTimeout(timeout);
            timeout = setTimeout(() => {
                setDraggedLabel(undefined);
                console.log('undrag')
            }, 500);
        });
    }, []);

    const conformationPopover = useRef();

    return (
        <div className="management" style={{display: display?'block':'none'}}>
            <DropZone show={draggedLabel != undefined} type="category" onDrop={OnLabelDrop} onDropData={{position: 0, parentID: null}} />
            {
                labels.labels.map((category, categoryIndex) => {
                    return (
                    <Fragment key={category.name}>
                        <Category category={category} draggedLabel={draggedLabel} />
                        <DropZone show={draggedLabel != undefined} type="category" onDrop={OnLabelDrop} onDropData={{position: categoryIndex+1, parentID: null}} />
                    </Fragment>
                    )
                })
            }
            <div className="add-button">
                <i className="fas fa-plus"
                    onClick={(ev) => {
                        const input = ev.target.parentNode.getElementsByTagName('input')[0];
                        if (input.value.length == 0) return;
                        addLabel(queryClient, null, input.value);
                        input.value = '';
                    }}
                />
                <input type="text" placeholder="Voeg categorie toe"
                    onKeyDown={(ev) => {
                        if (ev.key === 'Enter') {
                            ev.preventDefault();
                            ev.target.blur();
                            if (ev.target.value.length == 0) return;
                            addLabel(queryClient, null, ev.target.value);
                            ev.target.value = '';
                        }
                    }}
                />
            </div>
            <ConformationPopover ref={conformationPopover} />
        </div>
    )
    function Category({category, draggedLabel}) {
        return (
        <div className="category" key={category.name} draggable={true}
            onDragStart={(ev) => {
                ev.stopPropagation();
                setDraggedLabel({ id: category.id, name: category.name, type: 'category' });
            } }
        >
            <div className="header">
                <a
                    onDoubleClick={(ev) => {
                        ev.target.contentEditable = true;
                        ev.target.oldName = ev.target.innerText;
                        ev.target.parentNode.parentNode.draggable = false;
                    } }
                    onKeyDown={(ev) => {
                        if (ev.key === 'Enter') {
                            ev.preventDefault();
                            ev.target.blur();
                        }
                    } }
                    onBlur={async (ev) => {
                        ev.target.contentEditable = false;
                        ev.target.parentNode.parentNode.draggable = true;
                        if (ev.target.oldName != ev.target.innerText) {
                            const hasConflicts = await renameLabel(queryClient, null, category.id, ev.target.innerText, false);
                            if (hasConflicts.hasConflicts) {
                                conformationPopover.current.open(`Deze actie zal de huidige categorie met de naam '${ev.target.innerText}' combineren met '${ev.target.oldName}' en dit kan niet ongedaan worden`,
                                    () => {
                                        renameLabel(queryClient, null, category.id, ev.target.innerText, true);
                                    }
                                );
                            }
                        }
                    } }
                >{category.name}</a>
                <i className="fas fa-plus fa-rotate-45" 
                    onClick={() => {
                        conformationPopover.current.open(`Deze actie zal de hele categorie ('${category.name}') verwijderen (inclusief de kinderen) ook al zit een label op inspiratie en dit kan niet ongedaan worden`,
                            () => {
                                deleteLabel(queryClient, category.id);
                            }
                        );
                    }} 
                />
            </div>
            <div className="content">
                <DropZone show={draggedLabel != undefined} type="label" onDrop={OnLabelDrop} onDropData={{ position: 0, parentID: category.id }} />
                {category.labels.map(({ id, name }, labelIndex) => {
                    return (
                        <Fragment key={name}>
                            <div className="inspiration-label" key={id} draggable={true}
                                onDragStart={(ev) => {
                                    console.log('dragstart')
                                    ev.stopPropagation();
                                    setDraggedLabel({ id: id, name: name, type: 'label' });
                                } }
                            >
                                <i className="fas fa-grip-vertical" />
                                <label
                                    onDoubleClick={(ev) => {
                                        ev.target.contentEditable = true;
                                        ev.target.parentNode.draggable = false;
                                        ev.target.oldName = ev.target.innerText;
                                    } }
                                    onKeyDown={(ev) => {
                                        if (ev.key === 'Enter') {
                                            ev.preventDefault();
                                            ev.target.blur();
                                        }
                                    } }
                                    onBlur={async (ev) => {
                                        ev.target.contentEditable = false;
                                        ev.target.parentNode.draggable = true;
                                        if (ev.target.oldName != ev.target.innerText) {
                                            const hasConflicts = await renameLabel(queryClient, category.id, id, ev.target.innerText, false);
                                            if (hasConflicts.hasConflicts) {
                                                conformationPopover.current.open(`Deze actie zal de huidige label met de naam '${ev.target.innerText}' combineren met '${ev.target.oldName}' en dit kan niet ongedaan worden`,
                                                    () => {
                                                        renameLabel(queryClient, category.id, id, ev.target.innerText, true);
                                                    }
                                                );
                                            }
                                        }
                                    } }
                                >{name}</label>
                                <i className="fas fa-plus fa-rotate-45" onClick={() => {
                                    conformationPopover.current.open(`Deze actie zal de label ('${name}') verwijderen ook al zit hij op inspiratie en dit kan niet ongedaan worden`,
                                        () => {
                                            deleteLabel(queryClient, id);
                                        }
                                    );
                                }} />
                            </div>
                            <DropZone show={draggedLabel != undefined} type="label" onDrop={OnLabelDrop} onDropData={{ position: labelIndex + 1, parentID: category.id }} />
                        </Fragment>
                    );
                })}
                <div className="add-button">
                    <i className="fas fa-plus"
                        onClick={(ev) => {
                            const input = ev.target.parentNode.getElementsByTagName('input')[0];
                            if (input.value.length == 0) return;
                            addLabel(queryClient, category.id, input.value);
                            input.value = '';
                        } } />
                    <input type="text" placeholder="Voeg label toe"
                        onKeyDown={(ev) => {
                            if (ev.key === 'Enter') {
                                ev.preventDefault();
                                ev.target.blur();
                                if (ev.target.value.length == 0) return;
                                addLabel(queryClient, category.id, ev.target.value);
                                ev.target.value = '';
                            }
                        } } />
                </div>
            </div>
        </div>
        );
    }

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
                    onDrop={(ev) => {
                        ev.target.classList.remove('hovered');
                        onDrop(draggedLabel, onDropData);
                        setDraggedLabel(undefined);
                    }}
                />
            </div>
        );
    }

    async function OnLabelDrop(draggedLabel, {position, parentID}) {
        const hasConflicts = await moveLabel(queryClient, draggedLabel.id, parentID, draggedLabel.parentID, position, false);
        if(hasConflicts.hasConflicts) {
            conformationPopover.current.open(`Deze actie zal de huidige label in 'foldernaam' zal gecombineert worden met '${draggedLabel.name}' en dit kan niet ongedaan worden`,
                () => {
                    moveLabel(queryClient, draggedLabel.id, parentID, draggedLabel.parentID, position, true);
                }
            )
        }
    }
}