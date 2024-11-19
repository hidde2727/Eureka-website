/* + ======================================================================== +
/* | General                                                                  |
/* + ========================================================================*/
function PushWindowParam(name, value) {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set(name, value);
  history.pushState(null, "", "?" + urlParams.toString());
}

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

var fetchCache = new Map;
async function FetchInfo(url, method, body, {jsonResponse=true, includeCredentials=false, useCache=true}={}) {
  try {
    if(useCache && method == 'GET' && fetchCache.has(url)) return [true, fetchCache.get(url)];

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    if(includeCredentials)
      headers.append("sessionCredentialRepeat", decodeURI(GetCookie("sessionCredential")));

    const response = await fetch(url, { 
      credentials: 'same-origin', 
      headers: headers, 
      method: method, 
      body: body
    });
    if (!response.ok)
      throw new Error(await response.text());

    var decodedResult = null;
    if(jsonResponse)
      decodedResult = await response.json();
    else
    decodedResult = await response.text();

    fetchCache.set(url, decodedResult);

    return [true, decodedResult];
  } catch(err) { console.error(err.message); return [false, err.message]; }
}

function IsValidURL(url) {
  try {
    var check = new URL(url);
  } catch(err) {
    try {
      var check = new URL('https://' + url);
    } catch(err) {
      return false;
    }
  }
  return true;
}


/* + ======================================================================== +
/* | Input fields                                                             |
/* + ========================================================================*/
// https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
function TextareaAutoGrow(element) {
  if(!element.parentNode.classList.contains("auto-grow")) {
    element.outerHTML = '<div class="auto-grow">' + element.outerHTML + '</div>';
  }
  element.parentNode.dataset.replicatedValue = element.value;
}

function OnSelectClick(el, ev) {
  if(el.classList.contains('open')) {
    var dropdown = el.getElementsByClassName('dropdown')[0];
    if(dropdown.contains(ev.target) && ev.target != dropdown) {
      el.getElementsByClassName('active')[0].innerText = ev.target.innerText;
      el.value = ev.target.innerText;

      el.classList.remove('open');
    }
  } else {
    el.classList.add('open');
    body.addEventListener('click', OutsideSelectClick.bind(null, el), {once: true});
  }
}
function OutsideSelectClick(el, ev) {
  if(el.contains(ev.target)) {
    body.addEventListener('click', OutsideSelectClick.bind(null, el), {once: true});
  } else {
    if(el.classList.contains('open')) el.classList.remove('open');
  }
}


/* + ======================================================================== +
/* | Input fields                                                             |
/* + ========================================================================*/
function OpenPopover(popover) {
  popover.showPopover();
  body.addEventListener('click', TryClosePopover.bind(null, popover), {once: true});
}

function TryClosePopover(popover, event) {
  if(!popover.matches(':popover-open')) return;
  if(event.target == popover)
    popover.hidePopover();
  else 
    body.addEventListener('click', TryClosePopover.bind(null, popover), {once: true});
}


/* + ======================================================================== +
/* | Form fault message                                                       |
/* + ========================================================================*/
// Used to automaticly calculate the offset from the top of the form to the input element
function ShowFaultMessage(forElement, message) {
  var offsetParent = forElement;
  var style = getComputedStyle(offsetParent);
  var offsetTop = parseFloat(style.height, 10) - parseFloat(style.paddingTop, 10) - parseFloat(style.borderTop, 10);
  var offsetLeft = 0;
  while(offsetParent.nodeName != 'FORM') {
    style = getComputedStyle(offsetParent);
    offsetTop += offsetParent.offsetTop + parseFloat(style.paddingTop, 10) + parseFloat(style.marginTop, 10) + parseFloat(style.borderTop, 10);
    offsetLeft += offsetParent.offsetLeft + parseFloat(style.paddingLeft, 10) + parseFloat(style.marginLeft, 10) + parseFloat(style.borderLeft, 10);
    offsetParent = offsetParent.offsetParent;
    if(offsetParent.parentElement == undefined) throw new Error("Invalid faultmessage -> requested element isn't part of a FORM element");
  }

  var tooltip = document.createElement('p');
  tooltip.innerText = message;
  tooltip.className = 'tooltip js-controlled fault-message bottom';
  tooltip.style.top = offsetTop + 'px';
  tooltip.style.left = (offsetLeft + (tooltip.clientWidth / 2)) + 'px';
  offsetParent.appendChild(tooltip);
  body.addEventListener('click', TryCloseFaultMessage.bind(null, tooltip), {once: true});
  setTimeout(() => {
    tooltip.classList.add('open');
  }, 1);
}

