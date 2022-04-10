import { songs } from "./songs"
import type { Song } from "./songs"

export const getSong = ():SongEntry => {
    const epoch = new Date(2022, 0, 1).valueOf()
    const currentTime = Date.now()
    const index = Math.floor((currentTime-epoch)/86400000)
    return {song:songs[index%songs.length], index:index%songs.length+1}
}

export interface SongEntry {
    song:Song,
    index:number
}