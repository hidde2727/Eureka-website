// Sidebar --------------------------------------
addEventListener("load", (event) => {
    const sidebarTabs = document.getElementsByClassName("sidebar-tab");

    const urlParams = new URLSearchParams(window.location.search);
    const selectedTabName = urlParams.get('tab');

    for (var i = 0; i < sidebarTabs.length; i++) {
        sidebarTabs[i].onmouseover = function(){
            var elements = this.getElementsByTagName("p")[0];
            const textSize = this.getElementsByTagName("p")[0].clientWidth;
            this.style.width = "calc(30px*1.25 + " + textSize + "px)";
        };
        sidebarTabs[i].onmouseleave = function(){
            this.style.width = "calc(30px*1.25)";
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