import vec from "./vec";
import * as GLManager from "./gl-manager";

let elements: AnimatedElement[] = [];
let point: vec = new vec(0, 0);
let selected: AnimatedElement | undefined;
let capture: AnimatedElement | undefined;
let hiddenElement: AnimatedElement | undefined;

let gradients;
let gradientRef: HTMLElement | undefined;
let idCounter: number = 0;

function makeGrad(stops: {
    offset: string,
    color: string
} []): [string, HTMLElement] {
    let id = 'grad' + idCounter;
    let stamp = 'http://www.w3.org/2000/svg';
    let grad = document.createElementNS(stamp,'linearGradient') as HTMLElement;
    grad.id = id;
    //grad.setAttribute('gradientTransform', '90');
    stops.forEach((s: {
        offset: string,
        color: string
    }) => {
        let stop = document.createElementNS(stamp, 'stop');
        stop.setAttribute('offset', s.offset);
        stop.setAttribute('stop-color', s.color);
        grad.appendChild(stop);
    })
    if (gradientRef)
        gradientRef.appendChild(grad);
    idCounter++;
    return [id, grad];
}

function animate(): void {
    let once = false;
    if (selected) {
        selected.settle();
        let picked: AnimatedElement | undefined = undefined;
        elements.forEach((e: AnimatedElement) => {
            if (!once) {

                if (e != selected && selected !== undefined) //I would nest the loop  within the if statement but typescript hates it despite it being predetermiend as not undefined 🙄
                    if (selected.near(e)) {
                        picked = e;
                    }
            }
        });
        if (picked !== undefined) {
            picked = picked as AnimatedElement;
            selected.mix(picked);
            capture = picked;
            if (picked != hiddenElement && hiddenElement !== undefined)
                hiddenElement.hide(false);
            picked.hide(true);
            hiddenElement = picked;
        } else {
            if (hiddenElement) {
                hiddenElement.hide(false);
                hiddenElement = undefined;
            }
            if(selected.gradientValue)
                selected.removeGradient();

            capture = undefined;
        }


    }
    elements.forEach(e =>
        e.animate()
    )
    requestAnimationFrame(animate);
}

function v(x: number, y: number) {
    return new vec(x, y);
}

