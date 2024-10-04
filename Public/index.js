var pageLoaded = false;
addEventListener("load", async (event) => {
  pageLoaded = true;
  PrepareSidebar();
  PreparePopup();

  GetProjects();
  (async () => {
    await CheckLogin();
    FetchInspiration();
  })();
  (async () => {
    await GetTutorials();
    PopulateFileNavigation();
  })();
});

// Sidebar --------------------------------------
function PrepareSidebar() {
    const sidebarTabs = document.getElementsByClassName("sidebar-tab");

    const urlParams = new URLSearchParams(window.location.search);
    const selectedTabName = urlParams.get('tab');

    for (var i = 0; i < sidebarTabs.length; i++) {
      sidebarTabs[i].onmouseover = function(){
          var elements = this.getElementsByTagName("p")[0];
          const textSize = this.getElementsByTagName("p")[0].clientWidth;
          this.style.width = "calc(var(--sidebar-height) + " + textSize + "px)";
      };
      sidebarTabs[i].onmouseleave = function(){
          this.style.width = "var(--sidebar-height)";
      };
      if(sidebarTabs[i].onmousedown != undefined) continue;
      sidebarTabs[i].onmousedown = function(){
          var mainWindow = document.getElementById("main-content-scroll-animation");
          mainWindow.style.top = "-" + (this.id * 100) + "vh";

          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set("tab", this.attributes.getNamedItem("target").nodeValue);
          history.pushState(null, "", "?"+ urlParams.toString());
      };
      sidebarTabs[i].id = i;
      if(selectedTabName != null && sidebarTabs[i].attributes.getNamedItem("target").nodeValue == selectedTabName) {
          var mainWindow = document.getElementById("main-content-scroll-animation");
          mainWindow.style.top = "-" + (i * 100) + "vh";
      }
    }
}

// Projects ----------------------------------
async function GetProjects(location) {
    try {
      const response = await fetch("/Data/Projects.json", { credentials: 'same-origin' });
      if (!response.ok)
        throw new Error(`Response status: ${response.status}`);
  
      const json = await response.json();
      const projectsPage = document.getElementById("projects");
      for(let i = 0; i < json.length; i++) {
        var project = document.createElement("div");
        project.classList.add("project");

        var innerHTML = '';
        innerHTML += '<div class="project-name">' + json[i].name + '</div>';
        innerHTML += '<div class="project-requester"><p>Aangevraagd door:</p><p>' + json[i].requester + '</p></div>';
        innerHTML += '<div class="project-executor"><p>Uitgevoerd door:</p><p>' + json[i].executor + '</p></div>';
        innerHTML += '<div class="project-description">' + json[i].description + '</div>';

        innerHTML += '<div class="project-links">';
        const links = json[i].urls.split("\n");
        for(var j = 0; j < links.length; j++) {
          var url = new URL(links[j]);
          innerHTML += '<a href="' + links[j] + '">' + url.hostname + '</a>';
        }
        innerHTML += '</div>';

        project.innerHTML = innerHTML;
        projectsPage.appendChild(project);
      }
    } catch (error) {
      console.error(error.message);
    }
}
// Inspiration --------------------------------
function FetchInspiration() {
  fetch("/Data/Inspiration.json", { credentials: 'same-origin' }).then(async (response) => {
    if(!response.ok) {
      console.error(response.status);
      return;
    }
    const json = await response.json();
    if(loggedIn && permissions["modifyInspiration"]) {
      PopulateInspirationLabels(json);
    }
    GetInspiration(json);
    PopulateSuggestionLabels(json);
  });
}

async function GetInspiration(json) {
  try {
    

  }
  catch(err) {
    console.error(error.message);
  }
}

// Suggestions --------------------------------
async function PopulateSuggestionLabels(json) {
  try {
    var suggestionLabels = document.getElementById("label-selector");
    suggestionLabels.innerHTML = "";
    Object.entries(json.labels).forEach(([category, labelsList]) => {
      var categoryP = document.createElement("p");
      categoryP.classList.add("label-aside");
      categoryP.innerText = category;
      suggestionLabels.appendChild(categoryP);

      var labels = document.createElement("div");
      labels.classList.add("labels");
      labelsList.forEach((labelObject, index) => {
        if(labelObject.name == null) return;
        
        var label = document.createElement("p");
        label.color = labelObject.color;
        label.name = labelObject.name;
        label.selected = false;
        label.onclick = ToggleLabelSelect.bind(label, label);
        label.innerText = labelObject.name;
        label.classList.add("inspiration-label");

        labels.appendChild(label);        
      });
      
      suggestionLabels.appendChild(labels);
      suggestionLabels.appendChild(document.createElement("br"));
    });

  } catch(err) {
    console.error(error.message);
  }
}
function ToggleLabelSelect(label, ev) {
  if(!label.selected) {
    label.selected = true;
    label.style.backgroundColor = "hsl(" + label.color + ",60%, 70%)";
  } else {
    label.selected = false;
    label.style.backgroundColor = "";
  }
}
function OnURLKeyDown(input, ev) {
  if(ev.keyCode == 13) {
    ev.preventDefault();
    input.blur();
  }
}
function OnVideoURLInput(input, ev) {
  ev.preventDefault();
  try {
    var url = new URL(input.value);
    // Youtube base on: https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
    if(url.hostname === "youtube.be" || url.hostname === "www.youtube.be") 
      DisplayYoutubePreview(url.pathname);
    else if((url.hostname === "youtube.com" || url.hostname === "www.youtube.com" ) && (url.pathname.indexOf("/embed") == 0 || url.pathname.indexOf("/shorts") == 0))
      DisplayYoutubePreview(url.pathname.substring(url.pathname.indexOf('/')));
    else if((url.hostname === "youtube.com" || url.hostname === "www.youtube.com" ) && url.searchParams.has("v"))
      DisplayYoutubePreview(url.searchParams.get("v"));
    else if((url.hostname === "youtube.com" || url.hostname === "www.youtube.com" ) && url.searchParams.has("vi"))
      DisplayYoutubePreview(url.searchParams.get("vi"));

  } catch(err) { return; }
  return;
}
async function DisplayYoutubePreview(videoID) {
  try {
    if(videoID == "") return;

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    const response = await fetch("/API/RetrieveVideoInfo", { 
      credentials: 'same-origin', 
      headers:headers, 
      method: 'PUT', 
      body:JSON.stringify({"videoID":videoID})
    });
    if (!response.ok)
      throw new Error(`Response status: ${response.status}`);
    
    const json = await response.json();

    const preview = document.getElementById("preview");
    preview.getElementsByClassName("thumbnail")[0].style.backgroundImage = "url(" + json.thumnnails.medium.url +")";
    preview.getElementsByClassName("channel-thumbnail")[0].style.backgroundImage = "url(" + json.channelThumbnails.medium.url + ")";
    preview.getElementsByClassName("channel-info-block")[0].firstChild.innerText = json.title;
  } catch(err) {
    console.error(err);
  }
}

