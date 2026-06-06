// Configuración principal de Phaser 3 para WinTrek
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1024,
    height: 768,
    backgroundColor: '#000000',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Inicializar el juego
const game = new Phaser.Game(config);

// Sistema de gestión de ventanas
let windows = {};

// Estado del juego
const gameState = {
    stardate: 3254.7,
    quadrant: { x: 5, y: 3 },
    sector: { x: 3, y: 3 }, // Posición inicial en el centro del grid 8x8
    dilithium: 1000,
    shields: 100,
    photonTorpedoes: 10,
    shipStatus: 'green', // green, yellow, red
    remainingEnemies: 15
};

// Configuración del grid
const GRID_SIZE = 8;
const CELL_SIZE = 17; // Ajustado para caber en la ventana de 180px de altura (8*17=136px)
const GRID_OFFSET_X = 10;
const GRID_OFFSET_Y = 35; // Ajustado para que el grid quepa (35+136=171px < 180px)

// Referencias a objetos del juego
let shipSprite = null;
let navigationDirection = 0;
let navigationDistance = 1;
let gridElements = []; // Elementos aleatorios en el grid
let isMoving = false; // Flag para evitar movimientos simultáneos

// Definición de las áreas de ventanas
const windowDefinitions = {
    navigation: { id: 'navigation', title: 'Navegación', x: 10, y: 10, width: 300, height: 200, color: 0x1a1a2e },
    computer: { id: 'computer', title: 'Computador', x: 320, y: 10, width: 350, height: 200, color: 0x16213e },
    shipStatus: { id: 'shipStatus', title: 'Estado de la Nave', x: 680, y: 10, width: 334, height: 200, color: 0x0f3460 },
    shieldStatus: { id: 'shieldStatus', title: 'Estado de Escudos', x: 10, y: 220, width: 300, height: 180, color: 0x1a1a2e },
    proximityScanner: { id: 'proximityScanner', title: 'Escanner de Proximidad', x: 320, y: 220, width: 350, height: 180, color: 0x16213e },
    longRangeScanner: { id: 'longRangeScanner', title: 'Escanner de Largo Alcance', x: 680, y: 220, width: 334, height: 180, color: 0x0f3460 },
    messages: { id: 'messages', title: 'Mensajes', x: 10, y: 410, width: 400, height: 150, color: 0x1a1a2e },
    torpedoControl: { id: 'torpedoControl', title: 'Control de Torpedos', x: 420, y: 410, width: 250, height: 150, color: 0x16213e },
    phaserControl: { id: 'phaserControl', title: 'Control de Phasers', x: 680, y: 410, width: 334, height: 150, color: 0x0f3460 },
    damageReport: { id: 'damageReport', title: 'Informe de Daños', x: 10, y: 570, width: 500, height: 188, color: 0x1a1a2e }
};

function preload() {
    // Cargar assets
    console.log('WinTrek: Cargando assets...');
    this.load.image('player_ship', 'assets/images/player_ship.png');
    this.load.image('planet', 'assets/images/planet-earth.png');
    this.load.image('star', 'assets/images/star.png');
}

function create() {
    // Configuración inicial del juego
    console.log('WinTrek: Juego inicializado');
    
    // Crear todas las ventanas
    createAllWindows.call(this);
}

function createAllWindows() {
    // Iterar sobre todas las definiciones de ventanas
    Object.values(windowDefinitions).forEach(def => {
        createWindow.call(this, def);
    });
}

