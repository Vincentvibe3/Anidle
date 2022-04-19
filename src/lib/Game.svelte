<script lang="ts">
    import type { Song } from "$lib/songs";
    import type { Metadata } from '../routes/getMetadata';
    import { onMount } from 'svelte';
    import Progress from "$lib/Progress.svelte";
    import { getSuggestions } from '$lib/suggestions';
    import Guesses from "$lib/Guesses.svelte";
    import FinishedDialog from "$lib/FinishedDialog.svelte";
    import type { Attempt } from "./reportGenerator";
    import videojs from 'video.js';

    export let song:Song
    export let metadata:Metadata
    export let index:number
    export let nextTime:number
    export let link:string

    let media:HTMLElement
    let overlay:HTMLElement
    let buttons:Buttons = {
        skipButton:undefined,
        submitButton:undefined,
        playButton:undefined
    }
    var player
    let inputField:HTMLElement
    let playIcon:SVGElement
    let pauseIcon:SVGElement
    let playing = false
    let currentTime:number = 0
    let maxTime:number = 16
    let attemptsTimestamp = [1, 2, 4, 7, 11, 16]
    let separators = attemptsTimestamp
    let revealed = 1
    let attempts:Attempt[] = []
    let attemptCount = 0
    export let finished = false
    export let displayEndScreen = false
    export let gameStarted = false
    let inputContent:string = ""
    let suggestions:string[] = []
    let inputContentSet = false
    let hintText = true
    let gameSuccess = false
    let diffMessage = ""
    let mounted= false
    let vidDuration = 0
    let playerReady = false

    interface Buttons {
        submitButton:HTMLButtonElement,
        skipButton:HTMLButtonElement,
        playButton:HTMLButtonElement
    }

    const setFinished = () => {
        finished = true
        disableButtons()
        if (vidDuration==0){
            maxTime = 90
        } else {
            maxTime = vidDuration
        }
        separators = []
        revealed = maxTime
        media.style.filter = "None"
        overlay.style.opacity = "0.6"
    }

    const addAttempt = () => {
        attempts = [...attempts, {text:"Skipped", success:false, skipped:true}]
        incrementAttempts()
    }

    const incrementAttempts = ()=> {
        if (attemptCount!=attemptsTimestamp.length-1){
            attemptCount++
            revealed = attemptsTimestamp[attemptCount]
        } else {
            setFinished()
        }
        saveProgress()
    }

    const saveProgress = ()=>{
        gameStarted = true
        let stringAttempts = JSON.stringify(attempts)
        localStorage.setItem("progress", `${song.id}+${stringAttempts}`)
    }

    const importProgress = () => {
        if (localStorage.getItem("progress") == null){
            return
        }
        let data = localStorage.getItem("progress").split("+")
        let stringJson = data[1]
        let id = parseInt(data[0])
        if (id==song.id){
            gameStarted = true
            attempts = JSON.parse(stringJson)
            if (attempts.at(-1).success){
                attemptCount = attempts.length
                gameSuccess = true
                setFinished()
            } else {
                attemptCount = attempts.length
                revealed = attemptsTimestamp[attemptCount]
                if (attemptCount==attemptsTimestamp.length){
                    setFinished()
                }
            }
            
        }
        
    }

    const checkAttempt = () => {
        let success = inputContent == song.guessString
        attempts = [...attempts, {text:inputContent, success:success, skipped:false}]
        inputContent = ""
        unfocusInput()
        if (success){
            gameSuccess = true
            setFinished()
            saveProgress()
        } else {
            incrementAttempts()
        }
        
    }

    const disableButtons = ()=>{
        Object.keys(buttons).forEach((key)=>{
            if (key!="playButton"){
                buttons[key].disabled = true
            }
        })
    }

    const updateProgress = ()=>{
        currentTime = player.currentTime()
        if (finished){
            maxTime = player.duration()
            revealed = maxTime
            setTimeout(updateProgress, 10)
            return
        }
        if (playing&&currentTime<attemptsTimestamp[attemptCount]){
            setTimeout(updateProgress, 10)
        } else {
            playing=false
            player.pause()
            player.currentTime(0)
            currentTime = 0
        }
    }

    const playPause = ()=>{
        if (playing){
            player.pause()
            if (!finished){
                player.currentTime(0)
                currentTime = 0
            }
        } else {
            player.play()
            setTimeout(updateProgress, 10)
        }
        playing=!playing
    }

    const getAnswerSuggestions = (query)=>{
        if(hintText){
            return
        }
        let tempSuggestions = getSuggestions(query, 5)
        if (tempSuggestions[0]==query){
            suggestions = [tempSuggestions[0]]
        } else {
            suggestions = tempSuggestions
        }
        if (query != suggestions[0]&&inputContentSet==true){
            inputContentSet = false
        }
    }

    const setSubmitButtonState = (inputContent) => {
        if (typeof buttons.submitButton !== "undefined"){
            if (inputContent.trim() == "" || hintText){
                buttons.submitButton.disabled=true
            } else {
                if (!finished){
                    buttons.submitButton.disabled=false
                }
            }
        }
    }

    const getTimeDiff = ()=>{
        let next = attemptCount+1
        if (next<attemptsTimestamp.length){
            diffMessage = ` + ${attemptsTimestamp[next]-attemptsTimestamp[attemptCount]}s`
        } else {
            diffMessage = ""
        }
    }

    const adjustPlayIconColor = () => {
        if (!buttons.playButton.disabled){
            pauseIcon.style.stroke = "#FFFFFF"
            playIcon.style.stroke = "#FFFFFF"
        }
        
    }

    const adjustPlayIconColorMouseOut = () => {
        if (!buttons.playButton.disabled){
            pauseIcon.style.stroke = "#000000"
            playIcon.style.stroke = "#000000"
        }
    }

    const adjustIconVisibility = (playback:boolean)=>{
        if (mounted){
            if (playback){
                playIcon.style.display = "none"
                pauseIcon.style.display = "block"
            } else {
                pauseIcon.style.display = "none"
                playIcon.style.display = "block"
            }
        }
        
    }

    const clearHintText = () => {
        if (hintText){
            inputField.style.color = "inherit"
            hintText = false
            inputContent= ""
        }
    }

    const unfocusInput = () => {
        if (inputContent==""){
            inputField.style.color = "#818181"
            hintText = true
            inputContent= "Search for a op/ed"
        }
    }

    $: inputContent, getAnswerSuggestions(inputContent), setSubmitButtonState(inputContent)
    $:attemptCount, getTimeDiff()
    $:playing, adjustIconVisibility(playing)

    const onEnd = () => {
        vidDuration = currentTime
        player.currentTime(0)
        playing = false
    }

    const onPlayerReady = ()=>{
        console.log("player ready")
        media.style.display = "block"
        playerReady = true
        Object.keys(buttons).forEach((key)=>{
            if (key!="playButton"&&!finished){
                buttons[key].disabled = false
            }
        })
    }

    onMount(()=>{
        mounted = true
        disableButtons()
        importProgress()
        adjustIconVisibility(playing)
        unfocusInput()
        player = videojs('player', {
            controls:false
        });
        player.on("ended", onEnd)
        player.on("canplay", onPlayerReady)
        currentTime = player.currentTime()
    })

    $:finished, displayEndScreen=finished