// Tutorials ----------------------------------
var currentFolder = "/";
{
  const urlParams = new URLSearchParams(window.location.search);
  currentFolder = urlParams.get("folder");
  if(currentFolder == null)
    currentFolder = "/";
}
async function GetTutorials() {
  try {
    const response = await fetch("/Data/Tutorials" + currentFolder + "contents.json", { credentials: 'same-origin' });
    if (!response.ok)
      throw new Error(`Response status: ${response.status}`);

    const json = await response.json();
    var folders = document.getElementById("folders");
    folders.innerHTML = "";
    var files  = document.getElementById("files");
    files.innerHTML = "";
    
    for(let i = 0; i < json.length; i++) {
      var tutorial = document.createElement("div");
      tutorial.classList.add("tutorial");
      var isFolder = json[i].indexOf('.') == -1;
      var extension = json[i].split('.').pop();
      if(isFolder)
        tutorial.ondblclick = SelectFolder.bind(tutorial, json[i]);

      var innerHTML = '';
      if(isFolder) innerHTML += '<i class="file-type fas fa-folder"></i>';
      else if(extension == "txt") innerHTML += '<i class="file-type fas fa-file-alt"></i>';
      else if(extension == "jpeg") innerHTML += '<i class="file-type fas fa-file-image"></i>';
      else if(extension == "png") innerHTML += '<i class="file-type fas fa-file-image"></i>';
      else if(extension == "pdf") innerHTML += '<i class="file-type fas fa-file-pdf"></i>';
      else if(extension == "docx") innerHTML += '<i class="file-type fas fa-file-word"></i>';
      else if(extension == "mp4") innerHTML += '<i class="file-type fas fa-file-video"></i>';
      else innerHTML += '<i class="file-type fas fa-file-alt"></i>';
      innerHTML += '<p class="file-name">' + json[i] + '</p>';

      tutorial.innerHTML = innerHTML;
      if(isFolder)
        folders.appendChild(tutorial);
      else
        files.appendChild(tutorial);
    }
  } catch (error) {
    console.error(error.message);
  }
}
function SelectFolder(name, ev) {
  GoToFolder(currentFolder + name + "/");
}
function GoToFolder(name) {
  if(currentFolder == name) return;
  currentFolder = name;
  GetTutorials();
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("folder", currentFolder);
  history.pushState(null, "", "?"+ urlParams.toString());

  PopulateFileNavigation();
}
function PopulateFileNavigation() {
  // Also contains an empty entry at the start and end, '/foo/bar/'
  const folders = currentFolder.split('/');
  folders.pop();
  var navigationBar = document.getElementById('file-navigation');
  while(navigationBar.childElementCount >= 2)
    navigationBar.removeChild(navigationBar.lastChild);
  var navigatedFolder = "/";
  folders.forEach((folder, index) => {
    if(index != 0) {
      var name = document.createElement("p");
      name.innerHTML = folder;
      navigatedFolder += folder + '/';
      name.onclick = ((folder, ev) => {
        GoToFolder(folder);
      }).bind(name, navigatedFolder);
      navigationBar.appendChild(name);
    }
    var splitter = document.createElement("i");
    splitter.className = "fas fa-greater-than";
    navigationBar.appendChild(splitter);
  });
}

// Suggestions ------------------------------
function AutoGrow(element) {
  if (element.scrollHeight > element.clientHeight) {
    element.style.transition = "height 1s";
    element.style.height = element.scrollHeight + "px";
  }
}
function AddLinkToSuggestion() {
  var links = document.getElementById("links");
  var addButton = links.lastChild;

  var spacerLabel = document.createElement("label");
  spacerLabel.classList.add("label-aside");
  links.insertBefore(spacerLabel, addButton);

  var id = (links.childElementCount) / 2;

  var div = document.createElement("div");
  div.classList.add("iconed");
  div.classList.add("label-aside");
  div.innerHTML = '<input type="text" placeholder="www.youtube.com" id="link' + id + '"><i class="fas fa-minus-circle fa-wf" onmousedown="RemoveSelf(this)"></i>';

  links.insertBefore(div, addButton);
}
function RemoveSelf(self) {
  var link = self.parentNode;
  var label = link.previousSibling;

  link.remove();
  label.remove();
}
function PreparePopup() {
  document.onmousedown = (event) => {
    if(event.target.parentNode.classList.contains("popup") || event.target.classList.contains("popup")) 
      return;
  
    var popups = document.getElementsByClassName("popup");
    for(var i = 0; i < popups.length; i++) {
      popups[i].style.opacity = "0";
    }
    setTimeout(() => {
      var popups = document.getElementsByClassName("popup");
      for(var i = 0; i < popups.length; i++) {
        if(popups[i].style.opacity === "0")
          popups[i].style.display = "none";
      }
    }, 1000);
  };
}

