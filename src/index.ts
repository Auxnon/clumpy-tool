"use strict";
import "./style/main.scss";
import * as MenuManager from "./menu-manager";
{
    import(
        /* webpackExports: ["default","say_hello_from_rust"]*/
        '../pkg/'
        ).then(r => {
    //if(typeof r.default.then === 'function') {
    //if(r.default instanceof Promise<any>){
          
    // @ts-ignore: wasm built methods not matching dynamic import methods containing default, a promise to the actual module  
        r.default.then(r2=>{
            
            r2.say_hello_from_rust();
        })
        //r.say_hello_from_rust();

       /* r.default.then((t:any)=>{

        })*

    }
    
    //let p:Promise<Module> = r.default;
    /*if(r.default.then)
        r.default.then(r2=>{

        })*/
});
}


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
    MenuManager.init();
    initListeners();
}init();


function initListeners(){
    window.addEventListener('pointerdown',pointerdown);
    window.addEventListener('pointermove',pointermove);
    window.addEventListener('pointerup',pointerup)
   
}

function pointerdown(ev:PointerEvent){
    //console.log(ev.clientX);
    //pos(bubbles[0],ev.clientX,ev.clientY);
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