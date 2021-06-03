"use strict";
import "./style/main.scss";
function init():void{
    console.log('hi');
}init();


function initListens(){
    window.addEventListener('pointerdown',pointerdown);
    window.addEventListener('pointermove',pointermove);
    window.addEventListener('pointerup',pointerup)

}

function pointerdown(ev:PointerEvent){
    console.log(ev.clientX);
}

function pointermove(ev:PointerEvent){

}
function pointerup(ev:PointerEvent){

}