function TryCloseFaultMessage(tooltip, ev) {
  if(!ev.target.classList.contains('fault-message')) {
    tooltip.classList.remove('open');
    setTimeout(() => {
      tooltip.remove();
    }, 1000);
  } else {
    body.addEventListener('click', TryCloseFaultMessage.bind(null, tooltip), {once: true});
  }
}


/* + ======================================================================== +
/* | Website preview                                                          |
/* + ========================================================================*/
const InspirationTypes = Object.freeze({
  None: -1,
  YT_Video: 0,
  YT_Channel: 1,
  Github_account: 2,
  Github_repository: 3,
  Website: 4,
});
// ifInvalid -> previewInvalid/hide
function SetWebsitePreview(element, data, ifInvalid='previewInvalid') {
  try {
    element.style.display = '';
    element.innerHTML = '<div class="website-content"></div><div class="website-author-icon"></div><p class="website-author-name"></p><p class="website-extra-info"></p>';
    if(data.type == InspirationTypes.None) throw new Error("Invalid website data");
    else if(data.type == InspirationTypes.YT_Video) {
      element.getElementsByClassName("website-content")[0].style.backgroundImage = 'url(' + data.json.thumbnails.medium.url + ')';
      element.getElementsByClassName("website-author-icon")[0].style.backgroundImage = 'url(' + data.json.channelThumbnails.medium.url + ')';
      element.getElementsByClassName("website-author-name")[0].innerHTML = data.name;
      element.getElementsByClassName("website-author-name")[0].style.backgroundColor = "rgba(0,0,0,0)";
      element.getElementsByClassName("website-extra-info")[0].style.backgroundColor = "rgba(0,0,0,0)";
    } else if(data.type == InspirationTypes.YT_Channel) {

    } else if(data.type == InspirationTypes.Github_account) {

    } else if(data.type == InspirationTypes.Github_repository) {

    } else if(data.type == InspirationTypes.Website) {

    }
  } catch(err) {
    element.getElementsByClassName("website-content")[0].style.backgroundImage = '';
    element.getElementsByClassName("website-author-icon")[0].style.backgroundImage = '';
    element.getElementsByClassName("website-author-name")[0].innerHTML = '';
    element.getElementsByClassName("website-author-name")[0].style.backgroundColor = '';
    element.getElementsByClassName("website-extra-info")[0].style.backgroundColor = '';
    if(ifInvalid=='hide') {
      element.style.display = 'none';
    }
  }
}


/* + ======================================================================== +
/* | Inspiration labels                                                       |
/* + ========================================================================*/
var isInspirationLoaded = false;
var labels = FetchInfo('/Data/Labels.json', 'GET', null);
var labelListeners = [];
// Called after the page has been loaded
async function AwaitLabels() {
  var [succes, json] = await labels;
  if(!succes) throw new Error("Failed to fetch inspiration labels");
  isInspirationLoaded = true;
  labels = json;
  labelListeners.forEach((func) => {
    func(json);
  });
}

function AddLabelListener(func) {
  labelListeners.push(func);
  if(isInspirationLoaded) func(labels);
}


/* + ======================================================================== +
/* | General loading                                                          |
/* + ========================================================================*/
var pageLoaded = false;
addEventListener("load", async (event) => {
  pageLoaded = true;
  if(loggedIn) return;
  GeneralLoad();
});

async function GeneralLoad() {
  pageLoaded = true;
  GoToURLWindow();
  PrepareFooter();
  await AwaitLabels();

  PopulateProjectsWindow();
}


/* + ======================================================================== +
/* | Sidebar                                                                  |
/* + ========================================================================*/
var currentWindow = null;
function GoToWindow(name) {
  if(currentWindow != null && currentWindow.id == name) return;
  if(currentWindow != null) currentWindow.style.display = 'none';
  currentWindow = document.getElementById(name);
  currentWindow.style.display = 'block';

  PushWindowParam("window", name);
}

function GoToURLWindow() {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedWindowName = urlParams.get('window');
  try {
    currentWindow = document.getElementById(selectedWindowName);
    currentWindow.style.display = 'block';
  } catch(err) {
    currentWindow = document.getElementById('home');
    currentWindow.style.display = 'block';
  }
}


