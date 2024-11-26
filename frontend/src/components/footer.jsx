import { useRef, useContext } from 'react';

import { LoginContext } from '../management/components/login_popover.jsx';

export default function Footer() {
    var clicks = useRef(0);
    const loginContext = useContext(LoginContext);

    return (
        <div className="footer">
            <a className="github" href="https://github.com/hidde2727/Eureka-website"><i className="fab fa-github fa-fw"></i></a>
            <a className="instagram" href="https://instagram.com"><i className="fab fa-instagram fa-fw"></i></a>
            <a className="copyright" onClick={() => { clicks.current++; if(clicks.current > 5) { clicks.current = 0; loginContext.current.open(); }}}>©2024 by Hidde Meiburg</a>
        </div>
    )
}