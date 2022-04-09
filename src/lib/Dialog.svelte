<script>
    let bg
    const dismiss = ()=>{
        bg.style.display = "none"
    }
</script>
<div bind:this={bg} class="bg">
    <div class="card">
        <ul>
            <li><p class="Instructions">You have 6 tries to guess the opening</p></li>
            <li><p class="Instructions">Press skip to reveal more of the song</p></li>
            <li><p class="Instructions">Press play to start</p></li>
        </ul>
        <button on:click={dismiss}>Play</button>
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

    .bg {
        position: fixed;
        width: 100vw;
        height: 100vh;
        top: 0px;
        left: 0px;
        background-color: #00000090;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 4;
    }

    .card {
        color: #161616;
        background-color: #ffffff;
        display: flex;
        flex-direction: column;
        padding: 2rem;
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
        background-color: rgb(147, 145, 216);
    }
    button:focus {
        box-shadow: 0rem 0rem 1rem 0.5rem #00000030;
    }
</style>