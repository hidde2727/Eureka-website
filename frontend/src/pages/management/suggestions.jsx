import { useContext, useState } from 'react';

import { useSuggestions } from '../../utils/data_fetching.jsx';

import Pagination from '../../components/pagination.jsx';
import Footer from '../../components/footer.jsx';

import '/public/pages/suggestions.css';
import PopoverContext from '../../popovers/context.jsx';

export default function SuggestionVoting({isActive}) {
    const popoverContext = useContext(PopoverContext);

    const [showHistory, setShowHistory] = useState(false);
    const [search, setSearch] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const { suggestions } = useSuggestions(0, 50, false);
    if(suggestions == undefined) return <div style={isActive ? {display: 'block'} : {display: 'none'}} />;

    return (
        <div className="window" id="suggestion-voting" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <div>
                <h1>Suggesties</h1>
                <Pagination 
                    columns={['', 'Type', 'Naam', 'Omschrijving']} history={true} 
                    setHistory={setShowHistory} setSearch={setSearch} setItemsPerPage={setItemsPerPage}
                >
                    {
                        suggestions.map((suggestion) => {
                            return (
                                <div className="suggestion" key={suggestion.name} onClick={() => { OnSuggestionClick(popoverContext, suggestion) }}>
                                    { (()=> {
                                        if(suggestion.vote_value == 1) return <i className="far fa-thumbs-up" />;
                                        else if(suggestion.vote_value == -1) return <i className="far fa-thumbs-down" />;
                                        else return <i />;
                                    })()}
                                    { (()=> {
                                        if(suggestion.type == 'inspiration') return <i className="fas fa-lightbulb" />;
                                        else if(suggestion.type == 'project') return <i className="fas fa-wrench" />;
                                        else return <i />;
                                    })()}
                                    <p>{suggestion.name}</p>
                                    <p>{suggestion.description}</p>
                                    <i className="fas fa-arrow-right" />
                                </div>
                            )
                        })
                    }
                </Pagination>
            </div>
            <Footer />
        </div>
    );
}

function OnSuggestionClick(popoverContext, suggestion) {
    if(suggestion.type == 'inspiration') {

    }
    else if(suggestion.type == 'project') {
        popoverContext.project.current.open({original_id: suggestion.original_id, uuid: suggestion.uuid});
    }
    else throw new Error("Invalid suggestion type");
}