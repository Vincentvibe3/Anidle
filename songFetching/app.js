const fs = require('fs')
const process = require("process")
const axios = require('axios');
const wanakana = require('wanakana');
const client_id = process.env.MAL_CLIENT

var ids = []
var animeCount = 150
var songData = []
var animes = new Map()
var processed = 0
let cleanNumbers = /^#[0-9]*:/gm
let split = /(?<!^|[\s])[^\w]( by|By )/gm
let endFilter = /^(\).*?\()/gm
let filterBrackets = /\[.*\]/gm
let jpNameFilter = /(\([^A-z]*\))$/gm
let trailingParenthesis = new RegExp("\\)$")

let animeFetchDone = false
let songFetchDone = false

const getJpTitle = (str) => {
  let reversed = str.split("").reverse()
  let jpTitleList = []
  let open = 0
  if (reversed[0]===")"){
    for (let letter of reversed){
      if (letter===")"){
        open++
      } else if (letter==="("){
        open--
      } 
      if (open>0 && letter!==")"){
          jpTitleList.push(letter)
      } else {
        break
      }
    }
    console.log(jpTitleList.reverse().join(""))
  }
}

getJpTitle("secret base ~Kimi ga Kureta Mono~ (10 years after ver.) (secret base 〜君がくれたもの〜（10 years after Ver.）)")
console.log(wanakana.isMixed("(10 years after ver.)"))

const formatSongs = (str)=> {
  console.log(str)
  let cleaned = str.replace(cleanNumbers, "")
  let artistTrackSplit = cleaned.split(split)
  if (artistTrackSplit.length!=3){
    return null
  }
  let artistRound1 = artistTrackSplit[2]
    .split("").reverse().join("")
    .replace(endFilter, "").trim()
    .split("").reverse().join("")
    .replace(filterBrackets, "")
  let artistRound2 = endFilter.exec(artistRound1)
  let artist
  if (artistRound2===null){
    artist = artistRound1
  } else {
    artist = artistRound1.replace(artistRound2[1], "")
  }
  let track = artistTrackSplit[0].replace("\"", "")
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
  while(!animeFetchDone){
    await sleep(10)
  }
  console.log("Getting Songs")
  console.log(ids.length)
  for (let id of ids){
    await getSong(id)
    processed++
    if (processed%10===0){
      console.log(`${processed}/${ids.length} animes processed`)
    }
    await sleep(1000)
  }
  songFetchDone = true
}

const getAnimes = async () => {
  console.log("Getting animes")
  for (let page of [...Array(Math.ceil(animeCount/100)).keys()]){
    console.log(`Getting page ${page}`)
    await getTop(page)
    console.log(`Done page ${page}`)
    await sleep(200)
  }
  animeFetchDone = true
}

const checkDuplicates = (anime, data)=>{
  if (animes.has(anime)){
    let existing = animes.get(anime)
    if (existing.includes(data)){
      return true
    } else {
      let stripPattern = /-.*-$/gm
      let stripPattern2 = /\(.*\)$/gm
      let verStripped = data.replace(stripPattern, "").replace(stripPattern2, "")
      for (let title of existing){
        if (title.startsWith(data) || data.startsWith(title) || title.startsWith(verStripped)){
          return true
        }
      }
      existing.push(data)
      return false
    }
  } else {
    animes.set(anime, [data])
    return false
  }
}

const getSong = async (id) => {
  axios.get(`https://api.myanimelist.net/v2/anime/${id}?fields=opening_themes,ending_themes,media_type`,
    {
      headers:{"X-MAL-Client-ID": client_id}
    }
  ).then(
    ({data})=> {
      let ignore = ["music", "special", "ova"]
      if (!ignore.includes(data.media_type.toLowerCase())){
        if (typeof data.opening_themes !== "undefined"){
          for (let song of data.opening_themes){
            let formatted = formatSongs(song.text)
            if (formatted!=null) {
              formatted.anime = data.title
              let duplicate = checkDuplicates(formatted.anime, formatted.enName)
              if (!duplicate){
                songData.push(formatted)
              }
            }
          }
        }
        if (typeof data.ending_themes !== "undefined"){
          for (let song of data.ending_themes){
            let formatted = formatSongs(song.text)
            if (formatted!=null) {
              formatted.anime = data.title
              let duplicate = checkDuplicates(formatted.anime, formatted.enName)
              if (!duplicate){
                songData.push(formatted)
              }
            }
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
        if (ids.length<animeCount){
          ids.push(entry.node.id)
        } else {
          break
        }
      }
    }
  )
}

const writeData = async () => {
  while(!songFetchDone){
    await sleep(10)
  }
  console.log("Writing data")
  if (ids.length>0){
    fs.writeFile("./data.json", JSON.stringify(songData),
      err => {
        if (err) {
          console.error(err)
          return
        }
        //file written successfully
      })
  }
  
}

const start = async ()=>{
  let args = process.argv
  if (args[2]=="--initial"){
    while (ids.length==0){
      await getAnimes()
      await getSongs()
      await writeData()
    }
  } else {
    //get seasonal anime
  }
}

// start()

