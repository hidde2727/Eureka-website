import { useRef, useContext } from 'react';

import { PopoverContext } from '../popovers/context.jsx';

export default function Footer() {
    var clicks = useRef(0);
    const popoverContext = useContext(PopoverContext);

    return (
        <div className="footer">
            <a className="github" href="https://github.com/hidde2727/Eureka-website"><i className="fab fa-github fa-fw"></i></a>
            <a className="instagram" href="https://www.instagram.com/eureka_usg"><i className="fab fa-instagram fa-fw"></i></a>
            <a className="copyright" onClick={() => { clicks.current++; if(clicks.current > 5) { clicks.current = 0; popoverContext.login.current.open(); }}}>©2024 by Hidde Meiburg</a>
        </div>
    )
}