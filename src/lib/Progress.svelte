<script lang="ts">
    export let value:number
    export let max:number
    export let revealed:number
    export let separatorPositions:Array<number>
    let formattedTime:string

    const formatTime = (time:number)=>{
        let out = ""
        if (time<10){
            out+="0"
        }
        formattedTime = `${out}${Math.floor(time)}`
    }
    $: value, formatTime(value)
</script>
<div class="progress-bar">
    <div class="revealed" style="width: {revealed/max*100}%;"></div>
    <div class="progress" style="width: {value/max*100}%;"></div>
    {#each separatorPositions.slice(0, -1) as pos}
        <div class="separator" style="width:{pos/max*100}%;"></div>
    {/each}
</div>
<div class="progress-time">
    <p>0:{formattedTime}</p>
    <p>0:{max}</p>
</div>

<style>

    .progress-time {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        font-size: 0.9rem;
    }

    .progress-bar {
        position: relative;
        width: calc(100% - 0.2rem);
        height: 1rem;
        display: flex;
        flex-direction: row;
        border: #3f434d solid 0.2rem;
        margin-top: 1rem;
        background-color: #161616;
    }

    .revealed {
        position: absolute;
        height: inherit;
        background-color: #818181;
    }

    .progress {
        position: absolute;
        height: inherit;
        background-color: rgb(171, 169, 253);
    }

    .separator {
        position: absolute;
        height: inherit;
        border-right: solid #3f434d 0.15rem;
    }

</style>