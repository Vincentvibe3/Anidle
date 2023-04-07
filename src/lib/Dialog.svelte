<script>

    let container
    let opacity = 1

    const dismiss = () => {
        container.style.display = "none"
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
</script>
<div bind:this={container} class="container">
    <div on:click={animateFadeOut} class="bg"></div>
    <div class="card">
        <h2>How to Play</h2>
        <ul>
            <li><p class="Instructions">You have 6 tries to guess the opening or ending</p></li>
            <li><p class="Instructions">Press skip to reveal more of the song</p></li>
        </ul>
        <button on:click={animateFadeOut}>Start</button>
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

    ul {
        padding-left: 1rem;
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
        transition: all ease-in-out 0.2s;
    }
    button:hover {
        background-color: rgb(106, 104, 160);
        color: white;
    }
    button:focus {
        box-shadow: 0rem 0rem 1rem 0.5rem #00000030;
    }
</style>