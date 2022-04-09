<script lang="ts" context="module">
    import { browser } from '$app/env'

    /** @type {import('./[slug]').Load} */  
    export async function load({ url }) {
        if (browser) {
            let song = getSong()
            let response = await fetch(`${url.origin}/getMetadata?id=${song.id}`)
            if (response.status!=200){
                return {
                    props: {
                        loadFailed:true,
                        loaded:true
                    }
                }
            }
            let metadata:Metadata = (await response.json()).metadata
            console.log(metadata)
            return {
                props: {
                    song:song,
                    mediaLink: metadata,
                    loaded: true
                }
            }
        }
        return {
            status: 200,
        }
    }
</script>
<script lang="ts">
    import { getSong } from "$lib/songChooser";
    import type { Song } from "$lib/songs";
    import Dialog from "$lib/Dialog.svelte"
    import type { Metadata } from './getMetadata';
    import { onMount } from 'svelte';
    import Progress from "$lib/Progress.svelte";
    import { getSuggestions } from '$lib/suggestions';

    export let loaded = false
    export let loadFailed = false
    export let song:Song
    export let mediaLink:Metadata
    export let media:HTMLAudioElement

    let dialog = true
    let playing = false
    let currentTime:number=0
    let maxTime:number = 16
    let attempts = [1, 2, 4, 7, 11, 16]
    let attemptCount = 0
    let finished = false
    let inputContent = ""
    let suggestions:string[] = []
    let inputContentSet = false

    const addAttempt = () => {
        if (attemptCount!=attempts.length-1){
            attemptCount++
        } else {
            finished=true
        }
    }

    const updateProgress = ()=>{
        currentTime = media.currentTime
        if (playing&&currentTime<attempts[attemptCount]){
            setTimeout(updateProgress, 10)
        } else {
            playing=false
            media.pause()
            media.currentTime = 0
            currentTime = 0
        }
    }

    const playPause = ()=>{
        if (playing){
            media.pause()
            media.currentTime = 0
            currentTime = 0
        } else {
            media.play()
            setTimeout(updateProgress, 10)
        }
        playing=!playing
    }

    const getAnswerSuggestions = (query)=>{
        let tempSuggestions = getSuggestions(query, 5)
        if (tempSuggestions[0]==query){
            suggestions = [tempSuggestions[0]]
        } else {
            suggestions = tempSuggestions
        }
        if (query != suggestions[0]&&inputContentSet==true){
            inputContentSet = false
        }
        console.log(suggestions)
    }

    $: inputContent, getAnswerSuggestions(inputContent)

    onMount(()=>{
        currentTime = media.currentTime
    })
</script>

{#if dialog}
    <Dialog></Dialog>
{/if}
<main>
{#if loaded && loadFailed}
        <p>Loading failed. Reload the page to try again</p>
{:else if loaded && !loadFailed}
    {#if !finished}
        <p>{song.id}</p>
        <p>{song.name}</p>
        <p>{mediaLink.artist}</p>
        <p>{mediaLink.spotifyURL}</p>
        <audio bind:this={media} src={mediaLink.mediaURL} preload="true"></audio>
    {:else}
        <p>Done</p>
    {/if}
    <div class="controls">
        {#if !inputContentSet}
            <div class="suggestions">
                {#each suggestions as suggestion}
                    <button on:click={()=>{inputContent=suggestion;inputContentSet=true}}>{suggestion}</button>
                {/each}
            </div>    
        {/if}
        <input bind:value={inputContent}>
        <Progress bind:max={maxTime} bind:value={currentTime} bind:separatorPositions={attempts} bind:revealed={attempts[attemptCount]}></Progress>
        <div class="buttons">
            <button on:click={addAttempt}>Skip</button>
            <button on:click={playPause} class="play">Play</button>
            <button on:click={addAttempt}>Submit</button>
        </div>
    </div>
{:else}
    <p>Loading...</p>
{/if}
</main>

<style>
    main {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        width: 100%;
    }

    .controls {
        position: absolute;
        bottom: 1rem;
        width: 60%;
        display: flex;
        flex-direction: column;
        justify-items: flex-end;
    }

    .suggestions {
        margin: 1rem 0rem 1rem 0rem;
        display: flex;
        flex-direction: column;
    }

    .suggestions button {
        margin-top: 0rem;
    }

    

    input {
        margin: 0rem 0rem 1rem 0rem;
    }

    .buttons {
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin: 1rem 0rem 1rem 0rem;
    }
</style>
