import * as fs from 'fs';
import readline from "readline"
import { createClient } from '@supabase/supabase-js'

const email = process.env.EMAIL
const password = process.env.PASSWORD
const key = process.env.SUPABASE_KEY
const url = process.env.SUPABASE_URL
const bucketName = process.env.BUCKET_NAME

// Create a single supabase client for interacting with your database 
const supabase = createClient(url, key)

const isKeyframe = /^(.*K.)$/gm

let idData = JSON.parse(fs.readFileSync("./ids.json", "utf-8"))
let validIds = idData.valid
let id = idData.toFetch

const login = async () => {
    const { session, error } = await supabase.auth.signIn({
        email: email,
        password: password,
      })
      if (error==null){
          supabase.auth.setAuth(session.access_token)
      } else {
          console.log(error)
          console.log("Login Failed")
          process.exit(1)
      }
}

const getSmallestFile = async () => {
    let originalExists = fs.existsSync("./original.webm")
    let processedExists = fs.existsSync("./processed.webm")
    let originalMetadataExists = fs.existsSync("./dump_original.txt")
    let processedMetadata = fs.existsSync("./dump_processed.txt")
    if (processedExists&&processedMetadata&&originalExists&&originalMetadataExists){
        let ogSize = fs.statSync("./original.webm").size
        let processedSize = fs.statSync("./processed.webm").size
        if (ogSize>processedSize){
            console.log("using processed")
            return "./processed.webm"
        } else {
            console.log("using orignal")
            return "./original.webm"
        }
    } else {
        console.log("missing files")
        process.exit(1)
    }
}

const getKeyframes = async (file)=>{
    let dump
    if (file=="./original.webm"){
        dump = "dump_original.txt"
    } else {
        dump = "dump_processed.txt"
    }
    let data = []
    const stream = fs.createReadStream(dump)
    const rl = readline.createInterface({
        input:stream,
        crlfDelay: Infinity
    })
    for await (const line of rl){
        if (isKeyframe.test(line)){
            let dataArray = line.split("|")
            data.push({
                timestamp:dataArray[0],
                bytes:dataArray[1]
            })
        }
    }
    console.log("Got keyframes")
    return JSON.stringify(data)
}

const uploadMetadata = async (keyframes) => {
    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(`${id}/keyframes.json`, keyframes, {
            upsert: true,
            contentType:"application/json"
        })
    if (error!=null){
        console.log(error)
    } else {
        console.log(data)
    }
}

const clearOldData = async () => {
    const { data, error } = await supabase.storage
        .from(bucketName)
        .list()
    if (error!=null){
        console.log(error)
    } else {
        for (let file of data){
            if (!validIds.includes(parseInt(file.name))){
                const { errorDel } = await supabase.storage
                    .from(bucketName)
                    .remove([`${file.name}/video.webm`, `${file.name}/keyframes.json`])
                if (errorDel!=null){
                    console.log(errorDel)
                } else {
                    console.log(`Deleted ${file.name}`)
                }
            }
        }
    }
}

const uploadProcessedVideo = async (file) => {
    let video = fs.readFileSync(file)
    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(`${id}/video.webm`, video, {
            upsert: true,
            contentType:"video/webm"
        })
    if (error!=null){
        console.log(error)
    } else {
        console.log(data)
    }
}

const start = async () => {
    console.log("Logging in")
    await login()
    console.log("Logged in")
    await clearOldData()
    let file = await getSmallestFile()
    let keyframes = await getKeyframes(file)
    console.log("uploading metadata")
    await uploadMetadata(keyframes)
    console.log("Uploading video")
    await uploadProcessedVideo(file)
}

start()