<script lang="ts">
    import { onMount } from "svelte";
    export let displayed:boolean
    let container:HTMLElement
    let mounted = false
    let opacity = 0

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
        container.style.opacity = `${opacity}`
        if (opacity<1){
            setTimeout(animateFadeIn, 10)
        } else {
            opacity = 1
        }
    }

    const animateFadeOut = ()=>{
        opacity-=0.1
        container.style.opacity = `${opacity}`
        if (opacity>0){
            setTimeout(animateFadeOut, 10)
        } else {
            opacity = 0
            dismiss()
        }
        
    }

    const flipDisplay = ()=>{
        displayed= !displayed
    }

    $: displayed, changeDisplay(displayed)

    onMount(() => {
        mounted = true
        if (displayed){
            show()
        } else {
            animateFadeOut()
        }
    })

    
</script>
<div bind:this={container} class="container">
    <div on:click={flipDisplay} class="bg"></div>
    <div class="card">
        <h2>About</h2>
        <p>An anime quiz inspired by <a href="https://www.heardle.app/">Heardle</a>/<a href="https://www.nytimes.com/games/wordle/index.html">Wordle</a></p>
        <p>Built with <a href="https://svelte.dev/">Svelte</a></p>
        <p>Hosted by <a href="https://vercel.com/">Vercel</a></p>
        <p>Audio by <a href="https://www.spotify.com/">Spotify</a></p>
        <p>Icons by <a href="https://iconsvg.xyz/">IconSvg</a></p>
        <p>Font used: <a href="https://fonts.google.com/specimen/Manrope">Manrope</a></p>
        <p>Open Sourced <a href="https://github.com/Vincentvibe3/Anidle/">here</a></p>
        <div class="submissions">
            <p>Want to include a song?</p>
            <a href="https://github.com/Vincentvibe3/Anidle/issues">Submit a song request</a>
        </div>
        <button on:click={flipDisplay}>Close</button>
    </div>
    
</div>


<style>

    p {
        margin-top: 0rem;
        margin-bottom: 1rem;
    }

    .submissions {
        margin-top: 1rem;
        margin-bottom: 1rem;
    }

    .submissions p{
        font-size: 0.8rem;
        margin-bottom: 0.5rem;
    }

    .submissions p + a{
        font-size: 0.8rem;
        margin-top: 0.5rem;
    }

    .submissions a {
        font-size: 0.8rem;
    }

    a {
        color: rgb(171, 169, 253);
    }

    h2 {
        margin-top: 0rem;
    }

    .container {
        position: fixed;
        width: 100vw;
        height: 100vh;
        top: 0px;
        left: 0px;
        display: none;
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
        background-color: #161616;
        display: flex;
        flex-direction: column;
        padding: 2rem;
        z-index: 5;
    }

    @media screen and (max-width: 800px) {
        .card {
            max-width: 70%;
        }
    }

    button {
        margin-top: 1rem;
        background-color: rgb(171, 169, 253);
        border: none;
        height: 2rem;
        transition: all cubic-bezier(0.55, 0.055, 0.675, 0.19) 0.2s;
        box-shadow: 0.5rem 0.5rem 1rem 0.5rem #00000030;
    }
    button:hover {
        background-color: rgb(106, 104, 160);
        color: white;
    }
    button:focus {
        box-shadow: 0rem 0rem 1rem 0.5rem #00000030;
    }
</style>