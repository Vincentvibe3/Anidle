import type { RequestHandler } from './$types';

import { cachedVideo } from "$lib/cache"
import { createClient } from "@supabase/supabase-js"
import {json, error } from '@sveltejs/kit';
import {
    VITE_SUPABASE_KEY as supabaseKey,
    VITE_SUPABASE_URL as supabaseUrl,
    VITE_BUCKET_NAME as bucketName,
} from '$env/static/private'
import type { VideoInfo } from "$lib/types";
// const supabaseUrl = process.env.VITE_SUPABASE_URL
// const supabaseKey = process.env.VITE_SUPABASE_KEY
// const bucketName = process.env.VITE_BUCKET_NAME
// const supabasePassword = process.env.VITE_PASSWORD
// const supabaseUsername = process.env.VITE_USERNAME

const supabase = createClient(supabaseUrl, supabaseKey)

const getVideoInfo = async (id:string, fetch):Promise<VideoInfo> => {
    let response = await fetch(`https://api.animethemes.moe/video/?filter[id]=${id}`)
    let respData = await response.json()
    let videos = respData.videos
    for (let video of videos){
        if (video.id==id){
            return {
                link:video.link.replace("staging.", ""),
                expiry:Date.now()+86400000,
            }
        }
    }
    return null
}

const checkMirror = async (id) => {
    const { data, error } = await supabase.storage
        .from(bucketName)
        .list()
    if (error!=null){
        console.log(error)
    } else {
        for (let file of data){
            if (file.name==id){
                return {
                    link:await getMirrorVideoLink(id),
                    metadata:await getMetadataLink(id),
                    expiry:Date.now()+86400000,
                }
            }
        }
    }
    return null
}

const getMetadataLink = async (id) => {
    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${id}/keyframes.json`
}

const getMirrorVideoLink = async (id) => {
    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${id}/video.webm`
}

export const GET: RequestHandler = async ({url, fetch}) => {
    console.log("request received")
    if (url.searchParams.has("id")){
        let id = url.searchParams.get("id")
        if (cachedVideo.has(id)){
            let videoInfo = cachedVideo.get(id)
            if (videoInfo.expiry>Date.now()){
                return json({
                    video:videoInfo
                })
                
            } else {
                cachedVideo.delete(id)
            }
        }
        let mirrorVideoInfo = null
        try {
            mirrorVideoInfo = await checkMirror(id)
        } catch (FetchError) {}
        if (mirrorVideoInfo!=null){
            return json({
                video:mirrorVideoInfo
            })
        } else {
            try {
                console.log("Trying original")
                let videoInfo = await getVideoInfo(id, fetch)
                cachedVideo.set(id, videoInfo)
                return json({
                        video:videoInfo
                    })
            } catch (FetchError) {
                throw error(400, FetchError.message)
            }
        }
    }
    throw error(400)
};