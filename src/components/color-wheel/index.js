const template = document.createElement('template');
template.innerHTML = `<style>
:host{
	position: absolute;
}
.colorWheel{
    width: 200px;
    height: 200px;
    position: absolute;
    background: gray;
    border-radius: 100px;
    /*border: 4px solid black;
    box-sizing: border-box;*/
    /*display: none;*/
    animation: wheelPop 0.4s;
}
.colorWheel canvas{
    width: 200px;
    height: 200px;
    border-radius: 100px;
    overflow: hidden;
}
.subCircle{
    width: 180px;
    height: 180px;
    border-radius: 90px;
    position: absolute;
    left: 0;
    top: 200px;
    background: white;
}
.colorWheelPicker{
    position: absolute;
    width: 170px;
    height: 170px;
    border-radius: 90px;
    left: 15px;
    top: 15px;
    background: #0000;
    border: 4px solid black;
    box-sizing: border-box;
    transform: scale(1.01,1.01) /*a hack im not proud of to rid sharp pixelation in my canvas render*/
}
.darkWheelSelector,.colorWheelSelector{
    position: absolute;
    border: white 3px solid;
    width: 12px;
    height: 12px;
    border-radius: 12px;
    user-select: none;
    transform: translate(-50%,-50%);
    box-shadow: 0 0 0px 2px black inset;
}
.darkWheelSelector{
    height:8px;
    width:16px;
}
@keyframes wheelPop{
    0%{
        transform: scale(0.8)
    }
    30%{
        transform: scale(1.1)
    }
    60%{
        transform: scale(0.9)
    }
    100%{
        transform: scale(1)
    }
}</style>`;

