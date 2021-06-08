let gl: WebGL2RenderingContext;
let program: WebGLProgram;
let time = 0;
let lastTime = Date.now();
let pos = [0, 1, 0];
let timeUniform: WebGLUniformLocation;
let resolutionUniform: WebGLUniformLocation;
let posUniform: WebGLUniformLocation;

let apos: WebGLUniformLocation;
let bpos: WebGLUniformLocation;
let cpos: WebGLUniformLocation;

export function setPos(id: number, x: number, y: number, z: number) {
    if (gl) {
        switch (id) {
            case 1:
                gl.uniform3f(bpos, x, y, z);break;
            case 2:
                gl.uniform3f(cpos, x, y, z);break;
            default:
                gl.uniform3f(apos, x, y, z);
        }
    }
}
export function init(): string {
    console.log('hi');

    let fs = getSource("./assets/fragment.frag"); //document.querySelector("#shader-vs");
    let vs = getSource("./assets/vertex.vert");


    let canvas: HTMLCanvasElement | null = document.querySelector("canvas");
    if (!canvas)
        return "Canvas missing";

    let out = canvas.getContext("webgl2");
    if (!out)
        return "Missing Context";
    gl = out;
    gl.viewport(0, 0, canvas.width = window.innerWidth, canvas.height = window.innerHeight);
    let vShader, fShader;
    if (fs && vs) {
        vShader = compileShader(gl, vs, gl.VERTEX_SHADER);
        fShader = compileShader(gl, fs, gl.FRAGMENT_SHADER);

    } else
        return "Cannot locate shaders";

    if (vShader && fShader) {
        let p = createProgram(gl, vShader, fShader);
        if (p)
            program = p;
        else
            return "Program could not be validated"
    }

    let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    // Create a buffer and put three 2d clip space points in it
    let positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    let positions = [
        -1, -1,
        -1, 1,
        1, 1,
        1, -1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.enableVertexAttribArray(positionAttributeLocation);

    let time = gl.getUniformLocation(program, "iTime");

    let res = gl.getUniformLocation(program, "resolution")
    //console.log(window.innerWidth,window.innerWidth)

    let pos = gl.getUniformLocation(program, "ipos");

    let a = gl.getUniformLocation(program, "apos");
    let b = gl.getUniformLocation(program, "bpos");
    let c = gl.getUniformLocation(program, "cpos");
    if (!(time && res && pos))
        return "Missing uniforms";

    gl.uniform1f(time, 1.);
    gl.uniform2f(res, window.innerWidth, window.innerHeight);
    gl.uniform3f(pos, 0, 1, 0);
    if (a && b && c) {
        apos = a;
        bpos = b;
        cpos = c;
        gl.uniform3f(apos, 0, 1, 0);
        gl.uniform3f(bpos, 0, 1, 0);
        gl.uniform3f(cpos, 0, 1, 0);
    }


    timeUniform = time;
    resolutionUniform = res;
    posUniform = pos;
    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    let size = 2; // 2 components per iteration
    let type = gl.FLOAT; // the data is 32bit floats
    let normalize = false; // don't normalize the data
    let stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    let offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    animate();
    window.addEventListener('mousemove', mousemove);
    //let program = gl.createProgramFromSources(gl, [vs, fs]);
    return "";
}



function animate() {
    let t = Date.now();
    let delta = t - lastTime;
    lastTime = t;
    time += delta / 1000.; //DEV add delta

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.uniform1f(timeUniform, Math.floor(time * 100) / 100.);
    gl.uniform3f(posUniform, pos[0], pos[1], pos[2]);
    requestAnimationFrame(animate);
}

function mousemove(ev: MouseEvent) {
    pos[0] = ((ev.clientX / window.innerWidth) - 0.5) * 3.;
    pos[1] = ((ev.clientY / window.innerHeight) - 0.5) * 3.;
}

function compileShader(gl: WebGL2RenderingContext, shaderSource: string, shaderType: number) {
    let shader = gl.createShader(shaderType);
    let success = false;
    if (shader) {
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    }

    if (!success) {
        throw "could not compile shader:" + (shader ? gl.getShaderInfoLog(shader) : "missing");
    }
    return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    let program = gl.createProgram();
    let success = false;
    if (program) {
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        success = gl.getProgramParameter(program, gl.LINK_STATUS);
    }
    if (!success) {
        throw ("program filed to link:" + (program ? gl.getProgramInfoLog(program) : "Missing"));
    }

    /* if(program)
     program.createUniform = function (type, name) {
         var location = gl.getUniformLocation(program, name);
         return function (v1, v2, v3, v4) {
             gl['uniform' + type](location, v1, v2, v3, v4);
         }
     };*/

    return program;
};

function getSource(url: string): string | undefined {
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    return (req.status == 200) ? req.responseText : undefined;
};