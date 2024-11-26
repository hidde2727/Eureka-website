import Footer from '../components/footer.jsx';

export default function Files({isActive}) {
    return (
        <div className="window" id="files" style={isActive ? {display: 'block'} : {display: 'none'}}>
            
            <Footer />
        </div>
    )
}