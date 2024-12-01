import Footer from '../components/footer.jsx';

export default function Home({isActive}) {
    return (
        <div className="window" id="home" style={isActive ? {display: 'block'} : {display: 'none'}}>
            
            <Footer />
        </div>
    )
}