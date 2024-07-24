// game.js

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let lives = 3;
let gameOver = false;
let canFire = true; // To control firing rate
let level = 1;

function preload() {
    // No assets to preload
}

function create() {
    // Create background
    this.add.rectangle(400, 300, 800, 600, 0x000000); // Black background

    // Create start screen (hidden for now)
    this.startScreen = this.add.text(400, 300, 'Click to Start', {
        fontSize: '48px',
        fill: '#fff'
    }).setOrigin(0.5, 0.5);
    this.startScreen.setInteractive();
    this.startScreen.on('pointerdown', startGame, this);

    // Create game over screen
    this.gameOverScreen = this.add.text(400, 300, 'Game Over', {
        fontSize: '48px',
        fill: '#fff'
    }).setOrigin(0.5, 0.5);
    this.gameOverScreen.setVisible(false);

    // Create player
    this.player = this.physics.add.sprite(400, 550, null).setOrigin(0.5, 0.5).setDisplaySize(64, 64);
    this.player.setCollideWorldBounds(true);

    // Create invaders group
    this.invaders = this.physics.add.group();

    // Create bullets group
    this.bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 10
    });

    // Create lives display
    this.livesText = this.add.text(16, 16, `Lives: ${lives}`, {
        fontSize: '32px',
        fill: '#fff'
    });

    // Create level display
    this.levelText = this.add.text(700, 16, `Level: ${level}`, {
        fontSize: '32px',
        fill: '#fff'
    });

    // Input controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Collisions
    this.physics.add.collider(this.bullets, this.invaders, hitInvader, null, this);
    this.physics.add.collider(this.player, this.invaders, hitPlayer, null, this);

    // Initialize the first level
    initializeLevel.call(this);
}

function update() {
    if (gameOver) return;

    // Player movement
    if (this.cursors.left.isDown) {
        this.player.setVelocityX(-300);
    } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(300);
    } else {
        this.player.setVelocityX(0);
    }

    // Fire bullets
    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {
        fireBullet.call(this);
    }

    // Move invaders
    this.invaders.children.iterate((invader) => {
        invader.y += 0.5 * level; // Increase speed based on level
        if (invader.y > 600) {
            invader.y = 0; // Reset position
        }
    });

    // Check for bullets going off-screen and deactivate them
    this.bullets.children.iterate((bullet) => {
        if (bullet.active && bullet.y < 0) {
            bullet.setActive(false);
            bullet.setVisible(false);
        }
    });

    // Check if all invaders are gone to progress to the next level
    if (this.invaders.countActive(true) === 0) {
        level++;
        this.levelText.setText(`Level: ${level}`);
        initializeLevel.call(this);
    }
}

function fireBullet() {
    if (gameOver || !canFire) return;

    canFire = false; // Prevent firing multiple bullets at once

    const bullet = this.bullets.get(this.player.x, this.player.y - 20, 'bullet');
    if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.body.setVelocityY(-400);

        // Allow firing again after a short delay
        this.time.addEvent({
            delay: 300,
            callback: () => { canFire = true; },
            callbackScope: this
        });
    }
}

function hitInvader(bullet, invader) {
    bullet.setActive(false);
    bullet.setVisible(false);
    invader.setActive(false);
    invader.setVisible(false);
}

function hitPlayer(player, invader) {
    invader.setActive(false);
    invader.setVisible(false);
    lives--;
    this.livesText.setText(`Lives: ${lives}`);

    if (lives <= 0) {
        gameOver = true;
        this.gameOverScreen.setVisible(true);
        this.input.keyboard.removeAllListeners();
    }
}

function initializeLevel() {
    const invaderCount = 12 + (level - 1) * 4; // Increase number of invaders per level
    for (let i = 0; i < invaderCount; i++) {
        const x = 100 + (i % 12) * 70;
        const y = 100 + Math.floor(i / 12) * 70;
        const invader = this.add.rectangle(x, y, 64, 64, 0x00ff00);
        this.physics.add.existing(invader);
        invader.body.setCollideWorldBounds(true);
        invader.body.setBounce(1, 0);
        this.invaders.add(invader);
    }
}

function resetGame() {
    lives = 3;
    level = 1;
    this.livesText.setText(`Lives: ${lives}`);
    this.levelText.setText(`Level: ${level}`);
    this.invaders.clear(true, true);
    initializeLevel.call(this);
    this.gameOverScreen.setVisible(false);
    gameOver = false;
}

function startGame() {
    this.startScreen.setVisible(false); // Hide start screen when game starts
    resetGame.call(this);
}

