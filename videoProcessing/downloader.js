import * as fs from 'fs';
import axios from "axios"
import { spawn } from "child_process"

let args = process.argv
let songsFile = args[2]

const getDstOffset = () => {
    let now = new Date()
    let jan = new Date(now.getFullYear(), 0, 1);
    let jul = new Date(now.getFullYear(), 6, 1);
    let stdTimezoneOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    let dstTimezoneOffser = Math.min(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    if (stdTimezoneOffset>now.getTimezoneOffset()){
        return (stdTimezoneOffset-dstTimezoneOffser)*60*1000
    } else {
        return 0
    }
}

const loadSongs = () => {
    let songsStr = fs.readFileSync(songsFile, "utf-8")
    return JSON.parse(songsStr)
}

const getId = async () => {
    let songs = loadSongs()
    let dstoffset = getDstOffset()
    const epoch = new Date(2022, 0, 1, 0, 0, 0, 0).valueOf()
    const currentTime = Date.now()
    const index = Math.floor((currentTime+dstoffset-epoch)/86400000)+1
    return {
        toFetch:songs[index%songs.length].id, 
        valid:[
            songs[(index-2)%songs.length].id,
            songs[(index-1)%songs.length].id,
            songs[index%songs.length].id,
        ]
    }
}

const getLink = async (id) => {
    let response = await axios.get(`https://staging.animethemes.moe/api/video/?filter[id]=${id}`)
    let respData = response.data
    let videos = respData.videos
    for (let video of videos){
        if (video.id==id){
            return video.link.replace("staging.", "")
        }
    }
    return null
}

const getMetadata = async (link) => {
    let script = spawn(`./getKeyframes.sh`, [link]);

    script.stdout.on("data", data => {
        console.log(`${data}`);
    });
    
    script.stderr.on("data", data => {
        console.log(`${data}`);
    });
    
    script.on('error', (error) => {
        console.log(`error: ${error.message}`);
        console.log("failed")
        process.exit(1)
    });
    
    script.on("close", code => {
        console.log(`script exited with code ${code}`);
    });
}

const start = async () => {
    console.log("Getting id")
    let idData = await getId()
    fs.writeFileSync("ids.json", `${JSON.stringify(idData)}`)
    console.log("Getting link")
    let link = await getLink(idData.toFetch)
    if (link!=null){
        console.log("downloading + running ffprobe")
        getMetadata(link)
    } else {
        console.log("Failed")
        process.exit(1)
    }
}

start()
