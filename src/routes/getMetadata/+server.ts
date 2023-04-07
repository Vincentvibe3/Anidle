import { cachedMetadata } from '$lib/cache';
import type { RequestHandler } from './$types';
import {json, error } from '@sveltejs/kit';

import {
    VITE_SPOTIFY_CLIENT as client,
    VITE_SPOTIFY_SECRET as secret
} from '$env/static/private'

const getToken = async ():Promise<string> => {
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
    URL:string,
    artist:string,
    expiry:number, //Unix Timestamp
    albumArt:string
    source:string
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
    console.log(response.status)
    let respData = await response.json()
    return {
        URL:respData.external_urls.spotify,
        artist:respData.artists[0].name,
        expiry:Date.now()+86400000,
        albumArt:respData.album.images[0].url,
        source:"spotify"
    }
}

export const GET: RequestHandler = async ({url}) => {
    if (url.searchParams.has("id")){
        let id = url.searchParams.get("id")
        if (cachedMetadata.has(id)){
            let metadata = cachedMetadata.get(id)
            if (metadata.expiry>Date.now()){
                return json({
                    metadata:metadata
                })
            } else {
                cachedMetadata.delete(id)
            }
        }
        try {
            let token = await getToken()
            let metadata = await fetchData(token, url.searchParams.get("id"))
            cachedMetadata.set(id, metadata)
            
            
            return json({
                metadata:metadata
            })
        } catch (FetchError) {}
    }
    throw error(400)
};