// Configuración principal del juego R-Type Clone
class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        // Cargar sprites del jugador y disparos
        this.load.image('player_ship', 'assets/images/player_ship.png');
        this.load.image('friendly_shot', 'assets/images/friendly-shot.png');
        
        // Cargar sprites de enemigos
        this.load.image('enemy_battlecruiser', 'assets/images/enemy-battlecruiser.png');
        this.load.image('enemy_frigate', 'assets/images/enemy-frigate.png');
        this.load.image('enemy_supply_ship', 'assets/images/enemy-supply-ship.png');
        this.load.image('enemy_shot', 'assets/images/enemy-shot.png');
        
        console.log('Assets cargados correctamente');
    }

    create() {
        // Fondo del juego
        this.add.rectangle(400, 300, 800, 600, 0x000000);

        // Crear nave del jugador
        this.player = this.physics.add.sprite(100, 300, 'player_ship');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.5);

        // Configurar controles de teclado
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Grupo para los disparos del jugador
        this.playerBullets = this.physics.add.group({
            defaultKey: 'friendly_shot',
            maxSize: 10
        });

        // Grupo para los enemigos
        this.enemies = this.physics.add.group();

        // Grupo para los disparos enemigos
        this.enemyBullets = this.physics.add.group({
            defaultKey: 'enemy_shot',
            maxSize: 50
        });

        // Configurar colisiones
        this.physics.add.collider(this.playerBullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.collider(this.enemyBullets, this.player, this.enemyBulletHitPlayer, null, this);

        // Evento para spawnear enemigos
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Texto informativo
        this.add.text(400, 30, 'R-Type Clone - Phaser 3', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(400, 570, 'Flechas: Mover | Espacio: Disparar', {
            fontSize: '14px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        console.log('Juego inicializado correctamente');
    }

    update() {
        // Verificar que el jugador existe y está activo
        if (!this.player || !this.player.active || !this.player.body) {
            return;
        }
        
        // Movimiento del jugador
        const speed = 150;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
        } else {
            this.player.setVelocityY(0);
        }

        // Disparo
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.fireBullet();
        }

        // Actualizar disparos del jugador
        this.playerBullets.children.iterate((bullet) => {
            if (bullet && bullet.active) {
                if (bullet.x > 800) {
                    bullet.destroy();
                }
            }
        });

        // Actualizar disparos enemigos
        this.enemyBullets.children.iterate((bullet) => {
            if (bullet && bullet.active) {
                if (bullet.x < 0) {
                    bullet.destroy();
                }
            }
        });

        // Actualizar enemigos
        this.enemies.children.iterate((enemy) => {
            if (enemy && enemy.active) {
                // Eliminar enemigos que salen de la pantalla
                if (enemy.x < -50) {
                    enemy.destroy();
                }
                
                // Movimiento no lineal según tipo
                this.updateEnemyMovement(enemy);
                
                // Disparo enemigo
                if (enemy.canShoot) {
                    this.enemyShoot(enemy);
                }
            }
        });
    }

    fireBullet() {
        if (!this.player || !this.player.active) {
            return;
        }
        
        const bullet = this.playerBullets.get(this.player.x + 30, this.player.y);
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setVelocityX(300);
            bullet.setScale(0.3);
        }
    }

    spawnEnemy() {
        const enemyTypes = ['battlecruiser', 'frigate', 'supply_ship'];
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const y = Phaser.Math.Between(50, 550);
        
        let enemy;
        let speed;
        let canShoot = false;
        let shootInterval = 0;
        
        switch(type) {
            case 'battlecruiser':
                enemy = this.enemies.create(850, y, 'enemy_battlecruiser');
                speed = 80;
                canShoot = true;
                shootInterval = 1500;
                enemy.movementPattern = 'sine';
                enemy.amplitude = 50;
                enemy.frequency = 0.002;
                enemy.initialY = y;
                enemy.timeAlive = 0;
                break;
            case 'frigate':
                enemy = this.enemies.create(850, y, 'enemy_frigate');
                speed = 120;
                canShoot = true;
                shootInterval = 2000;
                enemy.movementPattern = 'zigzag';
                enemy.zigzagTimer = 0;
                enemy.zigzagDirection = 1;
                break;
            case 'supply_ship':
                enemy = this.enemies.create(850, y, 'enemy_supply_ship');
                speed = 60;
                canShoot = false;
                enemy.movementPattern = 'straight';
                break;
        }
        
        enemy.setScale(0.4);
        enemy.setVelocityX(-speed);
        enemy.canShoot = canShoot;
        enemy.shootInterval = shootInterval;
        enemy.lastShot = 0;
    }

    updateEnemyMovement(enemy) {
        // Verificar que el enemigo está activo y tiene cuerpo físico
        if (!enemy.active || !enemy.body) {
            return;
        }
        
        enemy.timeAlive = (enemy.timeAlive || 0) + 16;
        
        switch(enemy.movementPattern) {
            case 'sine':
                // Movimiento en onda senoidal
                const sineY = enemy.initialY + Math.sin(enemy.timeAlive * enemy.frequency) * enemy.amplitude;
                enemy.setVelocityY((sineY - enemy.y) * 0.1);
                break;
            case 'zigzag':
                // Movimiento en zigzag
                enemy.zigzagTimer = (enemy.zigzagTimer || 0) + 16;
                if (enemy.zigzagTimer > 500) {
                    enemy.zigzagDirection *= -1;
                    enemy.zigzagTimer = 0;
                }
                enemy.setVelocityY(enemy.zigzagDirection * 60);
                break;
            case 'straight':
                // Movimiento recto
                enemy.setVelocityY(0);
                break;
        }
    }

    enemyShoot(enemy) {
        if (!enemy.active || !enemy.body) {
            return;
        }
        
        const now = this.time.now;
        if (now - enemy.lastShot > enemy.shootInterval) {
            const bullet = this.enemyBullets.get(enemy.x - 30, enemy.y);
            if (bullet) {
                bullet.setActive(true);
                bullet.setVisible(true);
                bullet.setVelocityX(-200);
                bullet.setScale(0.3);
                enemy.lastShot = now;
            }
        }
    }

    bulletHitEnemy(bullet, enemy) {
        bullet.destroy();
        enemy.destroy();
    }

    enemyBulletHitPlayer(bullet, player) {
        bullet.destroy();
        // Aquí se podría añadir lógica de daño al jugador
        console.log('Jugador golpeado');
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