function createWindow(def) {
    // Crear contenedor para la ventana
    const windowContainer = this.add.container(def.x, def.y);
    
    // Fondo de la ventana
    const background = this.add.rectangle(0, 0, def.width, def.height, def.color)
        .setStrokeStyle(2, 0x00ff00)
        .setOrigin(0, 0);
    
    // Barra de título
    const titleBar = this.add.rectangle(0, 0, def.width, 25, 0x003300)
        .setStrokeStyle(1, 0x00ff00)
        .setOrigin(0, 0);
    
    // Texto del título
    const titleText = this.add.text(def.width / 2, 12, def.title, {
        fontSize: '14px',
        fill: '#00ff00',
        fontFamily: 'Arial',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Contenido de la ventana
    let contentElements = [];
    if (def.id === 'shipStatus') {
        const contentText = createShipStatusContent.call(this, def.width);
        contentElements.push(contentText);
    } else if (def.id === 'proximityScanner') {
        const gridElements = createProximityScannerGrid.call(this);
        contentElements.push(...gridElements);
    } else if (def.id === 'navigation') {
        const navElements = createNavigationControls.call(this);
        contentElements.push(...navElements);
    } else {
        const contentText = this.add.text(10, 40, `[${def.title}]\nÁrea de contenido`, {
            fontSize: '12px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            lineSpacing: 5
        });
        contentElements.push(contentText);
    }
    
    // Agregar elementos al contenedor
    windowContainer.add([background, titleBar, titleText, ...contentElements]);
    
    // Guardar referencia a la ventana
    windows[def.id] = {
        container: windowContainer,
        definition: def,
        contentElements: contentElements
    };
}

function createShipStatusContent(windowWidth) {
    const statusColor = getShipStatusColor(gameState.shipStatus);
    
    const content = this.add.text(10, 40, '', {
        fontSize: '11px',
        fill: '#00ff00',
        fontFamily: 'Arial',
        lineSpacing: 4
    });
    
    updateShipStatusText(content, statusColor);
    return content;
}

function getShipStatusColor(status) {
    switch(status) {
        case 'red': return '#ff0000';
        case 'yellow': return '#ffff00';
        case 'green': return '#00ff00';
        default: return '#00ff00';
    }
}

function updateShipStatusText(content, statusColor) {
    content.setText([
        `Fecha Estelar: ${gameState.stardate.toFixed(1)}`,
        `Cuadrante: [${gameState.quadrant.x}, ${gameState.quadrant.y}]`,
        `Sector: [${gameState.sector.x}, ${gameState.sector.y}]`,
        `Dilitio: ${gameState.dilithium} unidades`,
        `Escudos: ${gameState.shields}%`,
        `Torpedos de Fotones: ${gameState.photonTorpedoes}`,
        `Estado: ${getStatusText(gameState.shipStatus)}`,
        `Enemigos Restantes: ${gameState.remainingEnemies}`
    ]);
}

function getStatusText(status) {
    switch(status) {
        case 'red': return 'CRÍTICO';
        case 'yellow': return 'ADVERTENCIA';
        case 'green': return 'NORMAL';
        default: return 'NORMAL';
    }
}

function createProximityScannerGrid() {
    const elements = [];
    
    // Crear grid 8x8
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const cellX = GRID_OFFSET_X + x * CELL_SIZE;
            const cellY = GRID_OFFSET_Y + y * CELL_SIZE;
            
            const cell = this.add.rectangle(cellX, cellY, CELL_SIZE - 2, CELL_SIZE - 2, 0x000000)
                .setStrokeStyle(1, 0x003300)
                .setOrigin(0, 0);
            
            elements.push(cell);
        }
    }
    
    // Crear sprite de la nave en la posición actual
    const shipX = GRID_OFFSET_X + gameState.sector.x * CELL_SIZE + CELL_SIZE / 2;
    const shipY = GRID_OFFSET_Y + gameState.sector.y * CELL_SIZE + CELL_SIZE / 2;
    
    shipSprite = this.add.image(shipX, shipY, 'player_ship')
        .setScale(0.25) // Escala reducida para caber en la casilla de 17x17
        .setOrigin(0.5);
    
    elements.push(shipSprite);
    
    // Agregar elementos aleatorios al grid
    addRandomGridElements.call(this, elements);
    
    return elements;
}

