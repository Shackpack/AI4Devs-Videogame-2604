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
        
        // Cargar sprites de elementos de curación
        this.load.image('allied_spacedock', 'assets/images/allied-spacedock.png');
        this.load.image('neutral_spacedoc', 'assets/images/neutral_spacedoc.png');
        
        // Cargar imagen de fondo
        this.load.image('background', 'assets/images/1000_F_243757367_gBpS6R5c8DB7pL5gw9gi9KXlzFfbdZOA.jpg');
        
        // Cargar efectos de sonido
        this.load.audio('laser_shot', 'assets/audio/chakong-laser-gun-shot-sound-future-sci-fi-lazer-wobble-chakongaudio-174883.mp3');
        
        // Cargar música de fondo
        this.load.audio('background_music', 'assets/audio/solarflex-space-541545.mp3');
        
        console.log('Assets cargados correctamente');
    }

    create() {
        // Fondo del juego (imagen fija)
        this.add.image(400, 300, 'background').setDisplaySize(800, 600);

        // Variables del juego
        this.playerHP = 100;
        this.maxPlayerHP = 100;
        this.score = 0;
        this.gameOver = false;
        this.isInvulnerable = false;

        // Crear nave del jugador
        this.player = this.physics.add.sprite(100, 300, 'player_ship');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.5);

        // Configurar controles de teclado
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

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
        
        // Grupo para elementos de curación
        this.healingItems = this.physics.add.group();

        // Configurar colisiones
        this.physics.add.overlap(this.playerBullets, this.enemies, this.bulletHitEnemy, null, this);
        // Desactivar overlap de bullets enemigos para evitar problemas de visibilidad
        // Se usará verificación manual en update()
        // this.physics.add.overlap(this.enemyBullets, this.player, this.enemyBulletHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.healingItems, this.playerHitHealingItem, null, this);

        // Evento para spawnear enemigos
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        // Evento para spawnear allied spacedock (cada 1 minuto como máximo)
        this.time.addEvent({
            delay: 60000,
            callback: this.spawnAlliedSpacedock,
            callbackScope: this,
            loop: true
        });
        
        // Evento para spawnear neutral spacedoc (cada 3 minutos como máximo)
        this.time.addEvent({
            delay: 180000,
            callback: this.spawnNeutralSpacedoc,
            callbackScope: this,
            loop: true
        });

        // Texto informativo
        this.add.text(400, 30, 'R-Type Clone - Phaser 3', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(400, 570, 'Flechas: Mover | Espacio: Disparar | R: Reiniciar', {
            fontSize: '14px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Barra de vida del jugador
        this.healthBarBackground = this.add.rectangle(20, 20, 200, 20, 0x333333);
        this.healthBar = this.add.rectangle(20, 20, 200, 20, 0x00ff00);
        this.healthBar.setOrigin(0, 0);
        this.healthBarBackground.setOrigin(0, 0);

        // Texto de puntuación
        this.scoreText = this.add.text(780, 20, 'Score: 0', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(1, 0);

        // Pantalla de Game Over (oculta inicialmente)
        this.gameOverText = this.add.text(400, 300, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false);

        this.restartText = this.add.text(400, 360, 'Presiona R para reiniciar', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setVisible(false);

        // Iniciar música de fondo
        this.backgroundMusic = this.sound.add('background_music');
        this.backgroundMusic.play({
            volume: 0.3,
            loop: true
        });

        console.log('Juego inicializado correctamente');
    }

    update() {
        // Verificar Game Over (primero para permitir reinicio)
        if (this.gameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
                this.restartGame();
            }
            return;
        }

        // Verificar que el jugador existe (sin verificar body para evitar problemas)
        if (!this.player) {
            return;
        }
        
        // Si el jugador no tiene cuerpo físico, recrearlo
        if (!this.player.body) {
            this.physics.world.enable(this.player);
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

        // Actualizar disparos enemigos y verificar colisión con jugador
        this.enemyBullets.children.iterate((bullet) => {
            if (bullet && bullet.active) {
                if (bullet.x < 0) {
                    bullet.destroy();
                }
                
                // Verificación manual de colisión con jugador
                if (this.player && this.player.active && !this.isInvulnerable) {
                    const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                    if (distance < 30) {
                        // Colisión detectada
                        bullet.destroy();
                        
                        // Aplicar daño
                        const damage = 10;
                        this.playerHP -= damage;
                        console.log('Jugador golpeado por bullet - HP restante:', this.playerHP);
                        this.updateHealthBar();
                        
                        // Activar invulnerabilidad temporal
                        this.isInvulnerable = true;
                        this.time.delayedCall(500, () => {
                            this.isInvulnerable = false;
                        });
                        
                        if (this.playerHP <= 0) {
                            console.log('Game Over por bullet - HP:', this.playerHP);
                            this.gameOver = true;
                            this.showGameOver();
                        }
                    }
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
        
        // Actualizar elementos de curación
        this.healingItems.children.iterate((item) => {
            if (item && item.active) {
                // Eliminar elementos que salen de la pantalla
                if (item.x < -50) {
                    item.destroy();
                }
            }
        });
    }

    fireBullet() {
        if (!this.player) {
            return;
        }
        
        const bullet = this.playerBullets.get(this.player.x + 30, this.player.y);
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setVelocityX(300);
            bullet.setScale(0.3);
            
            // Reproducir efecto de sonido de disparo
            this.sound.play('laser_shot');
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
                shootInterval = 2700;
                enemy.movementPattern = 'sine';
                enemy.amplitude = 90;
                enemy.frequency = 0.005;
                enemy.initialY = y;
                enemy.timeAlive = 0;
                enemy.hp = 3;
                enemy.maxHp = 3;
                enemy.damage = 25;
                enemy.scoreValue = 300;
                enemy.enemyType = 'battlecruiser';
                break;
            case 'frigate':
                enemy = this.enemies.create(850, y, 'enemy_frigate');
                speed = 120;
                canShoot = true;
                shootInterval = 2200;
                enemy.movementPattern = 'zigzag';
                enemy.zigzagTimer = 0;
                enemy.zigzagDirection = 1;
                enemy.zigzagSpeed = 100;
                enemy.hp = 2;
                enemy.maxHp = 2;
                enemy.damage = 15;
                enemy.scoreValue = 200;
                enemy.enemyType = 'frigate';
                break;
            case 'supply_ship':
                enemy = this.enemies.create(850, y, 'enemy_supply_ship');
                speed = 300;
                canShoot = false;
                enemy.movementPattern = 'circular';
                enemy.circleRadius = 30;
                enemy.circleSpeed = 0.003;
                enemy.initialY = y;
                enemy.timeAlive = 0;
                enemy.hp = 1;
                enemy.maxHp = 1;
                enemy.damage = 10;
                enemy.scoreValue = 100;
                enemy.enemyType = 'supply_ship';
                break;
        }
        
        enemy.setScale(0.4);
        enemy.setVelocityX(-speed);
        enemy.canShoot = canShoot;
        enemy.shootInterval = shootInterval;
        enemy.lastShot = 0;
    }

    spawnAlliedSpacedock() {
        // Solo spawnear si hay menos de 2 en pantalla
        if (this.healingItems.getChildren().length >= 2) {
            return;
        }
        
        const y = Phaser.Math.Between(50, 550);
        const spacedock = this.healingItems.create(850, y, 'allied_spacedock');
        spacedock.setScale(0.3);
        spacedock.setVelocityX(-50);
        spacedock.healAmount = 10;
        spacedock.healingType = 'allied';
        spacedock.bonusUsed = false;
        console.log('Allied Spacedock spawn');
    }

    spawnNeutralSpacedoc() {
        // Solo spawnear si hay menos de 1 en pantalla
        if (this.healingItems.getChildren().length >= 1) {
            return;
        }
        
        const y = Phaser.Math.Between(50, 550);
        const spacedoc = this.healingItems.create(850, y, 'neutral_spacedoc');
        spacedoc.setScale(0.3);
        spacedoc.setVelocityX(-50);
        spacedoc.healAmount = 50;
        spacedoc.healingType = 'neutral';
        spacedoc.bonusUsed = false;
        console.log('Neutral Spacedoc spawn');
    }

    updateEnemyMovement(enemy) {
        // Verificar que el enemigo está activo y tiene cuerpo físico
        if (!enemy.active || !enemy.body) {
            return;
        }
        
        enemy.timeAlive = (enemy.timeAlive || 0) + 16;
        
        switch(enemy.movementPattern) {
            case 'sine':
                // Movimiento en onda senoidal más pronunciado
                const sineY = enemy.initialY + Math.sin(enemy.timeAlive * enemy.frequency) * enemy.amplitude;
                enemy.setVelocityY((sineY - enemy.y) * 0.2);
                break;
            case 'zigzag':
                // Movimiento en zigzag más rápido
                enemy.zigzagTimer = (enemy.zigzagTimer || 0) + 16;
                if (enemy.zigzagTimer > 300) {
                    enemy.zigzagDirection *= -1;
                    enemy.zigzagTimer = 0;
                }
                enemy.setVelocityY(enemy.zigzagDirection * (enemy.zigzagSpeed || 100));
                break;
            case 'circular':
                // Movimiento circular
                const circleY = enemy.initialY + Math.sin(enemy.timeAlive * enemy.circleSpeed) * enemy.circleRadius;
                enemy.setVelocityY((circleY - enemy.y) * 0.15);
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
        enemy.hp -= 1;
        
        // Efecto visual de golpe
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) {
                enemy.clearTint();
            }
        });
        
        if (enemy.hp <= 0) {
            this.score += enemy.scoreValue;
            this.updateScore();
            enemy.destroy();
        }
    }

    enemyBulletHitPlayer(bullet, player) {
        // Destruir el bullet pero NO afectar al jugador
        if (bullet) {
            bullet.destroy();
        }
        
        if (this.isInvulnerable) {
            return;
        }
        
        // Daño fijo por disparo enemigo (10 puntos)
        const damage = 10;
        
        this.playerHP -= damage;
        console.log('Jugador golpeado - HP restante:', this.playerHP);
        this.updateHealthBar();
        
        // Activar invulnerabilidad temporal
        this.isInvulnerable = true;
        
        // Desactivar invulnerabilidad después de 500ms
        this.time.delayedCall(500, () => {
            this.isInvulnerable = false;
        });
        
        // Solo mostrar Game Over si HP es 0 o menor
        if (this.playerHP <= 0) {
            console.log('Game Over - HP:', this.playerHP);
            this.gameOver = true;
            this.showGameOver();
        }
    }

    playerHitEnemy(player, enemy) {
        if (this.isInvulnerable) {
            return;
        }
        
        // Daño por colisión directa con enemigo (20 puntos)
        const damage = 20;
        
        this.playerHP -= damage;
        console.log('Jugador colisionó con enemigo - HP restante:', this.playerHP);
        this.updateHealthBar();
        
        // Activar invulnerabilidad temporal
        this.isInvulnerable = true;
        
        // Desactivar invulnerabilidad después de 500ms
        this.time.delayedCall(500, () => {
            this.isInvulnerable = false;
        });
        
        // El enemigo también recibe daño
        enemy.hp -= 1;
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) {
                enemy.clearTint();
            }
        });
        
        if (enemy.hp <= 0) {
            this.score += enemy.scoreValue;
            this.updateScore();
            enemy.destroy();
        }
        
        if (this.playerHP <= 0) {
            console.log('Game Over por colisión - HP:', this.playerHP);
            this.gameOver = true;
            this.showGameOver();
        }
    }

    playerHitHealingItem(player, item) {
        // Solo aplicar curación si el bono no ha sido usado
        if (item.bonusUsed) {
            return;
        }
        
        // Marcar el bono como usado
        item.bonusUsed = true;
        
        // Aplicar curación
        const healAmount = item.healAmount;
        this.playerHP = Math.min(this.playerHP + healAmount, this.maxPlayerHP);
        console.log('Jugador curado - HP:', this.playerHP, '+', healAmount);
        this.updateHealthBar();
        
        // Efecto visual de curación
        player.setTint(0x00ff00);
        this.time.delayedCall(200, () => {
            if (player) {
                player.clearTint();
            }
        });
    }

    getEnemyDamage(enemyType) {
        switch(enemyType) {
            case 'battlecruiser': return 25;
            case 'frigate': return 15;
            case 'supply_ship': return 10;
            default: return 10;
        }
    }

    updateHealthBar() {
        const healthPercent = Math.max(0, this.playerHP / this.maxPlayerHP);
        this.healthBar.width = 200 * healthPercent;
        
        // Cambiar color según salud
        if (healthPercent > 0.5) {
            this.healthBar.fillColor = 0x00ff00;
        } else if (healthPercent > 0.25) {
            this.healthBar.fillColor = 0xffff00;
        } else {
            this.healthBar.fillColor = 0xff0000;
        }
    }

    updateScore() {
        this.scoreText.setText('Score: ' + this.score);
    }

    showGameOver() {
        console.log('showGameOver llamado - HP:', this.playerHP);
        this.gameOverText.setVisible(true);
        this.restartText.setVisible(true);
        if (this.player) {
            this.player.setActive(false);
            this.player.setVisible(false);
        }
        
        // Detener música de fondo
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
    }

    restartGame() {
        console.log('restartGame llamado');
        // Reiniciar variables
        this.playerHP = 100;
        this.score = 0;
        this.gameOver = false;
        this.isInvulnerable = false;
        
        // Reiniciar música de fondo
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
            this.backgroundMusic.play({
                volume: 0.3,
                loop: true
            });
        }
        
        // Reiniciar jugador
        if (this.player) {
            this.player.setPosition(100, 300);
            this.player.setActive(true);
            this.player.setVisible(true);
            this.player.clearTint();
            // Asegurar que el cuerpo físico esté activo
            if (!this.player.body) {
                this.physics.world.enable(this.player);
            }
        }
        
        // Destruir todos los enemigos y disparos
        this.enemies.clear(true, true);
        this.playerBullets.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.healingItems.clear(true, true);
        
        // Actualizar UI
        this.updateHealthBar();
        this.updateScore();
        
        // Ocultar pantalla de Game Over
        this.gameOverText.setVisible(false);
        this.restartText.setVisible(false);
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
