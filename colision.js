
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

let ancho = window.innerWidth;
let alto = window.innerHeight;

const cantidadCirculos = 20;
const circulos = [];

// Colores originales de los círculos
const colores = [
    "#FF4D6D", "#FF9F1C", "#FFD60A", "#70E000",
    "#38B000", "#06D6A0", "#00B4D8", "#4CC9F0",
    "#4895EF", "#4361EE", "#3A0CA3", "#7209B7",
    "#B5179E", "#F72585", "#FF6B35", "#9EF01A",
    "#2EC4B6", "#E76F51", "#C77DFF", "#F4A261"
];

// Ajustar el canvas al tamaño de la ventana
function ajustarCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    ancho = window.innerWidth;
    alto = window.innerHeight;

    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);

    canvas.style.width = `${ancho}px`;
    canvas.style.height = `${alto}px`;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", ajustarCanvas);
ajustarCanvas();

// Número aleatorio entre un mínimo y un máximo
function aleatorio(min, max) {
    return Math.random() * (max - min) + min;
}

// Clase que representa cada círculo
class Circle {
    constructor(x, y, radio, color) {
        this.x = x;
        this.y = y;
        this.radio = radio;
        this.colorOriginal = color;
        this.color = color;

        this.vx = aleatorio(-2.5, 2.5);
        this.vy = aleatorio(-2.5, 2.5);

        // Evitar círculos prácticamente inmóviles
        if (Math.abs(this.vx) < 0.7) this.vx = 1.2;
        if (Math.abs(this.vy) < 0.7) this.vy = -1.2;

        this.flashFrames = 0;
        this.flashDuration = 28;
    }

    // Detectar colisión con otro círculo
    checkCollision(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const distancia = Math.hypot(dx, dy);

        return distancia < this.radio + other.radio;
    }

    // Activar destello azul
    flash() {
        this.flashFrames = this.flashDuration;
    }

    // Dibujar el círculo
    draw() {
        const enColision = this.flashFrames > 0;

        if (enColision) {
            const progreso =
                this.flashFrames / this.flashDuration;

            context.shadowColor = "#008CFF";
            context.shadowBlur = 18 + progreso * 28;
            context.strokeStyle = "#48BFFF";
            context.lineWidth = 3 + progreso * 2;
            context.fillStyle = "#0000FF";
        } else {
            context.shadowBlur = 0;
            context.strokeStyle = this.colorOriginal;
            context.lineWidth = 2;
            context.fillStyle = this.colorOriginal;
        }

        context.beginPath();
        context.arc(
            this.x,
            this.y,
            this.radio,
            0,
            Math.PI * 2
        );

        context.fill();
        context.stroke();

        // Restaurar los efectos del contexto
        context.shadowBlur = 0;

        if (this.flashFrames > 0) {
            this.flashFrames--;
        }
    }

    // Rebote contra los límites de la ventana
    checkBorders() {
        if (this.x - this.radio < 0) {
            this.x = this.radio;
            this.vx = Math.abs(this.vx);
        }

        if (this.x + this.radio > ancho) {
            this.x = ancho - this.radio;
            this.vx = -Math.abs(this.vx);
        }

        if (this.y - this.radio < 0) {
            this.y = this.radio;
            this.vy = Math.abs(this.vy);
        }

        if (this.y + this.radio > alto) {
            this.y = alto - this.radio;
            this.vy = -Math.abs(this.vy);
        }
    }

    // Actualizar la posición
    update() {
        this.x += this.vx;
        this.y += this.vy;

        this.checkBorders();
    }
}

// Crear círculos evitando que nazcan superpuestos
function crearCirculos() {
    circulos.length = 0;

    for (let i = 0; i < cantidadCirculos; i++) {
        const radio = aleatorio(15, 27);
        let x;
        let y;
        let intentos = 0;
        let posicionValida = false;

        do {
            x = aleatorio(radio + 5, Math.max(radio + 5, ancho - radio - 5));
            y = aleatorio(radio + 100, Math.max(radio + 100, alto - radio - 90));

            posicionValida = circulos.every(circle => {
                const distancia = Math.hypot(
                    circle.x - x,
                    circle.y - y
                );

                return distancia >= circle.radio + radio + 5;
            });

            intentos++;
        } while (!posicionValida && intentos < 100);

        // Si no hay espacio suficiente, se coloca en una posición aleatoria
        if (!posicionValida) {
            x = aleatorio(radio, Math.max(radio, ancho - radio));
            y = aleatorio(radio, Math.max(radio, alto - radio));
        }

        circulos.push(
            new Circle(x, y, radio, colores[i])
        );
    }
}

// Resolver las colisiones entre círculos
function resolverColisiones() {
    for (let i = 0; i < circulos.length; i++) {
        for (let j = i + 1; j < circulos.length; j++) {
            const a = circulos[i];
            const b = circulos[j];

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distancia = Math.hypot(dx, dy);
            const distanciaMinima = a.radio + b.radio;

            if (distancia >= distanciaMinima) {
                continue;
            }

            // Normal de la colisión
            const nx = distancia > 0 ? dx / distancia : 1;
            const ny = distancia > 0 ? dy / distancia : 0;

            // Separar los círculos para evitar que se encimen
            const solapamiento = distanciaMinima - distancia;
            const separacion = solapamiento / 2;

            a.x -= nx * separacion;
            a.y -= ny * separacion;
            b.x += nx * separacion;
            b.y += ny * separacion;

            // Velocidad relativa en la dirección de la colisión
            const velocidadRelativa =
                (b.vx - a.vx) * nx +
                (b.vy - a.vy) * ny;

            // Responder solo si se están acercando
            if (velocidadRelativa < 0) {
                const impulso = -velocidadRelativa;

                a.vx -= impulso * nx;
                a.vy -= impulso * ny;

                b.vx += impulso * nx;
                b.vy += impulso * ny;

                // Ambos círculos brillan en azul
                a.flash();
                b.flash();
            }
        }
    }
}

// Bucle principal de animación
function animate() {
    context.clearRect(0, 0, ancho, alto);

    for (const circle of circulos) {
        circle.update();
    }

    resolverColisiones();

    for (const circle of circulos) {
        circle.draw();
    }

    requestAnimationFrame(animate);
}

// Iniciar la simulación
crearCirculos();
animate();