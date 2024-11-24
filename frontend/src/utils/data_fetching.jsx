import { queryOptions } from '@tanstack/react-query';

var fetchCache = new Map;
export async function FetchInfo(url, method, body, {jsonResponse=true, includeCredentials=false, useCache=true}={}) {
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

  return decodedResult;
}

export default function FetchOptionsInt(url, method, body, {jsonResponse=true, includeCredentials=false, useCache=true, enable=true}={}) {
    return queryOptions({
        queryKey: [url, method, body],
        queryFn: () => FetchInfo(url, method, body, {jsonResponse: jsonResponse, includeCredentials: includeCredentials, useCache: useCache}),
        staleTime: Infinity,
        enabled: enable
    });
}
export const FetchOptions = FetchOptionsInt;