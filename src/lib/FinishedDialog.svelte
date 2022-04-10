<script lang="ts">
    import type { get, Metadata } from "src/routes/getMetadata";
    import { onMount } from "svelte";
    import Report from "./report.svelte";
    import { getReport, type Attempt } from "./reportGenerator";
    import type { Song } from "./songs";
    export let displayed:boolean
    export let metadata:Metadata
    export let song:Song
    export let maxAttempts:number
    export let attempts:Attempt[]
    export let success:boolean
    export let index:number

    let container:HTMLElement
    let mounted = false
    let plural = ""

    const dismiss = () => {
        container.style.display = "none"
        
    }
    const show = () => {
        container.style.display = "flex"
    }

    onMount(()=>{
        mounted = true
    })

    const changeDisplay = (value) => {
        if (mounted){
            if (value){
                show()
            } else {
                dismiss()
            }
        }
        
    }

    const flipDisplay = ()=>{
        displayed= !displayed
    }

    const updatePlural = (attemptCount)=>{
        if (attemptCount>1){
            plural="s"
        } else {
            plural=""
        }
    }

    const copyToClipboard = ()=>{
        navigator.clipboard.writeText(
            window.location.protocol+"//"+
            window.location.host+` #${index}`+"\n"+
            getReport(attempts, maxAttempts)
            )
    }

    $: displayed, changeDisplay(displayed)
    $:attempts, updatePlural(attempts.length)

    onMount(() => {
        if (displayed){
            show()
        } else {
            dismiss()
        }
    })
</script>
<div bind:this={container} class="container">
    <div on:click={flipDisplay} class="bg"></div>
    <div class="card">
        {#if success}
            <h2>You got the Anidle in {attempts.length} attempt{plural}</h2>
        {:else}
            <h2>You failed today's Anidle.</h2>
        {/if}
        <Report bind:attempts={attempts} bind:maxAttempts={maxAttempts}></Report>
        <div class="songInfo">
            <img alt="Album art for {metadata.albumArt}" src={metadata.albumArt}>
            <div class="infoText">
                <p class="title">{song.name}</p>
                <p>by {metadata.artist}</p>
                <a href="{metadata.spotifyURL}">Listen on Spotify</a>
            </div>
            
        </div>
        <button on:click={copyToClipboard}>Share</button>
        <button on:click={flipDisplay}>Close</button>
    </div>
    
</div>


<style>

    h2 {
        margin-top: 0rem;
    }

    p {
        margin-top: 0rem;
        margin-bottom: 1rem;
    }

    img {
        width: 3rem;
        margin-right: 1rem;
    }

    .songInfo .infoText {
        width: calc(100% - 4rem);
        flex-direction: column;
        align-items: flex-start;
        justify-content: start;
    }

    .container {
        position: fixed;
        width: 100vw;
        height: 100vh;
        top: 0px;
        left: 0px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 4;
    }

    .bg{
        position: fixed;
        width: 100vw;
        height: 100vh;
        top: 0px;
        left: 0px;
        background-color: #00000090;
    }

    .card {
        color: white;
        width: 50%;
        max-width: 40rem;
        background-color: #161616;
        display: flex;
        flex-direction: column;
        padding: 2rem;
        z-index: 5;
    }

    .songInfo {
        color: white;
        background-color: #3f434d;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        z-index: 5;
        margin-top: 1rem;
        margin-bottom: 1rem;
    }

    .songInfo p {
        width: fit-content;
        max-width: 100%;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
        margin-top: 0rem;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }

    .songInfo .title {
        font-weight: bold;
        margin-bottom: 0.5rem;
    }

    .songInfo a {
        color: rgb(171, 169, 253);
        font-size: 0.8rem;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        display: block;
        width: min-content;
        max-width: 100%;
    }

    button {
        margin-top: 1rem;
        background-color: rgb(171, 169, 253);
        border: none;
        height: 2rem;
        transition: all cubic-bezier(0.55, 0.055, 0.675, 0.19) 0.2s;
    }
    button:hover {
        background-color: rgb(106, 104, 160);
        color: white;
    }
    button:focus {
        box-shadow: 0rem 0rem 1rem 0.5rem #00000030;
    }
</style>