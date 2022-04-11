import { songs } from "./songs"
import type { Song } from "./songs"

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

export const getSong = ():SongEntry => {
    let dstoffset = getDstOffset()
    const epoch = new Date(2022, 0, 1, 0, 0, 0, 0).valueOf()
    const currentTime = Date.now()
    const index = Math.floor((currentTime+dstoffset-epoch)/86400000)
    let next = (index + 1) * 86400000 + epoch - dstoffset
    return {
        song:songs[index%songs.length], 
        index:index%songs.length+1,
        expiry:next
    }
}

export interface SongEntry {
    song:Song,
    index:number,
    expiry:number
}