/* + ======================================================================== +
/* | Footer                                                                   |
/* + ========================================================================*/
function PrepareFooter() {
  const windows = document.getElementsByClassName("window");
  var innerHTML = '<a class="github" href="https://github.com/hidde2727/Eureka-website"><i class="fab fa-github fa-fw"></i></a>';
  innerHTML += '<a class="instagram" href="https://instagram.com"><i class="fab fa-instagram fa-fw"></i></a>';
  innerHTML += '<a class="copyright" onclick="OnCopyrightClick()">©2024 by Hidde Meiburg</a>';

  for (var i = 0; i < windows.length; i++) {
    var footer = document.createElement("div");
    footer.classList.add("footer");
    footer.innerHTML = innerHTML;

    windows[i].appendChild(footer);
  }
}


/* + ======================================================================== +
/* | Projects window                                                          |
/* + ========================================================================*/
function CreateProjectDiv(data) {
  var innerHTML = '';
  innerHTML += '<h2 class="card-title title">' + data.name + '</h2>';

  innerHTML += '<div class="split-window">'
  innerHTML += '<div class="requestor"><p>Aangevraagd door:</p><p>' + data.requester + '</p></div>';
  innerHTML += '<div class="executor"><p>Uitgevoerd door:</p><p>' + data.implementer + '</p></div>';
  innerHTML += '</div>';

  innerHTML += '<p class="description">' + data.description + '</p>';
  if(data.url1 != undefined) {
    innerHTML += '<div class="urls">';
    if(typeof(data.url1) == 'string') data.url1 = JSON.parse(data.url1);
    var hostname = (new URL(data.url1.url)).hostname;
    innerHTML += '<a href="' + data.url1.url + '">' + hostname +'</a>';
    if(data.url2 != undefined) {
      if(typeof(data.url2) == 'string') data.url2 = JSON.parse(data.url2);
      hostname = (new URL(data.url2.url)).hostname;
      innerHTML += '<a href="' + data.url2.url + '">' + hostname +'</a>';
      if(data.url3 != undefined) {
        if(typeof(data.url3) == 'string') data.url3 = JSON.parse(data.url3);
        hostname = (new URL(data.url3.url)).hostname;
        innerHTML += '<a href="' + data.url3.url + '">' + hostname +'</a>';
      }
    }
    innerHTML += '</div>';
  }

  var project = document.createElement('div');
  project.className = 'project';
  project.innerHTML = innerHTML;

  return project;
}

var projects = FetchInfo('/Data/Projects.json', 'GET', null);
async function PopulateProjectsWindow() {
  var succes = false;
  [succes, projects] = await projects;
  if(!succes) throw new Error('Loading projects information failed!');

  var projectsPage = document.getElementById('projects');
  for(var i = 0; i < projects.length; i++) {
    var project = CreateProjectDiv(projects[i]);

    project.onclick = OpenProjectPopover.bind(null, projects[i]);

    projectsPage.appendChild(project);
  }
}

async function OpenProjectPopover(data) {
  var popover = document.getElementById('project-popover');
  popover.getElementsByClassName('project')[0].innerHTML = CreateProjectDiv(data).innerHTML;
  popover.getElementsByClassName('project')[0].getElementsByClassName('urls')[0].remove();

  SetWebsitePreview(document.getElementById('project-popover-url2'), data.url1, 'hide');
  SetWebsitePreview(document.getElementById('project-popover-url1'), data.url2, 'hide');
  SetWebsitePreview(document.getElementById('project-popover-url3'), data.url3, 'hide');

  try {
    document.getElementById('accept-emails-project-executor').checked = false;
  } catch(err) {}

  popover.getElementsByClassName('middle')[0].style.width = '';
  if(data.url2 == undefined) {
    popover.getElementsByClassName('middle')[0].style.width = '500px';
  }

  OpenPopover(popover);
}


/* + ======================================================================== +
/* | Suggestion window                                                        |
/* + ========================================================================*/
function PopulateSuggestionLabelSelector(labels) {
  const labelSelector = document.getElementById('suggestion-label-selector');
  for (const [category, values] of new Map(Object.entries(labels.labels))) {
    var innerHTML = '<label class="inline">' + category + '</label><div class="inline-input">';
    values.forEach((value) => {
      innerHTML += '<p class="label ' + value.id + '" onclick="ToggleSuggestionLabel(this)">' + value.name + '</p>';
    });
    innerHTML += '</div>'
    labelSelector.innerHTML += innerHTML;
  }
}
AddLabelListener(PopulateSuggestionLabelSelector);

var selectedLabels = [];
function ToggleSuggestionLabel(element) {
  if(element.state == undefined) element.state = false;

  if(element.state == false) {
    element.state = true;
    element.style.backgroundColor = 'var(--accent)';
    element.style.color = 'var(--prominent-text)';
    selectedLabels.push(element.classList[1]);
  } else if(element.state == true) {
    element.state = false;
    element.style.backgroundColor = '';
    element.style.color = '';
    selectedLabels = selectedLabels.filter(item => item != element.classList[1]);
  }
}