function createNavigationControls() {
    const elements = [];
    
    // Texto de instrucciones
    const instructions = this.add.text(10, 40, 'NAVEGACIÓN', {
        fontSize: '12px',
        fill: '#00ff00',
        fontFamily: 'Arial',
        fontStyle: 'bold'
    });
    elements.push(instructions);
    
    // Dirección
    const dirLabel = this.add.text(10, 65, 'Dirección (grados):', {
        fontSize: '10px',
        fill: '#00ff00',
        fontFamily: 'Arial'
    });
    elements.push(dirLabel);
    
    const dirOptions = '0, 45, 90, 135, 180, 225, 270, 315';
    const dirText = this.add.text(10, 80, dirOptions, {
        fontSize: '9px',
        fill: '#00aa00',
        fontFamily: 'Arial'
    });
    elements.push(dirText);
    
    const dirValue = this.add.text(10, 95, 'Actual: 0°', {
        fontSize: '10px',
        fill: '#ffff00',
        fontFamily: 'Arial'
    });
    elements.push(dirValue);
    
    // Botones para cambiar dirección
    const dirButtons = [];
    const dirValues = [0, 45, 90, 135, 180, 225, 270, 315];
    let btnX = 10;
    let btnY = 105;
    
    dirValues.forEach((deg, index) => {
        if (index > 0 && index % 4 === 0) {
            btnX = 10;
            btnY += 12;
        }
        
        const btn = this.add.rectangle(btnX, btnY, 28, 10, 0x002200)
            .setStrokeStyle(1, 0x00ff00)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
        
        const btnText = this.add.text(btnX + 14, btnY + 5, `${deg}°`, {
            fontSize: '8px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        btn.on('pointerdown', () => {
            navigationDirection = deg;
            dirValue.setText(`Actual: ${deg}°`);
        });
        
        elements.push(btn, btnText);
        dirButtons.push(btn);
        btnX += 32;
    });
    
    // Distancia
    const distLabel = this.add.text(10, 115, 'Distancia (casillas):', {
        fontSize: '10px',
        fill: '#00ff00',
        fontFamily: 'Arial'
    });
    elements.push(distLabel);
    
    const distValue = this.add.text(10, 130, 'Actual: 1', {
        fontSize: '10px',
        fill: '#ffff00',
        fontFamily: 'Arial'
    });
    elements.push(distValue);
    
    // Botones para cambiar distancia
    const distButtons = [];
    const distValues = [1, 2, 3, 4, 5, 6, 7];
    let distBtnX = 10;
    let distBtnY = 140;
    
    distValues.forEach((dist, index) => {
        if (index > 0 && index % 4 === 0) {
            distBtnX = 10;
            distBtnY += 12;
        }
        
        const btn = this.add.rectangle(distBtnX, distBtnY, 28, 10, 0x002200)
            .setStrokeStyle(1, 0x00ff00)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
        
        const btnText = this.add.text(distBtnX + 14, distBtnY + 5, `${dist}`, {
            fontSize: '8px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        btn.on('pointerdown', () => {
            navigationDistance = dist;
            distValue.setText(`Actual: ${dist}`);
        });
        
        elements.push(btn, btnText);
        distButtons.push(btn);
        distBtnX += 32;
    });
    
    // Botón de mover
    const moveButton = this.add.rectangle(10, 175, 80, 25, 0x003300)
        .setStrokeStyle(1, 0x00ff00)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });
    
    const moveText = this.add.text(50, 187, 'MOVER', {
        fontSize: '11px',
        fill: '#00ff00',
        fontFamily: 'Arial',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    
    elements.push(moveButton, moveText);
    
    // Evento del botón
    moveButton.on('pointerdown', () => {
        moveShip();
    });
    
    return elements;
}

function moveShip() {
    if (isMoving) {
        console.log('La nave ya se está moviendo');
        return;
    }
    
    const directions = {
        0: { dx: 0, dy: -1 },      // Norte
        45: { dx: 1, dy: -1 },     // Noreste
        90: { dx: 1, dy: 0 },      // Este
        135: { dx: 1, dy: 1 },     // Sureste
        180: { dx: 0, dy: 1 },     // Sur
        225: { dx: -1, dy: 1 },    // Suroeste
        270: { dx: -1, dy: 0 },    // Oeste
        315: { dx: -1, dy: -1 }    // Noroeste
    };
    
    const dir = directions[navigationDirection];
    if (!dir) return;
    
    isMoving = true;
    
    // Movimiento paso a paso
    let currentStep = 0;
    const totalSteps = navigationDistance;
    
    const moveStep = () => {
        if (currentStep >= totalSteps) {
            isMoving = false;
            updateShipStatusDisplay();
            console.log(`Nave movida a sector [${gameState.sector.x}, ${gameState.sector.y}]`);
            return;
        }
        
        const newX = gameState.sector.x + dir.dx;
        const newY = gameState.sector.y + dir.dy;
        
        // Verificar límites del grid
        if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
            isMoving = false;
            console.log('Movimiento fuera de los límites del grid');
            return;
        }
        
        // Actualizar posición
        gameState.sector.x = newX;
        gameState.sector.y = newY;
        
        // Animar el movimiento del sprite
        if (shipSprite) {
            const newSpriteX = GRID_OFFSET_X + newX * CELL_SIZE + CELL_SIZE / 2;
            const newSpriteY = GRID_OFFSET_Y + newY * CELL_SIZE + CELL_SIZE / 2;
            
            shipSprite.scene.tweens.add({
                targets: shipSprite,
                x: newSpriteX,
                y: newSpriteY,
                duration: 300, // 300ms por paso
                ease: 'Linear',
                onComplete: () => {
                    currentStep++;
                    moveStep();
                }
            });
        } else {
            currentStep++;
            moveStep();
        }
    };
    
    moveStep();
}

function updateShipStatusDisplay() {
    const shipStatusWindow = windows['shipStatus'];
    if (shipStatusWindow && shipStatusWindow.contentElements) {
        const contentText = shipStatusWindow.contentElements[0];
        updateShipStatusText(contentText, getShipStatusColor(gameState.shipStatus));
    }
}

function addRandomGridElements(elements) {
    const randomElements = ['planet', 'star'];
    const numElements = 2; // Número de elementos aleatorios
    
    for (let i = 0; i < numElements; i++) {
        let x, y;
        let validPosition = false;
        
        // Buscar una posición válida que no sea la posición de la nave
        while (!validPosition) {
            x = Phaser.Math.Between(0, GRID_SIZE - 1);
            y = Phaser.Math.Between(0, GRID_SIZE - 1);
            
            // Verificar que no sea la posición de la nave
            if (x !== gameState.sector.x || y !== gameState.sector.y) {
                // Verificar que no haya otro elemento en esa posición
                const occupied = gridElements.some(el => el.gridX === x && el.gridY === y);
                if (!occupied) {
                    validPosition = true;
                }
            }
        }
        
        const elementX = GRID_OFFSET_X + x * CELL_SIZE + CELL_SIZE / 2;
        const elementY = GRID_OFFSET_Y + y * CELL_SIZE + CELL_SIZE / 2;
        
        const randomType = randomElements[Phaser.Math.Between(0, randomElements.length - 1)];
        const elementSprite = this.add.image(elementX, elementY, randomType)
            .setScale(0.2) // Escala reducida para caber en la casilla de 17x17
            .setOrigin(0.5);
        
        gridElements.push({ sprite: elementSprite, gridX: x, gridY: y, type: randomType });
        elements.push(elementSprite);
    }
}

function update() {
    // Loop principal del juego
}
