<script lang="ts">
    import type { Attempt } from "./reportGenerator";
    export let attempts:Attempt[]
    export let maxAttempts:number
</script>

<div class="container">
    {#each attempts as attempt}
        {#if attempt.success}
            <div class="indicator" style="background-color: #65b265;"></div>
        {:else if attempt.skipped}
            <div class="indicator" style="background-color: white;"></div>
        {:else}
            <div class="indicator" style="background-color: #b64646;"></div>
        {/if}
    {/each}
    {#each [...Array(maxAttempts-attempts.length).keys()] as _ }
        <div class="indicator" style="background-color: #3f4146;"></div>
    {/each}
</div>
<style>

    .container {
        display: flex;
        flex-direction: row;
        width: 100%;
        justify-content: space-between;
        padding: 1rem 0rem 1rem 0rem;
    }

    .indicator {
        height: 0.2rem;
        width: 10%;
        
    }
</style>