</script>
<svelte:head>
    <script src="https://vjs.zencdn.net/7.18.1/video.min.js"></script>
    <link href="https://vjs.zencdn.net/7.18.1/video-js.css" rel="stylesheet" />
</svelte:head>
<FinishedDialog bind:nextTime={nextTime} bind:index={index} bind:displayed={displayEndScreen} bind:song={song} bind:metadata={metadata} bind:attempts={attempts} bind:success={gameSuccess} bind:maxAttempts={attemptsTimestamp.length}></FinishedDialog>
<div bind:this={media} class="vidContainer">
    <video id="player" class="video-js" preload="auto">
        <track kind="captions"/>
        <source src={link}/>
    </video>
    <div bind:this={overlay} class="videoOverlay"></div>
</div>

<Guesses bind:maxAttempts={attemptsTimestamp.length} bind:attempts={attempts}></Guesses>
<div class="controls">
    {#if !finished}
        {#if !inputContentSet}
            <div class="suggestions">
                {#each suggestions as suggestion}
                    <button on:click={()=>{inputContent=suggestion;inputContentSet=true}}>{suggestion}</button>
                {/each}
            </div>    
        {/if}
        <input on:blur={unfocusInput} on:click={clearHintText} bind:value={inputContent} bind:this={inputField}>
    {/if}
    <Progress bind:max={maxTime} bind:value={currentTime} bind:separatorPositions={separators} bind:revealed={revealed}></Progress>
    <div class="buttons">
        <button bind:this={buttons.skipButton} on:click={addAttempt} class="controlButton">Skip{diffMessage}</button>
        {#if !playerReady}
            <button bind:this={buttons.playButton} on:mouseenter={adjustPlayIconColor} on:mouseleave={adjustPlayIconColorMouseOut} on:click={playPause} class="play controlButton">
                <svg bind:this={pauseIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                <svg bind:this={playIcon} class="playIcon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </button>
        {:else}
             <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
        {/if}
        <button bind:this={buttons.submitButton} on:click={checkAttempt} class="controlButton" disabled>Submit</button>
    </div>
</div>

<style>

    @keyframes rotate {
        0% {transform: rotate(0);}
        50% {transform: rotate(180);}
        100% {transform: rotate(360);}
    }

    .spinner {
        animation-name: rotate;
    }

    .vidContainer {
        position: fixed;
        width: 100vw;
        height: 100vh;
        top:0rem;
        left:0rem;
        object-fit: cover;
        z-index: -1;
        background-color: #161616;
        filter: blur(300px);
        pointer-events: none;
        display: none;
    }

    .videoOverlay {
        position: fixed;
        width: 100vw;
        height: 100vh;
        top:0rem;
        left:0rem;
        background-color: #161616;
        display: block;
        opacity: 0.7;
    }

    .controls {
        width: 60%;
        max-width: 40rem;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        margin-top: 0.5rem;
    }

    .suggestions {
        width: inherit;
        max-width: inherit;
        position: absolute;
        margin: 1rem 0rem 0rem 0rem;
        display: flex;
        flex-direction: column;
        z-index: 2;
        transform: translateY(-109%);
    }

    .suggestions button {
        margin-top: 0rem;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        padding: 0.5rem;
        background-color: inherit;
        color: inherit;
        text-align: left;
        text-indent: 1rem;
        background-color: #161616;
    }

    .suggestions button {
        border: #3f434d solid 0.15rem;
        border-bottom: none;
    }

    .suggestions button + button{
        border: #3f434d solid 0.15rem;
        border-bottom: none;
    }


    input {
        margin: 0rem 0rem 1rem 0rem;
        background-color: #161616;
        border: solid #3f434d 0.15rem;
        height: 2.5rem;
        color: inherit;
        padding-left: 1rem;
        padding-right: 1rem;
        font-family: inherit;
        font-size: 1rem;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        transition: all cubic-bezier(0.075, 0.82, 0.165, 1) 0.5s;
        outline: 0.1rem solid #00000000;
    }

    input:hover {
        border-color: rgb(106, 104, 160);
        outline: 0.1rem solid rgb(106, 104, 160);
    }

    input:focus {
        border-color: rgb(106, 104, 160);
        outline: 0.1rem solid rgb(106, 104, 160);
    }

    .buttons {
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin: 0rem 0rem 1rem 0rem;
    }

    .buttons button {
        background-color: rgb(171, 169, 253);
        transition: all cubic-bezier(0.55, 0.055, 0.675, 0.19) 0.2s;
        color: black;
        border: none;
        padding: 0.8rem 1rem 0.8rem 1rem;
    }

    .buttons button:disabled{
        color: white;
        background-color: #3f434d;
    }

    .buttons button:disabled:hover{
        color: white;
        cursor: default;
        background-color: #3f434d;
    }

    .buttons button:hover{
        background-color: rgb(106, 104, 160);
        color: white;
    }

    .buttons .play{
        border-radius: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        margin-left: 1rem;
        margin-right: 1rem;
    }

    .buttons .playIcon{
        position: relative;
        left: 2px;
    }

    @media screen and (max-width: 800px) {
        .controls {
            width: 80%;
        }
    }
</style>