class AnimatedElement {
    nativeElement: SVGPathElement;
    pos: vec; //the intended position of the element with the intent of animating into and then stopping as close as possible
    center: vec; //the literal actual center of the element, unlike position this is accurate to it's current center
    centerElement: HTMLElement;
    points: vec[] = [v(10, 10), v(80, 10), v(80, 80), v(10, 80)];
    shadowPoints ? : vec[]; //only used for mixing elements
    shape: vec[] = [v(-40, -40), v(40, -40), v(40, 40), v(-40, 40)];
    radius: number = 50;
    velocity: vec[] = [];
    active: boolean = true;
    delay: number = 0;
    hidden: boolean = false;
    color:string="#aaa";
    gradient ? : HTMLElement;
    gradientValue ? : string;
    hook?:Function;
    constructor(element: SVGPathElement, position: vec,color?:string) {
        this.nativeElement = element;
        this.color=color?color:"#468";
        this.nativeElement.style.fill=this.color;
        this.pos = position;
        this.centerElement = document.createElement('div');
        this.centerElement.className = "icon";
        this.center = position.clone();
        this.centerElement.style.top = position.x + "px";
        this.centerElement.style.left = position.y + "px";
        this.nativeElement.appendChild(this.centerElement);
        this.shake();
    }
    get ishidden() {
        return this.hidden;
    }
    hide(bool: boolean) {
        if (bool != this.hidden) {
            if (bool)
                this.nativeElement.style.display = 'none'
            else
                this.nativeElement.style.display = 'initial'
        }
        this.hidden = bool;
    }
    shake(): void {
        this.delay = 0;
        this.active = true;
        this.velocity = [v(rnd(20), rnd(20)), v(rnd(20), rnd(20)), v(rnd(20), rnd(20)), v(rnd(20), rnd(20))];
    }
    settle(): void {
        if (this.shadowPoints)
            this.shadowPoints = undefined;
    }
    removeGradient():void{
        if(this.gradient){
            this.gradient.remove();
            this.gradientValue=undefined;
            this.gradient=undefined;
            this.nativeElement.style.fill=this.color;
        }

    }
    check(x: number, y: number): boolean {
        // ray-casting algorithm based on
        // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
        let inside = false;
        for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
            let xi = this.points[i].x,
                yi = this.points[i].y;
            let xj = this.points[j].x,
                yj = this.points[j].y;

            let intersect = ((yi > y) != (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;


        //return x > this.points[0].x && x < this.points[2].x && y < this.points[0].y && y > this.points[2].y;
    }
    near(target: AnimatedElement): boolean {

        return (this.radius + target.radius) > target.pos.distance(this.pos)
    }
    mix(target: AnimatedElement): void {
        let home = this.points.map(a => a);
        /*this.points.map(v => {
                    return v.distance(target.center)
                });*/
        let edge = target.points.map(a => a);
        home.sort((a, b) => {
            return a.distance(target.pos) - b.distance(target.pos);
        })
        edge.sort((a, b) => {
            return b.distance(this.pos) - a.distance(this.pos);
        })
        this.shadowPoints = [];
        for (let i = home.length / 2; i < home.length; i++) {
            this.shadowPoints.push(home[i]);
        }
        //for (let i = 0; i <(edge.length / 2) ; i++) {
        for (let i = (edge.length / 2) - 1; i >= 0; i--) {
            this.shadowPoints.push(edge[i]);
        }

        let value = "0% "+this.color+" 100% "+target.color;
        if (this.gradientValue != value) {
            this.gradientValue = value;
            let [id, ele] = makeGrad([{
                offset: "0%",
                color: this.color
            }, {
                offset: "100%",
                color: target.color
            }]);
            if(this.gradient)
                this.gradient.replaceWith(ele);
            this.gradient = ele;
            this.nativeElement.style.fill = "url('#" + id + "')"
        }

        

    }
    animate(): boolean {
        if (!this.active)
            return false;

        let avgx = 0,
            avgy = 0;
        for (let i = 0; i < this.points.length; i++) {

            let dx = this.points[i].x - this.pos.x + this.shape[i].x;
            let dy = this.points[i].y - this.pos.y + this.shape[i].y;
            let dr = Math.sqrt(dx * dx + dy * dy);
            this.points[i].x += this.velocity[i].x;
            this.points[i].y += this.velocity[i].y;
            let fric = .9
            if (dr < 40) {
                fric = .6
                this.velocity[i].x -= 2 * dx / dr;
                this.velocity[i].y -= 2 * dy / dr;
            } else {
                this.velocity[i].x -= 4 * dx / dr;
                this.velocity[i].y -= 4 * dy / dr;
            }

            this.velocity[i].x *= fric;
            this.velocity[i].y *= fric;
            if (selected != this && dr < 10) {
                this.delay++;
                if (this.delay > 20) {
                    this.active = false;
                    //this.shadowPoints=undefined
                }
            }

            avgx += this.points[i].x;
            avgy += this.points[i].y;
        }
        this.center.set(avgx / this.points.length, avgy / this.points.length);
        this.centerElement.style.left = this.center.x + 'px';
        this.centerElement.style.top = this.center.y + 'px';
        if (this.shadowPoints) {
            if (this.shadowPoints.length > 0) {
                let p = [];
                for (let i = 0; i < this.shadowPoints.length; i++) {
                    p.push(this.shadowPoints[i].x, this.shadowPoints[i].y)
                }
                this.nativeElement.setAttribute('d', square(p));
            } else
                this.nativeElement.setAttribute('d', '');
        } else {
            this.nativeElement.setAttribute('d', square([this.points[0].x, this.points[0].y, this.points[1].x, this.points[1].y, this.points[2].x, this.points[2].y, this.points[3].x, this.points[3].y]));
        }

        if(this.hook)
            this.hook(this.pos);
        return this.active;
    }
}

function cx(x:number){
    return ((x/window.innerWidth)-.5)*8.;
}
function cy(y:number){
    return ((y/window.innerHeight)-.5)*8.;
}

export function init(): void {
    let path = document.querySelectorAll('path');
    gradientRef = document.querySelector('#svg-gradients') as HTMLElement;
    if (path) {
        //test=new AnimatedElement(path, new vec(0, 0))
        elements.push(new AnimatedElement(path[0], new vec(0, 0)))
        elements.push(new AnimatedElement(path[1], new vec(60, 60),"#706"))
        elements.push(new AnimatedElement(path[2], new vec(250, 260),"#f45"))

        elements[0].hook=(p:vec)=>{GLManager.setPos(0,cx(p.x),-cy(p.y),4.)}
        elements[1].hook=(p:vec)=>{GLManager.setPos(1,cx(p.x),-cy(p.y),4.)}
        elements[2].hook=(p:vec)=>{GLManager.setPos(2,cx(p.x),-cy(p.y),4.)}
    }
    window.addEventListener('pointermove', ev => {
        if (selected) {
            selected.pos.x = ev.clientX;
            selected.pos.y = ev.clientY;
        }
    });
    window.addEventListener('pointerup', ev => {
        if (selected)
            selected.settle();
        selected = undefined;
        capture = undefined;
    })
    window.addEventListener('pointerdown', ev => {
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].check(ev.clientX, ev.clientY)) {
                selected = elements[i];
                selected.shake();
                selected.pos.x = ev.clientX;
                selected.pos.y = ev.clientY;
            }
        }

    });
    animate();
}