function OnURLSuggestionKeyDown(inputElement, event, websitePreviewID) {
  if(event.keyCode == 13) {
    event.preventDefault();
    inputElement.blur();
  }
}

async function OnURLSuggestionChange(inputElement, event, websitePreviewID) {
  if(!IsValidURL(inputElement.value)) return;
  var [succes, urlInfo] = await FetchInfo('API/RetrieveURLInfo/?url=' + encodeURI(inputElement.value), 'GET', null);
  if(!succes) return;
  SetWebsitePreview(document.getElementById(websitePreviewID), urlInfo);
}

async function OnProjectSuggestionSubmit(form) {
  var projectName = document.getElementById('project-name').value;
  if(!projectName) return ShowFaultMessage(document.getElementById('project-name'), 'Specificeer een naam');
  else if(projectName.length > 255) return ShowFaultMessage(document.getElementById('project-name'), 'Maximale lengte 255');

  var projectDescription = document.getElementById('project-description').value;
  if(!projectDescription) return ShowFaultMessage(document.getElementById('project-description'), 'Specificeer een omschrijving');
  else if(projectDescription.length > 65535) return ShowFaultMessage(document.getElementById('project-description'), 'Maximale lengte 65535');

  var urls = [];
  var link1 = document.getElementById('project-link1').value;
  if(link1) {
    if(link1.length > 255) return ShowFaultMessage(document.getElementById('project-link1'), 'Maximale lengte 255');
    else if(!IsValidURL(link1)) return  ShowFaultMessage(document.getElementById('project-link1'), 'Moet valide link zijn');
    urls.push(link1);
  }
  var link2 = document.getElementById('project-link2').value;
  if(link2) {
    if(link2.length > 255) return ShowFaultMessage(document.getElementById('project-link2'), 'Maximale lengte 255');
    else if(!IsValidURL(link2)) return  ShowFaultMessage(document.getElementById('project-link2'), 'Moet valide link zijn');
    urls.push(link2);
  }
  var link3 = document.getElementById('project-link3').value;
  if(link3) {
    if(link3.length > 255) return ShowFaultMessage(document.getElementById('project-link3'), 'Maximale lengte 255');
    else if(!IsValidURL(link3)) return  ShowFaultMessage(document.getElementById('project-link3'), 'Moet valide link zijn');
    urls.push(link3);
  }

  var projectSuggestorName = document.getElementById('project-suggestor-name').value;
  if(!projectSuggestorName) return ShowFaultMessage(document.getElementById('project-suggestor-name'), 'Specificeer je naam');
  else if(projectSuggestorName.length > 255) return ShowFaultMessage(document.getElementById('project-suggestor-name'), 'Maximale lengte 255');

  var projectSuggestorEmail = document.getElementById('project-suggestor-email').value;
  if(!projectSuggestorEmail) return ShowFaultMessage(document.getElementById('project-suggestor-email'), 'Specificeer je email');
  else if(projectSuggestorEmail.length > 255) return ShowFaultMessage(document.getElementById('project-suggestor-email'), 'Maximale lengte 255');

  const [succes, response] = await FetchInfo('/API/SuggestProject/', 'POST', JSON.stringify(
    {
      'name':projectName,
      'description':projectDescription,
      'links':urls,
      'suggestorName':projectSuggestorName,
      'suggestorEmail':projectSuggestorEmail
    }
  ), {jsonResponse:false});

  if(!succes) {
    form.innerHTML = '<div class="center-content"><i class="fas fa-sad-tear" style="font-size:2rem;"></i></div><div class="center-content"><h2>Error bij het indienen</h2></div><div class="center-content"><p>' + response + '</p></div>';
    return;
  }
  
  document.getElementById('project-name').value = '';
  document.getElementById('project-description').value = '';
  document.getElementById('project-link1').value = '';
  document.getElementById('project-link2').value = '';
  document.getElementById('project-link3').value = '';
  document.getElementById('project-suggestor-name').value = '';
  document.getElementById('project-suggestor-email').value = '';

  form.innerHTML = '<div class="center-content"><i class="fas fa-smile-beam" style="font-size:2rem;"></i></div><div class="center-content"><h2>Alles is goed gegaan!</h2></div><div class="center-content"><p>We proberen in een week bij je terug te komen!</p></div>';
}

