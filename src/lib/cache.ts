import type { Metadata } from "src/routes/getMetadata";
import type { VideoInfo } from "src/routes/getVideo"

export let cachedMetadata:Map<string, Metadata> = new Map()
export let cachedVideo:Map<string, VideoInfo> = new Map()