window.customElements.define('ui-color-wheel', class extends HTMLElement {

	colorSelector;
	darkSelector;
	darkFactor=1;
	colorVal = [0, 0, 0, 0];
	colorWheelPicker;
	isPointerDown = false;
	pos = {
		x: 0,
		y: 0
	};
	eventRefs;

	constructor(x, y) {
		super();
		this.pos = {
			x,
			y
		};
	}
	connectedCallback() {
		let shadowRoot = this.attachShadow({
			mode: 'closed'
		});
		shadowRoot.appendChild(template.content.cloneNode(true));
		let ele = document.createElement('div');
		ele.className = 'colorWheel'
		ele.ondragstart = function () {
			return false;
		};

		//wheel.style.left='200px';
		//wheel.style.top='460px';

		let canvas = document.createElement('canvas');
		canvas.width = 200;
		canvas.height = 200;
		canvas.draggable = false;

		let ctx = canvas.getContext('2d');
		let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		let w = canvas.width;
		let h = canvas.height;

		for (let x = 0; x < w; x++) {
			for (let y = 0; y < h; y++) {
				let i = ((y * w) + x) * 4;
				let v = this.getValue(x, y, w, h, 85);
				if (v) {
					imgData.data[i] = v[0];
					imgData.data[i + 1] = v[1];
					imgData.data[i + 2] = v[2];
					imgData.data[i + 3] = v[3];
				}
			}
		}

		this.colorWheelPicker = document.createElement('div');
		this.colorWheelPicker.classList.add('colorWheelPicker');

		ctx.putImageData(imgData, 0, 0);
		ele.appendChild(canvas)
		ele.appendChild(this.colorWheelPicker)

		this.darkSelector = document.createElement('div');
		this.darkSelector.className = 'darkWheelSelector';
		this.darkSelector.style.opacity = 0;
		ele.appendChild(this.darkSelector);

		this.colorSelector = document.createElement('div');
		this.colorSelector.className = 'colorWheelSelector';
		this.colorSelector.style.opacity = 0;
		ele.appendChild(this.colorSelector);

		this.colorWheelPicker.addEventListener('mousedown', ev => {
			this.isPointerDown = 1;
			this.innerColorEvent(ev)
		})
		this.colorWheelPicker.addEventListener('touchstart', ev => {
			this.isPointerDown = 1;
			this.innerColorEvent(ev.touches[0])
		})

		window.addEventListener('mouseup', ev => {
			this.isPointerDown = false;
			this.lockDarkWheel = 0;
		})
		window.addEventListener('touchend', ev => {
			this.isPointerDown = false;
			this.lockDarkWheel = 0;
		})

		canvas.addEventListener('mousedown', ev => {
			this.isPointerDown = 2;
			this.outerColorEvent(ev);
		});
		canvas.addEventListener('touchstart', ev => {
			this.isPointerDown = 2;
			this.outerColorEvent(ev.touches[0]);
		});
		this.eventRefs = [this.mousemoveListener.bind(this), this.touchmoveListener.bind(this)]
		window.addEventListener('mousemove', this.eventRefs[0]);
		window.addEventListener('touchmove', this.eventRefs[1]);

		shadowRoot.appendChild(ele);

	}

	disconnectedCallback() {
		window.removeEventListener('mousemove', this.eventRefs[0]);
		window.removeEventListener('touchmove', this.eventRefs[1]);
		//don't need this since it's all inside shadowDom
		//this.removeEventListener("click", this.update);
	}
	mousemoveListener(ev) {
		if (this.isPointerDown == 2) {
			this.outerColorEvent(ev);
		} else if (this.isPointerDown == 1) {
			this.innerColorEvent(ev);
		}
	}
	touchmoveListener(ev) {
		if (this.isPointerDown == 2) {
			this.outerColorEvent(ev.touches[0]);
		} else if (this.isPointerDown == 1) {
			this.innerColorEvent(ev.touches[0]);
		}
	}

	update() {
		//this.textContent = Math.random();
	}


	innerColorEvent(ev) {
		let xx = ev.clientX - this.offsetLeft;
		let yy = ev.clientY - this.offsetTop;

		this.colorVal = this.getValue(xx - 15, yy - 15, 170, 170);

		let xn = xx - 100;
		let yn = yy - 100
		let r = Math.sqrt(xn * xn + yn * yn);
		if (r > 85) {
			yy = 100 + 85 * yn / r
			xx = 100 + 85 * xn / r
		}

		this.colorSelector.style.left = xx + 'px';
		this.colorSelector.style.top = yy + 'px';
		this.colorSelector.style.opacity = 1;
		this.applyColor();
	}

	outerColorEvent(ev) {
		let xx = -this.offsetLeft + ev.clientX - 100; //half canvas
		let yy = -this.offsetTop + ev.clientY - 100;
		if (xx < 0)
			if (this.lockDarkWheel == 0)
				this.lockDarkWheel = yy < 0 ? 1 : 2;
			else {
				if (this.lockDarkWheel == 2) {
					yy = Math.max(0, yy)
					console.log(yy)
				} else {
					yy = Math.min(-0.0001, yy)
				}
			}
		else
			this.lockDarkWheel = 0;

		let ar = Math.atan2(yy, xx);
		this.darkFactor = 0.5 + 0.5 * ar / Math.PI;
		let w2 = 100;
		let h2 = 100;
		this.darkSelector.style.opacity = 1;
		this.darkSelector.style.left = w2 + Math.cos(ar) * (w2 - 7) + 'px'
		this.darkSelector.style.top = h2 + Math.sin(ar) * (h2 - 7) + 'px'
		this.darkSelector.style.transform = 'translate(-50%,-50%) rotate(' + (180 * ar / Math.PI) + 'deg)'
		this.applyColor();

		this.colorWheelPicker.style.background = 'rgba(0,0,0,' + (1 - this.darkFactor) + ')';
	}

	applyColor() {
		let v = this.dividor(this.darkFactor, this.colorVal);
		let st = "rgb(" + v[0] + ',' + v[1] + ',' + v[2] + ')';
		//wheel.style.border="4px solid "+st
		this.colorWheelPicker.style.border = "4px solid " + st;

		/*if (domTarget)
			domTarget.style.background = st*/
		const event = new CustomEvent('colorpick', {
			detail: {rgb:st}
		});
		dispatchEvent(event)
	}

	getValue(x, y, w, h, bwRadius) {
		let w2 = w / 2;
		let h2 = h / 2;

		let xx = x - w2;
		let yy = y - h2;
		let ax = x / (w);
		let ay = y / (h);

		let r = Math.sqrt(xx * xx + yy * yy);


		//console.log(ar)
		//max=max<factor?factor:max;
		let aro = Math.atan2(yy / h2, xx / w2) / Math.PI;
		let ar = 180 + aro * 180;
		if (bwRadius && r > bwRadius) {
			let arg = 128 + aro * 128
			return [arg, arg, arg, 255];
		} else {


			let rfactor = (r / w2);
			let val;
			if (ar < 60) {
				let factor = 255 * ar / 60
				val = [255, (factor), 0, 255]
			} else if (ar < 120) {
				let factor = 255 * (ar - 60) / 60
				val = [(255 - factor), 255, 0, 255]
			} else if (ar < 180) {
				let factor = 255 * (ar - 120) / 60
				val = [0, 255, factor, 255]
			} else if (ar < 240) {
				let factor = 255 * (ar - 180) / 60
				val = [0, (255 - factor), 255, 255]
			} else if (ar < 300) {
				let factor = 255 * (ar - 240) / 60
				val = [factor, 0, 255, 255]
			} else if (ar <= 360) {
				let factor = 255 * (ar - 300) / 60
				val = [255, 0, (255 - factor), 255]
			} else {
				val = [0, 0, 0, 255]
			}
			val = this.blend(rfactor, val, [255, 255, 255, 255])

			return val;
		}

	}

	blend(f, ar1, ar2) {
		let f2 = 1 - f;
		return [ar1[0] * f + ar2[0] * f2, ar1[1] * f + ar2[1] * f2, ar1[2] * f + ar2[2] * f2, ar1[3] * f + ar2[3] * f2]
	}

	dividor(f, ar) {
		return [Math.floor(ar[0] * f), Math.floor(ar[1] * f), Math.floor(ar[2] * f), Math.floor(ar[3] * f)];
	}

});



