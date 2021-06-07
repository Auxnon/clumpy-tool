export default class vec{
    x:number;
    y:number;
    constructor(x:number,y:number){
        this.x=x;
        this.y=y;
    }
    //length(v2:number):number;
    //length(x:number,y:number):number;

    distance(v2:vec):number{
        let x=this.x-v2.x;
        let y=this.y-v2.y;
        return Math.sqrt(x*x+y*y);
    }
    set(x:number,y:number){
        this.x=x;
        this.y=y;
    }
    get length():number{
        return Math.sqrt(this.x*this.x+this.y*this.y);
    }
    clone():vec{
        return new vec(this.x,this.y);
    }
}