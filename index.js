addEventListener("load", (event) => {
  PrepareSidebar();
  PreparePopup();
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
async function GetProjects() {
    try {
      const response = await fetch("/Data/Projects.json");
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
  
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
GetProjects();

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

  links.insertBefore(document.createElement("label"), addButton);

  var id = (links.childElementCount) / 2;

  var div = document.createElement("div");
  div.classList.add("link");
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
function ToValidPostString(string) {
  return new String(string).replaceAll('&', '%26').replaceAll('=', '%3D');
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

  var postBody = "";
  postBody+="projectName=" + ToValidPostString(projectName) + "&";
  postBody+="projectDescription=" + ToValidPostString(projectDescription) + "&";
  postBody+="amountLinks=" + ToValidPostString(amountLinks) + "&";
  for(var i = 1; i <= amountLinks; i++) {
    var url = document.getElementById("link" + i).value;
    if((new URL(url)).protocol == "")
      url = "https://" + url;
    postBody+="link" + i + "=" + ToValidPostString(url) + "&";
  }
  postBody+="projectSuggestor=" + ToValidPostString(projectSuggestor) + "&";
  postBody+="projectSuggestorEmail=" + ToValidPostString(projectSuggestorEMail) + "&";

  const headers = new Headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded");

  const response = await fetch("/API/AddProjectSuggestion.php", {
    method: "POST",
    body: postBody,
    headers: headers
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