function ShowProjectFaultMessagePopUp(element, message) {
  element.focus();

  var popover = document.getElementById("project-suggestion-wrong");
  var projectSuggestionPage = document.getElementById("project-suggestion");
  var offsetParent = element;
  var offsetTop = 0;
  while(offsetParent != projectSuggestionPage) {
    var style = getComputedStyle(offsetParent);
    offsetTop += offsetParent.offsetTop + parseFloat(style.paddingTop, 10) + parseFloat(style.marginTop, 10) + parseFloat(style.borderTop, 10);
    offsetParent = offsetParent.offsetParent;
  }
  popover.style.display = "inline-block";
  popover.style.top = (offsetTop + element.clientHeight - 10) + "px";
  popover.innerHTML = message;

  popover.style.opacity = 1;

}
function IsValidURL(url) {
  try { 
    new URL(url);
    return true;
  } catch(e) { return false; }
}
function IsValidEMail(email) {
  const res = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return res.test(String(email).toLowerCase());
}
function IsASCII(str) {
  return /^[\x00-\x7F]*$/.test(str);
}
async function OnProjectSuggestionSubmit() {
  var projectName = document.getElementById("project-name").value;
  if(!projectName)
    return ShowProjectFaultMessagePopUp(document.getElementById("project-name"), "Specificeer een naam");
  else if(projectName.length > 255)
    return ShowProjectFaultMessagePopUp(document.getElementById("project-name"), "Maximum lengte is 255");
  else if(projectName.indexOf('"') != -1)
    return ShowProjectFaultMessagePopUp(document.getElementById("project-name"), "Kan geen \" erin hebben");

  var projectDescription = document.getElementById("project-description").value;
  if(!projectDescription)
    return ShowProjectFaultMessagePopUp(document.getElementById("project-description"), "Schrijf een omschrijving");
  else if(projectDescription.length > 65535)
    return ShowProjectFaultMessagePopUp(document.getElementById("project-description"), "Maximum lengte is 65535");
  else if(projectDescription.indexOf('"') != -1)
    return ShowProjectFaultMessagePopUp(document.getElementById("project-description"), "Kan geen \" erin hebben");

  var links = document.getElementById("links");
  var amountLinks = (links.childElementCount - 1) / 2;
  var usedLink = false;
  var lastFaultyLink = null;
  for(var i = amountLinks; i > 0; i--) {
    var input = document.getElementById("link" + i);
    if(input.value)
      usedLink = true;
    if((usedLink && !IsValidURL(input.value) && !IsValidURL("https://" + input.value)) || input.value.length > 255 || input.value.indexOf('"') != -1)
      lastFaultyLink = input;
  }
  if(lastFaultyLink) {
    if(!lastFaultyLink.value)
      return ShowProjectFaultMessagePopUp(lastFaultyLink, "Geef een link indien volgende velden een link hebben");
    else if(lastFaultyLink.value.length > 255)
      return ShowProjectFaultMessagePopUp(lastFaultyLink, "Maximum lengte is 255");
    else if(lastFaultyLink.value.indexOf('"') != -1)
      return ShowProjectFaultMessagePopUp(lastFaultyLink, "Kan geen \" erin hebben");
    else
      return ShowProjectFaultMessagePopUp(lastFaultyLink, "Ongeldige URL");
  }

  var projectSuggestor = document.getElementById("project-suggestor").value;
  if(!projectSuggestor)
    return ShowProjectFaultMessagePopUp(document.getElementById("project-suggestor"), "Geef je naam");
  else if(projectSuggestor.length > 255)
    return ShowProjectFaultMessagePopUp(document.getElementById("project-suggestor"), "Maximum lengte is 255");
  else if(projectSuggestor.indexOf('"') != -1)
    return ShowProjectFaultMessagePopUp(document.getElementById("project-suggestor"), "Kan geen \" erin hebben");

  var projectSuggestorEMail = document.getElementById("project-suggestor-email").value;
  if(!projectSuggestorEMail)
    return ShowProjectFaultMessagePopUp(document.getElementById("project-suggestor-email"), "Geef je email");
  else if(!IsValidEMail(projectSuggestorEMail))
    return ShowProjectFaultMessagePopUp(document.getElementById("project-suggestor-email"), "Geef een valide email");
  else if(projectSuggestorEMail.length > 255)
    return ShowProjectFaultMessagePopUp(document.getElementById("project-suggestor-email"), "Maximum lengte is 255");
  else if(projectSuggestorEMail.indexOf('"') != -1)
    return ShowProjectFaultMessagePopUp(document.getElementById("project-suggestor-email"), "Kan geen \" erin hebben");

  // Shove it into a post request
  var submitButton = document.getElementById("submit-project-suggestion");
  submitButton.value = "Aan het versturen ...";

  var postBody = "{";
  postBody+='"projectName":' + JSON.stringify(projectName) + ",";
  postBody+='"projectDescription":' + JSON.stringify(projectDescription) + ",";
  postBody+='"amountLinks":' + JSON.stringify(amountLinks) + ",";
  for(var i = 1; i <= amountLinks; i++) {
    var url = document.getElementById("link" + i).value;
    if((new URL(url)).protocol == "")
      url = "https://" + url;
    postBody+='"link' + i + '":' + JSON.stringify(url) + ",";
  }
  postBody+='"projectSuggestor":' + JSON.stringify(projectSuggestor) + ",";
  postBody+='"projectSuggestorEmail":' + JSON.stringify(projectSuggestorEMail) + "}";

  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  const response = await fetch("/API/SuggestProject", {
    method: "POST",
    body: postBody,
    headers: headers,
    credentials: 'same-origin'
  });

  var succesPage = document.getElementById("project-succes-page");
  succesPage.style.display = "inline-block";
  if (!response.ok) {
    succesPage.getElementsByTagName("i")[0].className = "fas fa-frown";
    succesPage.getElementsByTagName("h2")[0].innerHTML = "Oeps";
    succesPage.getElementsByTagName("p")[0].innerHTML = "Er is iets fout gegaan: " + await response.text();
  }
  document.getElementById("project-suggestion").style.overflowY = "hidden";
  succesPage.style.opacity = "1";

  // Remove the stuff in the input fields
  document.getElementById("project-name").value = "";
  document.getElementById("project-description").value = "";
  for(var i = 1; i <= amountLinks; i++) {
    document.getElementById("link" + i).value = "";
  }
  document.getElementById("project-suggestor").value = "";
  document.getElementById("project-suggestor-email").value = "";
}

