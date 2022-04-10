<script lang="ts" context="module">
    import { browser } from '$app/env'

    /** @type {import('./[slug]').Load} */  
    export async function load({ url }) {
        if (browser) {
            let songEntry:SongEntry = getSong()
            let song = songEntry.song
            let response = await fetch(`${url.origin}/getMetadata?id=${song.id}`)
            if (response.status!=200){
                return {
                    props: {
                        song:song,
                        metadata:{},
                        loadFailed:true,
                        loaded:true,
                        index:songEntry.index
                    }
                }
            }
            let metadata:Metadata = (await response.json()).metadata
            return {
                props: {
                    song:song,
                    metadata: metadata,
                    loaded: true,
                    index:songEntry.index
                }
            }
        }
        return {
            status: 200,
        }
    }

</script>

<script lang="ts">
    import Dialog from "$lib/dialog.svelte"
    import Game from "$lib/game.svelte";
    import About from "$lib/about.svelte"
    import { getSong, type SongEntry } from '$lib/songChooser';
    import type { Metadata } from './getMetadata';
    import type { Song } from '$lib/songs';
    import { onMount } from 'svelte';

    export let loaded = false
    export let loadFailed = false
    export let song:Song
    export let metadata:Metadata
    export let index:number

    let gameStarted = false
    let showAbout = false
    let dialog = false
    let finished = false
    let displayEndScreen = false

    const showAboutCard = () => {
        showAbout = true
    }

    const showOnEndCard = () => {
        displayEndScreen = true
    }

    onMount(()=>{
        if (gameStarted){
            dialog = false
        } else {
            dialog = true
        }
    })
</script>

{#if dialog && !finished}
    <Dialog></Dialog>
{/if}
<header>
    <button on:click={showAboutCard} class="aboutButton">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
    </button>
    <h1>Anidle</h1>
    {#if finished}
        <button class="endButton" on:click="{showOnEndCard}">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
        </button>
    {:else}
        <button class="endButton" on:click="{showOnEndCard}" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3f4146" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
        </button>
    {/if}
</header>
<About bind:displayed={showAbout}></About>
<main>
    {#if loaded && loadFailed}
        <p>Loading failed.</p>
        <p>Reload the page to try again</p>
    {:else if loaded && !loadFailed}
        <Game bind:gameStarted={gameStarted} bind:song={song} bind:metadata={metadata} bind:index={index} bind:displayEndScreen={displayEndScreen} bind:finished={finished}></Game>
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
        justify-content: center;
        top: 5rem;
        height: calc(100% - 5rem);
        width: 100%;
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
