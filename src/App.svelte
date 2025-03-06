<script lang="ts">
    import type { Point } from "./lib/util";

    console.log("init");
    let points: Point[] = $state([]);
    function addPoint(id: number, x: number, y: number) {
        points.push({ id, x, y });
        // points=points;
    }
    function removePoint(id: number) {
        // technically faster then a hash?
        const i = points.findIndex((o) => o.id == id);
        if (i > -1) points.splice(i, 1);
        console.log("remove", id);
    }

    function updatePoint(id: number, x: number, y: number) {
        // console.log(id,points)
        const i = points.findIndex((o) => o.id == id);
        if (i > -1) {
            const p = points[i];
            p.x = x;
            p.y = y;
        }
    }

    let message = $state("H");
    window.addEventListener("pointerdown", (ev: PointerEvent) => {
        addPoint(ev.pointerId, ev.clientX, ev.clientY);
    });
    window.addEventListener("pointermove", (ev: PointerEvent) => {
        updatePoint(ev.pointerId, ev.clientX, ev.clientY);
        message=`${ev.clientX}, ${ev.clientY}`
    });

    window.addEventListener("pointerup", (ev: PointerEvent) => {
        removePoint(ev.pointerId);
    });

    window.addEventListener("contextmenu",(ev: MouseEvent) => {
        ev.preventDefault();
        return false;
    },false);
    document.addEventListener("gesturestart", function (e) {
        e.preventDefault();
        // special hack to prevent zoom-to-tabs gesture in safari
        document.body.style.zoom = "0.99;"
    });

    document.addEventListener("gesturechange", function (e) {
        e.preventDefault();
        // special hack to prevent zoom-to-tabs gesture in safari
        document.body.style.zoom = "0.99;"
    });

    document.addEventListener("gestureend", function (e) {
        e.preventDefault();
        // special hack to prevent zoom-to-tabs gesture in safari
        document.body.style.zoom = "0.99;"
    });
</script>

<main class="w-screen h-screen">
    <h1 class="bg-red-500">{message}</h1>
    {#each points as p}
        <div
            class="border-purple-500 border-3 rounded-full pointer-events-none select-none absolute w-16 h-16"
            style:left="{p.x-32}px"
            style:top="{p.y-32}px"
        >
        </div>
    {/each}
    <Canvas></Canvas>
</main>

<style lang="scss">
</style>
