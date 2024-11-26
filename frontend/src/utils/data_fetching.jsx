import { queryOptions } from '@tanstack/react-query';
import { GetCookie, DeleteCookie } from './utils.jsx';

export async function FetchInfo(url, method, body, { jsonResponse=true, includeCredentials=false }) {
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
  if (!response.ok) {
    const error = await response.text();
    if(error == 'Log in voor dit deel van de API') { DeleteCookie('sessionCredential'); DeleteCookie('sessionID'); DeleteCookie('userID'); return window.location.reload(); }
    throw new Error(error);
  }

  var decodedResult = null;
  if(jsonResponse)
    decodedResult = await response.json();
  else
    decodedResult = await response.text();

  return decodedResult;
}

export default function FetchOptionsInt(url, method, body, { jsonResponse=true, includeCredentials=false, enable=true }={}) {
    return queryOptions({
        queryKey: [url, method, body],
        queryFn: () => FetchInfo(url, method, body, { jsonResponse: jsonResponse, includeCredentials: includeCredentials }),
        staleTime: Infinity,
        enabled: enable
    });
}
export const FetchOptions = FetchOptionsInt;