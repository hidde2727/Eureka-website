import Footer from '../components/footer.jsx';

export default function Users({isActive}) {
    return (
        <div className="window" id="home" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <p>Users</p>

            <Footer />
        </div>
    );
}