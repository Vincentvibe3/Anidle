import type { Metadata } from "$lib/types"
import type { VideoInfo } from "$lib/types"

export let cachedMetadata:Map<string, Metadata> = new Map()
export let cachedVideo:Map<string, VideoInfo> = new Map()