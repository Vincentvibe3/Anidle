<script lang="ts">
    import { onMount } from "svelte";
    export let displayed:boolean
    let container:HTMLElement
    let mounted = false

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

    $: displayed, changeDisplay(displayed)

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
        <h2>About</h2>
        <p>An anime quiz inspired by <a href="https://www.heardle.app/">Heardle</a>/<a href="https://www.nytimes.com/games/wordle/index.html">Wordle</a></p>
        <p>Built with <a href="https://svelte.dev/">Svelte</a></p>
        <p>Hosted by <a href="https://vercel.com/">Vercel</a></p>
        <p>Audio by <a href="https://www.spotify.com/">Spotify</a></p>
        <p>Icons by <a href="https://iconsvg.xyz/">IconSvg</a></p>
        <p>Font used: <a href="https://fonts.google.com/specimen/Manrope">Manrope</a></p>
        <p>Find the code <a href="https://github.com/Vincentvibe3/Anidle/">here</a></p>
        <button on:click={flipDisplay}>Close</button>
    </div>
    
</div>


<style>

    p {
        margin-top: 0rem;
        margin-bottom: 1rem;
    }

    ul {
        padding-left: 1rem;
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