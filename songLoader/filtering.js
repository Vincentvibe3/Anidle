import * as stringSimilarity from "string-similarity"
import axios from "axios"
import { logger } from "./logging.js"

let maxRetries = 3

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const getYoutubeData = async (song) => {
    //check youtube for data
    let data = {
        context: {
            client: {
                clientName: "WEB",
                clientVersion: "2.20220107.00.00"
            }
        },
        query: `${song.name} ${song.anime}`,
        params: "CAASAhAB"
    }
    let requestOk = false
    let response
    console.log(`Getting views for ${song.name}`)
    let tries = 0
    while (!requestOk){
        try{
            response = await axios.post("https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8", data, { timeout: 1000 })
            requestOk = true
        } catch {
            requestOk = false
            tries++
            if (tries===maxRetries){
                logger.error({}, `Failed to get views for ${song.name}`)
                return null
            }
            console.log(`Retrying fetching views for ${song.name}`)
            await sleep(100)
        }
    }
    await sleep(100)
    return getVideoData(response.data)
}

const formatViewCount = (string) => {
    return parseInt(string.replace(" views", "")
    .replaceAll(",", ""))
}

const getVideoData = (json) => {
    let videos = []
    let contents = json.contents
        .twoColumnSearchResultsRenderer
        .primaryContents
        .sectionListRenderer
        .contents[0]
        .itemSectionRenderer
        .contents
    for (let item of contents){
        if (item.hasOwnProperty("videoRenderer")){
            let views = item.videoRenderer
                .viewCountText
                .simpleText
            let id = item.videoRenderer.videoId
            let thumbnail = item.videoRenderer.thumbnail.thumbnails[0].url
            if (videos.length == 2){
                break
            }
            videos.push({
                views:formatViewCount(views),
                id:id,
                thumbnail:thumbnail
            })
        }
    }
    let data = {}
    if (videos.length>0){
        videos.sort(
            function compareNumbers(a, b) {
                return a.views - b.views;
            }    
        ).reverse()
        data.id = videos[0].id
        data.thumbnail = videos[0].thumbnail
        data.views = 0
        for (let video of videos){
            data.views=data.views+video.views
        }
        return data
    }
    return null
}

const insertPopularityData = (count, data, store) => {
    if (store.has(count)){
        store.get(count).push(data)
    } else {
        store.set(count, [data])
    }
}

const filterDuplicates = (current, existing) => {
    for (let entry of existing){
        let sim = stringSimilarity.compareTwoStrings(current.name, entry.name)
        if (sim>=0.6){
            return true
        }
    }
    return false
}

export const filterSongs = async (unfilteredSongs) => {
    let maxCount = 4
    let toKeep = []
    let scores = new Map()
    let scored = []
    for (let song of unfilteredSongs){
        let duplicate = filterDuplicates(song, scored)
        if (!duplicate){
            let ytData = await getYoutubeData(song)
            if (ytData!==null){
                let popularity = ytData.views
                song.externalData = [
                    {
                        source:"youtube",
                        id:ytData.id,
                        thumbnail:ytData.thumbnail
                    }
                ]
                if (popularity!==null){
                    scored.push(song)
                    insertPopularityData(popularity, song, scores)
                }
            }
        } 
    }
    let sortedScores = Array.from(scores.keys()).sort(
        function compareNumbers(a, b) {
            return a - b;
        }              
    ).reverse()
    for (let score of sortedScores){
        for (let song of scores.get(score)){
            toKeep.push(song)
            if (toKeep.length>=maxCount){
                return toKeep
            }
        }
    }
    return toKeep
}