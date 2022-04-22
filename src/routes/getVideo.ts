import { cachedVideo } from "$lib/cache"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_KEY
const bucketName = process.env.VITE_BUCKET_NAME
const supabasePassword = process.env.VITE_PASSWORD
const supabaseUsername = process.env.VITE_USERNAME

const supabase = createClient(supabaseUrl, supabaseKey)

const login = async () => {
    const { session, error } = await supabase.auth.signIn({
        email: supabaseUsername,
        password: supabasePassword,
      })
      if (error==null){
          supabase.auth.setAuth(session.access_token)
      } else {
          console.log(error)
          console.log("Login Failed")
          process.exit(1)
      }
}

await login()

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

const checkMirror = async (id) => {
    const { data, error } = await supabase.storage
        .from('animethemes-mirror')
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
            let mirrorVideoInfo = await checkMirror(id)
            if (mirrorVideoInfo!=null){
                return {
                    status:200,
                    body:{
                        video:mirrorVideoInfo
                    }
                }
            }
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