// Footer -----------------------------------
addEventListener("load", (event) => {
  const windows = document.getElementsByClassName("content-wrapper");
  var innerHTML = '<a class="github" href="https://github.com/hidde2727/Eureka-website"><i class="fab fa-github fa-fw"></i></a>';
  innerHTML += '<a class="instagram" href="https://instagram.com"><i class="fab fa-instagram fa-fw"></i></a>';
  innerHTML += '<a class="copyright">©2024 by Hidde Meiburg</a>';

  for (var i = 0; i < windows.length; i++) {
    var footer = document.createElement("div");
    footer.classList.add("footer");
    footer.innerHTML = innerHTML;

    windows[i].appendChild(footer);
  }
  AfterFooterGeneration();
});

// Loggin page -------------------------------
var clickCounter = 0;
function AfterFooterGeneration() {
  const copyrightButtons = document.getElementsByClassName("copyright");
  for(var i = 0; i < copyrightButtons.length; i++) {
    copyrightButtons[i].onmousedown = () => {
      clickCounter++;
      if(clickCounter >= 5) {
        var button = document.getElementsByClassName("user-tab")[0];
        button.style.display = "";
      }
    };
  }
}
async function TryLogin() {
  var username = document.getElementById("username").value;
  if(!username) {
    document.getElementById("wrong-password").innerHTML = "Vul een gebruikersnaam in";
    document.getElementById("wrong-password").style.opacity = "1";
    return;
  }
  else if(username.indexOf('"') != -1) {
    document.getElementById("wrong-password").innerHTML = "Vul een gebruikersnaam in zonder \"";
    document.getElementById("wrong-password").style.opacity = "1";
    return;
  }
  var password = document.getElementById("password").value;
  if(!password) {
    document.getElementById("wrong-password").innerHTML = "Vul een wachtwoord in";
    document.getElementById("wrong-password").style.opacity = "1";
    return;
  }
  // process the password
  var buffer = new ArrayBuffer( password.length );
  var passwordArray = new Uint8Array(buffer);
  for(var i = 0; i < password.length; i++) {
    if(password.charCodeAt(i) > 255 || password.charCodeAt(i) < 0) {
      document.getElementById("wrong-password").innerHTML = "Illegaal karakter: " + password.charCodeAt(i);
      document.getElementById("wrong-password").style.opacity = "1";
      return;
    }
    passwordArray[i] = password.charCodeAt(i);
  }
  var encrypted = new Uint8Array(await window.crypto.subtle.digest("SHA-256", buffer));
  var base64 = btoa(String.fromCharCode.apply(null, encrypted));

  var postBody = JSON.stringify({
    username: username,
    password: base64
  });

  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  const response = await fetch("/API/Login", {
    method: "POST",
    body: postBody,
    headers: headers
  });
  if (!response.ok) {
    document.getElementById("wrong-password").innerHTML = "Er is iets fout gegaan: " + await response.text();
    document.getElementById("wrong-password").style.opacity = "1";
    return;
  }

  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  window.location.reload();
}
async function Logout() {
  const headers = new Headers();
  headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));
  await fetch("/API/Private/LogOut", { credentials: 'same-origin', headers:headers });
  window.location.reload();
}

// If logged in -------------------------------

function GetCookie(cookie) { // Taken from https://www.w3schools.com/js/js_cookies.asp
  let name = cookie + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return undefined;
}
var loggedIn = false;
var permissions;
// Check if the user is logged in
if(GetCookie("sessionID") != undefined && GetCookie("sessionCredential") != undefined)
  GetUserPermissions();

async function GetUserPermissions() {
  const headers = new Headers();
  headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));

  const response = await fetch("/API/Private/Permission/GetOwn", { credentials: 'same-origin', headers:headers });
  if (!response.ok)
    throw new Error(`Response status: ${response.status}`);

  permissions = await response.json();

  loggedIn = true;
  if(pageLoaded) // If page hasn't been loaded then we wait for the event to trigger CheckLogin
    CheckLogin();  
}

function CheckLogin() {
  if(!loggedIn) return;

  document.getElementsByClassName("user-tab")[0].style.display = "";
  document.getElementsByClassName("log-out")[0].style.display = "";
  document.getElementById("login-window").style.display = "none";
  document.getElementById("logged-in-window").style.display = "";

  PopulateSuggestionApproval();
  // Check individual permissions
  // Modifying users
  if(permissions["modifyUsers"]) {
    document.getElementById("add-user").style.display = "";
    document.getElementById("modify-users").style.display = "";
    PopulateUserModifier();
  }
  // Adding files
  if(permissions["addFiles"]) {
    PopulateFileEditor();
  }
  // Modify the inspiration
  if(permissions["modifyInspiration"]) {
    
  }
  // Modify the projects
  if(permissions["modifyProjects"]) {

  }
}

