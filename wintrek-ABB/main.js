// Configuración principal del juego R-Type Clone
class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        // Cargar assets aquí cuando estén disponibles
        console.log('Cargando assets...');
    }

    create() {
        // Fondo del juego
        this.add.rectangle(400, 300, 800, 600, 0x000000);
        
        // Texto de prueba
        this.add.text(400, 300, 'R-Type Clone - Phaser 3', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(400, 350, 'Presiona F12 para abrir la consola', {
            fontSize: '16px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        console.log('Juego inicializado correctamente');
    }

    update() {
        // Lógica del juego en cada frame
    }
}

// Configuración de Phaser
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: MainScene,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Inicializar el juego
const game = new Phaser.Game(config);
