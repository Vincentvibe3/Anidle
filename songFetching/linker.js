const wanakana = require('wanakana');
const client_id = process.env.SPOTIFY_CLIENT
const client_secret = process.env.SPOTIFY_SECRET


let romajiArtist = "Chimame-tai"
let kanaArtist = wanakana.toKana(romajiArtist)
let jpArtist = "チマメ隊"
console.log(wanakana.toRomaji(kanaArtist))
const fs = require('fs')
let str = fs.readFileSync("data.json")
let data = JSON.parse(str)


const getMatches = async (page)=>{
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

for (let song of data){
    let jpOr
    if (song.jpName!==""){
        jpOr = ` OR ${song.jpName}`
    } else {
        jpOr = ""
    }
    let query = `${song.enName}${jpOr} artist:${song.artist}`
    console.log(query)
}

// let query = `Odore! Kyu-kyoku Tetsugaku OR 踊れ！きゅーきょく哲学 artist:"Sumire Uesaka" OR "すみれ ウえさか"`
// let data = "#2: \"Nichijou Decoration (日常デコレーション)\" by Petit Rabbit's (Ayane Sakura, Inori Minase, Risa Taneda, Satomi Sato, Maaya Uchida) (ep 12)"
// console.log(data)
// console.log(kanaArtist)