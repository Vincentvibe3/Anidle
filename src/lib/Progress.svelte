<script lang="ts">
    export let value:number
    export let max:number
    export let revealed:number
    let progress:HTMLElement
    export let separatorPositions:Array<number>
</script>
<div class="progress-bar">
    <div class="revealed" style="width: {revealed/max*100}%;"></div>
    <div class="progress" style="width: {value/max*100}%;"></div>
    {#each separatorPositions.slice(0, -1) as pos}
        <div class="separator" style="width:{pos/max*100}%;"></div>
    {/each}
    
</div>

<style>

    .progress-bar {
        position: relative;
        width: calc(100% - 0.2rem);
        height: 1rem;
        display: flex;
        flex-direction: row;
        border: black solid 0.2rem;
        margin: 1rem 0rem 1rem 0rem;
    }

    .revealed {
        position: absolute;
        height: inherit;
        background-color: grey;
    }

    .progress {
        position: absolute;
        height: inherit;
        background-color: blue;
    }

    .separator {
        position: absolute;
        height: inherit;
        border-right: solid 0.2rem black;
    }

</style>