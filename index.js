// Sidebar --------------------------------------
addEventListener("load", (event) => {
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
            mainWindow.style.top = "-" + (this.id * 100) + "%";

            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set("tab", this.attributes.getNamedItem("target").nodeValue);
            history.pushState(null, "", "?"+ urlParams.toString());
        };
        sidebarTabs[i].id = i;
        if(selectedTabName != null && sidebarTabs[i].attributes.getNamedItem("target").nodeValue == selectedTabName) {
            var mainWindow = document.getElementById("main-content-scroll-animation");
            mainWindow.style.top = "-" + (i * 100) + "%";
        }
    }
});

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
        for(var j = 0; j < json[i].urls.length; j++) {
          var url = new URL(json[i].urls[j]);
          innerHTML += '<a href="' + json[i].urls[j] + '">' + url.hostname + '</a>';
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