var allSuggestions = new Map();
async function PopulateSuggestionApproval() {
  // remove all childs except first one
  const suggestions = document.getElementById("select-suggestion");
  while (suggestions.childNodes.length > 5) {
    suggestions.removeChild(suggestions.lastChild);
  }
  try {
    const headers = new Headers();
    headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));
    const response = await fetch("/API/Private/Suggestion/GetAll", { credentials: 'same-origin', headers:headers });
    if (!response.ok)
      throw new Error(`Response status: ${response.status}`);

    const json = await response.json();
    for(let i = 0; i < json.length; i++) {
      var suggestion = document.createElement("div");
      suggestion.classList.add("suggestion");
      suggestion.onclick = SelectSuggestion.bind(suggestion, json[i].id, suggestion);

      var innerHTML = '';
      if(json[i].type == "project") {
        innerHTML += '<i class="fas fa-wrench fa-fw"></i>';
        innerHTML += '<p>' + json[i].json.projectName + '</p>';
      } else if(json[i].type == "inspiration") {
        innerHTML += '<i class="fas fa-lightbulb fa-fw"></i>';
        innerHTML += '<p>' + json[i].json.name + '</p>';
      }
      innerHTML += '<i class="fas fa-eye fa-fw"></i>';

      suggestion.innerHTML = innerHTML;
      suggestions.appendChild(suggestion);

      allSuggestions.set(json[i].id, new Object());
      allSuggestions.get(json[i].id).type = json[i].type;
      allSuggestions.get(json[i].id).json = json[i].json;
    }
  } catch (error) {
    console.error(error.message);
  }
}
var currentSuggestionBeingModified = null;
function SelectSuggestion(id, element, event) {
  var suggestion = allSuggestions.get(id);
  var popover = document.getElementById("approve-suggestion");
  popover.innerHTML = "";
  var innerHTML = "";
  if(suggestion.type == "project") {
    innerHTML += '<label class="label-above">Project naam</label><input class="label-above" type="text" placeholder="Project naam" value="' + suggestion.json.projectName + '">';
    innerHTML += '<label class="label-above">Omschrijving</label><textarea class="label-above" placeholder="Omschrijving">' + suggestion.json.projectDescription + '</textarea>';
    innerHTML += '<label class="label-above">Links</label>';
    for(var i = 0; i < suggestion.json.links.length; i++) {
      innerHTML += '<input class="label-above" type="text" placeholder="Link" value="' + suggestion.json.links[i] + '">';
    }
    innerHTML += '<label class="label-above">Naam voorsteller</label><input class="label-above" type="text" placeholder="Naam voorsteller" value="' + suggestion.json.projectSuggestor + '">';
    innerHTML += '<label class="label-above">Email voorsteller</label><input class="label-above" type="text" placeholder="Email voorsteller" value="' + suggestion.json.projectSuggestorEmail + '">';
    innerHTML += '<input type=submit id="deny" value="Weiger">';
    innerHTML += '<input type=submit value="Pas aan">';
    innerHTML += '<input type=submit id="accept" value="Helemaal toppie">';
  } else if(suggestion.type == "inspiration") {

  }
  popover.innerHTML = innerHTML;
  popover.togglePopover();
  var textareas = popover.getElementsByTagName("textarea");
  for(var i = 0; i < textareas.length; i++) {
    AutoGrow(textareas[i]);
  }
}

async function PopulateFileEditor() {
  var tutorials = document.getElementById("tutorials");
  tutorials.ondrop = OnFileDrop;
  tutorials.ondragover = OnFileDrag;
  tutorials.ondragenter = OnFileEnter;
  var dropScreen = document.getElementById("on-file-drag");
  dropScreen.ondragover = OnFileDrag;
  dropScreen.ondragleave = OnFileLeave;
}
var amountFilesQueued = 0;
function UploadFile(file, startingPath) {
  if(file.isDirectory) {
    // Scan the directory
    var directoryReader = file.createReader();
    directoryReader.readEntries((entries) => {
        entries.forEach((file) => {
        UploadFile(file, startingPath);
      });
    });
  } 
  else {
    // Upload the file
    amountFilesQueued++;

    file.file(async (fileData) => {
      fileBinary = (await fileData.bytes());
      fileBase64 = btoa(String.fromCharCode.apply(null, fileBinary));
      var postBody = JSON.stringify({
        filePath: currentFolder + file.fullPath,
        blob: fileBase64
      });
  
      const headers = new Headers();
      headers.append("Content-Type", "application/json");
      headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));
    
      fetch("/API/Private/Files/Add", {
        method: "PUT",
        body: postBody,
        headers: headers,
        credentials: 'same-origin'
      }).then(() => {
        amountFilesQueued--;
        if(amountFilesQueued == 0) {
          // Send the regenIndex request
          fetch("/API/Private/Files/RegenIndex", {
            method: "PUT",
            headers: headers,
            credentials: 'same-origin'
          });
          // Remove the loading screen
          GetTutorials();
          OnFileLeave(null);
        }
      });
    })
  }
}
function OnFileDrop(ev) {
  ev.preventDefault();
  
  var fileDropScreen = document.getElementById("on-file-drag");
  fileDropScreen.getElementsByTagName("h1")[0].innerHTML = "Even geduld.";
  fileDropScreen.getElementsByTagName("p")[0].innerHTML = "De files worden nu geupload";

  [...ev.dataTransfer.items].forEach(async (file) => {
    var entry = file.webkitGetAsEntry();
    UploadFile(entry, entry.fullPath);
  });
}
function OnFileDrag(ev) {
  ev.preventDefault();
}
function OnFileEnter(ev) {
  ev.preventDefault();

  var fileDropScreen = document.getElementById("on-file-drag");
  fileDropScreen.getElementsByTagName("h1")[0].innerHTML = "Drop die files!";
  fileDropScreen.getElementsByTagName("p")[0].innerHTML = "Upload bestanden door ze hier te droppen";

  if(fileDropScreenTransitionTimeout != null) {
    clearTimeout(fileDropScreenTransitionTimeout);
    fileDropScreenTransitionTimeout = null;
  }
  if(!fileDropScreen.classList.contains("files-hover")) {
    fileDropScreen.style.display = "flex";
    // Dirty fix for the transition not working the first time
    setTimeout(function () {
      fileDropScreen.classList.add("files-hover");
    }, 1);
  }
}
var fileDropScreenTransitionTimeout = null;
function OnFileLeave(ev) {
  if(ev)
    ev.preventDefault();

  var fileDropScreen = document.getElementById("on-file-drag");
  if(fileDropScreen.classList.contains("files-hover")) {
    fileDropScreen.classList.remove("files-hover");
    fileDropScreenTransitionTimeout = setTimeout(function () {
      fileDropScreen.style.display = "none";
    }, 1000);
  }
}

