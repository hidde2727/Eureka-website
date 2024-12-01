import { useState, Suspense, Fragment } from 'react';

import { IsValidURL } from '../utils/utils.jsx';
import { useInspirationLabelsSus, FetchInfo } from '../utils/data_fetching.jsx';

import Website from '../components/website.jsx';
import { Input, Textarea } from '../components/inputs.jsx';
import Loading from '../components/loading.jsx';
import { FormErrorMessage, SetFormErrorMessage } from '../components/form_error_message.jsx';
import FormSuccesScreen from '../components/form_succes_screen.jsx';
import Footer from '../components/footer.jsx';

export default function Suggestions({ isActive }) {
    const [url, setURL] = useState();
    const [selectedLabels, setSelectedLabels] = useState({});
    const [suggestion1, setSuggestion1] = useState(undefined);
    const [suggestion2, setSuggestion2] = useState(undefined);

    const [projectError, setProjectError] = useState(undefined);
    const [projectErrorInput, setProjectErrorInput] = useState(undefined);
    const [projectSucces, setProjectSucces] = useState("");

    const [inspirationError, setInspirationError] = useState(undefined);
    const [inspirationErrorInput, setInspirationErrorInput] = useState(undefined);
    const [inspirationSucces, setInspirationSucces] = useState("");

    return (
        <div className="window" id="suggestions" style={isActive ? {display: 'block'} : {display: 'none'}}>
            <div className="split-window seperator">
                <form onSubmit={(event) => { OnProjectSubmit(event, { setError: setProjectError, setErrorAtInput: setProjectErrorInput }, setProjectSucces); }}>
                    <h2>Suggereer een project</h2>
                    <p>Wat is het project?</p>
                    
                    <Input type="text" placeholder="Project naam" label="Naam*" inline={true} name="projectName" />
                    <Textarea placeholder="Een mooie omschrijving" label="Omschrijving*" inline={true} name="projectDescription" />

                    <Input type="text" placeholder="www.youtube.com" id="project-link1" label="Linkjes" inline={true} name="projectLink1" />
                    <Input type="text" placeholder="www.youtube.com" id="project-link2" label="" inline={true} name="projectLink2" />
                    <Input type="text" placeholder="www.youtube.com" id="project-link3" label="" inline={true} name="projectLink3" />

                    <p>Hoe houden we je op de hoogte?</p>
                    <Input type="text" placeholder="De biologie sectie" label="Naam*" inline={true} name="projectSuggestorName" />
                    <Input type="text" placeholder="eureka@usgym.nl" label="Email*" inline={true} name="projectSuggestorEmail" />

                    <FormErrorMessage message={projectError} atInput={projectErrorInput} />
                    <FormSuccesScreen message={projectSucces} error={projectSucces.includes('error')} />

                    <input type="submit" value="Insturen" />

                </form>
                <form onSubmit={(event) => { OnInspirationSubmit(event, selectedLabels, { setError: setInspirationError, setErrorAtInput: setInspirationErrorInput }, setInspirationSucces); }}>
                    <h2>Suggereer inspiratie</h2>
                    <p>Wat is de url?</p>

                    <Input type="text" placeholder="www.youtube.com" label="URL*" inline={true} name="inspirationURL" onChange={(event) => { setURL(event.target.value); }} />

                    <label className="inline"></label>
                    <div className="center-content inline-input" style={{display:'inline-flex'}}>
                        <Website id="inspiration-preview" url={url} />
                    </div>

                    <p>Waar gaat het over?</p>
                    
                    <Textarea 
                        placeholder="Dit is een geweldige video om te bekijken als je graag meer te weten wilt komen over AI. Het start op een perfect niveau om voor iedereen begrijpbaar te zijn en zal je een solide basis geven voor de rest van de serie. Absoluut een aanrader om te kijken als je graag meer te weten wilt komen over AI."
                        label="Korte omschrijving*" inline={true} name="inspirationDescription" 
                        rows={5} 
                    />

                    <p>Welke label zijn van toepassing?</p>
                    <div id="suggestion-label-selector">
                        <Suspense fallback={<Loading />}>
                            <LabelSelector selectedLabels={selectedLabels} setSelectedLabels={setSelectedLabels} />
                        </Suspense>
                    </div>

                    <p>Suggesties om na afloop te bekijken?</p>
                    <div className="split-window">
                        <div>
                            <Input type="text" placeholder="www.youtube.com" label="Suggestie 1" name="inspirationSuggestion1" onChange={(event) => { setSuggestion1(event.target.value); }} />
                            <Website id="inspiration-preview1" url={suggestion1} />
                        </div>
                        <div>
                            <Input type="text" placeholder="www.youtube.com" label="Suggestie 2" name="inspirationSuggestion2" onChange={(event) => { setSuggestion2(event.target.value); }} />
                            <Website id="inspiration-preview2" url={suggestion2} />
                        </div>
                    </div>

                    <FormErrorMessage message={inspirationError} atInput={inspirationErrorInput} />
                    <FormSuccesScreen message={inspirationSucces} error={inspirationSucces.includes('error')} />

                    <input type="submit" value="Insturen" />

                </form>
            </div>
            <Footer />
        </div>
    );
}


