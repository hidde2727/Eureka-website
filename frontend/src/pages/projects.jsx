import Footer from '../components/footer.jsx';

export default function Projects({isActive}) {
    return (
        <div className="window" id="projects" style={isActive ? {display: 'block'} : {display: 'none'}}>
            
            <Footer />
        </div>
    )
}