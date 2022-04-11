<script lang="ts">
    import type { Song } from "$lib/songs";
    import type { Metadata } from '../routes/getMetadata';
    import { onMount } from 'svelte';
    import Progress from "$lib/Progress.svelte";
    import { getSuggestions } from '$lib/suggestions';
    import Guesses from "$lib/Guesses.svelte";
    import FinishedDialog from "$lib/FinishedDialog.svelte";
    import type { Attempt } from "./reportGenerator";

    export let song:Song
    export let metadata:Metadata
    export let index:number
    export let nextTime:number

    let media:HTMLAudioElement
    let buttons:Buttons = {
        skipButton:undefined,
        submitButton:undefined,
        playButton:undefined
    }
    let playIcon:SVGElement
    let pauseIcon:SVGElement
    let playing = false
    let currentTime:number = 0
    let maxTime:number = 16
    let attemptsTimestamp = [1, 2, 4, 7, 11, 16]
    let attempts:Attempt[] = []
    let attemptCount = 0
    export let finished = false
    export let displayEndScreen = false
    export let gameStarted = false
    let inputContent = ""
    let suggestions:string[] = []
    let inputContentSet = false
    let gameSuccess = false
    let diffMessage = ""

    interface Buttons {
        submitButton:HTMLButtonElement,
        skipButton:HTMLButtonElement,
        playButton:HTMLButtonElement
    }

    const addAttempt = () => {
        attempts = [...attempts, {text:"Skipped", success:false, skipped:true}]
        incrementAttempts()
    }

    const incrementAttempts = ()=> {
        if (attemptCount!=attemptsTimestamp.length-1){
            attemptCount++
        } else {
            finished=true
            disableButtons()
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
        let id = data[0]
        if (id==song.id){
            gameStarted = true
            attempts = JSON.parse(stringJson)
            if (attempts.at(-1).success){
                attemptCount = attempts.length
                finished = true
                gameSuccess = true
                disableButtons()
            } else {
                attemptCount = attempts.length
                if (attemptCount==attemptsTimestamp.length){
                    finished=true
                    disableButtons()
                }
            }
            
        }
        
    }

    const checkAttempt = () => {
        let success = inputContent == song.name
        attempts = [...attempts, {text:inputContent, success:success, skipped:false}]
        inputContent = ""
        if (success){
            gameSuccess = true
            finished=true
            disableButtons()
            saveProgress()
        } else {
            incrementAttempts()
        }
        
    }

    const disableButtons = ()=>{
        playIcon.style.stroke = "#FFFFFF"
        pauseIcon.style.stroke = "#FFFFFF"
        Object.keys(buttons).forEach((key)=>{
            buttons[key].disabled = true
        })
    }

    const updateProgress = ()=>{
        currentTime = media.currentTime
        if (playing&&currentTime<attemptsTimestamp[attemptCount]){
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
    }

    const setSubmitButtonState = (inputContent) => {
        if (typeof buttons.submitButton !== "undefined"){
            if (inputContent.trim() == ""){
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

    $: inputContent, getAnswerSuggestions(inputContent), setSubmitButtonState(inputContent)
    $:attemptCount, getTimeDiff()

    onMount(()=>{
        currentTime = media.currentTime
        importProgress()
    })

    $:finished, displayEndScreen=finished
</script>

<FinishedDialog bind:nextTime={nextTime} bind:index={index} bind:displayed={displayEndScreen} bind:song={song} bind:metadata={metadata} bind:attempts={attempts} bind:success={gameSuccess} bind:maxAttempts={attemptsTimestamp.length}></FinishedDialog>
<audio bind:this={media} src={metadata.mediaURL} preload="true"></audio>
<Guesses bind:maxAttempts={attemptsTimestamp.length} bind:attempts={attempts}></Guesses>
<div class="controls">
    {#if !inputContentSet}
        <div class="suggestions">
            {#each suggestions as suggestion}
                <button on:click={()=>{inputContent=suggestion;inputContentSet=true}}>{suggestion}</button>
            {/each}
        </div>    
    {/if}
    {#if !finished}
        <input bind:value={inputContent}>
    {/if}
    <Progress bind:max={maxTime} bind:value={currentTime} bind:separatorPositions={attemptsTimestamp} bind:revealed={attemptsTimestamp[attemptCount]}></Progress>
    <div class="buttons">
        <button bind:this={buttons.skipButton} on:click={addAttempt} class="controlButton">Skip{diffMessage}</button>
        <button bind:this={buttons.playButton} on:mouseenter={adjustPlayIconColor} on:mouseleave={adjustPlayIconColorMouseOut} on:click={playPause} class="play controlButton">
            {#if playing}
                <svg bind:this={pauseIcon} class="playIcon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            {:else}
                <svg bind:this={playIcon} class="playIcon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            {/if}
        </button>
        <button bind:this={buttons.submitButton} on:click={checkAttempt} class="controlButton" disabled>Submit</button>
    </div>
</div>

<style>

    .controls {
        position: absolute;
        bottom: 1rem;
        width: 60%;
        max-width: 40rem;
        display: flex;
        flex-direction: column;
        justify-items: flex-end;
    }

    .suggestions {
        margin: 1rem 0rem 0rem 0rem;
        display: flex;
        flex-direction: column;
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
    }

    .buttons {
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin: 1rem 0rem 1rem 0rem;
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
        border-radius: 10rem;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    .buttons .playIcon{
        position: relative;
        left: 2px;
    }
</style>