/* + ======================================================================== +
/* | Inspiration label select                                                 |
/* + ========================================================================*/
function OnLabelClick(selectedLabels, setSelectedLabels, labelId) {
    if(selectedLabels[labelId]) {
        setSelectedLabels({
            ...selectedLabels,
            [labelId]: undefined
        });
    } else {
        setSelectedLabels({
            ...selectedLabels,
            [labelId]: true
        });
    }
}
function LabelSelector(props) {
    const { labels, hasError, isFetching } = useInspirationLabelsSus();
    if(isFetching) return;
    if(hasError || labels==undefined) return (<p>Error tijdens het ophalen van de labels</p>);

    return (<> {
        Object.entries(labels.labels).map((label) => {
            const [categoryName, values] = label;
            return <Fragment key={categoryName}>
                <label className="inline">{categoryName}</label>
                <div className="inline-input">
                    {values.map((value, i) => {
                        return (
                        <p className={'label ' + value.id} key={i} 
                        onClick={() => { OnLabelClick(props.selectedLabels, props.setSelectedLabels, value.id); }} 
                        style={ props.selectedLabels[value.id] ? {color:"var(--prominent-text)", backgroundColor:"var(--accent)"} : {} }>
                            {value.name}
                        </p> )
                    })}
                </div>
            </Fragment>;
        })
    } </>);
}