async function PopulateInspirationLabels(json) {
  try {
    const labelCategories = document.getElementById("label-categories");
    labelCategories.innerHTML = "";
    Object.entries(json.labels).forEach(([category, labelsList]) => {
      var categoryDiv = document.createElement("div");
      categoryDiv.classList.add("category")

      var topDiv = document.createElement("div");
      topDiv.className = "top";
      topDiv.innerHTML = '<i class="fas fa-chevron-right collapse" onmousedown="ToggleCategory(this)"></i><p>' + category + '</p><i class="fas fa-edit edit"></i><i class="fas fa-trash-alt delete"></i>';
      categoryDiv.appendChild(topDiv);

      var labels = document.createElement("div");
      labels.classList.add("labels");
      labelsList.forEach((labelObject, index) => {
        if(labelObject.name == null) return;
        
        var content = document.createElement("p");
        content.innerText = labelObject.name;
        content.contentEditable = false;
        content.ondblclick = OnLabelDoubleClick.bind(content, content);
        content.onblur = OnLabelEditEnd.bind(content, content);
        content.onkeydown = OnLabelInput.bind(content, content);
        content.classList.add("content");

        var label = document.createElement("p");
        label.classList.add("inspiration-label");
        label.style.backgroundColor = "hsl(" + labelObject.color + ", 60%, 70%)";
        label.draggable = "true";
        label.ondragstart = OnLabelDragStart.bind(label, label);
        label.ondragend = OnLabelDragEnd.bind(label, label);
        label.ondblclick = OnLabelDoubleClick.bind(label, label);
        label.onblur = OnLabelEditEnd.bind(label, label);
        label.labelName = labelObject.name;
        label.category = category;
        label.appendChild(content);

        labels.appendChild(label);
      });
      var bottomWidget = document.createElement("div");
      {
        addButton = document.createElement("i");
        addButton.className = "fas fa-plus";
        addButton.onmousedown = AddLabel.bind(addButton, addButton, category);
        bottomWidget.appendChild(addButton);

        addInput = document.createElement("input");
        addInput.type = "text";
        addInput.placeholder = "Nieuwe label";
        bottomWidget.appendChild(addInput);

        colorButton = document.createElement("button");
        colorButton.innerHTML = '<i class="fas fa-sync-alt">';
        colorButton.onmousedown = RegenerateColor.bind(colorButton, colorButton);
        RegenerateColor(colorButton);
        bottomWidget.appendChild(colorButton);
      }
      labels.appendChild(bottomWidget);
      categoryDiv.appendChild(labels);

      labelCategories.appendChild(categoryDiv);
    });

  } catch(err) {
    console.error(err.message);
  }
}
async function AddCategory() {
  try {
    const categoryName = document.getElementById("new-category-name").value;
    const body = JSON.stringify({"name":categoryName});

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));
    const response = await fetch("/API/Private/Inspiration/AddCategory", { method: "PUT", credentials: 'same-origin', headers:headers, body: body });

    document.getElementById("new-category-name").value = "";
    if (!response.ok)
      throw new Error(`Response status: ${response.status}`);

    FetchInspiration();

  } catch(err) {
    console.error(err.message);
  }
}
function ToggleCategory(element) {
  var labels = element.parentElement.parentElement.getElementsByClassName("labels")[0];
  if(labels.style.maxHeight == "300px") {
    labels.style.maxHeight = "0px";
    element.classList.remove("fa-rotate-90");
  } else {
    labels.style.maxHeight = "300px";
    element.classList.add("fa-rotate-90");
  }
}
function RegenerateColor(element) {
  var oldHue = element.hue == undefined ? -100000 : element.hue;
  do {
    element.hue = Math.floor(Math.random() * 360);
  } while(Math.abs(element.hue - oldHue) < 30);
  element.style.backgroundColor = "hsl(" + element.hue + ", 60%, 70%)";
}
async function AddLabel(element, categoryName) {
  try {
    var labelName = element.parentElement.getElementsByTagName("input")[0].value;
    var hue = element.parentElement.getElementsByTagName("button")[0].hue;
    if(labelName.length == 0)
      return;
  
    const body = JSON.stringify({"name":labelName, "category":categoryName, "color":hue});

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));
    const response = await fetch("/API/Private/Inspiration/AddLabel", { method: "PUT", credentials: 'same-origin', headers:headers, body: body });

    element.parentElement.getElementsByTagName("input")[0].value = "";
    if (!response.ok)
      throw new Error(`Response status: ${response.status}`);

    FetchInspiration();

  } catch(err) {
    console.error(err.message);
  }
}
function ExpandTrashbin() {
  var bin = document.getElementById("delete-draggables");
  bin.style.height = "";
  bin.style.margin = "";
  bin.style.padding = "";
}
function RetractTrashbin() {
  var bin = document.getElementById("delete-draggables");
  bin.style.height = "0px";
  bin.style.margin = "0";
  bin.style.padding = "0";
}
function OnLabelDoubleClick(element, ev) {
  ev.stopPropagation();

  element.parentElement.draggable = "";
  element.contentEditable = true;
  element.focus();
  element.oldContent = element.innerText;
}
function OnLabelInput(element, ev) {
  if(ev.keyCode == 13) {
    ev.preventDefault();
    element.blur();
  }
}
async function OnLabelEditEnd(element, ev) {
  element.parentElement.draggable = "true";
  element.contentEditable = false;

  if(element.oldContent != element.innerText) {
    try {    
      var labelName = element.parentElement.labelName;
      var category = element.parentElement.category;
      const body = JSON.stringify({"name":labelName, "category":category, "newName":element.innerText});
  
      const headers = new Headers();
      headers.append("Content-Type", "application/json");
      headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));
      const response = await fetch("/API/Private/Inspiration/EditLabel", { method: "PUT", credentials: 'same-origin', headers:headers, body: body });
  
      if (!response.ok)
        throw new Error(`Response status: ${response.status}`);
      
      OnInspirationChange();
  
    } catch(err) {
      console.error(err.message);
    }
  }
}
var currentDraggedLabel = null;
function OnLabelDragStart(element, ev) {
  //ev.preventDefault();
  ExpandTrashbin();
  currentDraggedLabel = element;
}
function OnLabelDragEnd(element, ev) {
  //ev.preventDefault();
  RetractTrashbin();
  currentDraggedLabel = null;
}

