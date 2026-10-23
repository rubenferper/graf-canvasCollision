
"use strict";

// Obtener el canvas y su contexto de dibujo.
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Color que se utiliza cuando dos círculos están chocando.
const COLOR_COLISION = "#0000FF";

// Cantidad de círculos que tendrá la animación.
const NUM_CIRCULOS = 20;

// Conjunto que almacena las parejas que están en colisión.
const colisionesActivas = new Set();

// Ajustar el tamaño real del canvas a sus dimensiones visibles.
function ajustarCanvas() {
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;
}

// Clase que representa cada círculo.
class Circle {
    constructor(x, y, radius, color, text, speed) {
        // Atributos de posición, apariencia e identificación.
        this.posX = x;
        this.posY = y;
        this.radius = radius;
        this.color = color;
        this.colorOriginal = color;
        this.text = text;
        this.speed = speed;

        // Dirección y velocidad horizontal y vertical.
        const angulo = Math.random() * Math.PI * 2;

        this.dx = Math.cos(angulo) * speed;
        this.dy = Math.sin(angulo) * speed;

        // Indica si el círculo está colisionando.
        this.enColision = false;
    }

    // Dibujar el círculo y su etiqueta.
    draw(context) {
        context.beginPath();

        // Cambiar el color mientras exista una colisión.
        context.strokeStyle = this.enColision
            ? COLOR_COLISION
            : this.colorOriginal;

        context.fillStyle = this.enColision
            ? COLOR_COLISION
            : this.colorOriginal;

        context.lineWidth = 3;

        context.arc(
            this.posX,
            this.posY,
            this.radius,
            0,
            Math.PI * 2
        );

        context.fill();
        context.stroke();

        // Mostrar la identificación del círculo.
        context.fillStyle = "#FFFFFF";
        context.font = "bold 12px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";

        context.fillText(
            this.text,
            this.posX,
            this.posY
        );

        context.closePath();
    }

    // Actualizar la posición y rebotar contra los bordes.
    update() {
        this.posX += this.dx;
        this.posY += this.dy;

        // Rebote horizontal.
        if (this.posX + this.radius > canvas.width) {
            this.posX = canvas.width - this.radius;
            this.dx = -Math.abs(this.dx);
        }

        if (this.posX - this.radius < 0) {
            this.posX = this.radius;
            this.dx = Math.abs(this.dx);
        }

        // Rebote vertical.
        if (this.posY + this.radius > canvas.height) {
            this.posY = canvas.height - this.radius;
            this.dy = -Math.abs(this.dy);
        }

        if (this.posY - this.radius < 0) {
            this.posY = this.radius;
            this.dy = Math.abs(this.dy);
        }
    }

    // Cambiar el sentido del movimiento después del choque.
    rebotar() {
        this.dx = -this.dx;
        this.dy = -this.dy;
    }
}

// Arreglo que almacenará los 20 círculos.
const circles = [];

// Crear un color hexadecimal aleatorio.
function generarColor() {
    return "#" + Math.floor(
        Math.random() * 0x1000000
    ).toString(16).padStart(6, "0");
}

// Generar los círculos evitando superposiciones iniciales.
function generateCircles(n) {
    circles.length = 0;

    for (let i = 0; i < n; i++) {
        const radius = 15 + Math.random() * 10;
        const speed = 1 + Math.random() * 4;

        let x;
        let y;
        let intentos = 0;
        let posicionValida = false;

        // Buscar una posición sin superponerse con otros círculos.
        while (!posicionValida && intentos < 1000) {
            x = radius + Math.random() *
                Math.max(1, canvas.width - 2 * radius);

            y = radius + Math.random() *
                Math.max(1, canvas.height - 2 * radius);

            posicionValida = circles.every(circle => {
                const dx = x - circle.posX;
                const dy = y - circle.posY;
                const distancia = Math.sqrt(dx * dx + dy * dy);

                return distancia >= radius + circle.radius + 2;
            });

            intentos++;
        }

        // Crear el círculo si se encontró una posición válida.
        if (posicionValida) {
            circles.push(
                new Circle(
                    x,
                    y,
                    radius,
                    generarColor(),
                    `C${i + 1}`,
                    speed
                )
            );
        }
    }
}

// Detectar colisiones entre todas las parejas de círculos.
function detectarColisiones() {
    const nuevasColisiones = new Set();

    // Al inicio de cada revisión, ninguno está marcado.
    circles.forEach(circle => {
        circle.enColision = false;
    });

    // Comparar cada círculo con los que siguen en el arreglo.
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            const a = circles[i];
            const b = circles[j];

            const dx = b.posX - a.posX;
            const dy = b.posY - a.posY;

            // Distancia entre los centros de ambos círculos.
            const distancia = Math.sqrt(dx * dx + dy * dy);

            // Existe colisión si la distancia no supera la suma
            // de los radios de los dos círculos.
            if (distancia <= a.radius + b.radius) {
                const idColision = `${i}-${j}`;

                nuevasColisiones.add(idColision);

                // Ambos círculos se muestran en azul.
                a.enColision = true;
                b.enColision = true;

                // Rebotar una sola vez al comenzar cada colisión.
                // Evita invertir la dirección en cada fotograma.
                if (!colisionesActivas.has(idColision)) {
                    a.rebotar();
                    b.rebotar();

                    // Separar ligeramente los círculos para reducir
                    // el riesgo de detectar el mismo choque repetido.
                    if (distancia > 0) {
                        const separacion =
                            a.radius + b.radius - distancia;

                        const nx = dx / distancia;
                        const ny = dy / distancia;

                        a.posX -= nx * separacion / 2;
                        a.posY -= ny * separacion / 2;
                        b.posX += nx * separacion / 2;
                        b.posY += ny * separacion / 2;
                    }
                }
            }
        }
    }

    // Guardar las parejas detectadas para el siguiente fotograma.
    colisionesActivas.clear();

    nuevasColisiones.forEach(id => {
        colisionesActivas.add(id);
    });
}

// Ejecutar continuamente la animación.
function animate() {
    // Limpiar el fotograma anterior.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Primero mover los círculos.
    circles.forEach(circle => {
        circle.update();
    });

    // Después detectar colisiones y cambiar direcciones.
    detectarColisiones();

    // Dibujar los círculos con sus colores actualizados.
    circles.forEach(circle => {
        circle.draw(ctx);
    });

    // Solicitar el siguiente fotograma.
    requestAnimationFrame(animate);
}

// Inicializar el proyecto.
ajustarCanvas();
generateCircles(NUM_CIRCULOS);
animate();

// Adaptar el canvas cuando cambie el tamaño de la ventana.
window.addEventListener("resize", () => {
    ajustarCanvas();
    generateCircles(NUM_CIRCULOS);
    colisionesActivas.clear();
});
