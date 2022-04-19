import { cachedVideo } from "$lib/cache"

const getVideoInfo = async (id:string):Promise<VideoInfo> => {
    let response = await fetch(`https://staging.animethemes.moe/api/video/?filter[id]=${id}`)
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

export interface VideoInfo{
    link:string,
    expiry:number
}

/** @type {import('./[id]').RequestHandler} */
export async function get({ url }) {
    if (url.searchParams.has("id")){
        let id = url.searchParams.get("id")
        if (cachedVideo.has(id)){
            let videoInfo = cachedVideo.get(id)
            if (videoInfo.expiry>Date.now()){
                return {
                    status:200,
                    body:{
                        video:videoInfo
                    }
                }
            } else {
                cachedVideo.delete(id)
            }
        }
        try {
            let videoInfo = await getVideoInfo(id)
            cachedVideo.set(id, videoInfo)
            return {
                status:200,
                body:{
                    video:videoInfo
                }
            }
        } catch (FetchError) {}
    }
    return {
        status:400
    }
}