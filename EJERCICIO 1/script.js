const lienzo = document.getElementById("canvas");
const ctx = lienzo.getContext("2d");
const areaElementos = document.getElementById("itemsArea");
const resultado = document.getElementById("result");

const colores = ["#4169e0", "#fa8073", "#98fa98", "#f5deb3", "#dea0de"];
let elementos = [];
let angulo = 0;
let elementosDeshabilitados = [];
let ventanaClick = null;
function obtenerElementos() {
    return areaElementos.innerText
        .split("\n")
        .map(e => e.replace(/\s*\(oculto\)\s*$/, '').trim())
        .filter(e => e && !elementosDeshabilitados.includes(e));
}
function dibujarRuleta() {
    elementos = obtenerElementos();
    const total = elementos.length;
    const radio = lienzo.width / 2;
    const maxChars = 27;
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);

    elementos.forEach((elemento, i) => {
        const anguloInicio = (2 * Math.PI / total) * i + angulo;
        const anguloFin = anguloInicio + (2 * Math.PI / total);
        let textoParaMostrar = elemento.length > maxChars ? elemento.substring(0, maxChars - 3) + "..." : elemento;
        ctx.beginPath();
        ctx.moveTo(radio, radio);
        ctx.arc(radio, radio, radio, anguloInicio, anguloFin);
        ctx.fillStyle = colores[i % colores.length];
        ctx.fill();
        ctx.stroke();
        ctx.save();
        ctx.translate(radio, radio);
        ctx.rotate((anguloInicio + anguloFin) / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#000";
        ctx.font = "15px Arial";
        ctx.fillText(textoParaMostrar, radio - 10, 5);

        ctx.restore();
    });

    if (!girando) {
        ctx.save();
        const anchoFondo = 240;
        const altoFondo = 50;
        const x = radio - anchoFondo / 2;
        const y = radio - altoFondo / 2;
        const radioBorde = 10;
        ventanaClick = { x, y, ancho: anchoFondo, alto: altoFondo };

        ctx.beginPath();
        ctx.moveTo(x + radioBorde, y);
        ctx.lineTo(x + anchoFondo - radioBorde, y);
        ctx.quadraticCurveTo(x + anchoFondo, y, x + anchoFondo, y + radioBorde);
        ctx.lineTo(x + anchoFondo, y + altoFondo - radioBorde);
        ctx.quadraticCurveTo(x + anchoFondo, y + altoFondo, x + anchoFondo - radioBorde, y + altoFondo);
        ctx.lineTo(x + radioBorde, y + altoFondo);
        ctx.quadraticCurveTo(x, y + altoFondo, x, y + altoFondo - radioBorde);
        ctx.lineTo(x, y + radioBorde);
        ctx.quadraticCurveTo(x, y, x + radioBorde, y);
        ctx.closePath();
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Haz clic para girarlo", radio, radio);

        ctx.restore();
    }

}

let girando = false;

function girarRuleta() {
    if (girando || obtenerElementos().length === 0) return;

    let velocidad = Math.random() * 0.3 + 0.2;
    const desaceleracion = 0.005;
    girando = true;

    const intervalo = setInterval(() => {
        angulo += velocidad;
        angulo %= 2 * Math.PI;
        dibujarRuleta();
        velocidad -= desaceleracion;
        if (velocidad <= 0) {
            clearInterval(intervalo);
            girando = false;
            const seleccionado = obtenerSeleccionado();
            resultado.innerText = "Seleccionado: " + seleccionado;
            const activos = obtenerElementos();
            const indice = activos.indexOf(seleccionado);
            if (indice !== -1) {
                resultado.style.backgroundColor = colores[indice % colores.length];
                resultado.style.color = '#000';
                resultado.style.padding = '10px';
                resultado.style.borderRadius = '8px';
            } else {
                resultado.style.backgroundColor = '';
                resultado.style.color = '';
                resultado.style.padding = '';
                resultado.style.borderRadius = '';
            }
        }
    }, 30);
}

function obtenerSeleccionado() {
    const activos = obtenerElementos();
    const total = activos.length;
    const anguloSector = 2 * Math.PI / total;
    const anguloPuntero = (0 - angulo + 2 * Math.PI) % (2 * Math.PI);
    const indice = Math.floor(anguloPuntero / anguloSector) % total;
    return activos[indice];
}

function reiniciar() {
    elementosDeshabilitados = [];
    actualizarResaltadoTextarea();
    dibujarRuleta();
    resultado.innerText = "";
    resultado.style.backgroundColor = '';
    resultado.style.color = '';
    resultado.style.padding = '';
    resultado.style.borderRadius = '';
}

function actualizarResaltadoTextarea() {
    const lineas = areaElementos.innerText.split("\n");
    areaElementos.innerHTML = ''; // limpiar

    for (let linea of lineas) {
        const limpio = linea.replace(/\s*\(oculto\)\s*$/, '').trim();
        const divLinea = document.createElement("div");

        if (elementosDeshabilitados.includes(limpio)) {
            divLinea.innerText = limpio + " (oculto)";
            divLinea.style.backgroundColor = "#d3d3d3"; // gris claro
        } else {
            divLinea.innerText = limpio;
        }

        areaElementos.appendChild(divLinea);
    }
}


areaElementos.addEventListener("input", dibujarRuleta);

document.addEventListener("keydown", (e) => {
    const target = e.target;
    const esEditable = target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable;
    if (esEditable) return;  

    if (e.code === "Space") {
        e.preventDefault();
        girarRuleta();
    } else if (e.key === "S" || e.key === "s") {
        if (!girando && resultado.innerText) {
            let seleccionado = resultado.innerText
                .replace("Seleccionado:", "")
                .replace("(oculto)", "")
                .trim();

            if (!elementosDeshabilitados.includes(seleccionado)) {
                elementosDeshabilitados.push(seleccionado);
                actualizarResaltadoTextarea();
                resultado.innerText = `Seleccionado: ${seleccionado} (oculto)`;
                dibujarRuleta(); 
            }
        }
    } else if (e.key === "R" || e.key === "r") {
        reiniciar();
    } else if (e.key === "F" || e.key === "f") {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    } else if (e.key === "E" || e.key === "e") {
        areaElementos.disabled = false;
        areaElementos.focus();
    }
});



areaElementos.addEventListener("click", () => {
});
lienzo.addEventListener("click", () => {
    if (!girando) {
        girarRuleta();
    }
});


