import Footer from '../../components/footer.jsx';

export default function Settings({isActive}) {
    return (
        <div className="window" id="management-settings" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <p>Settings</p>

            <Footer />
        </div>
    );
}