/* + ======================================================================== +
/* | Project form handeling                                                   |
/* + ========================================================================*/
async function OnProjectSubmit(event, errorMessaging, setSuccesMessage) {
    event.preventDefault();

    var projectName = event.target.projectName.value;
    if(!projectName) return SetFormErrorMessage(errorMessaging, 'Specificeer een naam', event.target.projectName);
    else if(projectName.length > 255) return SetFormErrorMessage(errorMessaging, 'Maximale lengte 255', event.target.projectName);

    var projectDescription = event.target.projectDescription.value;
    if(!projectDescription) return SetFormErrorMessage(errorMessaging, 'Specificeer een omschrijving', event.target.projectDescription);
    else if(projectDescription.length > 65535) return SetFormErrorMessage(errorMessaging, 'Maximale lengte 65535', event.target.projectDescription);

    var urls = [];
    var link1 = event.target.projectLink1.value;
    if(link1) {
        if(link1.length > 255) return SetFormErrorMessage(errorMessaging, 'Maximale lengte 255', event.target.projectLink1);
        else if(!IsValidURL(link1)) return  SetFormErrorMessage(errorMessaging, 'Moet valide link zijn', event.target.projectLink1);
        urls.push(link1);
    }
    var link2 = event.target.projectLink2.value;
    if(link2) {
        if(link2.length > 255) return SetFormErrorMessage(errorMessaging, 'Maximale lengte 255', event.target.projectLink2);
        else if(!IsValidURL(link2)) return  SetFormErrorMessage(errorMessaging, 'Moet valide link zijn', event.target.projectLink2);
        urls.push(link2);
    }
    var link3 = event.target.projectLink3.value;
    if(link3) {
        if(link3.length > 255) return SetFormErrorMessage(errorMessaging, 'Maximale lengte 255', event.target.projectLink3);
        else if(!IsValidURL(link3)) return SetFormErrorMessage(errorMessaging, 'Moet valide link zijn', event.target.projectLink3);
        urls.push(link3);
    }

    var projectSuggestorName = event.target.projectSuggestorName.value;
    if(!projectSuggestorName) return SetFormErrorMessage(errorMessaging, 'Specificeer je naam', event.target.projectSuggestorName);
    else if(projectSuggestorName.length > 255) return SetFormErrorMessage(errorMessaging, 'Maximale lengte 255', event.target.projectSuggestorName);

    var projectSuggestorEmail = event.target.projectSuggestorEmail.value;
    if(!projectSuggestorEmail) return SetFormErrorMessage(errorMessaging, 'Specificeer je email', event.target.projectSuggestorEmail);
    else if(projectSuggestorEmail.length > 255) return SetFormErrorMessage(errorMessaging, 'Maximale lengte 255', event.target.projectSuggestorEmail);

    try {
        await FetchInfo('/api/suggest/project/', 'POST', JSON.stringify(
            {
            'name':projectName,
            'description':projectDescription,
            'links':urls,
            'suggestorName':projectSuggestorName,
            'suggestorEmail':projectSuggestorEmail
            }
        ), {jsonResponse:false});
        
        event.target.reset();
        setSuccesMessage('We proberen in een week bij je terug te komen!');
    } catch(err) {
        setSuccesMessage('error: ' + err.message);;
        return;
    }
}


/* + ======================================================================== +
/* | Inspiration form handeling                                               |
/* + ========================================================================*/
async function OnInspirationSubmit(event, selectedLabels, errorMessaging, setSuccesMessage) {
    event.preventDefault();

    var url = event.target.inspirationURL.value;
    if(!url) return SetFormErrorMessage(errorMessaging, 'Specificeer een naam', event.target.inspirationURL);
    else if(url.length > 255) return SetFormErrorMessage(errorMessaging, 'Maximale lengte 255', event.target.inspirationURL);
    else if(!IsValidURL(url)) return  SetFormErrorMessage(errorMessaging, 'Moet valide zijn', event.target.inspirationURL);
  
    var description = event.target.inspirationDescription.value;
    if(!description) return SetFormErrorMessage(errorMessaging, 'Specificeer een omschrijving', event.target.inspirationDescription);
    else if(description.length > 65535) return SetFormErrorMessage(errorMessaging, 'Maximale lengte 65535', event.target.inspirationDescription);
  
    var suggestions = [];
    var link1 = event.target.inspirationSuggestion1.value;
    if(link1) {
      if(link1.length > 255) return SetFormErrorMessage(errorMessaging, 'Maximale lengte 255', event.target.inspirationSuggestion1);
      else if(!IsValidURL(link1)) return  SetFormErrorMessage(errorMessaging, 'Moet valide link zijn', event.target.inspirationSuggestion1);
      suggestions.push(link1);
    }
    var link2 = event.target.inspirationSuggestion2.value;
    if(link2) {
      if(link2.length > 255) return SetFormErrorMessage(errorMessaging, 'Maximale lengte 255', event.target.inspirationSuggestion2);
      else if(!IsValidURL(link2)) return  SetFormErrorMessage(errorMessaging, 'Moet valide link zijn', event.target.inspirationSuggestion2);
      suggestions.push(link2);
    }
    try {
        await FetchInfo('/api/suggest/inspiration/', 'POST', JSON.stringify(
            {
                'url':url,
                'description':description,
                'recommendations':suggestions,
                'labels': Array.from(Object.keys(selectedLabels))
            }
        ), {jsonResponse:false});

        event.target.reset();
        setSuccesMessage('We proberen het binnen een week op de website te hebben staan!'); 
    } catch(err) {
        setSuccesMessage('error: ' + err.message);
        return;
    }
}