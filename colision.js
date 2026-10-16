
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

let ancho = window.innerWidth;
let alto = window.innerHeight;

// Configuración del juego
const cantidadCristales = 25;
const cristales = [];

let objetosCapturados = 0;

// Parámetros de física
const gravedad = 0.28;
const restitucion = 0.68;
const velocidadMinimaRebote = 2.5;

// Velocidad según las capturas
function obtenerNivelVelocidad() {
    if (objetosCapturados > 20) return 2.0;
    if (objetosCapturados > 10) return 1.5;
    return 1.0;
}

// Crear contador en la parte superior derecha
const contadorUI = document.createElement("div");

contadorUI.id = "contador-cristales";

contadorUI.innerHTML = `
    <div style="
        font-size: 12px;
        letter-spacing: 2px;
        color: #B9DFFF;
        margin-bottom: 5px;
        text-transform: uppercase;
    ">Cristales capturados</div>

    <div style="
        display: flex;
        align-items: center;
        gap: 10px;
    ">
        <span style="font-size: 24px;">✦</span>
        <span id="contador-numero">0</span>
    </div>

    <div id="contador-velocidad" style="
        font-size: 11px;
        margin-top: 6px;
        color: #7DD3FC;
        letter-spacing: 1px;
    ">VELOCIDAD INICIAL</div>
`;

Object.assign(contadorUI.style, {
    position: "fixed",
    top: "24px",
    right: "24px",
    zIndex: "20",
    padding: "15px 20px",
    minWidth: "205px",
    color: "#FFFFFF",
    fontFamily: '"Segoe UI", Arial, sans-serif',
    fontSize: "22px",
    fontWeight: "600",
    background: "rgba(8, 18, 35, 0.78)",
    border: "1px solid rgba(125, 211, 252, 0.45)",
    borderRadius: "16px",
    backdropFilter: "blur(15px)",
    WebkitBackdropFilter: "blur(15px)",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
    pointerEvents: "none"
});

document.body.appendChild(contadorUI);

// Actualizar el contador y la velocidad
function actualizarContador() {
    document.getElementById("contador-numero").textContent =
        objetosCapturados;

    const nivel = obtenerNivelVelocidad();
    const textoVelocidad =
        document.getElementById("contador-velocidad");

    if (nivel === 2.0) {
        textoVelocidad.textContent = "VELOCIDAD ALTA";
        textoVelocidad.style.color = "#F87171";
    } else if (nivel === 1.5) {
        textoVelocidad.textContent = "VELOCIDAD MEDIA";
        textoVelocidad.style.color = "#FBBF24";
    } else {
        textoVelocidad.textContent = "VELOCIDAD INICIAL";
        textoVelocidad.style.color = "#7DD3FC";
    }
}

// Paleta de colores metálicos
const colores = [
    "#B9C6D8",
    "#64D8FF",
    "#8A7CFF",
    "#FFD166",
    "#73FBD3",
    "#F48FB1",
    "#D9E2F2",
    "#8CA9FF",
    "#E6B8FF",
    "#A7F3D0"
];

// Ajustar tamaño del canvas
function ajustarCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    ancho = window.innerWidth;
    alto = window.innerHeight;

    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);

    canvas.style.width = `${ancho}px`;
    canvas.style.height = `${alto}px`;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Mantener los cristales dentro de los nuevos límites
    for (const cristal of cristales) {
        cristal.x = Math.max(
            cristal.radio,
            Math.min(ancho - cristal.radio, cristal.x)
        );

        cristal.y = Math.min(
            alto - cristal.radio,
            cristal.y
        );
    }
}

window.addEventListener("resize", ajustarCanvas);

ajustarCanvas();

function aleatorio(min, max) {
    return Math.random() * (max - min) + min;
}

// Clase Crystal
class Crystal {
    constructor(x, y, radio, color) {
        this.x = x;
        this.y = y;
        this.radio = radio;
        this.colorOriginal = color;

        // Velocidad horizontal independiente
        this.vx = aleatorio(-1.8, 1.8);

        // Cada cristal comienza con una velocidad vertical diferente
        this.vy = aleatorio(0.5, 2.5);

        // Gravedad individual para variar la caída
        this.gravedadIndividual = aleatorio(0.22, 0.34);

        // Rotación
        this.angulo = aleatorio(0, Math.PI * 2);
        this.velocidadRotacion = aleatorio(-0.035, 0.035);

        // Efectos de colisión
        this.flashFrames = 0;
        this.flashDuration = 24;
    }

    checkCollision(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;

        return Math.hypot(dx, dy) <
            this.radio + other.radio;
    }

    flash() {
        this.flashFrames = this.flashDuration;
    }

    // Reiniciar desde arriba sin reducir la cantidad
    reiniciarCaida() {
        this.x = aleatorio(
            this.radio,
            Math.max(this.radio, ancho - this.radio)
        );

        this.y = -this.radio - aleatorio(0, 60);

        this.vx = aleatorio(-1.8, 1.8);
        this.vy = aleatorio(0.5, 2.5);

        this.gravedadIndividual = aleatorio(0.22, 0.34);

        this.angulo = aleatorio(0, Math.PI * 2);
        this.velocidadRotacion = aleatorio(-0.035, 0.035);

        this.flashFrames = 0;
    }