function createAnimatable(element: SVGPathElement) {
    let item = new AnimatedElement(element, new vec(0, 0));
    elements.push(item);
}

function rnd(v: number): number {
    return (Math.random() * 2 - 1) * (v ? v : 1);
}

function square(p: number[]) {
    let offset = 10;
    let slope = [(p[2] - p[0]), (p[3] - p[1]), (p[4] - p[2]), (p[5] - p[3]), (p[6] - p[4]), (p[7] - p[5]), (p[0] - p[6]), (p[1] - p[7])];

    for (let i = 0; i < 8; i += 2) {
        let r = Math.sqrt(slope[i] * slope[i] + slope[i + 1] * slope[i + 1]);
        slope[i] /= r;
        slope[i + 1] /= r;
    }
    //m <- (n*sum(xy)-sum(x)*sum(y)) / (n*sum(x^2)-sum(x)^2) 

    const f = Math.floor;

    let c1, c2; //round corners
    c2 = [f(p[0] + offset * slope[0]), f(p[1] + offset * slope[1])]; //

    let st = "M" + c2[0] + " " + c2[1];
    c1 = [f(p[2] - offset * slope[0]), f(p[3] - offset * slope[1])];
    c2 = [f(p[2] + offset * slope[2]), f(p[3] + offset * slope[3])];
    st += "L" + c1[0] + " " + c1[1];
    st += "Q " + f(p[2]) + " " + f(p[3]) + " " + c2[0] + " " + c2[1];

    c1 = [f(p[4] - offset * slope[2]), f(p[5] - offset * slope[3])];
    c2 = [f(p[4] + offset * slope[4]), f(p[5] + offset * slope[5])];
    st += "L" + c1[0] + " " + c1[1];
    st += "Q " + f(p[4]) + " " + f(p[5]) + " " + c2[0] + " " + c2[1];

    c1 = [f(p[6] - offset * slope[4]), f(p[7] - offset * slope[5])];
    c2 = [f(p[6] + offset * slope[6]), f(p[7] + offset * slope[7])];
    st += "L" + c1[0] + " " + c1[1];
    st += "Q " + f(p[6]) + " " + f(p[7]) + " " + c2[0] + " " + c2[1];

    c1 = [f(p[0] - offset * slope[6]), f(p[1] - offset * slope[7])];
    c2 = [f(p[0] + offset * slope[0]), f(p[1] + offset * slope[1])];
    st += "L" + c1[0] + " " + c1[1];
    st += "Q " + f(p[0]) + " " + f(p[1]) + " " + c2[0] + " " + c2[1];
    st += "Z";
    return st;

}
