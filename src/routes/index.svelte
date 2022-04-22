<script lang="ts" context="module">
    import { browser } from '$app/env'

    const getVideo = async (id:number, url):Promise<string> => {
        let response = await fetch(`${url.origin}/getVideo?id=${id}`)
        if (response.status!=200){
            return null
        } else {
            return (await response.json()).video.link
        }
    }

    const getMetadata = async (song:Song, url):Promise<Metadata> => {
        let metadata:Metadata
        for (let externalSource of song.external){
            if (externalSource.source=="youtube"){
                let source = externalSource as YoutubeInfo
                metadata = {
                    URL:`https://www.youtube.com/watch?v=${source.id}`,
                    albumArt:source.thumbnail,
                    artist:song.artist,
                    expiry:Date.now()+86400000,
                    source:"youtube"
                }
            } else if (externalSource.source=="spotify"){
                let response = await fetch(`${url.origin}/getMetadata?id=${externalSource.id}`)
                if (response.status!=200){
                    return null
                }
                metadata =  (await response.json()).metadata
            }
        }
        return metadata
    }

    /** @type {import('./[slug]').Load} */  
    export async function load({ url }) {
        if (browser) {
            console.log("Loading")
            let songEntry:SongEntry = getSong()
            let song = songEntry.song
            let link = await getVideo(song.id, url)
            let metadata = await getMetadata(song, url)
            if (metadata==null||link==null){
                return {
                    props: {
                        song:song,
                        metadata:{},
                        link:"",
                        loadFailed:false,
                        loaded:true,
                        index:songEntry.song.index,
                        nextTime:songEntry.expiry
                    }
                }
            }
            return {
                props: {
                    song:song,
                    metadata: metadata,
                    link:link,
                    loaded: true,
                    index:songEntry.song.index,
                    nextTime:songEntry.expiry
                }
            }
        }
        return {
            status: 200,
        }
    }

</script>

<script lang="ts">
    import Dialog from "$lib/Dialog.svelte"
    import Game from "$lib/Game.svelte";
    import About from "$lib/About.svelte"
    import { getSong, type SongEntry } from '$lib/songChooser';
    import type { Metadata } from './getMetadata';
    import type { Song, YoutubeInfo } from '$lib/songs';
    import { onMount } from 'svelte';

    export let loaded = false
    export let loadFailed = false
    export let song:Song
    export let metadata:Metadata
    export let index:number
    export let nextTime:number
    export let link:string

    let gameStarted = false
    let showAbout = false
    let dialog = false
    let finished = false
    let displayEndScreen = false
    let content:HTMLElement

    const flipAboutCard = () => {
        showAbout = !showAbout
    }

    const flipEndCard = () => {
        displayEndScreen = !displayEndScreen
    }

    onMount(()=>{
        if (!loadFailed){
            content.style.justifyContent = "space-between"
        }
        if (gameStarted){
            dialog = false
        } else {
            dialog = true
        }
    })
</script>
<svelte:head>
	<title>Anidle</title>
    <link rel="preconnect" href="https://animethemes.moe">
</svelte:head>
{#if dialog && !finished && !loadFailed}
    <Dialog></Dialog>
{/if}

<main bind:this={content}>
    {#if loaded && loadFailed}
        <p>Loading failed.</p>
        <p>Reload the page to try again</p>
    {:else if loaded && !loadFailed}
        <Game bind:link={link} bind:nextTime={nextTime} bind:gameStarted={gameStarted} bind:song={song} bind:metadata={metadata} bind:index={index} bind:displayEndScreen={displayEndScreen} bind:finished={finished}></Game>
    {:else}
        <p>Loading Game ...</p>
    {/if}
    <noscript>
        <p>This page relies on javascript for the game's functionality</p>
        <p>The page will be stuck loading without javascript</p>
    </noscript>
</main>
<About bind:displayed={showAbout}></About>
<header>
    <button on:click={flipAboutCard} class="aboutButton">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
    </button>
    <h1>Anidle</h1>
    {#if finished}
        <button class="endButton" on:click="{flipEndCard}">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
        </button>
    {:else}
        <button class="endButton" on:click="{flipEndCard}" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3f4146" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
        </button>
    {/if}
</header>


<style>

    noscript {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    noscript p {
        margin: 0.5rem;
    }

    main {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        top: 5rem;
        height: calc(100% - 5rem);
        width: 100%;
        min-width: 20rem;
    }

    header {
        position: absolute;
        top:0rem;
        height:4rem;
        width: 100%;
        background-color: #1e1f22;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        min-width: 20rem;
        z-index: 1;
    }

    header .aboutButton {
        position: absolute;
        left: 1rem;
        background-color: #00000000;
        border: none;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    header .endButton {
        position: absolute;
        right: 1rem;
        background-color: #00000000;
        border: none;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    header h1 {
        font-size: 1.2rem;
    }

</style>
