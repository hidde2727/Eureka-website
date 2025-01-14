import { useEffect } from 'react';

import '/public/components/pagination.css';

function UpwardsArray(start, end) {
    if(start<=0 || end<=0) return [];
    return (Array.from({length: end-start+1}, (v,k) => k+start));
}
export default function Pagination({ children, columns, header, amountPages, currentPage, setPage }) {
    useEffect(() => {
        if(currentPage > amountPages) setPage(1);
    });
    return (
        <>
            <div className="pagination-top">
                <div className="align-names">{ columns.map((column) => <p key={column}>{column}</p>) }</div>
                <p></p><p></p>
                { header }
            </div>
            <div className="content">
                {children}
            </div>
            <div className="pagination-bottom">
                <a onClick={() => { if(currentPage > 1) setPage(currentPage-1); }}><i className="fas fa-chevron-left" />Vorige pagina</a>
                { 
                    UpwardsArray(1, Math.min(currentPage+1, 2, amountPages)).map((num) => {
                        return (
                            <a className={num==currentPage?'selected':undefined} onClick={() => { setPage(num) }} key={num}>{num}</a>
                        );
                    })
                }
                { currentPage>4 && <a>...</a> }
                {
                    UpwardsArray(Math.max(currentPage - 1, 3), Math.min(currentPage+1, amountPages-2)).map((num) => {
                        return (
                            <a className={num==currentPage?'selected':undefined} onClick={() => { setPage(num) }} key={num}>{num}</a>
                        );
                    }) 
                }
                { currentPage<amountPages-3 && <a>...</a> }
                {
                    UpwardsArray(Math.max(currentPage-1, amountPages-1, 3), amountPages).map((num) => {
                        return (
                            <a className={num==currentPage?'selected':undefined} onClick={() => { setPage(num) }} key={num}>{num}</a>
                        );
                    })
                }
                <a onClick={() => { if(currentPage < amountPages-1) setPage(currentPage+1); }}>Volgende pagina<i className="fas fa-chevron-right" /></a>
            </div>
        </>
    )
}