"use strict";
import "./style/main.scss";


class Bubble extends HTMLElement{
    x:number=0;
    y:number=0;
}

let bubbles:Bubble[]=[];

function init():void{
    console.log('hi');
    document.querySelectorAll('.bubble').forEach(b=>{
        bubbles.push(b as Bubble);
    });
    initListeners();
}init();


function initListeners(){
    window.addEventListener('pointerdown',pointerdown);
    window.addEventListener('pointermove',pointermove);
    window.addEventListener('pointerup',pointerup)

}

function pointerdown(ev:PointerEvent){
    console.log(ev.clientX);
    pos(bubbles[0],ev.clientX,ev.clientY);
}

function pointermove(ev:PointerEvent){

}
function pointerup(ev:PointerEvent){

}

function pos(element:Bubble,x:number,y:number):void{
    element.x=x;
    element.y=y;
    element.style.left=x+"px";
    element.style.top=y+"px";
}