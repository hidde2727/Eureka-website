import Footer from '../../components/footer.jsx';

export default function Logs({isActive}) {
    return (
        <div className="window" id="management-logs" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <p>Logs</p>

            <Footer />
        </div>
    );
}