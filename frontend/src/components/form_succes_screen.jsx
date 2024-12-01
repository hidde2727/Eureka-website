export default function FormSuccesScreen({message, error}) {
    if(message == "" || message == undefined || message == null) return;

    return (
    <div className="form-succes-screen" onLoad={(ev) => { ev.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
        <div>
            <i className={error ? 'fas fa-sad-tear' : 'fas fa-smile-beam'}></i>
        </div>
        <div>
            <h2>{error ? 'Error bij het indienen' : 'Alles is goed gegaan!' }</h2>
        </div>
        <div><p>{message}</p></div>
    </div>
    );
}