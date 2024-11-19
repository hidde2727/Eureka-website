// This file is loaded after the loader.js (and the whole page is already loaded)
// This file refrences functions and variables created in index.js and loader.js:
// Variables: 
// Functions: FetchInfo()

var votableSuggestions = FetchInfo('/API/Private/Suggestion/GetAll', 'GET', null, {includeCredentials:true});
async function PopulateSuggestionWindow() {
    var body = document.getElementById('body');

    var window = document.getElementById('suggestionVoting');
    if(window == undefined) {
        window = document.createElement('div');
        body.appendChild(window);
    }
    window.className = 'window';
    window.id = 'suggestionVoting';
    window.innerHTML = '<h1>Suggesties</h1>';

    var succes = true;
    // Check if votableSuggestions is a promise (this function can be called to refresh the suggestions)
    if(typeof(votableSuggestions) === 'object' && typeof(votableSuggestions.then) === 'function')
        [succes, votableSuggestions] = await votableSuggestions;

    window.innerHTML += `<div class="top">
    <div class="align-names"><p></p><p>Type</p><p>Naam</p><p>Omschrijving</p></div>
    <p></p><p></p>
    <span><input type="checkbox" id="show-suggestion-history" checked=false></span><label for="show-suggestion-history">Laat historie zien</label>
    <input type="text" id="search-suggstions" placeholder="search">
    <div class="select" id="amount-suggestion-per-page" onclick="OnSelectClick(this, event);"><div class="active">25 items per pagina</div><div class="dropdown"><div>10 items per pagina</div><div>25 items per pagina</div><div> 50 items per pagina</div></div></div>
    </div>`;

    var content = document.createElement('div');
    content.className = 'content';
    for(var i = 0; i < votableSuggestions.length; i++) {
        var innerHTML = '';
        
        if(votableSuggestions[i].vote_value == 1) innerHTML += '<i class="far fa-thumbs-up"></i>';
        else if(votableSuggestions[i].vote_value == -1) innerHTML += '<i class="far fa-thumbs-down"></i>';
        else innerHTML += '<p></p>';    

        if(votableSuggestions[i].type == 'inspiration') innerHTML += '<i class="fas fa-lightbulb"></i>';
        else if(votableSuggestions[i].type == 'project') innerHTML += '<i class="fas fa-wrench"></i>';
        else innerHTML += '<p></p>';

        innerHTML += '<p>' + votableSuggestions[i].name + '</p>';
        innerHTML += '<p>' + votableSuggestions[i].description + '</p>';

        innerHTML += '<i class="fas fa-arrow-right"></i>';

        var div = document.createElement('div');
        div.className = 'suggestion';
        div.innerHTML = innerHTML;
        div.onclick = OnSuggestionClick.bind(null, votableSuggestions[i]);

        content.appendChild(div);
    }
    window.appendChild(content);
}
PopulateSuggestionWindow();

async function OnSuggestionClick(suggestion, ev) {
    if(suggestion.type == 'inspiration') {

    }
    else if(suggestion.type == 'project') {
        var [result, response] = await FetchInfo('/API/Private/Project/Get?uuid=' + encodeURI(suggestion.uuid), 'GET', null, {includeCredentials:true});
        if(!result) throw new Error('Invalid project uuid');

        OpenProjectPopover(response);
    }
    else throw new Error("Invalid suggestion type");
}

// Used by project and inspiration module
function GetUsersVoteValue(type, uuid) {
    return votableSuggestions.find((suggestion) => suggestion.type == type && suggestion.uuid == uuid);
}