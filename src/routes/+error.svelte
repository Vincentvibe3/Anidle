<script context="module">
    /** @type {import('@sveltejs/kit').ErrorLoad} */  export function load({ error, status }) {
      return {
        props: {
          info: {
            status:status,
            message:error.message
            }
        }
      };
    }
</script>

<script>
export let info;
</script>
<div>
    <h1>{info.status}</h1>
    <p>{info.message}</p>
    <a href="/">Go to home</a>
</div>
<style>
    div {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>