<script lang="ts">
    import type { get, Metadata } from "src/routes/getMetadata";
    import { onMount } from "svelte";
    import Report from "./Report.svelte";
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
    let opacity = 0
    let clipboardSnackbar:HTMLElement
    export let nextTime:number
    let timer:string =""

    const dismiss = () => {
        container.style.display = "none"
    }
    const show = () => {
        container.style.display = "flex"
        animateFadeIn()
    }

    const changeDisplay = (value) => {
        if (mounted){
            if (value){
                show()
            } else {
                animateFadeOut()
            }
        }
        
    }

    const animateFadeIn = ()=>{
        opacity+=0.1
        if (opacity<1){
            setTimeout(animateFadeIn, 10)
        } else {
            opacity = 1
        }
        container.style.opacity = `${opacity}`
    }

    const animateFadeOut = ()=>{
        opacity-=0.1
        if (opacity>0){
            setTimeout(animateFadeOut, 10)
        } else {
            opacity = 0
            dismiss()
        }
        container.style.opacity = `${opacity}`
    }

    const animateFadeInClipboard = ()=>{
        clipboardSnackbar.style.display= "flex"
        clipboardSnackbar.style.opacity = `${Number.parseFloat(clipboardSnackbar.style.opacity)+0.1}`
        if (Number.parseFloat(clipboardSnackbar.style.opacity)<1){
            setTimeout(animateFadeInClipboard, 20)
        } else {
            clipboardSnackbar.style.opacity = "1"
            setTimeout(animateFadeOutClipboard, 3000)
        }
    }

    const animateFadeOutClipboard = ()=>{
        clipboardSnackbar.style.opacity = `${Number.parseFloat(clipboardSnackbar.style.opacity)-0.1}`
        if (Number.parseFloat(clipboardSnackbar.style.opacity)>0){
            setTimeout(animateFadeOutClipboard, 20)
        } else {
            clipboardSnackbar.style.opacity = "0"
            clipboardSnackbar.style.display= "none"
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
        animateFadeInClipboard()
    }

    $: displayed, changeDisplay(displayed)
    $:attempts, updatePlural(attempts.length)

    const timeFormatter = (num:number):string => {
        if (num>9){
            return `${num}`
        } else {
            return `0${num}`
        }
    }

    const updateTimer = () => {
        let diff = nextTime-Date.now()
        let hours = Math.floor(diff/(60*60*1000))
        let minutes = Math.floor(diff/(60*1000))-hours*60
        let seconds = Math.floor(diff/1000)-minutes*60-hours*60*60
        // let seconds = Math.floor(diff%((hours*60*60*1000)+(minutes*60*1000))/1000)
        timer=`${timeFormatter(hours)}:${timeFormatter(minutes)}:${timeFormatter(seconds)}`
        setTimeout(updateTimer, 1000)
    }

    onMount(() => {
        mounted = true
        clipboardSnackbar.style.opacity = "0"
        updateTimer()
        if (displayed){
            show()
        } else {
            dismiss()
        }
    })
</script>
<div bind:this={clipboardSnackbar} on:click={animateFadeOutClipboard} class="copied">
    <p>Copied to Clipboard</p>
</div>
<div bind:this={container} class="container">
    <div on:click={flipDisplay} class="bg"></div>
    <div class="card">
        {#if success}
            <h2>You got the Anidle in {attempts.length} attempt{plural}</h2>
        {:else}
            <h2>You failed today's Anidle.</h2>
        {/if}
        <p>Next Anidle in {timer}</p>
        <Report bind:attempts={attempts} bind:maxAttempts={maxAttempts}></Report>
        <div class="songInfo">
            <img alt="Album art for {metadata.albumArt}" src={metadata.albumArt}>
            <div class="infoText">
                <p class="title">{song.guessString}</p>
                <p>by {metadata.artist}</p>
                {#if metadata.source == "spotify"}
                    <a href="{metadata.URL}">Listen on Spotify</a>
                {:else if metadata.source =="youtube"}
                    <a href="{metadata.URL}">Listen on Youtube</a>
                {/if}
            </div>
            
        </div>
        <p class="errorMessage">Not the right song or anime? <a href="https://github.com/Vincentvibe3/Anidle/issues">Report an error</a></p>
        <button on:click={copyToClipboard}>Share</button>
        <button on:click={flipDisplay}>Close</button>
    </div>
</div>


<style>

    .copied {
        position: fixed;
        top: 1rem;
        z-index: 5;
        background-color: #65b265;
        display: none;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        opacity: 0;
    }

    .copied p {
        margin: 0rem;
        padding: 0rem;
    }

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
        max-width: 40rem;
        width: 50%;
        background-color: #161616;
        display: flex;
        flex-direction: column;
        padding: 2rem;
        z-index: 5;
    }

    @media screen and (max-width: 800px) {
        .card {
            max-width: 70%;
            width: 70%;
        }
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

    .errorMessage {
        font-size: 0.8rem;
    }

    a {
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