async function OnTrashbinDrop(ev) {
  ev.preventDefault();
  if(currentDraggedLabel != null) {
    try {    
      var labelName = currentDraggedLabel.labelName;
      var category = currentDraggedLabel.category;
      const body = JSON.stringify({"name":labelName, "category":category});
  
      const headers = new Headers();
      headers.append("Content-Type", "application/json");
      headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));
      const response = await fetch("/API/Private/Inspiration/DeleteLabel", { method: "PUT", credentials: 'same-origin', headers:headers, body: body });
  
      if (!response.ok)
        throw new Error(`Response status: ${response.status}`);
      
      OnInspirationChange();
  
    } catch(err) {
      console.error(err.message);
    }
  }
}

var allUserPermissions = new Map();
async function PopulateUserModifier() {
  // remove all childs except first one
  const usersPage = document.getElementById("modify-user-users");
  while (usersPage.childNodes.length > 5) {
    usersPage.removeChild(usersPage.lastChild);
  }
  try {
    const headers = new Headers();
    headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));
    const response = await fetch("/API/Private/Permission/GetAll", { credentials: 'same-origin', headers:headers });
    if (!response.ok)
      throw new Error(`Response status: ${response.status}`);

    const json = await response.json();
    for(let i = 0; i < json.length; i++) {
      var user = document.createElement("div");
      user.classList.add("user");
      user.onmousedown = SelectUser.bind(user, json[i].username, user);

      var innerHTML = '';
      innerHTML += '<i class="fas fa-user-alt fa-fw"></i>';
      innerHTML += '<p>' + json[i].username + '</p>';
      innerHTML += '<i class="fas fa-pen fa-fw"></i>';

      user.innerHTML = innerHTML;
      usersPage.appendChild(user);

      allUserPermissions.set(json[i].username, new Object());

      allUserPermissions.get(json[i].username).modifyUsers = json[i].modifyUsers;
      allUserPermissions.get(json[i].username).addFiles = json[i].addFiles;
      allUserPermissions.get(json[i].username).modifyInspiration = json[i].modifyInspiration;
      allUserPermissions.get(json[i].username).modifyProjects = json[i].modifyProjects;
    }
  } catch (error) {
    console.error(error.message);
  }
}

var currentUserBeingModified = null;
function SelectUser(username, element, event) {
  currentUserBeingModified = username;

  document.getElementById("modify-users").getElementsByClassName("next-to-each-other")[0].style.left = "-100%";
  var user = document.getElementById("modify-user-screen").getElementsByClassName("user")[0];
  user.innerHTML = '<i class="fas fa-user-alt fa-fw"></i><p>' + username + '</p>';
  var userPermissions = allUserPermissions.get(username);
  document.getElementById("modify-users-permission").checked = !!+userPermissions.modifyUsers;
  document.getElementById("add-files-permission").checked = !!+userPermissions.addFiles;
  document.getElementById("modify-project-permission").checked = !!+userPermissions.modifyProjects;
  document.getElementById("modify-inspiration-permission").checked = !!+userPermissions.modifyInspiration;

  document.getElementById("modify-users-permission").disabled = false;
  document.getElementById("add-files-permission").disabled = false;
  document.getElementById("modify-project-permission").disabled = false;
  document.getElementById("modify-inspiration-permission").disabled = false;

  document.getElementById("delete-user").style.opacity = "1";
  document.getElementById("change").style.opacity = "1";
  if(username == GetCookie("username")) {
    document.getElementById("delete-user").style.opacity = "0";
    document.getElementById("change").style.opacity = "0";

    document.getElementById("modify-users-permission").disabled = true;
    document.getElementById("add-files-permission").disabled = true;
    document.getElementById("modify-project-permission").disabled = true;
    document.getElementById("modify-inspiration-permission").disabled = true;
  }
}

// User window form submits -----------------------

