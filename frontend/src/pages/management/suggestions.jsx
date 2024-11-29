import { useState } from 'react';

import Pagination from '../../components/pagination.jsx';
import Footer from '../../components/footer.jsx';

import '/public/pages/suggestions.css';

export default function SuggestionVoting({isActive}) {
    const [showHistory, setShowHistory] = useState(false);
    const [search, setSearch] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(25);

    return (
        <div className="window" id="suggestion-voting" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <div>
                <h1>Suggesties</h1>
                <Pagination 
                    columns={['', 'Type', 'Naam', 'Omschrijving']} history={true} 
                    setHistory={setShowHistory} setSearch={setSearch} setItemsPerPage={setItemsPerPage}
                >
                    
                </Pagination>
            </div>
            <Footer />
        </div>
    );
}