    checkBorders() {
        if (this.x - this.radio < 0) {
            this.x = this.radio;
            this.vx = Math.abs(this.vx);
        }

        if (this.x + this.radio > ancho) {
            this.x = ancho - this.radio;
            this.vx = -Math.abs(this.vx);
        }
    }

    update() {
        const nivel = obtenerNivelVelocidad();

        // Gravedad individual y aumento progresivo
        this.vy += this.gravedadIndividual * nivel;

        // Movimiento
        this.x += this.vx * nivel;
        this.y += this.vy * nivel;

        this.angulo += this.velocidadRotacion * nivel;

        this.checkBorders();

        // Rebote en el suelo
        const suelo = alto - this.radio;

        if (this.y >= suelo) {
            this.y = suelo;

            // Si el rebote pierde energía, comienza otra caída
            if (Math.abs(this.vy) < velocidadMinimaRebote) {
                this.reiniciarCaida();
                return;
            }

            this.vy = -Math.abs(this.vy) * restitucion;

            this.velocidadRotacion *= 0.92;
        }
    }

    draw() {
        const r = this.radio;
        const enColision = this.flashFrames > 0;

        context.save();

        context.translate(this.x, this.y);
        context.rotate(this.angulo);

        context.shadowColor = enColision
            ? "#168BFF"
            : this.colorOriginal;

        context.shadowBlur = enColision ? 32 : 16;

        const vertices = [
            [0, -r * 1.15],
            [r * 0.58, -r * 0.62],
            [r, -r * 0.12],
            [r * 0.76, r * 0.62],
            [0, r * 1.12],
            [-r * 0.76, r * 0.62],
            [-r, -r * 0.12],
            [-r * 0.58, -r * 0.62]
        ];

        const metal = context.createLinearGradient(
            -r, -r, r, r
        );

        if (enColision) {
            metal.addColorStop(0, "#FFFFFF");
            metal.addColorStop(0.35, "#47B8FF");
            metal.addColorStop(0.7, "#0758D8");
            metal.addColorStop(1, "#D8F5FF");
        } else {
            metal.addColorStop(0, "#FFFFFF");
            metal.addColorStop(0.18, this.colorOriginal);
            metal.addColorStop(0.42, "#F8FCFF");
            metal.addColorStop(0.62, "#536477");
            metal.addColorStop(0.82, this.colorOriginal);
            metal.addColorStop(1, "#182536");
        }

        // Silueta exterior
        context.beginPath();
        context.moveTo(vertices[0][0], vertices[0][1]);

        for (let i = 1; i < vertices.length; i++) {
            context.lineTo(vertices[i][0], vertices[i][1]);
        }

        context.closePath();
        context.fillStyle = metal;
        context.fill();

        context.shadowBlur = 0;

        // Facetas metálicas
        const centro = [0, 0];

        for (let i = 0; i < vertices.length; i++) {
            const siguiente = (i + 1) % vertices.length;

            context.beginPath();
            context.moveTo(centro[0], centro[1]);
            context.lineTo(vertices[i][0], vertices[i][1]);
            context.lineTo(
                vertices[siguiente][0],
                vertices[siguiente][1]
            );
            context.closePath();

            if (enColision) {
                const tonos = [
                    "#EAFBFF",
                    "#55C5FF",
                    "#187BFF",
                    "#A5E7FF"
                ];

                context.fillStyle = tonos[i % tonos.length];
            } else {
                const tonos = [
                    "#FFFFFF",
                    this.colorOriginal,
                    "#526174",
                    "#DDE8F5",
                    "#71869D",
                    "#26394D",
                    "#F7FBFF",
                    "#8DA1B8"
                ];

                context.fillStyle = tonos[i];
            }

            context.fill();

            context.strokeStyle = enColision
                ? "rgba(255,255,255,0.9)"
                : "rgba(255,255,255,0.55)";

            context.lineWidth = 0.8;
            context.stroke();
        }

        // Contorno exterior
        context.beginPath();
        context.moveTo(vertices[0][0], vertices[0][1]);

        for (let i = 1; i < vertices.length; i++) {
            context.lineTo(vertices[i][0], vertices[i][1]);
        }

        context.closePath();

        context.strokeStyle = enColision
            ? "#FFFFFF"
            : "#E9F5FF";

        context.lineWidth = enColision ? 2.8 : 1.4;
        context.stroke();

        // Reflejo de luz
        context.beginPath();
        context.moveTo(-r * 0.42, -r * 0.53);
        context.lineTo(-r * 0.08, -r * 0.92);
        context.lineTo(r * 0.04, -r * 0.12);
        context.closePath();

        const reflejo = context.createLinearGradient(
            -r * 0.4, -r, r * 0.2, 0
        );

        reflejo.addColorStop(0, "rgba(255,255,255,0.95)");
        reflejo.addColorStop(1, "rgba(255,255,255,0.02)");

        context.fillStyle = reflejo;
        context.fill();

        // Destello central durante una colisión
        if (enColision) {
            context.beginPath();
            context.arc(0, 0, r * 0.18, 0, Math.PI * 2);

            context.fillStyle = "#FFFFFF";
            context.shadowColor = "#72D7FF";
            context.shadowBlur = 22;
            context.fill();

            context.shadowBlur = 0;
        }

        context.restore();

        if (this.flashFrames > 0) {
            this.flashFrames--;
        }
    }
}

