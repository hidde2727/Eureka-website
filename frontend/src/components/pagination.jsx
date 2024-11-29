import { Checkbox, Select } from './inputs.jsx';

import '/public/components/pagination.css';

export default function Pagination({ children, columns, history, setHistory, setSearch, setItemsPerPage }) {
    return (
        <>
            <div className="pagination-top">
                <div className="align-names">{ columns.map((column) => <p key={column}>{column}</p>) }</div>
                <p></p><p></p>
                { history ? <Checkbox label="Laat historie zien" checked={false} onChange={(ev) => { setHistory(ev.target.checked) }} /> : <></> }
                <input type="text" id="search-suggstions" placeholder="search" onChange={(ev) => { setSearch(ev.target.value) }} />
                <Select 
                    items={['10 items per pagina', '25 items per pagina', '50 items per pagina']} 
                    defaultActive="25 items per pagina" 
                    onChange={ (selected) => { setItemsPerPage(Number.parseInt(selected)) } } 
                />
            </div>
            <div className="content">
                {children}
            </div>
            <div className="pagination-bottom">

            </div>
        </>
    )
}