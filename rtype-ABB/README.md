# WinTrek - Clon de R-Type

Juego de disparos horizontal (shmup) desarrollado con Phaser 3, inspirado en el clásico R-Type.

## Estructura del Proyecto

```
wintrek-ABB/
├── assets/
│   ├── images/
│   │   ├── player_ship.png          # Nave del jugador
│   │   ├── friendly-shot.png        # Disparos del jugador
│   │   ├── enemy-battlecruiser.png  # Enemigo tipo Battlecruiser
│   │   ├── enemy-frigate.png        # Enemigo tipo Frigate
│   │   ├── enemy-supply-ship.png    # Enemigo tipo Supply Ship
│   │   ├── enemy-shot.png           # Disparos enemigos
│   │   ├── allied-spacedock.png     # Elemento de curación (10 HP)
│   │   └── neutral_spacedoc.png     # Elemento de curación (50 HP)
├── documentation/
│   └── game_definition.md          # Definición detallada del juego
├── js/                             # Directorio para scripts adicionales
├── index.html                      # Página principal del juego
├── main.js                         # Lógica principal del juego
├── prompts.md                      # Historial de prompts y respuestas
└── README.md                       # Este archivo
```

## Características del Juego

### Jugador
- **Movimiento**: Flechas del teclado (arriba, abajo, izquierda, derecha)
- **Disparo**: Barra espaciadora
- **Reinicio**: Tecla R
- **Vida**: 100 puntos de HP con barra de vida visual
- **Invulnerabilidad**: 500ms después de recibir daño

### Enemigos
- **Battlecruiser**: 3 HP, 25 daño, 300 puntos, movimiento en onda senoidal
- **Frigate**: 2 HP, 15 daño, 200 puntos, movimiento en zigzag
- **Supply Ship**: 1 HP, 10 daño, 100 puntos, movimiento circular

### Elementos de Curación
- **Allied Spacedock**: Cura 10 HP, aparece cada 1 minuto máximo
- **Neutral Spacedoc**: Cura 50 HP, aparece cada 3 minutos máximo
- Los elementos no desaparecen al colisionar
- Cada elemento solo proporciona curación una vez

### Sistema de Puntuación
- Battlecruiser: 300 puntos
- Frigate: 200 puntos
- Supply Ship: 100 puntos

## Instrucciones para Arrancar el Juego

### Requisitos Previos
- Un servidor web local (no se puede abrir directamente el archivo HTML)
- Navegador web moderno con soporte para JavaScript

### Opción 1: Usar Python (Recomendado)

#### Python 3
```bash
cd wintrek-ABB
python -m http.server 8000
```
Luego abre en tu navegador: `http://localhost:8000`

#### Python 2
```bash
cd wintrek-ABB
python -m SimpleHTTPServer 8000
```
Luego abre en tu navegador: `http://localhost:8000`

### Opción 2: Usar Node.js
```bash
cd wintrek-ABB
npx http-server -p 8000
```
Luego abre en tu navegador: `http://localhost:8000`

### Opción 3: Usar PHP
```bash
cd wintrek-ABB
php -S localhost:8000
```
Luego abre en tu navegador: `http://localhost:8000`

### Opción 4: Extensiones de VS Code
Si usas Visual Studio Code, instala la extensión "Live Server" y haz clic derecho en `index.html` y selecciona "Open with Live Server".

## Controles

- **Flechas**: Mover la nave
- **Espacio**: Disparar
- **R**: Reiniciar el juego (solo en Game Over)

## Mecánicas de Juego

### Sistema de Daño
- Disparos enemigos: 10 de daño
- Colisión con enemigos: 20 de daño
- Game Over cuando HP llega a 0

### Sistema de Curación
- Colisionar con elementos de curación restaura HP
- La curación no excede el HP máximo (100)
- Cada elemento solo puede curar una vez

### Invulnerabilidad
- El jugador es invulnerable durante 500ms después de recibir daño
- Esto previene múltiples colisiones simultáneas

## Desarrollo

El juego utiliza Phaser 3 para el motor de juego y Arcade Physics para las colisiones.

### Archivos Principales
- `main.js`: Contiene toda la lógica del juego
- `index.html`: Página HTML que carga el juego
- `prompts.md`: Historial de desarrollo con todos los prompts y respuestas

## Licencia

Este es un proyecto educativo desarrollado como clon de R-Type.
Los recursos graficos y de sonido utilizados en el proyecto son a nivel de dominio publico y no me pertenecen en ningun caso.

Las marcas comerciales y logos utilizados en el proyecto pertenecen a sus respectivos dueños.

### Fondo de pantalla:
https://as2.ftcdn.net/v2/jpg/02/43/75/73/1000_F_243757367_gBpS6R5c8DB7pL5gw9gi9KXlzFfbdZOA.jpg

### Assets de las naves:
https://icons8.com/icons/

### Assets de sonido:
Utilizados del sitio 
https://pixabay.com/es/sound-effects/search/%20space%20shooter/ 
siendo estos libres de regalias.