// Crear un cristal desde el margen superior
function crearCristal() {
    const radio = aleatorio(15, 25);

    const x = aleatorio(
        radio,
        Math.max(radio, ancho - radio)
    );

    const y = -radio - aleatorio(0, 60);

    const color = colores[
        Math.floor(Math.random() * colores.length)
    ];

    return new Crystal(x, y, radio, color);
}

// Crear exactamente 25 cristales
function crearCristales() {
    cristales.length = 0;

    for (let i = 0; i < cantidadCristales; i++) {
        cristales.push(crearCristal());
    }
}

// Registrar clic y capturar un cristal
canvas.addEventListener("pointerdown", function(evento) {
    if (evento.button !== 0) return;

    const rect = canvas.getBoundingClientRect();

    const mouseX = evento.clientX - rect.left;
    const mouseY = evento.clientY - rect.top;

    // Revisar primero los cristales que se dibujan al frente
    for (let i = cristales.length - 1; i >= 0; i--) {
        const cristal = cristales[i];

        // Considerar la forma y la rotación del cristal
        const dx = mouseX - cristal.x;
        const dy = mouseY - cristal.y;

        const cos = Math.cos(-cristal.angulo);
        const sin = Math.sin(-cristal.angulo);

        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        const r = cristal.radio;

        const vertices = [
            [0, -r * 1.15],
            [r * 0.58, -r * 0.62],
            [r, -r * 0.12],
            [r * 0.76, r * 0.62],
            [0, r * 1.12],
            [-r * 0.76, r * 0.62],
            [-r, -r * 0.12],
            [-r * 0.58, -r * 0.62]
        ];

        // Comprobar si el punto está dentro del polígono
        let dentro = false;

        for (
            let j = 0, k = vertices.length - 1;
            j < vertices.length;
            k = j++
        ) {
            const xi = vertices[j][0];
            const yi = vertices[j][1];
            const xk = vertices[k][0];
            const yk = vertices[k][1];

            const cruza =
                (yi > localY) !== (yk > localY) &&
                localX <
                    ((xk - xi) * (localY - yi)) /
                    ((yk - yi) || 0.000001) + xi;

            if (cruza) dentro = !dentro;
        }

        if (dentro) {
            // El cristal capturado desaparece y se reemplaza
            cristales.splice(i, 1);
            objetosCapturados++;

            actualizarContador();

            // Reponer inmediatamente para mantener siempre 25
            cristales.push(crearCristal());

            break;
        }
    }
});

// Resolver colisiones entre cristales
function resolverColisiones() {
    for (let i = 0; i < cristales.length; i++) {
        for (let j = i + 1; j < cristales.length; j++) {
            const a = cristales[i];
            const b = cristales[j];

            const dx = b.x - a.x;
            const dy = b.y - a.y;

            const distancia = Math.hypot(dx, dy);
            const distanciaMinima = a.radio + b.radio;

            if (distancia >= distanciaMinima) continue;

            const nx = distancia > 0 ? dx / distancia : 1;
            const ny = distancia > 0 ? dy / distancia : 0;

            // Separar los cristales
            const solapamiento = distanciaMinima - distancia;
            const separacion = solapamiento / 2;

            a.x -= nx * separacion;
            a.y -= ny * separacion;

            b.x += nx * separacion;
            b.y += ny * separacion;

            const velocidadRelativa =
                (b.vx - a.vx) * nx +
                (b.vy - a.vy) * ny;

            if (velocidadRelativa < 0) {
                a.vx += velocidadRelativa * nx;
                a.vy += velocidadRelativa * ny;

                b.vx -= velocidadRelativa * nx;
                b.vy -= velocidadRelativa * ny;

                a.flash();
                b.flash();
            }
        }
    }
}

// Seguridad adicional: mantener exactamente 25
function mantenerCantidadCristales() {
    while (cristales.length > cantidadCristales) {
        cristales.pop();
    }

    while (cristales.length < cantidadCristales) {
        cristales.push(crearCristal());
    }
}

// Animación principal
function animate() {
    context.clearRect(0, 0, ancho, alto);

    mantenerCantidadCristales();

    for (const cristal of cristales) {
        cristal.update();
    }

    resolverColisiones();

    for (const cristal of cristales) {
        cristal.draw();
    }

    requestAnimationFrame(animate);
}

// Iniciar juego
crearCristales();
actualizarContador();
animate();