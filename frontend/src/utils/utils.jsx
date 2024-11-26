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