async function OnInspirationSuggestion(form) {
  var url = document.getElementById('inspiration-url').value;
  if(!url) return ShowFaultMessage(document.getElementById('inspiration-url'), 'Specificeer een naam');
  else if(url.length > 255) return ShowFaultMessage(document.getElementById('inspiration-url'), 'Maximale lengte 255');
  else if(!IsValidURL(url)) return  ShowFaultMessage(document.getElementById('inspiration-url'), 'Moet valide zijn');

  var description = document.getElementById('inspiration-description').value;
  if(!description) return ShowFaultMessage(document.getElementById('inspiration-description'), 'Specificeer een omschrijving');
  else if(description.length > 65535) return ShowFaultMessage(document.getElementById('inspiration-description'), 'Maximale lengte 65535');

  var suggestions = [];
  var link1 = document.getElementById('inspiration-suggestion1').value;
  if(link1) {
    if(link1.length > 255) return ShowFaultMessage(document.getElementById('inspiration-suggestion1'), 'Maximale lengte 255');
    else if(!IsValidURL(link1)) return  ShowFaultMessage(document.getElementById('inspiration-suggestion1'), 'Moet valide link zijn');
    suggestions.push(link1);
  }
  var link2 = document.getElementById('inspiration-suggestion2').value;
  if(link2) {
    if(link2.length > 255) return ShowFaultMessage(document.getElementById('inspiration-suggestion2'), 'Maximale lengte 255');
    else if(!IsValidURL(link2)) return  ShowFaultMessage(document.getElementById('inspiration-suggestion2'), 'Moet valide link zijn');
    suggestions.push(link2);
  }

  const [succes, response] = await FetchInfo('/API/SuggestInspiration/', 'POST', JSON.stringify(
    {
      'url':url,
      'description':description,
      'recommendations':suggestions,
      'labels':selectedLabels
    }
  ), {jsonResponse:false});

  if(!succes) {
    form.innerHTML = '<div class="center-content"><i class="fas fa-sad-tear" style="font-size:2rem;"></i></div><div class="center-content"><h2>Error bij het indienen</h2></div><div class="center-content"><p>' + response + '</p></div>';
    return;
  }
  
  document.getElementById('inspiration-url').value = '';
  document.getElementById('inspiration-description').value = '';
  document.getElementById('inspiration-suggestion1').value = '';
  document.getElementById('inspiration-suggestion2').value = '';

  form.innerHTML = '<div class="center-content"><i class="fas fa-smile-beam" style="font-size:2rem;"></i></div><div class="center-content"><h2>Alles is goed gegaan!</h2></div><div class="center-content"><p>We proberen het binnen een week op de website te hebben staan!</p></div>';

}


/* + ======================================================================== +
/* | Login page                                                               |
/* + ========================================================================*/
// For those sneaking around in the code, yes there is a login page. Good luck with getting in! (Please if you find a bug, report to the creator and do not attempt to hack into this website. !Do not see this as an encouragement to hack the site!)
var counter = 0;
function OnCopyrightClick() {
  counter++;
  if(counter > 5) {
    counter = 0;
    OpenPopover(document.getElementById('login-popover'))
    document.getElementById('login-user').focus();
  }
}

async function OnLoginAttempt(form) {
  var username = document.getElementById('login-user').value;
  if(!username) return ShowFaultMessage(document.getElementById('login-user'), 'Specificeer een naam');
  else if(username.length > 255) return ShowFaultMessage(document.getElementById('login-user'), 'Maximum lengte is 255');

  var password = document.getElementById('login-password').value;
  if(!password) return ShowFaultMessage(document.getElementById('login-password'), 'Specificeer een wachtwoord');
  else if(password.length > 255) return ShowFaultMessage(document.getElementById('login-password'), 'Maximum lengte is 255');

  var encoder = new TextEncoder();
  var encodedPassword = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(password)));
  var base64 = btoa(String.fromCharCode.apply(null, encodedPassword));

  var [succes, response] = await FetchInfo('API/Login/', 'POST', JSON.stringify({
    'username':username,
    'password':base64
  }), {jsonResponse: false});

  if(!succes)
    return ShowFaultMessage(document.getElementById('login-user'), 'Fout wachtwoord of gebruikersnaam');

  document.getElementById('login-user').value = '';
  document.getElementById('login-password').value = '';

  window.location.reload();
}


/* + ======================================================================== +
/* | Login checks and script downloads                                        |
/* + ========================================================================*/
var loggedIn = false;
async function CheckPermissions() {
  if(GetCookie("sessionID") == undefined || GetCookie("sessionCredential") == undefined) return;
  loggedIn = true;
  
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = '/Management/loader.js';
  script.async = 'true';

  document.head.appendChild(script);
}
CheckPermissions();