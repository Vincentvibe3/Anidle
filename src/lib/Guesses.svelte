<script lang="ts">

    import type { Attempt } from "./reportGenerator";
    export let maxAttempts
    export let attempts:Attempt[]
    let attemptBoxes:HTMLElement[] = []

    const setColor = () => {
        for (let attempt of attempts){
            if (attempt.success){
                attemptBoxes[attempts.indexOf(attempt)].style.backgroundColor = "#65b265"               
                attemptBoxes[attempts.indexOf(attempt)].style.border = "solid #65b265 0.15rem"        
            } else {
                if (!attempt.skipped){
                    attemptBoxes[attempts.indexOf(attempt)].style.backgroundColor = "#b64646"
                    attemptBoxes[attempts.indexOf(attempt)].style.border = "solid #b64646 0.15rem"      
                } else {
                    attemptBoxes[attempts.indexOf(attempt)].style.backgroundColor = "#3f434d"
                    attemptBoxes[attempts.indexOf(attempt)].style.border = "solid #3f434d 0.15rem"      
                }
            }
        }
    }

    $: attempts, setColor()
</script>
<div class="container">
    {#each [...Array(maxAttempts).keys()] as attempt}
        <div bind:this="{attemptBoxes[attempt]}" class="attempts">
            <p>{(typeof attempts[attempt] === 'undefined') ? "" : attempts[attempt].text}</p>
        </div>
    {/each}
</div>

<style>

    .container {
        width: 60%;
        max-width: 40rem;
        min-height: 18rem;
        height: 22rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
    }
    
    @media screen and (max-width: 800px) {
        .container {
            width: 80%;
        }
    }

    .attempts {
        width: calc(100% - 0.7rem);
        height: 2rem;
        border: solid #3f434d 0.15rem;
        background-color: #161616;
        margin: auto;
        padding: 0.2rem;
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    p {
        margin: 0rem;
        margin-left: 1rem;
        margin-right: 1rem;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }
</style>