function ShowAddUserFaultMessagePopUp(element, message) {
  element.focus();

  var popover = document.getElementById("add-user-wrong");
  var projectSuggestionPage = document.getElementById("add-user");
  var offsetParent = element;
  var offsetTop = 0;
  while(offsetParent != projectSuggestionPage) {
    var style = getComputedStyle(offsetParent);
    offsetTop += offsetParent.offsetTop + parseFloat(style.paddingTop, 10) + parseFloat(style.marginTop, 10) + parseFloat(style.borderTop, 10);
    offsetParent = offsetParent.offsetParent;
  }
  popover.style.display = "inline-block";
  popover.style.top = (offsetTop + element.clientHeight - 10) + "px";
  popover.innerHTML = message;

  popover.style.opacity = 1;

}
async function AddUser() {
  var username = document.getElementById("new-username").value;
  if(!username)
    return ShowAddUserFaultMessagePopUp(document.getElementById("new-username"), "Specificeer een naam");
  else if(username.length > 255)
    return ShowAddUserFaultMessagePopUp(document.getElementById("new-username"), "Maximum lengte is 255");
  else if(username.indexOf('"') != -1)
    return ShowAddUserFaultMessagePopUp(document.getElementById("new-username"), "Kan geen \" erin hebben");

  var password = document.getElementById("new-password").value;
  if(!password)
    return ShowAddUserFaultMessagePopUp(document.getElementById("new-password"), "Specificeer een wachtwoord");
  else if(password.length > 255)
    return ShowAddUserFaultMessagePopUp(document.getElementById("new-password"), "Maximum lengte is 255");
  else if(password.indexOf('"') != -1)
    return ShowAddUserFaultMessagePopUp(document.getElementById("new-password"), "Kan geen \" erin hebben");

  var passwordRepeat = document.getElementById("new-password-repeat").value;
  if(!passwordRepeat)
    return ShowAddUserFaultMessagePopUp(document.getElementById("new-password-repeat"), "Herhaal het wachtwoord");
  else if(passwordRepeat.length > 255)
    return ShowAddUserFaultMessagePopUp(document.getElementById("new-password-repeat"), "Maximum lengte is 255");
  else if(passwordRepeat.indexOf('"') != -1)
    return ShowAddUserFaultMessagePopUp(document.getElementById("new-password-repeat"), "Kan geen \" erin hebben");

  // process the password
  var buffer = new ArrayBuffer( password.length );
  var passwordArray = new Uint8Array(buffer);
  for(var i = 0; i < password.length; i++) {
    if(password.charCodeAt(i) > 255 || password.charCodeAt(i) < 0)
      return ShowAddUserFaultMessagePopUp(document.getElementById("new-password-repeat"), "Kan geen " + password.charCodeAt(i) + " erin hebben");
    passwordArray[i] = password.charCodeAt(i);
  }
  var encrypted = new Uint8Array(await window.crypto.subtle.digest("SHA-256", buffer));
  var base64 = btoa(String.fromCharCode.apply(null, encrypted));

  if(password != passwordRepeat)
    return ShowAddUserFaultMessagePopUp(document.getElementById("new-password-repeat"), "Moet hetzelfde zijn als het wachtwoord");

  var submitButton = document.getElementById("add-user-submit");
  submitButton.value = "Aan het versturen ...";

  var postBody = JSON.stringify({
    username: username,
    password: base64
  });

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));

  const response = await fetch("/API/Private/User/Add", {
    method: "PUT",
    body: postBody,
    headers: headers,
    credentials: 'same-origin'
  });

  if(!response.ok) {
    submitButton.value = "Maak nieuwe gebruiker";
    var error = await response.text();
    if(error == "Gebruikersnaam bestaat al!")
      return ShowAddUserFaultMessagePopUp(document.getElementById("new-username"), "Gebruikersnaam bestaat al");
    return ShowAddUserFaultMessagePopUp(document.getElementById("new-username"), "Error: " + error);
  }

  submitButton.value = "Aangemaakt!";
  document.getElementById("new-username").value = "";
  document.getElementById("new-password").value = "";
  document.getElementById("new-password-repeat").value = "";
  setTimeout(() => {
    var submitButton = document.getElementById("add-user-submit");
    submitButton.value = "Maak nieuwe gebruiker";
  }, 3000);

  PopulateUserModifier();
}

async function OnModifyUserSubmit(event) {
  if(event.submitter.id == "delete-user") {
    if(event.submitter.style.opacity == "0") return;

    if(event.submitter.value == "Verwijder gebruiker") { event.submitter.value = "Zeker weten?"; return; }
    else if(event.submitter.value == "Zeker weten?") { event.submitter.value = "Absoluut zeker?"; return; }
    else if(event.submitter.value == "Absoluut zeker?") { event.submitter.value = "Vernietig!!!"; return; }

    var postBody = JSON.stringify({
      username: currentUserBeingModified
    });
    
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));

    const response = await fetch("/API/Private/User/Delete", {
      method: "PUT",
      body: postBody,
      headers: headers,
      credentials: 'same-origin'
    });
    if(response.ok) PopulateUserModifier();
    else throw new Error("Failed to delete user: " + await response.text());

  } else if(event.submitter.id == "change") {
    if(document.getElementById("change").style.opacity == "0") return;

    var postBody = JSON.stringify({
      username: currentUserBeingModified,
      modifyUsers: document.getElementById("modify-users-permission").checked ? "1" : "0",
      addFiles: document.getElementById("add-files-permission").checked ? "1" : "0",
      modifyProjects: document.getElementById("modify-project-permission").checked ? "1" : "0",
      modifyInspiration: document.getElementById("modify-inspiration-permission").checked ? "1" : "0"
    });

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));

    const response = await fetch("/API/Private/Permission/Grant", {
      method: "PUT",
      body: postBody,
      headers: headers,
      credentials: 'same-origin'
    });
    if(response.ok) PopulateUserModifier();
    else throw new Error("Failed to modify user: " + await response.text());
  }
  document.getElementById("modify-users").getElementsByClassName("next-to-each-other")[0].style.left = "0%";
}