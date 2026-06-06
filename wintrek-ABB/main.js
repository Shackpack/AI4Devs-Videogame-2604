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

function preload() {
    // Cargar assets aquí cuando estén disponibles
    console.log('WinTrek: Cargando assets...');
}

function create() {
    // Configuración inicial del juego
    console.log('WinTrek: Juego inicializado');
    
    // Texto de prueba para verificar que Phaser funciona
    this.add.text(512, 384, 'WinTrek - Phaser 3', {
        fontSize: '32px',
        fill: '#00ff00',
        fontFamily: 'Arial'
    }).setOrigin(0.5);
}

function update() {
    // Loop principal del juego
}
