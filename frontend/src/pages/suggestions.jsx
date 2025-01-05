import { useState, Suspense, Fragment, useEffect, useRef } from 'react';

import { IsValidURL } from '../utils/utils.jsx';
import { useInspirationLabelsSus, suggestProject, suggestInspiration } from '../utils/data_fetching.jsx';

import Website from '../components/website.jsx';
import { Input, Textarea } from '../components/inputs.jsx';
import Loading from '../components/loading.jsx';
import { FormErrorMessage, SetFormErrorMessage } from '../components/form_error_message.jsx';
import FormSuccesScreen from '../components/form_succes_screen.jsx';
import Footer from '../components/footer.jsx';
import { SplitWindow } from '../components/split_window.jsx';

export default function Suggestions({ isActive }) {
    const windowRef = useRef();
    const [inlineInputs, setInlineInputs] = useState(true);
    useEffect(() => {
        window.addEventListener('resize', (ev) => {
            if(windowRef.current.clientWidth <= 800) {
                setInlineInputs(false);
                return;
            }
            setInlineInputs(true);
        });
    }, []);
    useEffect(() => {
        if(windowRef.current.clientWidth <= 800) {
            setInlineInputs(false);
            return;
        }
        setInlineInputs(true);
    })

    const [url, setURL] = useState();
    const [selectedLabels, setSelectedLabels] = useState({});
    const [suggestion1, setSuggestion1] = useState();
    const [suggestion2, setSuggestion2] = useState();

    const [projectError, setProjectError] = useState();
    const [projectSucces, setProjectSucces] = useState("");

    const [inspirationError, setInspirationError] = useState();
    const [inspirationSucces, setInspirationSucces] = useState("");

    return (
        <div className={'window' + (inlineInputs?'':' small')} id="suggestions" style={isActive ? {display: 'block'} : {display: 'none'}} ref={windowRef}>
            <SplitWindow minColumnWidth={750} seperator={true} >
                <form onSubmit={(event) => { OnProjectSubmit(event, setProjectError, setProjectSucces); }}>
                    <h2>Suggereer een project</h2>
                    <p>Wat is het project?</p>
                    
                    <Input type="text" placeholder="Project naam" label="Naam*" inline={inlineInputs} name="projectName" />
                    <Textarea placeholder="Een mooie omschrijving" label="Omschrijving*" inline={inlineInputs} name="projectDescription" />

                    <Input type="text" placeholder="www.youtube.com" id="project-link1" label="Linkjes" inline={inlineInputs} name="projectLink1" />
                    <Input type="text" placeholder="www.youtube.com" id="project-link2" label="" inline={inlineInputs} name="projectLink2" noLabel={!inlineInputs} />
                    <Input type="text" placeholder="www.youtube.com" id="project-link3" label="" inline={inlineInputs} name="projectLink3" noLabel={!inlineInputs} />

                    <p>Hoe houden we je op de hoogte?</p>
                    <Input type="text" placeholder="De biologie sectie" label="Naam*" inline={inlineInputs} name="projectSuggestorName" />
                    <Input type="text" placeholder="eureka@usgym.nl" label="Email*" inline={inlineInputs} name="projectSuggestorEmail" />

                    <FormErrorMessage error={projectError} />
                    <FormSuccesScreen message={projectSucces} error={projectSucces.includes('error')} />

                    <input type="submit" value="Insturen" />

                </form>
                <form onSubmit={(event) => { OnInspirationSubmit(event, selectedLabels, setInspirationError, setInspirationSucces); }}>
                    <h2>Suggereer inspiratie</h2>
                    <p>Wat is de url?</p>

                    <Input type="text" placeholder="www.youtube.com" label="URL*" inline={inlineInputs} name="inspirationURL" onChange={(event) => { setURL(event.target.value); }} />

                    { inlineInputs && <label className="inline"></label> }
                    <div className="center-content inline-input" style={{display:'inline-flex'}}>
                        <Website id="inspiration-preview" url={url} />
                    </div>

                    <p>Waar gaat het over?</p>
                    
                    <Textarea 
                        placeholder="Dit is een geweldige video om te bekijken als je graag meer te weten wilt komen over AI. Het start op een perfect niveau om voor iedereen begrijpbaar te zijn en zal je een solide basis geven voor de rest van de serie. Absoluut een aanrader om te kijken als je graag meer te weten wilt komen over AI."
                        label="Korte omschrijving*" inline={inlineInputs} name="inspirationDescription" 
                        rows={5} 
                    />

                    <p>Welke label zijn van toepassing?</p>
                    <div id="suggestion-label-selector">
                        <Suspense fallback={<Loading />}>
                            <LabelSelector inlineInputs={inlineInputs} selectedLabels={selectedLabels} setSelectedLabels={setSelectedLabels} />
                        </Suspense>
                    </div>

                    <p>Suggesties om na afloop te bekijken?</p>
                    <SplitWindow minColumnWidth={312} smallVerticalGap={true}>
                        <div>
                            <Input type="text" placeholder="www.youtube.com" label="Suggestie 1" name="inspirationSuggestion1" onChange={(event) => { setSuggestion1(event.target.value); }} />
                            <div className="center-content">
                                <Website url={suggestion1} />
                            </div>
                        </div>
                        <div>
                            <Input type="text" placeholder="www.youtube.com" label="Suggestie 2" name="inspirationSuggestion2" onChange={(event) => { setSuggestion2(event.target.value); }} />
                            <div className="center-content">
                                <Website url={suggestion2} />
                            </div>
                        </div>
                    </SplitWindow>

                    <FormErrorMessage error={inspirationError} />
                    <FormSuccesScreen message={inspirationSucces} error={inspirationSucces.includes('error')} />

                    <input type="submit" value="Insturen" />

                </form>
            </SplitWindow>
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
function LabelSelector({ inlineInputs, selectedLabels, setSelectedLabels }) {
    const { labels, hasError, isFetching } = useInspirationLabelsSus();
    if(isFetching) return;
    if(hasError || labels==undefined) return (<p>Error tijdens het ophalen van de labels</p>);

    return (<> {
        labels.labels.map((category) => {
            return <Fragment key={category.name}>
                <label className={inlineInputs?'inline':''}>{category.name}</label>
                <div className="inline-input">
                    {category.labels.map((value, i) => {
                        return (
                        <p className={'label ' + value.id} key={i} 
                        onClick={() => { OnLabelClick(selectedLabels, setSelectedLabels, value.id); }} 
                        style={ selectedLabels[value.id] ? {color:"var(--prominent-text)", backgroundColor:"var(--accent)"} : {} }>
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
async function OnProjectSubmit(event, setError, setSuccesMessage) {
    event.preventDefault();

    var projectName = event.target.projectName.value;
    if(!projectName) return SetFormErrorMessage(setError, 'Specificeer een naam', event.target.projectName);
    else if(projectName.length > 255) return SetFormErrorMessage(setError, 'Maximale lengte 255', event.target.projectName);

    var projectDescription = event.target.projectDescription.value;
    if(!projectDescription) return SetFormErrorMessage(setError, 'Specificeer een omschrijving', event.target.projectDescription);
    else if(projectDescription.length > 65535) return SetFormErrorMessage(setError, 'Maximale lengte 65535', event.target.projectDescription);

    var urls = [];
    var link1 = event.target.projectLink1.value;
    if(link1) {
        if(link1.length > 255) return SetFormErrorMessage(setError, 'Maximale lengte 255', event.target.projectLink1);
        else if(!IsValidURL(link1)) return  SetFormErrorMessage(setError, 'Moet valide link zijn', event.target.projectLink1);
        urls.push(link1);
    }
    var link2 = event.target.projectLink2.value;
    if(link2) {
        if(link2.length > 255) return SetFormErrorMessage(setError, 'Maximale lengte 255', event.target.projectLink2);
        else if(!IsValidURL(link2)) return  SetFormErrorMessage(setError, 'Moet valide link zijn', event.target.projectLink2);
        urls.push(link2);
    }
    var link3 = event.target.projectLink3.value;
    if(link3) {
        if(link3.length > 255) return SetFormErrorMessage(setError, 'Maximale lengte 255', event.target.projectLink3);
        else if(!IsValidURL(link3)) return SetFormErrorMessage(setError, 'Moet valide link zijn', event.target.projectLink3);
        urls.push(link3);
    }

    var projectSuggestorName = event.target.projectSuggestorName.value;
    if(!projectSuggestorName) return SetFormErrorMessage(setError, 'Specificeer je naam', event.target.projectSuggestorName);
    else if(projectSuggestorName.length > 255) return SetFormErrorMessage(setError, 'Maximale lengte 255', event.target.projectSuggestorName);

    var projectSuggestorEmail = event.target.projectSuggestorEmail.value;
    if(!projectSuggestorEmail) return SetFormErrorMessage(setError, 'Specificeer je email', event.target.projectSuggestorEmail);
    else if(projectSuggestorEmail.length > 255) return SetFormErrorMessage(setError, 'Maximale lengte 255', event.target.projectSuggestorEmail);

    try {
        await suggestProject({
            name: projectName, 
            description: projectDescription, 
            links: urls, 
            suggestorName: projectSuggestorName, 
            suggestorEmail: projectSuggestorEmail 
        });        
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
async function OnInspirationSubmit(event, selectedLabels, setError, setSuccesMessage) {
    event.preventDefault();

    var url = event.target.inspirationURL.value;
    if(!url) return SetFormErrorMessage(setError, 'Specificeer een naam', event.target.inspirationURL);
    else if(url.length > 255) return SetFormErrorMessage(setError, 'Maximale lengte 255', event.target.inspirationURL);
    else if(!IsValidURL(url)) return  SetFormErrorMessage(setError, 'Moet valide zijn', event.target.inspirationURL);
  
    var description = event.target.inspirationDescription.value;
    if(!description) return SetFormErrorMessage(setError, 'Specificeer een omschrijving', event.target.inspirationDescription);
    else if(description.length > 65535) return SetFormErrorMessage(setError, 'Maximale lengte 65535', event.target.inspirationDescription);
  
    var suggestions = [];
    var link1 = event.target.inspirationSuggestion1.value;
    if(link1) {
      if(link1.length > 255) return SetFormErrorMessage(setError, 'Maximale lengte 255', event.target.inspirationSuggestion1);
      else if(!IsValidURL(link1)) return SetFormErrorMessage(setError, 'Moet valide link zijn', event.target.inspirationSuggestion1);
      suggestions.push(link1);
    }
    var link2 = event.target.inspirationSuggestion2.value;
    if(link2) {
      if(link2.length > 255) return SetFormErrorMessage(setError, 'Maximale lengte 255', event.target.inspirationSuggestion2);
      else if(!IsValidURL(link2)) return SetFormErrorMessage(setError, 'Moet valide link zijn', event.target.inspirationSuggestion2);
      suggestions.push(link2);
    }
    try {
        await suggestInspiration({
            url: url, 
            description: description, 
            recommendations: suggestions, 
            labels: Array.from(Object.keys(selectedLabels)) 
        });

        event.target.reset();
        setSuccesMessage('We proberen het binnen een week op de website te hebben staan!'); 
    } catch(err) {
        setSuccesMessage('error: ' + err.message);
        return;
    }
}