/*

let domTarget;
let wheel;

function makeTargets() {
	for (let i = 0; i < 10; i++) {
		let dom = document.createElement('div');
		dom.className = "subCircle"
		dom.addEventListener('click', ev => {
			domTarget = dom;

			wheel.style.animationName = 'uh'
			void wheel.offsetWidth;
			wheel.style.animationName = ''

			wheel.style.display = 'block';

			let color = wheel.querySelector('.colorWheelSelector')
			let dark = wheel.querySelector('.darkWheelSelector')
			if (color)
				color.style.opacity = 0;
			if (dark)
				dark.style.opacity = 0;

			let picker = wheel.querySelector('.colorWheelPicker')
			if (picker)
				picker.style.border = "4px solid white";
			//picker.style.border=dom.style.background+" 4px solid;";


			wheel.style.top = ev.clientY - 200 + 'px';
			wheel.style.left = ev.clientX - 100 + 'px';
		})
		dom.style.left = Math.random() * 400 + "px"
		dom.style.top = Math.random() * 400 + "px"
		document.querySelector('#main').appendChild(dom);
	}
}

/*
function init() {
	makeTargets();

	wheel = document.querySelector('.colorWheel');
	wheel.ondragstart = function () {
		return false;
	};
	wheel.style.left = '200px';
	wheel.style.top = '460px';

	let canvas = document.createElement('canvas');
	canvas.width = 200;
	canvas.height = 200;
	canvas.draggable = false;

	let ctx = canvas.getContext('2d');
	let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	let w = canvas.width;
	let h = canvas.height;

	for (x = 0; x < w; x++) {
		for (y = 0; y < h; y++) {
			let i = ((y * w) + x) * 4;
			let v = getValue(x, y, w, h, 85);
			if (v) {
				imgData.data[i] = v[0];
				imgData.data[i + 1] = v[1];
				imgData.data[i + 2] = v[2];
				imgData.data[i + 3] = v[3];
			}
		}
	}

	let colorWheelPicker = document.createElement('div');
	colorWheelPicker.classList.add('colorWheelPicker');


	colorWheelPicker.addEventListener('mousedown', ev => {
		isMouseDown = 1;
		innerColorEvent(ev)
	})
	colorWheelPicker.addEventListener('touchstart', ev => {
		isMouseDown = 1;
		innerColorEvent(ev.touches[0])
	})

	window.addEventListener('mouseup', ev => {
		isMouseDown = false;
		lockDarkWheel = 0;
	})
	window.addEventListener('touchend', ev => {
		isMouseDown = false;
		lockDarkWheel = 0;
	})

	canvas.addEventListener('mousedown', ev => {
		isMouseDown = 2;
		outerColorEvent(ev);
	});
	canvas.addEventListener('touchstart', ev => {
		isMouseDown = 2;
		outerColorEvent(ev.touches[0]);
	});

	window.addEventListener('mousemove', ev => {
		if (isMouseDown == 2) {
			outerColorEvent(ev);
		} else if (isMouseDown == 1) {
			innerColorEvent(ev);
		}
	});
	window.addEventListener('touchmove', ev => {
		if (isMouseDown == 2) {
			outerColorEvent(ev.touches[0]);
		} else if (isMouseDown == 1) {
			innerColorEvent(ev.touches[0]);
		}
	});

	function innerColorEvent(ev) {
		let xx = ev.clientX - wheel.offsetLeft;
		let yy = ev.clientY - wheel.offsetTop;

		colorVal = getValue(xx - 15, yy - 15, 170, 170);

		let xn = xx - 100;
		let yn = yy - 100
		let r = Math.sqrt(xn * xn + yn * yn);
		if (r > 85) {
			yy = 100 + 85 * yn / r
			xx = 100 + 85 * xn / r
		}

		colorSelector.style.left = xx + 'px';
		colorSelector.style.top = yy + 'px';
		colorSelector.style.opacity = 1;
		applyColor();

	}

	function outerColorEvent(ev) {
		let xx = -wheel.offsetLeft + ev.clientX - canvas.width / 2;
		let yy = -wheel.offsetTop + ev.clientY - canvas.height / 2;
		if (xx < 0)
			if (lockDarkWheel == 0)
				lockDarkWheel = yy < 0 ? 1 : 2;
			else {
				if (lockDarkWheel == 2) {
					yy = Math.max(0, yy)
					console.log(yy)
				} else {
					yy = Math.min(-0.0001, yy)
				}
			}
		else
			lockDarkWheel = 0;

		let ar = Math.atan2(yy, xx);
		darkFactor = 0.5 + 0.5 * ar / Math.PI;
		let w2 = canvas.width / 2;
		let h2 = canvas.height / 2;
		darkSelector.style.opacity = 1;
		darkSelector.style.left = w2 + Math.cos(ar) * (w2 - 7) + 'px'
		darkSelector.style.top = h2 + Math.sin(ar) * (h2 - 7) + 'px'
		darkSelector.style.transform = 'translate(-50%,-50%) rotate(' + (180 * ar / Math.PI) + 'deg)'
		applyColor();

		colorWheelPicker.style.background = 'rgba(0,0,0,' + (1 - darkFactor) + ')';
	}

	function applyColor() {
		let v = dividor(darkFactor, colorVal);
		let st = "rgb(" + v[0] + ',' + v[1] + ',' + v[2] + ')';
		//wheel.style.border="4px solid "+st
		colorWheelPicker.style.border = "4px solid " + st

		if (domTarget)
			domTarget.style.background = st
	}

	ctx.putImageData(imgData, 0, 0);

	wheel.appendChild(canvas)
	wheel.appendChild(colorWheelPicker)


	let darkSelector = document.createElement('div');
	darkSelector.className = 'darkWheelSelector';
	darkSelector.style.opacity = 0;
	wheel.appendChild(darkSelector);


	let colorSelector = document.createElement('div');
	colorSelector.className = 'colorWheelSelector';
	colorSelector.style.opacity = 0;
	wheel.appendChild(colorSelector);

}
isMouseDown = false;
darkFactor = 1;
colorVal = [0, 0, 0, 0];
lockDarkWheel = 0;

function getValue(x, y, w, h, bwRadius) {
	let w2 = w / 2;
	let h2 = h / 2;

	let xx = x - w2;
	let yy = y - h2;
	let ax = x / (w);
	let ay = y / (h);

	let r = Math.sqrt(xx * xx + yy * yy);


	//console.log(ar)
	//max=max<factor?factor:max;
	let aro = Math.atan2(yy / h2, xx / w2) / Math.PI;
	let ar = 180 + aro * 180;
	if (bwRadius && r > bwRadius) {
		let arg = 128 + aro * 128
		return [arg, arg, arg, 255];
	} else {


		let rfactor = (r / w2);
		let val;
		if (ar < 60) {
			let factor = 255 * ar / 60
			val = [255, (factor), 0, 255]
		} else if (ar < 120) {
			let factor = 255 * (ar - 60) / 60
			val = [(255 - factor), 255, 0, 255]
		} else if (ar < 180) {
			let factor = 255 * (ar - 120) / 60
			val = [0, 255, factor, 255]
		} else if (ar < 240) {
			let factor = 255 * (ar - 180) / 60
			val = [0, (255 - factor), 255, 255]
		} else if (ar < 300) {
			let factor = 255 * (ar - 240) / 60
			val = [factor, 0, 255, 255]
		} else if (ar <= 360) {
			let factor = 255 * (ar - 300) / 60
			val = [255, 0, (255 - factor), 255]
		} else {
			val = [0, 0, 0, 255]
		}
		val = blend(rfactor, val, [255, 255, 255, 255])

		return val;
	}

}

function blend(f, ar1, ar2) {
	f2 = 1 - f;
	return [ar1[0] * f + ar2[0] * f2, ar1[1] * f + ar2[1] * f2, ar1[2] * f + ar2[2] * f2, ar1[3] * f + ar2[3] * f2]
}

function dividor(f, ar) {
	return [Math.floor(ar[0] * f), Math.floor(ar[1] * f), Math.floor(ar[2] * f), Math.floor(ar[3] * f)];
}

init();

*/