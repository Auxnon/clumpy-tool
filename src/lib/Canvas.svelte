<script lang="ts" context='module'>
    import { onMount } from "svelte";
    import * as gl from "./gl-manager";

    let ref: HTMLCanvasElement;
    onMount(() => {
        gl.init(ref);
    });
</script>

<canvas bind:this={ref}></canvas>
