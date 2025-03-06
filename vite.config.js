// import postcss from './postcss.config.mjs';
import { svelte } from '@sveltejs/vite-plugin-svelte'
// import tailwindcss from '@tailwindcss/vite'

/** @type {import('vite').UserConfig} */
export default {
    plugins: [svelte() ],
    // css: {
    //     postcss
    // },
    server: {
        allowedHosts: "beex.local",
    },
};
