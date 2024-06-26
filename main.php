<?php
  include("Background/background.php");
?>
<link rel="stylesheet" href="main.css">

<div id="background">
  <!-- Displayed windows on tab click -->
  <div id="window-mid">
    <script>
      // Make sure the window container can contain all of it's childeren side by side
      document.addEventListener("DOMContentLoaded", function() {
        var windowContent = document.getElementById("window-mid-content");
        windowContent.style.width= (windowContent.childElementCount*90) + "vw";
      });
    </script>
    <div id="window-mid-content">
      <!-- Displayed windows on tab click -->
      <div class="tab" id="voorstellen">

        <h1>Stel iets voor</h1>

      </div>
      <div class="tab" id="projecten">

        <h1>Projecten</h1>
        <div id="project-content"></div>
        <script>
          fetch("/Data/projecten.json")
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
              }
              return response.text();
            })
            .then((text) => {
              var data = JSON.parse(text);
              var projectTab = document.getElementById("project-content");
              for(var i = 0; i < data.length; i++) {
                var projectData = data[i];
                var projectDiv = document.createElement("div");
                projectDiv.className = "project";
                var innerHTML = '<div class="name">' + projectData.name + 
                '</div>\n<div class="requester">Vanuit ' + projectData.requester + 
                '</div>\n<div class="description">' + projectData.description + '</div>';

                if(projectData.link.length != 0) {
                  innerHTML += '<hr>';
                  if(typeof projectData.link === 'string' || projectData.link instanceof String) {
                    // It is a string
                    var url = new URL(projectData.link);
                    innerHTML += '<div class="links"><a href="' + projectData.link + '">' + url.hostname + '</a></div>';
                  }
                  else {
                    // It is an array
                    innerHTML += '<div class="links">';
                    for(var j = 0; j < projectData.link.length; j++) {
                      var url = new URL(projectData.link[j]);
                      innerHTML += '<a href="' + projectData.link[j] + '">' + url.hostname + '</a>';
                    }
                    innerHTML += '</div>';
                  }
                }

                projectDiv.innerHTML = innerHTML;
                projectTab.appendChild(projectDiv);
              }
            });
        </script>

      </div>
      <div class="tab" id="inspiratie">

        <h1>Inspiratie</h1>

      </div>
      <div class="tab" id="hoekje-tom">

        <h1>Tom's hoekje</h1>

      </div>
    </div>
  </div>
  <!-- Tabs -->
  <script>
    var currentSelectedTab = null;
    var currentSelectedPage = null;
    function selectTab(name) {
      if(currentSelectedTab != null)
        currentSelectedTab.classList.remove("selected");
      currentSelectedTab = document.querySelector('#tabs *[target="' + name + '"]');
      currentSelectedTab.classList.add("selected");
      
      if(currentSelectedPage != null)
        currentSelectedPage.classList.remove("selected");
      currentSelectedPage = document.querySelector('#' + name);
      currentSelectedPage.classList.add("selected");

      history.pushState(null, "", "/?tab=" + name);
      // Scroll the pages
      var windowContent = document.getElementById("window-mid-content");
      var pages = windowContent.children;
      var number = undefined;
      // Find which number of page the selected page is
      for(var i = 0; i < pages.length; i++) {
        if(pages[i] == currentSelectedPage) {
          number = i;
          break;
        }
      }
      windowContent.style.left = (number * -90) + "vw";
    }
    
    document.addEventListener("DOMContentLoaded", function() {
      const urlParams = new URLSearchParams(window.location.search);
      const tabName = urlParams.get('tab');
      try {
        selectTab(tabName);
      } catch(error) {
        selectTab("voorstellen");
      }
    });
  </script>
  <div id="tabs">
    <span target="voorstellen" onmousedown="selectTab('voorstellen');">Stel iets voor</span>
    <span target="projecten" onmousedown="selectTab('projecten');">Projecten</span>
    <span target="inspiratie" onmousedown="selectTab('inspiratie');">Inspiratie</span>
    <span target="hoekje-tom" onmousedown="selectTab('hoekje-tom');">Toms hoekje</span>
  </div>

</div>

<!-- <image src="logo.png" style="position: fixed; width: min(30vw, 30vh); min(30vw, 30vh); z-index: 10; border-radius: 20px; margin-left: calc(100vw - 0.9 * min(30vw, 30vh)); margin-top: 0px;"></image> -->