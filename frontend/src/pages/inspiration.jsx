import Footer from '../components/footer.jsx';

export default function Inspiration({isActive}) {
    return (
        <div className="window" id="inspiration" style={isActive ? {display: 'block'} : {display: 'none'}}>
            
            <Footer />
        </div>
    )
}