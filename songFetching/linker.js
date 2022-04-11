const wanakana = require('wanakana');

let romajiArtist = "Chimame-tai"
let kanaArtist = wanakana.toKana(romajiArtist)
let jpArtist = "チマメ隊"
console.log(wanakana.toRomaji(kanaArtist))

let query = `Odore! Kyu-kyoku Tetsugaku OR 踊れ！きゅーきょく哲学 artist:"Sumire Uesaka" OR "すみれ ウえさか"`
let data = "#2: \"Nichijou Decoration (日常デコレーション)\" by Petit Rabbit's (Ayane Sakura, Inori Minase, Risa Taneda, Satomi Sato, Maaya Uchida) (ep 12)"
console.log(data)
console.log(kanaArtist)