import { cachedMetadata } from "$lib/cache"

let process = import("process")

const getToken = async ():Promise<string> => {
    const client = (await process).env.VITE_SPOTIFY_CLIENT
    const secret = (await process).env.VITE_SPOTIFY_SECRET
    let auth = Buffer.from(`${client}:${secret}`).toString("base64")
    let response = await fetch("https://accounts.spotify.com/api/token", 
        {
            method:"POST",
            headers:{
                "Authorization":`Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body:"grant_type=client_credentials",
        }
    )
    let respData = await response.json()
    return respData.access_token
}

export interface Metadata{
    mediaURL:string,
    spotifyURL:string,
    artist:string,
    expiry:number, //Unix Timestamp
    albumArt:string
}

const fetchData = async (token:string, id:string):Promise<Metadata> => {
    let response = await fetch(`https://api.spotify.com/v1/tracks/${id}?market=JP`, 
        {
            method:"GET",
            headers:{
                "Authorization":`Bearer ${token}`,
                "Accept":"application/json",
                "Content-Type": "application/json"
            },
        }
    )
    let respData = await response.json()
    return {
        mediaURL:respData.preview_url,
        spotifyURL:respData.external_urls.spotify,
        artist:respData.artists[0].name,
        expiry:Date.now()+86400000,
        albumArt:respData.album.images[0].url
    }
}

//fix cache clearing
/** @type {import('./[id]').RequestHandler} */
export async function get({ url }) {
    if (url.searchParams.has("id")){
        let id = url.searchParams.get("id")
        if (cachedMetadata.has(id)){
            let metadata = cachedMetadata.get(id)
            if (metadata.expiry>Date.now()){
                return {
                    status:200,
                    body:{
                        metadata:metadata
                    }
                }
            } else {
                cachedMetadata.delete(id)
            }
        }
        try {
            let token = await getToken()
            let metadata = await fetchData(token, url.searchParams.get("id"))
            cachedMetadata.set(id, metadata)
            return {
                status:200,
                body:{
                    metadata:metadata
                }
            }
        } catch (FetchError) {}
    }
    return {
        status:400
    }
}