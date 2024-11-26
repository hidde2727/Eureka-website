import Footer from '../../components/footer.jsx';

export default function SuggestionVoting({isActive}) {
    return (
        <div className="window" id="home" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <p>Suggestions</p>

            <Footer />
        </div>
    );
}