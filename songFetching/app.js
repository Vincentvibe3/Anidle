const fs = require('fs')
const process = require("process")
const axios = require('axios');
const wanakana = require('wanakana');
const client_id = process.env.MAL_CLIENT

var ids = []
var animeCount = 1200
var songData = []
var processed = 0
let cleanNumbers = /^#[0-9]*:/gm
let endFilter = /(?:.*) (\(.*\))$/gm
let jpNameFilter = new RegExp("( \\().*$")
let trailingParenthesis = new RegExp("\\)$")

const formatSongs = (str)=> {
  console.log(str)
  let cleaned = str.replace(cleanNumbers, "")
    .replaceAll("\"", "")
  let artistTrackSplit
  if (cleaned.split(" by ")[1]===undefined){
    artistTrackSplit = cleaned.split(" By ")
  } else {
    artistTrackSplit = cleaned.split(" by ")
  }
  let artistRound1 = artistTrackSplit[1]
    .replace(endFilter, "").trim()
  let artistRound2 = endFilter.exec(artistRound1)
  let artist
  if (artistRound2===null){
    artist = artistRound1
  } else {
    artist = artistRound1.replace(artistRound2[1], "")
  }
  let track = artistTrackSplit[0]
  let enName = track.split(jpNameFilter)[0]
  let jpName = track.replace(enName, "")
    .replace("(", "")
    .replace(trailingParenthesis, "")

  return {
    enName:enName.trim(),
    jpName:jpName.trim(),
    artist:artist.trim()
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const getSongs = async ()=>{
  console.log("Getting Songs")
  for (let id of ids){
    getSong(id)
    processed++
    if (processed%10===0){
      console.log(`${processed}/${ids.length} animes processed`)
    }
    await sleep(1000)
  }
}

const getAnimes = async () => {
  console.log("Getting animes")
  for (let page of [...Array(animeCount/100).keys()]){
    getTop(page)
    await sleep(200)
  }
}

const getSong = async (id) => {
  axios.get(`https://api.myanimelist.net/v2/anime/${id}?fields=opening_themes,ending_themes,media_type`,
    {
      headers:{"X-MAL-Client-ID": client_id}
    }
  ).then(
    ({data})=> {
      let ignore = ["music", "special"]
      if (!ignore.includes(data.media_type)){
        if (typeof data.opening_themes !== "undefined"){
          for (let song of data.opening_themes){
            let formatted = formatSongs(song.text)
            formatted.anime = data.title
            songData.push(formatted)
          }
        }
        if (typeof data.ending_themes !== "undefined"){
          for (let song of data.ending_themes){
            let formatted = formatSongs(song.text)
            formatted.anime = data.title
            songData.push(formatted)
          }
        }
      }
    }
  )
}

const getTop = async (page)=>{
  axios.get(`https://api.myanimelist.net/v2/anime/ranking?ranking_type=bypopularity&offset=${page*100}&limit=100`,
    {
      headers:{"X-MAL-Client-ID": client_id}
    }
  ).then(
    ({data})=> {
      for (let entry of data.data){
        ids.push(entry.node.id)
      }
    }
  )
}

const writeData = async () => {
  console.log("Writing data")
  fs.writeFile("./data.json", JSON.stringify(songData),
    err => {
      if (err) {
        console.error(err)
        return
      }
      //file written successfully
    })
}

let args = process.argv
if (args[2]=="--initial"){
  getAnimes().then(
    getSongs
  ).then(
    writeData
  )
} else {
  //get seasonal anime
}


