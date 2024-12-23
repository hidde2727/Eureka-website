export function GetCookie(key) {
    var b = document.cookie.match("(^|;)\\s*" + key + "\\s*=\\s*([^;]+)");
    return b ? b.pop() : undefined;
}
export function DeleteCookie(key) {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function PushWindowParam(name, value) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set(name, value);
    history.pushState(null, "", "?" + urlParams.toString());
}

export function GetWindowParam(name, defaultTo=null) {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get(name) == null) return defaultTo;
    else return urlParams.get(name);
}

export function IsValidURL(url) {
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

// Just don't open the website outside the european timezone
export function TimeToString(time) {
    var date = new Date(time);
    var now = new Date();
    var difference = (now - date) / 1000;

    var years = Math.floor(difference / 31536000);
    difference -= years * 31536000;
    var months = Math.floor(difference / 2592000);
    difference -= months * 2592000;
    var weeks = Math.floor(difference / 604800);
    difference -= weeks * 604800;
    var days = Math.floor(difference / 86400);
    difference -= days * 86400;
    var hours = Math.floor(difference / 3600);
    difference -= hours * 3600;
    var minutes = Math.floor(difference / 60);
    difference -= minutes * 60;
    var seconds = Math.floor(difference);

    if(years != 0) return years + ' jaar geleden';
    else if(months == 1) return '1 maand geleden';
    else if(months != 0) return months + ' maanden geleden';
    else if(weeks == 1) return '1 week geleden';
    else if(weeks != 0) return weeks + ' weken geleden'; 
    else if(days == 1) return '1 dag geleden';
    else if(days != 0) return days + ' dagen geleden';
    else if(hours != 0) return hours + ' uur geleden';
    else if(minutes == 1) return '1 minuut geleden'; 
    else if(minutes != 0) return minutes + ' minuten geleden';
    else if(seconds <= 1) return '1 seconde geleden';
    else return seconds + ' secondes geleden';
}

// https://stackoverflow.com/questions/6195729/most-efficient-way-to-prepend-a-value-to-an-array
export function Prepend(array, value) {
    var newArray = array.slice();
    newArray.unshift(value);
    return newArray;
}

export function IsObjectEmpty(object) {
    for (const property in object) {
        if (Object.hasOwn(object, property)) return false;
    }
    return true;
}

// https://css-tricks.com/snippets/javascript/test-if-element-supports-attribute/
export function DoesElementSupportProperty(element, attribute) {
    return !!(attribute in document.createElement(element));
}

export function IconByExtension({ extension, fw=false }) {
    const additive = fw?' fa-fw':'';
    if(extension == "txt") return <i className={"file-type fas fa-file-alt"+additive}/>;
    else if(extension == "jpeg") return <i className={"file-type fas fa-file-image"+additive}/>;
    else if(extension == "png") return <i className={"file-type fas fa-file-image"+additive}/>;
    else if(extension == "pdf") return <i className={"file-type fas fa-file-pdf"+additive}/>;
    else if(extension == "docx") return <i className={"file-type fas fa-file-word"+additive}/>;
    else if(extension == "mp4") return <i className={"file-type fas fa-file-video"+additive}/>;
    else return <i className={"file-type fas fa-file-alt"+additive}/>;
}