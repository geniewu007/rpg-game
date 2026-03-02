const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
    },
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

let player;
let cursors;
let actionKey;
let treesGroup;
let waterGroup;
let rocksGroup;
let housesGroup;
let npc;
let dialogueBox;
let dialogueText;
let hasSword = false;
let hasBow = false;
let arrows = 0;
let arrowText;
let wood = 0;
let woodText;
let inventoryKey;
let inventoryVisible = false;
let invPanel = [];
let invSwordRow = [];
let invWoodCountText;
let invBowRow = [];
let invArrowCountText;
let chestGroup;
let swampChestOpened = false;
let desertChestOpened = false;
let hasStoneSword = false;
let hasCrystalSword = false;
let invStoneSwordRow = [];
let invCrystalSwordRow = [];
let fortressChestOpened = false;
let playerDamageMult = 1.0;
let playerClass = 1; // 0=Knight, 1=Adventurer, 2=Rogue
let playerTexturePrefix = 'player'; // 'knight' | 'player' | 'rogue'
let bossGroup;
let bossDefeated = false;
let lichSpawned = false;
let wishScreenShown = false;
let lichFinalAttackTriggered = false;
let cutsceneActive = false;
let hasShield = false;
let hasSpear = false;
let spearCharges = 0;
let isBlocking = false;
let playerFacing = 'down';
let shieldKey, spearKey;
let spearText;
let invShieldRow = [];
let invSpearRow = [];
let invSpearCountText;
let map13SageGaveGear = false;

// Touch controls state
let touchLeft = false, touchRight = false, touchUp = false, touchDown = false;
let touchShield = false, touchSpearJustPressed = false, touchActionJustPressed = false;
let touchShieldBtn = null, touchShieldBtnTxt = null;
let touchSpearBtn = null, touchSpearBtnTxt = null;
let deerGroup;
let wolfGroup;
let rabbitGroup;
let enemyGroup;
let zombieGroup;
let skeletonGroup;
let catGroup;
let companionGroup;
let laborMode = false;
let laborKey;
let laborIndicator;
let buildKey;
let playerCottages = [];
let checkpointGroup;
let lastCheckpoint = { mapIndex: 0, x: 400, y: 300 };
let checkpointsActivated = 0;
let visitedCheckpoints = new Set();
let playerHealth = 15;   // 3 HP per heart × 5 hearts
let playerMaxHealth = 15;
let playerInvincible = false;
let playerInvincibleTimer = 0;
let hearts = [];
let mapObjects = [];
let currentMapIndex = 0;
let transitioning = false;
let gameStarted = false;
let musicCtx = null;
let musicMasterGain = null;
let musicMuted = false;
let musicKey;
let musicIndicator;
const MAP_COUNT = 15;
const MAP_NAMES = ['Starting Village', 'Dark Forest', 'Rocky Badlands', 'Cursed Swamp', 'Frozen Tundra', 'Ancient Desert', 'Haunted Graveyard', 'Zombie Ruins', 'Undead Fortress', 'Crystal Caverns', 'Shadow Wastes', 'Bone Fields', 'Plague Marshes', "Death's Keep", "Lich's Throne"];
const PLAYER_SPEED = 160;
const TILE_SIZE = 32;

function preload() {
    // Generate textures programmatically since we don't have sprite files
    this.createPlayerTexture();
    this.createTileTextures();
    this.createNPCTexture();
    this.createSwordTexture();
    this.createDeerTexture();
    this.createWolfTexture();
    this.createRabbitTexture();
    this.createEnemyTexture();
    this.createZombieTexture();
    this.createExtraTerrainTextures();
    this.createHeartTextures();
    this.createCheckpointTextures();
    this.createChestTextures();
    this.createBowTexture();
    this.createStoneSwordTexture();
    this.createSkeletonTexture();
    this.createCatTexture();
    this.createCrystalSwordTexture();
    this.createLichTexture();
    this.createKnightTextures();
    this.createRogueTextures();
    this.createShieldTexture();
    this.createEmeraldSpearTexture();
    this.createDragonTexture();
}

function create() {
    // Create persistent physics groups (reused across all map transitions)
    treesGroup  = this.physics.add.staticGroup();
    waterGroup  = this.physics.add.staticGroup();
    rocksGroup  = this.physics.add.group();
    housesGroup = this.physics.add.staticGroup();
    deerGroup      = this.physics.add.group();
    wolfGroup      = this.physics.add.group();
    rabbitGroup    = this.physics.add.group();
    enemyGroup     = this.physics.add.group();
    companionGroup = this.physics.add.group();
    zombieGroup    = this.physics.add.group();
    skeletonGroup  = this.physics.add.group();
    catGroup       = this.physics.add.group();
    bossGroup      = this.physics.add.group();
    checkpointGroup = this.physics.add.staticGroup();
    chestGroup = this.physics.add.staticGroup();

    // Create player sprite
    player = this.physics.add.sprite(400, 300, 'player');
    player.setDepth(1);
    player.body.setSize(16, 16);
    player.body.setOffset(8, 14);

    // Create NPC once — shown/hidden depending on map
    npc = this.physics.add.sprite(10 * TILE_SIZE + 16, 12 * TILE_SIZE + 16, 'npc');
    npc.setDepth(1);
    npc.body.setImmovable(true);
    npc.hasGivenSword = false;

    // Set up collisions using the persistent groups (stays valid across transitions)
    this.physics.add.collider(player, treesGroup);
    this.physics.add.collider(player, waterGroup);
    this.physics.add.collider(player, housesGroup);
    this.physics.add.collider(player, npc);
    this.physics.add.collider(player, rocksGroup, pushRock, null, this);
    this.physics.add.collider(rocksGroup, treesGroup);
    this.physics.add.collider(rocksGroup, waterGroup);
    this.physics.add.collider(rocksGroup, housesGroup);
    this.physics.add.collider(rocksGroup, rocksGroup);
    this.physics.add.collider(deerGroup, treesGroup);
    this.physics.add.collider(deerGroup, waterGroup);
    this.physics.add.collider(deerGroup, housesGroup);
    this.physics.add.collider(deerGroup, deerGroup);
    this.physics.add.collider(wolfGroup, treesGroup);
    this.physics.add.collider(wolfGroup, waterGroup);
    this.physics.add.collider(wolfGroup, housesGroup);
    this.physics.add.collider(wolfGroup, wolfGroup);
    this.physics.add.collider(rabbitGroup, treesGroup);
    this.physics.add.collider(rabbitGroup, waterGroup);
    this.physics.add.collider(rabbitGroup, housesGroup);
    this.physics.add.collider(rabbitGroup, rabbitGroup);
    this.physics.add.collider(enemyGroup, treesGroup);
    this.physics.add.collider(enemyGroup, waterGroup);
    this.physics.add.collider(enemyGroup, housesGroup);
    this.physics.add.collider(enemyGroup, enemyGroup);
    this.physics.add.collider(zombieGroup, treesGroup);
    this.physics.add.collider(zombieGroup, waterGroup);
    this.physics.add.collider(zombieGroup, housesGroup);
    this.physics.add.collider(zombieGroup, zombieGroup);
    this.physics.add.collider(skeletonGroup, treesGroup);
    this.physics.add.collider(skeletonGroup, waterGroup);
    this.physics.add.collider(skeletonGroup, housesGroup);
    this.physics.add.collider(skeletonGroup, skeletonGroup);
    this.physics.add.collider(catGroup, treesGroup);
    this.physics.add.collider(catGroup, waterGroup);
    this.physics.add.collider(catGroup, housesGroup);
    this.physics.add.collider(bossGroup, treesGroup);
    this.physics.add.collider(bossGroup, waterGroup);
    this.physics.add.collider(bossGroup, housesGroup);
    this.physics.add.overlap(player, bossGroup, (p, boss) => {
        takeDamage(this, boss, 5);
    }, null, this);
    this.physics.add.overlap(player, enemyGroup, (p, enemy) => {
        takeDamage(this, enemy, 3);
    }, null, this);
    // Zombies deal 5 damage per hit (nearly 2 hearts)
    this.physics.add.overlap(player, zombieGroup, (p, zombie) => {
        takeDamage(this, zombie, 5);
    }, null, this);
    // Skeletons deal 7 damage per hit (harder than zombies)
    this.physics.add.overlap(player, skeletonGroup, (p, skeleton) => {
        takeDamage(this, skeleton, 7);
    }, null, this);
    this.physics.add.collider(companionGroup, treesGroup);
    this.physics.add.collider(companionGroup, waterGroup);
    this.physics.add.collider(companionGroup, housesGroup);
    this.physics.add.collider(companionGroup, companionGroup);

    // Set up arrow key input
    cursors   = this.input.keyboard.createCursorKeys();
    actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Camera follows player
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    // Create dialogue box (hidden initially)
    dialogueBox = this.add.rectangle(400, 520, 700, 100, 0x000000, 0.85);
    dialogueBox.setScrollFactor(0);
    dialogueBox.setDepth(200);
    dialogueBox.setStrokeStyle(3, 0xffffff);
    dialogueBox.setVisible(false);

    dialogueText = this.add.text(70, 485, '', {
        fontSize: '16px',
        fill: '#ffffff',
        wordWrap: { width: 620 }
    });
    dialogueText.setScrollFactor(0);
    dialogueText.setDepth(201);
    dialogueText.setVisible(false);

    // Wood counter HUD
    woodText = this.add.text(16, 50, 'Wood: 0', {
        fontSize: '14px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
    });
    woodText.setScrollFactor(0);
    woodText.setDepth(100);

    // Instructions
    const instructions = this.add.text(16, 16, 'Arrows: Move | Space: Interact/Chop | I: Inventory | B: Build Cottage (20 wood)', {
        fontSize: '14px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
    });
    instructions.setScrollFactor(0);
    instructions.setDepth(100);

    // Arrow counter HUD (hidden until bow obtained)
    arrowText = this.add.text(16, 68, 'Arrows: 0', {
        fontSize: '14px', fill: '#88DDFF',
        backgroundColor: '#000000', padding: { x: 10, y: 5 }
    }).setScrollFactor(0).setDepth(100).setVisible(false);

    // Health hearts HUD
    const hpLabel = this.add.text(16, 84, 'HP', {
        fontSize: '13px', fill: '#ffffff',
        backgroundColor: '#000000', padding: { x: 6, y: 4 }
    }).setScrollFactor(0).setDepth(100);
    for (let i = 0; i < 7; i++) {
        const h = this.add.image(52 + i * 18, 91, 'heart_full');
        h.setScrollFactor(0).setDepth(100).setScale(1.4).setVisible(false);
        hearts.push(h);
    }

    // Deer damage overlap
    this.physics.add.overlap(player, deerGroup, (p, deer) => {
        if (deer.isAggressive) takeDamage(this, deer);
    }, null, this);
    // Wolf damage overlap (wolves always deal 2 damage)
    this.physics.add.overlap(player, wolfGroup, (p, wolf) => {
        takeDamage(this, wolf, 2);
    }, null, this);

    // Labor mode indicator
    laborIndicator = this.add.text(400, 570, '[ LABOR MODE ]', {
        fontSize: '14px', fill: '#FFD700',
        stroke: '#000000', strokeThickness: 3,
        backgroundColor: '#00000088', padding: { x: 10, y: 5 }
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(100).setVisible(false);

    // Checkpoint overlap
    this.physics.add.overlap(player, checkpointGroup, (p, cp) => {
        activateCheckpoint(this, cp);
    }, null, this);

    // Build inventory UI
    this.createInventoryUI();
    inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    laborKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    buildKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    musicKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    shieldKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    spearKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.input.addPointer(3); // support multi-touch
    createTouchControls(this);

    // Spear HUD (hidden until obtained)
    spearText = this.add.text(16, 86, 'Spear: 0', {
        fontSize: '14px', fill: '#44ffaa',
        backgroundColor: '#000000', padding: { x: 10, y: 5 }
    }).setScrollFactor(0).setDepth(100).setVisible(false);

    musicIndicator = this.add.text(784, 16, '♪', {
        fontSize: '16px', fill: '#aaffaa',
        backgroundColor: '#000000', padding: { x: 6, y: 4 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100).setVisible(false);

    // Load the starting map
    this.loadMap(0, 400, 300);

    // Title screen overlay
    const titleOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 1)
        .setScrollFactor(0).setDepth(1000);

    const titleText = this.add.text(400, 230, 'For Peace', {
        fontSize: '72px',
        fill: '#f0d080',
        stroke: '#000000',
        strokeThickness: 6,
        fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    const subtitleText = this.add.text(400, 330, 'A journey begins...', {
        fontSize: '22px',
        fill: '#aaaacc',
        stroke: '#000000',
        strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    const promptText = this.add.text(400, 430, 'Press any key to begin', {
        fontSize: '18px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    // Pulse the prompt text
    this.tweens.add({
        targets: promptText,
        alpha: 0.2,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    const showBackstory = () => {
        // Fade out title elements
        this.tweens.add({
            targets: [titleText, subtitleText, promptText],
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                titleText.destroy();
                subtitleText.destroy();
                promptText.destroy();
            }
        });

        // Backstory panel
        const storyBg = this.add.rectangle(400, 300, 680, 420, 0x0a0a1a, 0.97)
            .setScrollFactor(0).setDepth(1002);
        storyBg.setStrokeStyle(2, 0x6655aa);

        const storyHeader = this.add.text(400, 108, '~ A World Once at Peace ~', {
            fontSize: '20px', fill: '#ccbbff',
            stroke: '#000000', strokeThickness: 3,
            fontStyle: 'italic'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1003);

        const lines = [
            'Long ago, these lands flourished in harmony.',
            'Humans, animals, and nature lived as one —',
            'forests full of life, villages full of laughter.',
            '',
            'Then darkness crept in from the east.',
            'Goblins, zombies, and skeletons spread a vile curse',
            'across the land, infecting the animals and twisting',
            'their hearts, turning them against the people they',
            'once lived beside.',
            '',
            'Villages burned. Forests fell silent with fear.',
            'The peace that once defined these lands was gone.',
            '',
            'You are the last hope.',
            'Take up arms, seek allies, and restore what was lost.',
            '',
            'This is your adventure.',
            ''
        ];

        const storyBody = this.add.text(400, 148, lines.join('\n'), {
            fontSize: '14px', fill: '#ddd8ee',
            stroke: '#000000', strokeThickness: 2,
            lineSpacing: 6,
            align: 'center',
            wordWrap: { width: 620 }
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1003);

        const storyTitle = this.add.text(400, 490, 'For Peace', {
            fontSize: '28px', fill: '#f0d080',
            stroke: '#000000', strokeThickness: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1003);

        const startPrompt = this.add.text(400, 530, 'Press any key to begin your journey', {
            fontSize: '16px', fill: '#ffffff',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1003);

        this.tweens.add({
            targets: startPrompt,
            alpha: 0.2, duration: 800, yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const showCharSelect = () => {
            // Fade out backstory
            const storyEls = [storyBg, storyHeader, storyBody, storyTitle, startPrompt];
            this.tweens.add({ targets: storyEls, alpha: 0, duration: 500, ease: 'Power2',
                onComplete: () => storyEls.forEach(e => e.destroy()) });

            const selBg = this.add.rectangle(400, 300, 740, 480, 0x080810, 0.97)
                .setScrollFactor(0).setDepth(1002).setStrokeStyle(2, 0x8866cc);
            const selTitle = this.add.text(400, 75, 'Choose Your Hero', {
                fontSize: '26px', fill: '#f0d080', stroke: '#000', strokeThickness: 4, fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(1003);
            const selHint = this.add.text(400, 555, 'Click a card to begin your journey', {
                fontSize: '13px', fill: '#888899', stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setScrollFactor(0).setDepth(1003);

            const classes = [
                { name: 'Knight',     sub: 'The Defender',   hp: 21, dmg: 0.7,  color: 0x4488CC,
                  desc: 'Built to endure.\nHigh HP, reduced attack.',
                  hpStr: '♥♥♥♥♥♥♥', atkStr: '★★☆☆☆', x: 180, texKey: 'knight' },
                { name: 'Adventurer', sub: 'The Wanderer',   hp: 15, dmg: 1.0,  color: 0x44AA55,
                  desc: 'Well-rounded.\nBalanced HP and attack.',
                  hpStr: '♥♥♥♥♥',   atkStr: '★★★☆☆', x: 400, texKey: 'player' },
                { name: 'Rogue',      sub: 'The Glass Cannon', hp: 9, dmg: 1.5, color: 0xCC4444,
                  desc: 'Strike hard, die fast.\nHigh attack, low HP.',
                  hpStr: '♥♥♥',     atkStr: '★★★★★', x: 620, texKey: 'rogue' }
            ];

            const cardEls = [];
            classes.forEach((cls, clsIdx) => {
                const card = this.add.rectangle(cls.x, 315, 190, 360, cls.color, 0.12)
                    .setScrollFactor(0).setDepth(1003).setStrokeStyle(2, cls.color).setInteractive();
                card.on('pointerover', () => { card.setFillStyle(cls.color, 0.3); card.setStrokeStyle(3, cls.color); });
                card.on('pointerout',  () => { card.setFillStyle(cls.color, 0.12); card.setStrokeStyle(2, cls.color); });
                card.on('pointerdown', () => {
                    playerMaxHealth = cls.hp;
                    playerHealth = cls.hp;
                    playerDamageMult = cls.dmg;
                    playerClass = clsIdx;
                    playerTexturePrefix = cls.texKey;
                    player.setTexture(cls.texKey);
                    updateHearts();
                    gameStarted = true;
                    startBackgroundMusic();
                    musicIndicator.setVisible(true);
                    const all = [titleOverlay, selBg, selTitle, selHint, ...cardEls];
                    all.forEach(e => { if (e && e.active) e.destroy(); });
                });

                const nameT = this.add.text(cls.x, 145, cls.name, {
                    fontSize: '20px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
                }).setOrigin(0.5).setScrollFactor(0).setDepth(1004);
                const subT = this.add.text(cls.x, 172, cls.sub, {
                    fontSize: '11px', fill: '#aaaaaa', fontStyle: 'italic'
                }).setOrigin(0.5).setScrollFactor(0).setDepth(1004);

                const divLine = this.add.rectangle(cls.x, 190, 150, 1, cls.color, 0.6)
                    .setScrollFactor(0).setDepth(1004);

                const hpLbl = this.add.text(cls.x, 210, 'HP', { fontSize: '11px', fill: '#ff9999' })
                    .setOrigin(0.5).setScrollFactor(0).setDepth(1004);
                const hpT = this.add.text(cls.x, 228, cls.hpStr, { fontSize: '13px', fill: '#ff5555' })
                    .setOrigin(0.5).setScrollFactor(0).setDepth(1004);
                const atkLbl = this.add.text(cls.x, 265, 'ATK', { fontSize: '11px', fill: '#ffdd88' })
                    .setOrigin(0.5).setScrollFactor(0).setDepth(1004);
                const atkT = this.add.text(cls.x, 283, cls.atkStr, { fontSize: '13px', fill: '#ffcc00' })
                    .setOrigin(0.5).setScrollFactor(0).setDepth(1004);

                const descT = this.add.text(cls.x, 340, cls.desc, {
                    fontSize: '11px', fill: '#cccccc', align: 'center', lineSpacing: 5
                }).setOrigin(0.5).setScrollFactor(0).setDepth(1004);

                const clickT = this.add.text(cls.x, 455, '▶  Select', {
                    fontSize: '13px', fill: '#ffffff', stroke: '#000', strokeThickness: 2,
                    backgroundColor: '#' + cls.color.toString(16).padStart(6, '0') + '99',
                    padding: { x: 14, y: 6 }
                }).setOrigin(0.5).setScrollFactor(0).setDepth(1004);

                // Character sprite preview (large, centered on card)
                const preview = this.add.image(cls.x, 380, cls.texKey + '_down')
                    .setScrollFactor(0).setDepth(1004).setScale(3);

                cardEls.push(card, nameT, subT, divLine, hpLbl, hpT, atkLbl, atkT, descT, clickT, preview);
            });
        };

        this.time.delayedCall(400, () => {
            this.input.keyboard.once('keydown', showCharSelect);
            this.input.once('pointerdown', showCharSelect);
        });
    };

    this.input.keyboard.once('keydown', showBackstory);
    this.input.once('pointerdown', showBackstory);
}

// Procedural background music using Web Audio API
function startBackgroundMusic() {
    if (musicCtx) return; // already running
    try {
        musicCtx = new (window.AudioContext || window.webkitAudioContext)();
        musicMasterGain = musicCtx.createGain();
        musicMasterGain.gain.value = 0.25;
        musicMasterGain.connect(musicCtx.destination);

        // Soft echo/reverb via feedback delay
        const delay = musicCtx.createDelay(0.6);
        delay.delayTime.value = 0.38;
        const delayGain = musicCtx.createGain();
        delayGain.gain.value = 0.22;
        delay.connect(delayGain);
        delayGain.connect(delay);
        delayGain.connect(musicMasterGain);

        // Melody in C natural minor (atmospheric RPG feel)
        const seq = [
            { f: 261.63, d: 0.5 }, // C4
            { f: 311.13, d: 0.5 }, // Eb4
            { f: 392.00, d: 0.5 }, // G4
            { f: 349.23, d: 0.5 }, // F4
            { f: 261.63, d: 1.0 }, // C4 held
            { f: 0,      d: 0.5 }, // rest
            { f: 293.66, d: 0.5 }, // D4
            { f: 349.23, d: 0.5 }, // F4
            { f: 466.16, d: 0.5 }, // Bb4
            { f: 392.00, d: 1.0 }, // G4 held
            { f: 0,      d: 0.5 }, // rest
            { f: 311.13, d: 0.5 }, // Eb4
            { f: 261.63, d: 0.5 }, // C4
            { f: 196.00, d: 0.5 }, // G3
            { f: 220.00, d: 0.5 }, // A3
            { f: 261.63, d: 1.5 }, // C4 long hold
            { f: 0,      d: 0.8 }, // rest
        ];

        let idx = 0;
        let schedTime = musicCtx.currentTime + 0.1;

        function schedule() {
            while (schedTime < musicCtx.currentTime + 2.5) {
                const note = seq[idx % seq.length];
                if (note.f > 0) {
                    const osc = musicCtx.createOscillator();
                    const env = musicCtx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.value = note.f;
                    env.gain.setValueAtTime(0, schedTime);
                    env.gain.linearRampToValueAtTime(0.16, schedTime + 0.05);
                    env.gain.exponentialRampToValueAtTime(0.001, schedTime + note.d * 0.88);
                    osc.connect(env);
                    env.connect(musicMasterGain);
                    env.connect(delay);
                    osc.start(schedTime);
                    osc.stop(schedTime + note.d);
                }
                schedTime += note.d;
                idx++;
            }
            setTimeout(schedule, 600);
        }
        schedule();

        // Deep bass drone on C2
        const bass = musicCtx.createOscillator();
        const bassGain = musicCtx.createGain();
        bass.type = 'sine';
        bass.frequency.value = 65.41;
        bassGain.gain.value = 0.09;
        bass.connect(bassGain);
        bassGain.connect(musicMasterGain);
        bass.start();

        // Soft ambient pad — C minor chord (C3, Eb3, G3)
        [130.81, 155.56, 196.00].forEach(freq => {
            const osc = musicCtx.createOscillator();
            const gain = musicCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.value = 0.035;
            osc.connect(gain);
            gain.connect(musicMasterGain);
            osc.start();
        });

    } catch (e) {
        console.warn('Web Audio not available:', e);
    }
}

// Push rock function
function pushRock(player, rock) {
    const pushForce = 80;

    // Calculate push direction based on player velocity
    if (player.body.velocity.x > 0) {
        rock.body.velocity.x = pushForce;
    } else if (player.body.velocity.x < 0) {
        rock.body.velocity.x = -pushForce;
    }

    if (player.body.velocity.y > 0) {
        rock.body.velocity.y = pushForce;
    } else if (player.body.velocity.y < 0) {
        rock.body.velocity.y = -pushForce;
    }
}

// Chop tree function
function chopTree(scene) {
    const chopRange = 40;

    treesGroup.getChildren().forEach(tree => {
        if (!tree.active) return;

        const distance = Phaser.Math.Distance.Between(
            player.x, player.y,
            tree.x, tree.y
        );

        if (distance < chopRange) {
            tree.health--;
            createChopEffect(scene, tree.x, tree.y);

            if (tree.health <= 0) {
                // Create stump at tree position
                const stump = scene.add.image(tree.x, tree.y, 'stump');
                stump.setDepth(0);
                mapObjects.push(stump);

                // Remove tree visual and collider
                if (tree.visual) {
                    tree.visual.destroy();
                }
                tree.destroy();

                // Increment wood counter
                wood++;
                woodText.setText('Wood: ' + wood);
                invWoodCountText.setText('x ' + wood);
            } else {
                // Shake the tree visually
                if (tree.visual) {
                    scene.tweens.add({
                        targets: tree.visual,
                        x: tree.x + 3,
                        duration: 50,
                        yoyo: true,
                        repeat: 2,
                        onComplete: () => { tree.visual.x = tree.x; }
                    });
                }
            }

            return; // Only chop one tree at a time
        }
    });
}

// Attack nearby enemies (goblins + zombies) with sword — returns true if one was hit
function attackEnemies(scene) {
    if (!hasSword && !hasStoneSword && !hasCrystalSword) return false;
    const range = hasCrystalSword ? 105 : (hasStoneSword ? 85 : 68);
    const baseDmg = hasCrystalSword ? 3 : (hasStoneSword ? 2 : 1);
    const dmg = Math.max(1, Math.round(baseDmg * playerDamageMult));
    let hit = false;

    const hitEnemy = (enemy, particleColor) => {
        if (!enemy.active || hit) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
        if (dist > range) return;

        hit = true;
        enemy.health -= dmg;

        const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
        enemy.setVelocityX(Math.cos(angle) * 200);
        enemy.setVelocityY(Math.sin(angle) * 200);

        if (enemy.health <= 0) {
            for (let i = 0; i < 8; i++) {
                const p = scene.add.rectangle(
                    enemy.x + Phaser.Math.Between(-10, 10),
                    enemy.y + Phaser.Math.Between(-10, 10),
                    4, 4, particleColor
                ).setDepth(2);
                scene.tweens.add({
                    targets: p,
                    x: p.x + Phaser.Math.Between(-35, 35),
                    y: p.y + Phaser.Math.Between(-40, 15),
                    alpha: 0, duration: 500, ease: 'Power2',
                    onComplete: () => p.destroy()
                });
            }
            enemy.destroy();
        } else {
            enemy.setTint(0xffffff);
            scene.time.delayedCall(120, () => { if (enemy.active) enemy.clearTint(); });
        }
    };

    enemyGroup.getChildren().forEach(e => hitEnemy(e, 0x4A6A3A));
    if (!hit) zombieGroup.getChildren().forEach(e => hitEnemy(e, 0x2A5A1A));
    if (!hit) skeletonGroup.getChildren().forEach(e => hitEnemy(e, 0xCCCCBB));
    if (!hit) bossGroup.getChildren().forEach(e => hitEnemy(e, 0x9922FF));

    return hit;
}

// Attack nearby animals with sword — returns true if an animal was hit
function attackAnimals(scene) {
    if (!hasSword) return false;
    const range = 68;
    let hit = false;

    const tryHit = (group) => {
        if (hit) return;
        group.getChildren().forEach(animal => {
            if (!animal.active || hit) return;
            const dist = Phaser.Math.Distance.Between(player.x, player.y, animal.x, animal.y);
            if (dist > range) return;

            hit = true;
            animal.health--;

            const angle = Phaser.Math.Angle.Between(player.x, player.y, animal.x, animal.y);
            animal.setVelocityX(Math.cos(angle) * 180);
            animal.setVelocityY(Math.sin(angle) * 180);

            if (animal.health <= 0) {
                tameAnimal(scene, animal);
            } else {
                animal.setTint(0xffffff);
                scene.time.delayedCall(120, () => {
                    if (!animal.active) return;
                    if (animal.restoreTint) animal.setTint(animal.restoreTint);
                    else animal.clearTint();
                });
            }
        });
    };

    tryHit(deerGroup);
    tryHit(wolfGroup);
    tryHit(rabbitGroup);
    return hit;
}

// Particle effect for chopping
function createChopEffect(scene, x, y) {
    for (let i = 0; i < 8; i++) {
        const particle = scene.add.rectangle(
            x + Phaser.Math.Between(-10, 10),
            y + Phaser.Math.Between(-10, 10),
            4, 4,
            0x4a2f1a
        );
        particle.setDepth(2);

        scene.tweens.add({
            targets: particle,
            x: particle.x + Phaser.Math.Between(-30, 30),
            y: particle.y + Phaser.Math.Between(-40, 20),
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => particle.destroy()
        });
    }
}

function update() {
    if (!gameStarted || cutsceneActive) return;

    // Reset velocity
    player.setVelocity(0);

    // Shield block — slow player while holding D (or touch shield btn)
    isBlocking = hasShield && (shieldKey.isDown || touchShield);
    const speed = isBlocking ? PLAYER_SPEED * 0.35 : PLAYER_SPEED;

    // Show/hide touch shield and spear buttons dynamically
    if (touchShieldBtn) { touchShieldBtn.setVisible(hasShield); touchShieldBtnTxt.setVisible(hasShield); }
    if (touchSpearBtn)  { touchSpearBtn.setVisible(hasSpear);   touchSpearBtnTxt.setVisible(hasSpear); }

    // Horizontal movement
    if (cursors.left.isDown || touchLeft) {
        player.setVelocityX(-speed);
        player.setTexture(playerTexturePrefix + '_left');
        playerFacing = 'left';
    } else if (cursors.right.isDown || touchRight) {
        player.setVelocityX(speed);
        player.setTexture(playerTexturePrefix + '_right');
        playerFacing = 'right';
    }

    // Vertical movement
    if (cursors.up.isDown || touchUp) {
        player.setVelocityY(-speed);
        if (!cursors.left.isDown && !cursors.right.isDown && !touchLeft && !touchRight) {
            player.setTexture(playerTexturePrefix + '_up');
            playerFacing = 'up';
        }
    } else if (cursors.down.isDown || touchDown) {
        player.setVelocityY(speed);
        if (!cursors.left.isDown && !cursors.right.isDown && !touchLeft && !touchRight) {
            player.setTexture(playerTexturePrefix + '_down');
            playerFacing = 'down';
        }
    }

    // Throw spear — S key or touch
    if (hasSpear && (Phaser.Input.Keyboard.JustDown(spearKey) || touchSpearJustPressed)) {
        throwSpear(this);
    }
    touchSpearJustPressed = false;

    // Shield visual tint
    if (isBlocking) {
        player.setTint(0x88CCFF);
    } else if (!playerInvincible) {
        player.clearTint();
    }

    // Normalize diagonal movement
    if (player.body.velocity.x !== 0 && player.body.velocity.y !== 0) {
        player.setVelocityX(player.body.velocity.x * 0.707);
        player.setVelocityY(player.body.velocity.y * 0.707);
    }

    // Handle spacebar actions (or touch attack btn)
    if (Phaser.Input.Keyboard.JustDown(actionKey) || touchActionJustPressed) {
        touchActionJustPressed = false;
        // Check if dialogue is showing - close it
        if (dialogueBox.visible) {
            hideDialogue();
        } else {
            // Check if near NPC first
            const distToNPC = Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y);
            const nearCompanion = companionGroup.getChildren().find(c =>
                c.active && Phaser.Math.Distance.Between(player.x, player.y, c.x, c.y) < 50
            );
            const nearChest = chestGroup.getChildren().find(c =>
                c.active && Phaser.Math.Distance.Between(player.x, player.y, c.x, c.y) < 44
            );
            if (nearChest && !nearChest.opened) {
                openChest(this, nearChest);
            } else if (distToNPC < 50 && npc.visible) {
                interactWithNPC(this);
            } else if (nearCompanion) {
                showCompanionStats(this, nearCompanion);
            } else if (!attackAnimals(this) && !attackEnemies(this)) {
                if (!fireBow(this)) {
                    chopTree(this);
                }
            }
        }
    }

    // Edge detection — walk through exit portals at map edges
    if (!transitioning) {
        const b = this.physics.world.bounds;
        const m = 6;
        const nextMap = (currentMapIndex + 1) % MAP_COUNT;
        const prevMap = (currentMapIndex - 1 + MAP_COUNT) % MAP_COUNT;
        if      (player.x <= m && currentMapIndex !== 0) transitionMap(this, 'left',  prevMap);
        else if (player.x >= b.width  - m && !(currentMapIndex === 14 && !bossDefeated)) transitionMap(this, 'right', nextMap);
        else if (player.y <= m)            transitionMap(this, 'up',    nextMap);
        else if (player.y >= b.height - m) transitionMap(this, 'down',  nextMap);
    }

    // Build cottage (B key)
    if (Phaser.Input.Keyboard.JustDown(buildKey)) {
        buildCottage(this);
    }

    // Toggle labor mode (L key)
    if (Phaser.Input.Keyboard.JustDown(laborKey)) {
        laborMode = !laborMode;
        laborIndicator.setVisible(laborMode);
    }

    // Toggle music (M key)
    if (Phaser.Input.Keyboard.JustDown(musicKey) && musicMasterGain) {
        musicMuted = !musicMuted;
        musicMasterGain.gain.value = musicMuted ? 0 : 0.25;
        musicIndicator.setText(musicMuted ? '♪ OFF' : '♪');
        musicIndicator.setStyle({ fill: musicMuted ? '#ff8888' : '#aaffaa' });
    }

    // Companion update — cottage-based behaviour
    companionGroup.getChildren().forEach(companion => {
        if (!companion.active) return;

        const cottage = companion.homeCottage;
        if (cottage) {
            const playerNear = Phaser.Math.Distance.Between(
                player.x, player.y, cottage.x, cottage.y) < 120;

            if (playerNear) {
                if (companion.animalName === 'Wolf') {
                    companionWolfProtect(this, companion);
                } else if (companion.animalName === 'Deer') {
                    companionLabor(this, companion);
                } else if (companion.animalName === 'Rabbit') {
                    companionRabbitAttack(this, companion);
                }
            } else {
                // Stay near cottage
                const d = Phaser.Math.Distance.Between(
                    companion.x, companion.y, cottage.x, cottage.y);
                if (d > 55) {
                    const a = Math.atan2(cottage.y - companion.y, cottage.x - companion.x);
                    companion.setVelocityX(Math.cos(a) * 60);
                    companion.setVelocityY(Math.sin(a) * 60);
                } else {
                    companion.setVelocity(0);
                }
            }
        } else {
            companion.setVelocity(0);
        }

        if (companion.body.velocity.x < -5) companion.setFlipX(true);
        else if (companion.body.velocity.x > 5) companion.setFlipX(false);
    });

    // Toggle inventory
    if (Phaser.Input.Keyboard.JustDown(inventoryKey)) {
        inventoryVisible = !inventoryVisible;
        invPanel.forEach(el => el.setVisible(inventoryVisible));
        invSwordRow.forEach(el => el.setVisible(inventoryVisible && hasSword));
        invBowRow.forEach(el => el.setVisible(inventoryVisible && hasBow));
        invStoneSwordRow.forEach(el => el.setVisible(inventoryVisible && hasStoneSword));
        invCrystalSwordRow.forEach(el => el.setVisible(inventoryVisible && hasCrystalSword));
        invShieldRow.forEach(el => el.setVisible(inventoryVisible && hasShield));
        invSpearRow.forEach(el => el.setVisible(inventoryVisible && hasSpear));
    }

    // Invincibility countdown
    if (playerInvincible) {
        playerInvincibleTimer--;
        if (playerInvincibleTimer <= 0) {
            playerInvincible = false;
            player.setAlpha(1);
        }
    }

    // Deer AI
    deerGroup.getChildren().forEach(deer => {
        if (!deer.active) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, deer.x, deer.y);

        if (deer.isAggressive) {
            // Aggressive deer: charge the player when nearby
            if (dist < 160) {
                deer.deerState = 'charge';
                const angle = Phaser.Math.Angle.Between(deer.x, deer.y, player.x, player.y);
                deer.setVelocityX(Math.cos(angle) * 150);
                deer.setVelocityY(Math.sin(angle) * 150);
            } else {
                if (deer.deerState === 'charge') {
                    deer.deerState = 'idle';
                    deer.setVelocity(0);
                    deer.wanderTimer = Phaser.Math.Between(60, 120);
                }
                deer.wanderTimer--;
                if (deer.wanderTimer <= 0) {
                    const angle = Math.random() * Math.PI * 2;
                    deer.setVelocityX(Math.cos(angle) * 45);
                    deer.setVelocityY(Math.sin(angle) * 45);
                    deer.deerState = 'wander';
                    deer.wanderTimer = Phaser.Math.Between(60, 150);
                }
                if (deer.deerState !== 'charge') {
                    deer.body.velocity.x *= 0.92;
                    deer.body.velocity.y *= 0.92;
                }
            }
        } else {
            // Passive deer: flee from player
            if (dist < 110) {
                deer.deerState = 'flee';
                deer.wanderTimer = 90;
                const angle = Phaser.Math.Angle.Between(player.x, player.y, deer.x, deer.y);
                deer.setVelocityX(Math.cos(angle) * 170);
                deer.setVelocityY(Math.sin(angle) * 170);
            } else {
                deer.wanderTimer--;
                if (deer.wanderTimer <= 0) {
                    if (deer.deerState === 'flee' || Math.random() < 0.45) {
                        deer.deerState = 'wander';
                        const angle = Math.random() * Math.PI * 2;
                        deer.setVelocityX(Math.cos(angle) * 50);
                        deer.setVelocityY(Math.sin(angle) * 50);
                        deer.wanderTimer = Phaser.Math.Between(80, 180);
                    } else {
                        deer.deerState = 'idle';
                        deer.setVelocity(0);
                        deer.wanderTimer = Phaser.Math.Between(60, 160);
                    }
                }
                deer.body.velocity.x *= 0.92;
                deer.body.velocity.y *= 0.92;
                if (Math.abs(deer.body.velocity.x) < 2) deer.body.velocity.x = 0;
                if (Math.abs(deer.body.velocity.y) < 2) deer.body.velocity.y = 0;
            }
        }
        // Flip sprite to face movement direction
        if (deer.body.velocity.x < -5) deer.setFlipX(true);
        else if (deer.body.velocity.x > 5) deer.setFlipX(false);
    });

    // Wolf AI (always aggressive, bigger chase range, faster)
    wolfGroup.getChildren().forEach(wolf => {
        if (!wolf.active) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, wolf.x, wolf.y);

        if (dist < 200) {
            wolf.deerState = 'chase';
            const angle = Phaser.Math.Angle.Between(wolf.x, wolf.y, player.x, player.y);
            wolf.setVelocityX(Math.cos(angle) * 130);
            wolf.setVelocityY(Math.sin(angle) * 130);
        } else {
            if (wolf.deerState === 'chase') {
                wolf.deerState = 'idle';
                wolf.setVelocity(0);
                wolf.wanderTimer = Phaser.Math.Between(60, 120);
            }
            wolf.wanderTimer--;
            if (wolf.wanderTimer <= 0) {
                const angle = Math.random() * Math.PI * 2;
                wolf.setVelocityX(Math.cos(angle) * 55);
                wolf.setVelocityY(Math.sin(angle) * 55);
                wolf.deerState = 'wander';
                wolf.wanderTimer = Phaser.Math.Between(60, 150);
            }
            if (wolf.deerState !== 'chase') {
                wolf.body.velocity.x *= 0.92;
                wolf.body.velocity.y *= 0.92;
            }
        }
        if (wolf.body.velocity.x < -5) wolf.setFlipX(true);
        else if (wolf.body.velocity.x > 5) wolf.setFlipX(false);
    });

    // Rabbit AI (passive, very fast flee)
    rabbitGroup.getChildren().forEach(rabbit => {
        if (!rabbit.active) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, rabbit.x, rabbit.y);

        if (dist < 130) {
            rabbit.deerState = 'flee';
            rabbit.wanderTimer = 90;
            const angle = Phaser.Math.Angle.Between(player.x, player.y, rabbit.x, rabbit.y);
            rabbit.setVelocityX(Math.cos(angle) * 220);
            rabbit.setVelocityY(Math.sin(angle) * 220);
        } else {
            rabbit.wanderTimer--;
            if (rabbit.wanderTimer <= 0) {
                if (rabbit.deerState === 'flee' || Math.random() < 0.4) {
                    rabbit.deerState = 'wander';
                    const angle = Math.random() * Math.PI * 2;
                    rabbit.setVelocityX(Math.cos(angle) * 60);
                    rabbit.setVelocityY(Math.sin(angle) * 60);
                    rabbit.wanderTimer = Phaser.Math.Between(60, 150);
                } else {
                    rabbit.deerState = 'idle';
                    rabbit.setVelocity(0);
                    rabbit.wanderTimer = Phaser.Math.Between(40, 120);
                }
            }
            rabbit.body.velocity.x *= 0.88;
            rabbit.body.velocity.y *= 0.88;
            if (Math.abs(rabbit.body.velocity.x) < 2) rabbit.body.velocity.x = 0;
            if (Math.abs(rabbit.body.velocity.y) < 2) rabbit.body.velocity.y = 0;
        }
        if (rabbit.body.velocity.x < -5) rabbit.setFlipX(true);
        else if (rabbit.body.velocity.x > 5) rabbit.setFlipX(false);
    });

    // Zombie AI (slow, relentless, high health)
    zombieGroup.getChildren().forEach(zombie => {
        if (!zombie.active) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, zombie.x, zombie.y);

        if (dist < 220) {
            zombie.enemyState = 'chase';
            const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, player.x, player.y);
            zombie.setVelocityX(Math.cos(angle) * 60);
            zombie.setVelocityY(Math.sin(angle) * 60);
        } else {
            if (zombie.enemyState === 'chase') {
                zombie.enemyState = 'idle';
                zombie.setVelocity(0);
                zombie.wanderTimer = Phaser.Math.Between(40, 100);
            }
            zombie.wanderTimer--;
            if (zombie.wanderTimer <= 0) {
                if (Math.random() < 0.4) {
                    const angle = Math.random() * Math.PI * 2;
                    zombie.setVelocityX(Math.cos(angle) * 28);
                    zombie.setVelocityY(Math.sin(angle) * 28);
                    zombie.enemyState = 'wander';
                    zombie.wanderTimer = Phaser.Math.Between(80, 180);
                } else {
                    zombie.setVelocity(0);
                    zombie.enemyState = 'idle';
                    zombie.wanderTimer = Phaser.Math.Between(60, 140);
                }
            }
            if (zombie.enemyState !== 'chase') {
                zombie.body.velocity.x *= 0.88;
                zombie.body.velocity.y *= 0.88;
            }
        }
        if (zombie.body.velocity.x < -5) zombie.setFlipX(true);
        else if (zombie.body.velocity.x > 5) zombie.setFlipX(false);
    });

    // Enemy (goblin) AI
    enemyGroup.getChildren().forEach(enemy => {
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);

        if (dist < 180) {
            // Chase player
            enemy.enemyState = 'chase';
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
            enemy.setVelocityX(Math.cos(angle) * 85);
            enemy.setVelocityY(Math.sin(angle) * 85);
        } else {
            if (enemy.enemyState === 'chase') {
                enemy.enemyState = 'idle';
                enemy.setVelocity(0);
                enemy.wanderTimer = Phaser.Math.Between(60, 120);
            }
            enemy.wanderTimer--;
            if (enemy.wanderTimer <= 0) {
                if (Math.random() < 0.5) {
                    const angle = Math.random() * Math.PI * 2;
                    enemy.setVelocityX(Math.cos(angle) * 40);
                    enemy.setVelocityY(Math.sin(angle) * 40);
                    enemy.enemyState = 'wander';
                    enemy.wanderTimer = Phaser.Math.Between(60, 150);
                } else {
                    enemy.setVelocity(0);
                    enemy.enemyState = 'idle';
                    enemy.wanderTimer = Phaser.Math.Between(60, 130);
                }
            }
            if (enemy.enemyState !== 'chase') {
                enemy.body.velocity.x *= 0.9;
                enemy.body.velocity.y *= 0.9;
            }
        }
        if (enemy.body.velocity.x < -5) enemy.setFlipX(true);
        else if (enemy.body.velocity.x > 5) enemy.setFlipX(false);
    });

    // Skeleton AI (faster and more aggressive than zombies)
    skeletonGroup.getChildren().forEach(skeleton => {
        if (!skeleton.active) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, skeleton.x, skeleton.y);

        if (skeleton.isArcher) {
            // Archer skeleton — strafe to keep distance, shoot arrows periodically
            const preferredDist = 160;
            if (dist < 340) {
                if (dist < preferredDist - 20) {
                    // Too close — back away
                    const angle = Phaser.Math.Angle.Between(player.x, player.y, skeleton.x, skeleton.y);
                    skeleton.setVelocityX(Math.cos(angle) * 75);
                    skeleton.setVelocityY(Math.sin(angle) * 75);
                } else if (dist > preferredDist + 20) {
                    // Too far — close in a little
                    const angle = Phaser.Math.Angle.Between(skeleton.x, skeleton.y, player.x, player.y);
                    skeleton.setVelocityX(Math.cos(angle) * 55);
                    skeleton.setVelocityY(Math.sin(angle) * 55);
                } else {
                    // Strafe sideways
                    const angle = Phaser.Math.Angle.Between(skeleton.x, skeleton.y, player.x, player.y) + Math.PI / 2;
                    skeleton.setVelocityX(Math.cos(angle) * 50);
                    skeleton.setVelocityY(Math.sin(angle) * 50);
                }

                // Fire arrow
                skeleton.arrowCooldown--;
                if (skeleton.arrowCooldown <= 0) {
                    skeleton.arrowCooldown = Phaser.Math.Between(90, 160);
                    const angle = Phaser.Math.Angle.Between(skeleton.x, skeleton.y, player.x, player.y);
                    const arrowVis = this.add.rectangle(skeleton.x, skeleton.y, 10, 3, 0xCCBB55)
                        .setDepth(2).setRotation(angle);
                    // Predict player position slightly ahead for a harder shot
                    const targetX = player.x + player.body.velocity.x * 0.12;
                    const targetY = player.y + player.body.velocity.y * 0.12;
                    this.tweens.add({
                        targets: arrowVis,
                        x: targetX, y: targetY,
                        duration: 320, ease: 'Linear',
                        onComplete: () => {
                            const hitDist = Phaser.Math.Distance.Between(arrowVis.x, arrowVis.y, player.x, player.y);
                            arrowVis.destroy();
                            if (hitDist < 22) takeDamage(this, skeleton, 4);
                        }
                    });
                }
            } else {
                skeleton.setVelocity(0);
            }
        } else {
            // Standard melee skeleton
            if (dist < 260) {
                skeleton.enemyState = 'chase';
                const angle = Phaser.Math.Angle.Between(skeleton.x, skeleton.y, player.x, player.y);
                skeleton.setVelocityX(Math.cos(angle) * 100);
                skeleton.setVelocityY(Math.sin(angle) * 100);
            } else {
                if (skeleton.enemyState === 'chase') {
                    skeleton.enemyState = 'idle';
                    skeleton.setVelocity(0);
                    skeleton.wanderTimer = Phaser.Math.Between(30, 80);
                }
                skeleton.wanderTimer--;
                if (skeleton.wanderTimer <= 0) {
                    if (Math.random() < 0.5) {
                        const angle = Math.random() * Math.PI * 2;
                        skeleton.setVelocityX(Math.cos(angle) * 45);
                        skeleton.setVelocityY(Math.sin(angle) * 45);
                        skeleton.enemyState = 'wander';
                        skeleton.wanderTimer = Phaser.Math.Between(50, 130);
                    } else {
                        skeleton.setVelocity(0);
                        skeleton.enemyState = 'idle';
                        skeleton.wanderTimer = Phaser.Math.Between(40, 100);
                    }
                }
                if (skeleton.enemyState !== 'chase') {
                    skeleton.body.velocity.x *= 0.88;
                    skeleton.body.velocity.y *= 0.88;
                }
            }
        }
        if (skeleton.body.velocity.x < -5) skeleton.setFlipX(true);
        else if (skeleton.body.velocity.x > 5) skeleton.setFlipX(false);
    });

    // ---- Map 14 logic: spawn Lich when army is cleared, handle boss death ----
    if (currentMapIndex === 14 && !lichSpawned) {
        const armyLeft = enemyGroup.countActive() + zombieGroup.countActive() + skeletonGroup.countActive();
        if (armyLeft === 0) {
            lichSpawned = true;
            // Small delay then spawn with dramatic intro
            this.time.delayedCall(600, () => {
                const bx = 15 * TILE_SIZE + TILE_SIZE / 2;
                const by = 6 * TILE_SIZE + TILE_SIZE / 2;
                const lich = bossGroup.create(bx, by, 'lich');
                lich.setDepth(2).setScale(1.6).setCollideWorldBounds(true);
                lich.body.setSize(20, 26).setOffset(6, 6);
                lich.health = 55;
                lich.enemyState = 'idle';
                lich.teleportTimer = 260;

                // Dramatic spawn flash
                for (let i = 0; i < 16; i++) {
                    const sp = this.add.rectangle(
                        bx + Phaser.Math.Between(-30, 30),
                        by + Phaser.Math.Between(-30, 30),
                        5, 5, 0x9922FF).setDepth(3);
                    this.tweens.add({ targets: sp, x: sp.x + Phaser.Math.Between(-60, 60), y: sp.y - Phaser.Math.Between(20, 60), alpha: 0, duration: 900, onComplete: () => sp.destroy() });
                }

                const banner = this.add.text(400, 200, 'THE LICH AWAKENS!', {
                    fontSize: '32px', fill: '#cc44ff',
                    stroke: '#000000', strokeThickness: 5, fontStyle: 'bold'
                }).setOrigin(0.5).setScrollFactor(0).setDepth(500);
                this.tweens.add({ targets: banner, alpha: 0, delay: 2200, duration: 800, onComplete: () => banner.destroy() });
            });
        }
    }

    // Boss (Lich) AI
    bossGroup.getChildren().forEach(boss => {
        if (!boss.active) return;

        const dist = Phaser.Math.Distance.Between(player.x, player.y, boss.x, boss.y);

        // Chase player relentlessly
        if (dist < 320) {
            const angle = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);
            boss.setVelocityX(Math.cos(angle) * 90);
            boss.setVelocityY(Math.sin(angle) * 90);
            boss.enemyState = 'chase';
        } else {
            boss.setVelocity(0);
            boss.enemyState = 'idle';
        }

        // Teleport mechanic — every few seconds the Lich blinks near the player
        boss.teleportTimer--;
        if (boss.teleportTimer <= 0) {
            boss.teleportTimer = Phaser.Math.Between(260, 400);
            const offX = Phaser.Math.Between(-80, 80);
            const offY = Phaser.Math.Between(-80, 80);
            boss.setAlpha(0);
            this.tweens.add({ targets: boss, alpha: 1, duration: 400 });
            boss.setPosition(
                Phaser.Math.Clamp(player.x + offX, 60, 30 * TILE_SIZE - 60),
                Phaser.Math.Clamp(player.y + offY, 60, 25 * TILE_SIZE - 60)
            );
        }

        // Low health — trigger final attack cutscene
        if (boss.health <= 20 && !lichFinalAttackTriggered) {
            lichFinalAttackTriggered = true;
            runLichFinalAttack(this, boss);
        }

        // Death check (only after cutscene sets health to 0)
        if (boss.health <= 0 && lichFinalAttackTriggered) {
            boss.destroy();
            this.time.delayedCall(600, () => spawnVictoryReturn(this));
        }

        if (boss.body.velocity.x < -5) boss.setFlipX(true);
        else if (boss.body.velocity.x > 5) boss.setFlipX(false);
    });

    // Cat AI — wander, flee if too close, deliver food to player
    catGroup.getChildren().forEach(cat => {
        if (!cat.active) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, cat.x, cat.y);

        if (cat.catState === 'deliver') {
            if (dist < 36) {
                // Deliver food!
                cat.catState = 'wander';
                cat.foodTimer = Phaser.Math.Between(700, 1100);
                cat.wanderTimer = Phaser.Math.Between(60, 120);
                cat.setVelocity(0);

                const heal = Math.min(4, playerMaxHealth - playerHealth);
                playerHealth = Math.min(playerMaxHealth, playerHealth + 4);
                updateHearts();

                const label = heal > 0 ? '🐾 Cat brought food! +4 HP' : '🐾 A cat visits you!';
                const popup = this.add.text(player.x, player.y - 44, label, {
                    fontSize: '13px', fill: '#ffddaa',
                    stroke: '#000000', strokeThickness: 3,
                    backgroundColor: '#00000088', padding: { x: 8, y: 4 }
                }).setOrigin(0.5).setDepth(300).setScrollFactor(1);
                this.tweens.add({ targets: popup, y: popup.y - 28, alpha: 0, duration: 1800, onComplete: () => popup.destroy() });

                // Cat sits and purrs (scale pulse)
                this.tweens.add({ targets: cat, scaleX: 1.2, scaleY: 0.85, duration: 200, yoyo: true, repeat: 3 });
            } else {
                const angle = Math.atan2(player.y - cat.y, player.x - cat.x);
                cat.setVelocityX(Math.cos(angle) * 75);
                cat.setVelocityY(Math.sin(angle) * 75);
            }
        } else {
            // Count down food timer
            cat.foodTimer--;
            if (cat.foodTimer <= 0 && dist < 280 && gameStarted) {
                cat.catState = 'deliver';
                return;
            }

            // Flee if player walks too close
            if (dist < 55) {
                cat.catState = 'flee';
                cat.wanderTimer = 80;
                const angle = Math.atan2(cat.y - player.y, cat.x - player.x);
                cat.setVelocityX(Math.cos(angle) * 130);
                cat.setVelocityY(Math.sin(angle) * 130);
            } else {
                cat.wanderTimer--;
                if (cat.wanderTimer <= 0) {
                    if (cat.catState === 'flee' || Math.random() < 0.4) {
                        cat.catState = 'wander';
                        const angle = Math.random() * Math.PI * 2;
                        cat.setVelocityX(Math.cos(angle) * 48);
                        cat.setVelocityY(Math.sin(angle) * 48);
                        cat.wanderTimer = Phaser.Math.Between(80, 200);
                    } else {
                        cat.catState = 'idle';
                        cat.setVelocity(0);
                        cat.wanderTimer = Phaser.Math.Between(60, 180);
                    }
                }
                cat.body.velocity.x *= 0.9;
                cat.body.velocity.y *= 0.9;
            }
        }

        if (cat.body.velocity.x < -5) cat.setFlipX(true);
        else if (cat.body.velocity.x > 5) cat.setFlipX(false);
    });

    // Apply friction to rocks so they stop
    rocksGroup.getChildren().forEach(rock => {
        rock.body.velocity.x *= 0.9;
        rock.body.velocity.y *= 0.9;
        if (Math.abs(rock.body.velocity.x) < 1) rock.body.velocity.x = 0;
        if (Math.abs(rock.body.velocity.y) < 1) rock.body.velocity.y = 0;
    });
}

// NPC interaction
function interactWithNPC(scene) {
    // Post-boss wish scene
    if (bossDefeated && !wishScreenShown) {
        wishScreenShown = true;
        showWishScreen(scene);
        return;
    }
    if (bossDefeated) {
        showDialogue("Old Sage: The choice is made. The world is grateful.");
        return;
    }

    // Map 13 — sage before Lich's Throne
    if (currentMapIndex === 13) {
        if (!map13SageGaveGear) {
            map13SageGaveGear = true;
            hasShield = true;
            hasSpear  = true;
            spearCharges = 25;
            updateSpearHUD();
            showDialogue("Old Sage: You've come far, brave soul. The Lich lies beyond.\nTake this Emerald Spear — it strikes true through any armour.\nAnd carry this Shield — hold D to stand firm against darkness.");

            const gearText = scene.add.text(player.x, player.y - 50,
                'Got Emerald Spear (25) + Shield!', {
                fontSize: '14px', fill: '#44ffaa',
                stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(100);
            scene.tweens.add({ targets: gearText, y: gearText.y - 36, alpha: 0, duration: 2000, onComplete: () => gearText.destroy() });

            // Sparkle
            for (let i = 0; i < 12; i++) {
                const sp = scene.add.rectangle(
                    player.x + Phaser.Math.Between(-20, 20),
                    player.y + Phaser.Math.Between(-20, 20),
                    4, 4, 0x44ffaa).setDepth(3);
                scene.tweens.add({ targets: sp, x: sp.x + Phaser.Math.Between(-40, 40), y: sp.y - Phaser.Math.Between(20, 50), alpha: 0, duration: 800, onComplete: () => sp.destroy() });
            }
        } else if (spearCharges < 8) {
            spearCharges = 25;
            updateSpearHUD();
            showDialogue("Old Sage: Your spear is replenished. Go — finish this.");
        } else {
            showDialogue("Old Sage: The Lich awaits beyond. Trust your blade.\nAnd remember — hold D when the darkness strikes.");
        }
        return;
    }

    if (!npc.hasGivenSword) {
        npc.hasGivenSword = true;
        hasSword = true;

        let swordName, swordKey, dialogueLine, itemColor;
        if (playerClass === 0) {
            // Knight — wooden sword
            swordName = 'Wooden Sword';
            swordKey = 'sword';
            itemColor = '#ffff00';
            dialogueLine = "Old Sage: Greetings, Knight! Your endurance is your\ngreatest weapon. Take this sword and defend the realm!";
        } else if (playerClass === 2) {
            // Rogue — crystal sword
            hasCrystalSword = true;
            swordName = 'Crystal Sword';
            swordKey = 'crystal_sword';
            itemColor = '#aaddff';
            dialogueLine = "Old Sage: A Rogue! Swift and deadly. This crystal blade\nshould suit your... particular style of combat.";
        } else {
            // Adventurer — stone sword
            hasStoneSword = true;
            swordName = 'Stone Sword';
            swordKey = 'stone_sword';
            itemColor = '#c0c0dd';
            dialogueLine = "Old Sage: Well met, Adventurer! A balanced soul deserves\na balanced blade. May this stone sword serve you well!";
        }

        showDialogue(dialogueLine);

        const itemText = scene.add.text(player.x, player.y - 40, 'Got ' + swordName + '!', {
            fontSize: '14px', fill: itemColor,
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);

        scene.tweens.add({
            targets: itemText,
            y: itemText.y - 30, alpha: 0, duration: 1500,
            onComplete: () => itemText.destroy()
        });
    } else {
        if (playerClass === 0) {
            showDialogue("Old Sage: Stand firm, Knight. Your shield is your honour!");
        } else if (playerClass === 2) {
            showDialogue("Old Sage: Strike fast and vanish, Rogue. They won't see you coming.");
        } else {
            showDialogue("Old Sage: Use your sword wisely, adventurer.\nMay it serve you well on your journey!");
        }
    }
}

function updateSpearHUD() {
    if (!spearText) return;
    spearText.setText('Spear: ' + spearCharges);
    spearText.setVisible(hasSpear);
}

function throwSpear(scene) {
    if (spearCharges <= 0) {
        const msg = scene.add.text(player.x, player.y - 40, 'No spear charges!', {
            fontSize: '13px', fill: '#ff8888', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(300);
        scene.tweens.add({ targets: msg, y: msg.y - 20, alpha: 0, duration: 1200, onComplete: () => msg.destroy() });
        return;
    }
    spearCharges--;
    updateSpearHUD();

    // Direction vector
    const dirs = { right: [1,0], left: [-1,0], up: [0,-1], down: [0,1] };
    const [dx, dy] = dirs[playerFacing] || [1, 0];

    // Spear travels 280px
    const spearLen = 280;
    const endX = player.x + dx * spearLen;
    const endY = player.y + dy * spearLen;

    // Visual: a thin elongated emerald rectangle
    const spearVisual = scene.add.rectangle(player.x, player.y, 6, 22, 0x22EE88)
        .setDepth(3)
        .setRotation(Math.atan2(dy, dx) + Math.PI / 2);

    // Glint highlight
    const glint = scene.add.rectangle(player.x, player.y, 2, 10, 0xAAFFCC).setDepth(4)
        .setRotation(Math.atan2(dy, dx) + Math.PI / 2);

    const dmgPerEnemy = Math.max(1, Math.round(10 * playerDamageMult));
    const hitEnemies = new Set();

    scene.tweens.add({
        targets: [spearVisual, glint],
        x: endX, y: endY,
        duration: 180,
        ease: 'Linear',
        onUpdate: () => {
            // Check all enemy groups for hits along the path
            const checkGroup = (group, particleColor) => {
                group.getChildren().forEach(e => {
                    if (!e.active || hitEnemies.has(e)) return;
                    const dist = Phaser.Math.Distance.Between(spearVisual.x, spearVisual.y, e.x, e.y);
                    if (dist > 30) return;
                    hitEnemies.add(e);
                    e.health -= dmgPerEnemy;
                    // Knockback
                    e.setVelocityX(dx * 250);
                    e.setVelocityY(dy * 250);
                    if (e.health <= 0) {
                        for (let i = 0; i < 8; i++) {
                            const p = scene.add.rectangle(e.x + Phaser.Math.Between(-10,10), e.y + Phaser.Math.Between(-10,10), 4, 4, particleColor).setDepth(2);
                            scene.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-35,35), y: p.y - Phaser.Math.Between(15,45), alpha: 0, duration: 500, onComplete: () => p.destroy() });
                        }
                        e.destroy();
                    } else {
                        e.setTint(0x44ffaa);
                        scene.time.delayedCall(120, () => { if (e.active) e.clearTint(); });
                    }
                });
            };
            checkGroup(enemyGroup,    0x4A6A3A);
            checkGroup(zombieGroup,   0x2A5A1A);
            checkGroup(skeletonGroup, 0xCCCCBB);
            checkGroup(bossGroup,     0x9922FF);
        },
        onComplete: () => {
            // Impact flash
            scene.tweens.add({ targets: [spearVisual, glint], alpha: 0, duration: 120, onComplete: () => { spearVisual.destroy(); glint.destroy(); } });
        }
    });
}

// Scripted final-attack cutscene when Lich reaches low health
function runLichFinalAttack(scene, boss) {
    cutsceneActive = true;
    boss.setVelocity(0);
    boss.health = 999; // prevent death mid-cutscene

    // Helper: screen flash
    const flash = (color, dur) => {
        const f = scene.add.rectangle(400, 300, 800, 600, color, 0.55)
            .setScrollFactor(0).setDepth(600);
        scene.tweens.add({ targets: f, alpha: 0, duration: dur, onComplete: () => f.destroy() });
    };

    // --- Phase 1: Lich charges up (1.5 s) ---
    const chargeText = scene.add.text(400, 150, 'The Lich channels its final power...', {
        fontSize: '20px', fill: '#ff4488', stroke: '#000', strokeThickness: 4, fontStyle: 'italic'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(601);

    scene.tweens.add({ targets: boss, scaleX: 2.2, scaleY: 2.2, duration: 1400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    boss.setTint(0xFF0055);

    // Charge particles orbiting boss
    const chargeParticles = [];
    for (let i = 0; i < 10; i++) {
        const cp = scene.add.rectangle(boss.x, boss.y, 5, 5, 0xFF2266).setDepth(3);
        chargeParticles.push(cp);
        scene.tweens.add({
            targets: cp,
            x: boss.x + Math.cos(i / 10 * Math.PI * 2) * 50,
            y: boss.y + Math.sin(i / 10 * Math.PI * 2) * 50,
            alpha: 0.3, duration: 400, yoyo: true, repeat: 3
        });
    }

    scene.time.delayedCall(1600, () => {
        chargeText.destroy();
        chargeParticles.forEach(p => p.destroy());
        scene.tweens.killTweensOf(boss);
        boss.setScale(1.6);

        // --- Phase 2: Fire the beam at player ---
        const fireText = scene.add.text(400, 150, 'DEATH BEAM!', {
            fontSize: '28px', fill: '#ff0000', stroke: '#000', strokeThickness: 5, fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(601);

        flash(0xFF0000, 300);

        const beam = scene.add.rectangle(boss.x, boss.y, 20, 20, 0xFF2244)
            .setDepth(4).setAlpha(0.9);
        const beamGlow = scene.add.rectangle(boss.x, boss.y, 12, 12, 0xFF8888)
            .setDepth(5).setAlpha(0.9);

        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);

        scene.tweens.add({
            targets: [beam, beamGlow],
            x: player.x, y: player.y,
            duration: 500, ease: 'Power2',
            onComplete: () => {
                fireText.destroy();

                // --- Phase 3: Old Sage teleports in ---
                const sageSprite = scene.add.sprite(player.x, player.y - 32, 'npc')
                    .setDepth(5).setAlpha(0).setScale(1.4);

                const sageFlash = scene.add.rectangle(player.x, player.y, 800, 600, 0xFFFFFF, 0)
                    .setScrollFactor(0).setDepth(599);

                scene.tweens.add({ targets: sageFlash, alpha: 0.7, duration: 120, yoyo: true,
                    onComplete: () => sageFlash.destroy() });
                scene.tweens.add({ targets: sageSprite, alpha: 1, duration: 200 });

                // Sparkle around sage
                for (let i = 0; i < 14; i++) {
                    const sp = scene.add.rectangle(
                        player.x + Phaser.Math.Between(-30, 30),
                        player.y + Phaser.Math.Between(-30, 30),
                        4, 4, 0xAAFFFF).setDepth(6);
                    scene.tweens.add({ targets: sp, x: sp.x + Phaser.Math.Between(-40, 40), y: sp.y - Phaser.Math.Between(20, 50), alpha: 0, duration: 600, onComplete: () => sp.destroy() });
                }

                scene.time.delayedCall(500, () => {

                    // --- Phase 4: Deflect — beam reverses back to Lich ---
                    const deflectText = scene.add.text(400, 150, 'The Sage deflects it!', {
                        fontSize: '22px', fill: '#aaffff', stroke: '#000', strokeThickness: 4
                    }).setOrigin(0.5).setScrollFactor(0).setDepth(601);

                    flash(0x44FFFF, 250);

                    // Beam bounces back
                    scene.tweens.add({
                        targets: [beam, beamGlow],
                        x: boss.x, y: boss.y,
                        duration: 400, ease: 'Power2',
                        onComplete: () => {
                            beam.destroy();
                            beamGlow.destroy();
                            deflectText.destroy();
                            sageSprite.destroy();

                            // Big explosion on Lich
                            flash(0xFF8800, 400);
                            boss.setTint(0xFF6600);
                            scene.tweens.add({ targets: boss, angle: 15, duration: 80, yoyo: true, repeat: 5,
                                onComplete: () => boss.setAngle(0) });

                            for (let i = 0; i < 20; i++) {
                                const ep = scene.add.rectangle(
                                    boss.x + Phaser.Math.Between(-20, 20),
                                    boss.y + Phaser.Math.Between(-20, 20),
                                    5, 5, [0xFF2200, 0xFF8800, 0x9922FF][i % 3]).setDepth(4);
                                scene.tweens.add({ targets: ep, x: ep.x + Phaser.Math.Between(-60, 60), y: ep.y - Phaser.Math.Between(20, 70), alpha: 0, duration: 700, onComplete: () => ep.destroy() });
                            }

                            // --- Phase 5: Lich staggers — player must land the final blow ---
                            scene.time.delayedCall(800, () => {
                                boss.setTint(0xFF4400);
                                boss.setScale(1.2);

                                const finishText = scene.add.text(400, 180, 'Now! Finish the Lich!', {
                                    fontSize: '26px', fill: '#FFD700', stroke: '#000', strokeThickness: 5, fontStyle: 'bold'
                                }).setOrigin(0.5).setScrollFactor(0).setDepth(601);
                                scene.tweens.add({ targets: finishText, alpha: 0.3, duration: 400, yoyo: true, repeat: 4,
                                    onComplete: () => finishText.destroy() });

                                // Lich staggers in place slowly
                                scene.tweens.add({ targets: boss, x: boss.x + 8, duration: 200, yoyo: true, repeat: -1 });

                                boss.health = 1; // one hit to kill
                                cutsceneActive = false; // re-enable player control
                            });
                        }
                    });
                });
            }
        });
    });
}

// Called when Lich dies — dragon flies player back to village
function spawnVictoryReturn(scene) {
    bossDefeated = true;
    transitioning = true;

    // Explosion on Lich position
    for (let i = 0; i < 30; i++) {
        const sp = scene.add.rectangle(
            player.x + Phaser.Math.Between(-50, 50),
            player.y + Phaser.Math.Between(-50, 50),
            6, 6, [0x9922FF, 0xFFDD00, 0xFFFFFF][i % 3]).setDepth(4);
        scene.tweens.add({ targets: sp, x: sp.x + Phaser.Math.Between(-100, 100), y: sp.y - Phaser.Math.Between(30, 100), alpha: 0, duration: 1200, onComplete: () => sp.destroy() });
    }

    const msg = scene.add.text(400, 200, 'The Lich is defeated!\nThe darkness lifts...', {
        fontSize: '28px', fill: '#FFD700', stroke: '#000', strokeThickness: 5,
        align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(500);

    // After victory message, Sage summons the dragon
    scene.time.delayedCall(2200, () => {
        msg.destroy();

        // Sage raises staff — brief glow at player position
        const sageGlow = scene.add.sprite(player.x, player.y - 40, 'npc')
            .setDepth(5).setScale(1.3).setTint(0xAAFFFF);
        scene.tweens.add({ targets: sageGlow, scaleX: 1.6, scaleY: 1.6, alpha: 0, duration: 700,
            onComplete: () => sageGlow.destroy() });

        const summonText = scene.add.text(400, 160, 'The Sage summons a dragon!', {
            fontSize: '22px', fill: '#aaffff', stroke: '#000', strokeThickness: 4, fontStyle: 'italic'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(601);

        // Dragon materialises above the player, flying in from the top
        const dragon = scene.add.image(player.x, player.y - 200, 'dragon')
            .setDepth(6).setScale(2.5).setAlpha(0);
        scene.tweens.add({ targets: dragon, alpha: 1, duration: 400 });

        // Dragon descends to player
        scene.time.delayedCall(500, () => {
            scene.tweens.add({
                targets: dragon, y: player.y - 40, duration: 700, ease: 'Power2',
                onComplete: () => {
                    summonText.destroy();
                    player.setVisible(false); // player "mounts" the dragon

                    // Dragon swoops up and off-screen to the right
                    scene.tweens.add({
                        targets: dragon,
                        x: player.x + 900, y: player.y - 180,
                        duration: 900, ease: 'Power2.easeIn',
                        onComplete: () => {
                            dragon.destroy();

                            // Fade to black then load map 0
                            scene.cameras.main.fadeOut(600, 0, 0, 0);
                            scene.cameras.main.once('camerafadeoutcomplete', () => {
                                const landX = 10 * TILE_SIZE + 16;
                                const landY = 12 * TILE_SIZE + 16;
                                scene.loadMap(0, landX, landY);
                                npc.hasGivenSword = true;
                                player.setVisible(false); // still mounted

                                scene.cameras.main.fadeIn(700, 0, 0, 0);
                                scene.cameras.main.once('camerafadeincomplete', () => {

                                    // Dragon enters from the right of the viewport
                                    const cam = scene.cameras.main;
                                    const dragonEntry = scene.add.image(
                                        cam.scrollX + 900, cam.scrollY + 120, 'dragon'
                                    ).setDepth(6).setScale(2.5);

                                    // Fire breath — sweeps particles downward as dragon flies
                                    const fireInterval = scene.time.addEvent({
                                        delay: 60,
                                        repeat: 14,
                                        callback: () => {
                                            if (!dragonEntry.active) return;
                                            for (let f = 0; f < 5; f++) {
                                                const fx = dragonEntry.x + Phaser.Math.Between(-30, 10);
                                                const fy = dragonEntry.y + 20;
                                                const flame = scene.add.rectangle(fx, fy, 8, 8,
                                                    [0xFF4400, 0xFF8800, 0xFFCC00][f % 3]).setDepth(5);
                                                scene.tweens.add({
                                                    targets: flame,
                                                    x: fx + Phaser.Math.Between(-20, 20),
                                                    y: fy + Phaser.Math.Between(40, 90),
                                                    scaleX: 2, scaleY: 2,
                                                    alpha: 0, duration: 400,
                                                    onComplete: () => flame.destroy()
                                                });
                                            }
                                            // Burn any enemies in range of the fire
                                            const burnRadius = 80;
                                            const burnGroup = (group) => {
                                                group.getChildren().forEach(e => {
                                                    if (!e.active) return;
                                                    if (Phaser.Math.Distance.Between(dragonEntry.x, dragonEntry.y + 60, e.x, e.y) < burnRadius) {
                                                        for (let p = 0; p < 6; p++) {
                                                            const bp = scene.add.rectangle(e.x + Phaser.Math.Between(-10,10), e.y + Phaser.Math.Between(-10,10), 4, 4, 0xFF6600).setDepth(4);
                                                            scene.tweens.add({ targets: bp, y: bp.y - 30, alpha: 0, duration: 400, onComplete: () => bp.destroy() });
                                                        }
                                                        e.destroy();
                                                    }
                                                });
                                            };
                                            burnGroup(wolfGroup);
                                            burnGroup(enemyGroup);
                                            burnGroup(zombieGroup);
                                            burnGroup(skeletonGroup);
                                            burnGroup(deerGroup);
                                        }
                                    });

                                    // Dragon flies from right to left across the screen
                                    scene.tweens.add({
                                        targets: dragonEntry,
                                        x: cam.scrollX - 200,
                                        y: cam.scrollY + 100,
                                        duration: 2200, ease: 'Linear',
                                        onComplete: () => {
                                            dragonEntry.destroy();
                                            fireInterval.remove();

                                            // Player drops down to landing spot
                                            player.setPosition(landX, landY);
                                            player.setVisible(true);

                                            const returnBanner = scene.add.text(400, 80, 'Starting Village', {
                                                fontSize: '26px', fill: '#ffffff', stroke: '#000', strokeThickness: 3,
                                                backgroundColor: '#00000099', padding: { x: 20, y: 10 }
                                            }).setOrigin(0.5).setScrollFactor(0).setDepth(500);
                                            scene.tweens.add({ targets: returnBanner, alpha: 0, delay: 2000, duration: 1000, onComplete: () => returnBanner.destroy() });

                                            const sageHint = scene.add.text(400, 540, 'Talk to the Old Sage...', {
                                                fontSize: '16px', fill: '#ccbbff', stroke: '#000', strokeThickness: 2
                                            }).setOrigin(0.5).setScrollFactor(0).setDepth(500);
                                            scene.tweens.add({ targets: sageHint, alpha: 0.2, duration: 800, yoyo: true, repeat: 4, onComplete: () => sageHint.destroy() });

                                            transitioning = false;
                                        }
                                    });
                                });
                            });
                        }
                    });
                }
            });
        });
    });
}

// Show the wish choice screen after defeating the Lich
function showWishScreen(scene) {
    hideDialogue();

    const overlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.88).setScrollFactor(0).setDepth(800);

    const title = scene.add.text(400, 130, 'Old Sage:', {
        fontSize: '22px', fill: '#ccbbff', stroke: '#000', strokeThickness: 3, fontStyle: 'italic'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(801);

    const speech = scene.add.text(400, 190,
        '"You have done it, brave soul. The Lich is vanquished.\nPeace may yet return to these lands.\n\nAs guardian of this world, I grant you one wish.\nChoose wisely — for it cannot be undone."',
        { fontSize: '15px', fill: '#ddd8ee', stroke: '#000', strokeThickness: 2, align: 'center', lineSpacing: 6, wordWrap: { width: 640 } }
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(801);

    // --- World Peace button ---
    const peaceBg = scene.add.rectangle(230, 420, 280, 80, 0x224422, 0.9)
        .setScrollFactor(0).setDepth(801).setStrokeStyle(2, 0x44cc44).setInteractive();
    const peaceLabel = scene.add.text(230, 410, 'World Peace', { fontSize: '20px', fill: '#66ff66', stroke: '#000', strokeThickness: 3, fontStyle: 'bold' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(802);
    const peaceDesc = scene.add.text(230, 434, 'Restore harmony to all lands', { fontSize: '12px', fill: '#aaddaa' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(802);

    // --- Xbox button ---
    const xboxBg = scene.add.rectangle(570, 420, 280, 80, 0x221111, 0.9)
        .setScrollFactor(0).setDepth(801).setStrokeStyle(2, 0x44cc44).setInteractive();
    const xboxLabel = scene.add.text(570, 410, 'An Xbox', { fontSize: '20px', fill: '#88bb88', stroke: '#000', strokeThickness: 3 })
        .setOrigin(0.5).setScrollFactor(0).setDepth(802);
    const xboxDesc = scene.add.text(570, 434, '...for gaming, obviously', { fontSize: '12px', fill: '#997777' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(802);

    const allEls = [overlay, title, speech, peaceBg, peaceLabel, peaceDesc, xboxBg, xboxLabel, xboxDesc];

    peaceBg.on('pointerover', () => peaceBg.setFillStyle(0x336633, 0.95));
    peaceBg.on('pointerout',  () => peaceBg.setFillStyle(0x224422, 0.9));
    xboxBg.on('pointerover',  () => xboxBg.setFillStyle(0x442222, 0.95));
    xboxBg.on('pointerout',   () => xboxBg.setFillStyle(0x221111, 0.9));

    peaceBg.on('pointerdown', () => {
        allEls.forEach(e => e.destroy());
        const bgOverlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.88).setScrollFactor(0).setDepth(800);
        const sageReply = scene.add.text(400, 300,
            'Old Sage:\n\n"Are you sure about this choice laddie?\nOh all right fine.\nBut for the record this is the\nworst wish in history."',
            { fontSize: '18px', fill: '#ccbbff', stroke: '#000', strokeThickness: 3, align: 'center', lineSpacing: 9, wordWrap: { width: 580 } }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(801);
        scene.time.delayedCall(3800, () => {
            bgOverlay.destroy();
            sageReply.destroy();
            showVictory(scene);
        });
    });

    xboxBg.on('pointerdown', () => {
        allEls.forEach(e => e.destroy());
        const bgOverlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.88).setScrollFactor(0).setDepth(800);
        const sageReply = scene.add.text(400, 280,
            'Old Sage:\n\n"Ah... yes good choice youngster.\nIt shall be granted."',
            { fontSize: '18px', fill: '#ccbbff', stroke: '#000', strokeThickness: 3, align: 'center', lineSpacing: 9 }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(801);

        scene.time.delayedCall(2600, () => {
            sageReply.destroy();
            const warning = scene.add.text(400, 260,
                'A wild rabbit leaps at you!!',
                { fontSize: '24px', fill: '#ff6622', stroke: '#000', strokeThickness: 4, align: 'center', fontStyle: 'bold' }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(801);

            // Rabbit flies from offscreen toward player
            const rabbitImg = scene.add.image(-40, 540, 'rabbit').setScrollFactor(0).setDepth(802).setScale(3);
            scene.tweens.add({
                targets: rabbitImg,
                x: 400, y: 300,
                duration: 700,
                ease: 'Power2',
                onComplete: () => {
                    rabbitImg.destroy();
                    scene.cameras.main.shake(350, 0.025);
                    scene.time.delayedCall(500, () => {
                        bgOverlay.destroy();
                        warning.destroy();
                        wishScreenShown = false;
                        showGameOver(scene);
                    });
                }
            });
        });
    });
}

// Full-screen victory when World Peace is chosen
function showVictory(scene) {
    const overlay = scene.add.rectangle(400, 300, 800, 600, 0x000011, 1).setScrollFactor(0).setDepth(900);

    // Stars
    for (let i = 0; i < 60; i++) {
        const star = scene.add.rectangle(
            Phaser.Math.Between(20, 780), Phaser.Math.Between(20, 580),
            Phaser.Math.Between(1, 3), Phaser.Math.Between(1, 3), 0xFFFFFF
        ).setScrollFactor(0).setDepth(901).setAlpha(Phaser.Math.FloatBetween(0.2, 1));
        scene.tweens.add({ targets: star, alpha: Phaser.Math.FloatBetween(0.1, 0.5), duration: Phaser.Math.Between(600, 2000), yoyo: true, repeat: -1 });
    }

    scene.add.text(400, 140, 'For Peace', {
        fontSize: '64px', fill: '#f0d080', stroke: '#000000', strokeThickness: 6, fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(902);

    scene.add.text(400, 230, '~ World Peace ~', {
        fontSize: '26px', fill: '#aaddff', stroke: '#000000', strokeThickness: 3, fontStyle: 'italic'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(902);

    scene.add.text(400, 310,
        'The darkness is banished. The lands are at peace.\nForests ring with laughter again. Animals and people\nlive side by side — as they always should have.\n\nYou have fulfilled the old prophecy.\nThe world is grateful.',
        { fontSize: '15px', fill: '#ddd8ee', stroke: '#000', strokeThickness: 2, align: 'center', lineSpacing: 7, wordWrap: { width: 620 } }
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(902);

    scene.add.text(400, 500, 'YOU WIN', {
        fontSize: '40px', fill: '#FFD700', stroke: '#000000', strokeThickness: 5, fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(902);

    scene.add.text(400, 560, 'Thank you for playing', {
        fontSize: '16px', fill: '#aaaaaa', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(902);

    // Stop music gracefully
    if (musicMasterGain) {
        const fadeSteps = 60;
        let step = 0;
        const vol = musicMasterGain.gain.value;
        const fade = setInterval(() => {
            step++;
            musicMasterGain.gain.value = vol * (1 - step / fadeSteps);
            if (step >= fadeSteps) clearInterval(fade);
        }, 50);
    }

    gameStarted = false; // freeze game
}

// Show dialogue box
function showDialogue(text) {
    dialogueBox.setVisible(true);
    dialogueText.setText(text);
    dialogueText.setVisible(true);
}

// Hide dialogue box
function hideDialogue() {
    dialogueBox.setVisible(false);
    dialogueText.setVisible(false);
}

function updateHearts() {
    const numHearts = Math.ceil(playerMaxHealth / 3);
    hearts.forEach((h, i) => {
        if (i >= numHearts) { h.setVisible(false); return; }
        h.setVisible(true);
        const slotHP = playerHealth - i * 3;
        if (slotHP >= 3)      h.setTexture('heart_full');
        else if (slotHP > 0)  h.setTexture('heart_half');
        else                  h.setTexture('heart_empty');
    });
}

function takeDamage(scene, source, damage = 1) {
    if (playerInvincible) return;
    if (isBlocking) damage = Math.max(1, Math.ceil(damage * 0.2));
    playerHealth = Math.max(0, playerHealth - damage);
    updateHearts();

    if (playerHealth <= 0) {
        showGameOver(scene);
        return;
    }

    // Invincibility frames (~1.5s)
    playerInvincible = true;
    playerInvincibleTimer = 90;

    // Flash player
    scene.tweens.add({
        targets: player, alpha: 0.25, duration: 80,
        yoyo: true, repeat: 5,
        onComplete: () => player.setAlpha(1)
    });

    // Knockback away from attacker
    if (source) {
        const angle = Phaser.Math.Angle.Between(source.x, source.y, player.x, player.y);
        player.setVelocityX(Math.cos(angle) * 220);
        player.setVelocityY(Math.sin(angle) * 220);
    }
}

function createTouchControls(scene) {
    if (!('ontouchstart' in window) && navigator.maxTouchPoints === 0) return;

    const depth = 500;
    const baseAlpha = 0.5;
    const activeAlpha = 0.85;

    function makeDir(x, y, label, onDown, onUp) {
        const bg = scene.add.circle(x, y, 26, 0x223344, baseAlpha)
            .setScrollFactor(0).setDepth(depth).setInteractive();
        const txt = scene.add.text(x, y, label, { fontSize: '20px', fill: '#ffffff', stroke: '#000', strokeThickness: 2 })
            .setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
        bg.on('pointerdown',  () => { bg.setFillStyle(0x4477aa, activeAlpha); onDown(); });
        bg.on('pointerup',    () => { bg.setFillStyle(0x223344, baseAlpha);  onUp();   });
        bg.on('pointerout',   () => { bg.setFillStyle(0x223344, baseAlpha);  onUp();   });
        bg.on('pointercancel',() => { bg.setFillStyle(0x223344, baseAlpha);  onUp();   });
    }

    // D-pad
    const dx = 90, dy = 510;
    makeDir(dx,      dy - 52, '▲', () => touchUp    = true, () => touchUp    = false);
    makeDir(dx,      dy + 52, '▼', () => touchDown  = true, () => touchDown  = false);
    makeDir(dx - 52, dy,      '◀', () => touchLeft  = true, () => touchLeft  = false);
    makeDir(dx + 52, dy,      '▶', () => touchRight = true, () => touchRight = false);

    // Attack / Interact button
    const atkBg = scene.add.circle(700, 535, 32, 0x774411, baseAlpha)
        .setScrollFactor(0).setDepth(depth).setInteractive();
    scene.add.text(700, 535, '⚔', { fontSize: '22px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    atkBg.on('pointerdown',  () => { atkBg.setFillStyle(0xcc7722, activeAlpha); touchActionJustPressed = true; });
    atkBg.on('pointerup',    () => atkBg.setFillStyle(0x774411, baseAlpha));
    atkBg.on('pointerout',   () => atkBg.setFillStyle(0x774411, baseAlpha));

    // Shield button (hidden until player gets shield)
    touchShieldBtn = scene.add.circle(640, 490, 26, 0x113366, baseAlpha)
        .setScrollFactor(0).setDepth(depth).setInteractive().setVisible(false);
    touchShieldBtnTxt = scene.add.text(640, 490, '🛡', { fontSize: '17px' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1).setVisible(false);
    touchShieldBtn.on('pointerdown',  () => { touchShieldBtn.setFillStyle(0x3366cc, activeAlpha); touchShield = true;  });
    touchShieldBtn.on('pointerup',    () => { touchShieldBtn.setFillStyle(0x113366, baseAlpha);   touchShield = false; });
    touchShieldBtn.on('pointerout',   () => { touchShieldBtn.setFillStyle(0x113366, baseAlpha);   touchShield = false; });
    touchShieldBtn.on('pointercancel',() => { touchShieldBtn.setFillStyle(0x113366, baseAlpha);   touchShield = false; });

    // Spear button (hidden until player gets spear)
    touchSpearBtn = scene.add.circle(760, 480, 26, 0x115533, baseAlpha)
        .setScrollFactor(0).setDepth(depth).setInteractive().setVisible(false);
    touchSpearBtnTxt = scene.add.text(760, 480, '✦', { fontSize: '17px', fill: '#88ffaa' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1).setVisible(false);
    touchSpearBtn.on('pointerdown', () => { touchSpearBtn.setFillStyle(0x33aa66, activeAlpha); touchSpearJustPressed = true; });
    touchSpearBtn.on('pointerup',   () => touchSpearBtn.setFillStyle(0x115533, baseAlpha));
    touchSpearBtn.on('pointerout',  () => touchSpearBtn.setFillStyle(0x115533, baseAlpha));
}

function showGameOver(scene) {
    if (transitioning) return;
    transitioning = true;

    playerHealth = playerMaxHealth;
    updateHearts();
    playerInvincible = true;
    playerInvincibleTimer = 120;
    player.setAlpha(0.3);

    // Defer the heavy loadMap call to the next frame so it runs
    // outside the current physics step and doesn't crash Phaser
    scene.time.delayedCall(16, () => {
        player.setAlpha(1);
        scene.loadMap(lastCheckpoint.mapIndex, lastCheckpoint.x, lastCheckpoint.y);
        transitioning = false;

        const msg = scene.add.text(400, 260, 'You were defeated!', {
            fontSize: '20px', fill: '#ffcccc',
            stroke: '#000000', strokeThickness: 3,
            backgroundColor: '#00000099',
            padding: { x: 20, y: 14 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(500);
        scene.tweens.add({
            targets: msg, alpha: 0, delay: 1200, duration: 600,
            onComplete: () => msg.destroy()
        });
    });
}

// Tame a defeated animal — disappears then reappears at nearest player cottage
function tameAnimal(scene, animal) {
    const maxCompanions = checkpointsActivated * 2;
    if (companionGroup.getLength() >= maxCompanions) {
        animal.destroy();
        const msg = maxCompanions === 0
            ? 'Activate a checkpoint\nto tame animals!'
            : `Companion limit: ${maxCompanions}\n(need more checkpoints)`;
        const full = scene.add.text(animal.x, animal.y - 30, msg, {
            fontSize: '12px', fill: '#ff8888', stroke: '#000', strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5).setDepth(200);
        scene.tweens.add({ targets: full, y: full.y - 25, alpha: 0, duration: 2000, onComplete: () => full.destroy() });
        return;
    }

    // Find nearest cottage that still has room (max 3 per cottage)
    let nearestCottage = null;
    let nearestDist = Infinity;
    playerCottages.forEach(c => {
        if (c.count >= 3) return;
        const d = Phaser.Math.Distance.Between(animal.x, animal.y, c.x, c.y);
        if (d < nearestDist) { nearestDist = d; nearestCottage = c; }
    });

    if (!nearestCottage) {
        animal.destroy();
        const msg = playerCottages.length === 0
            ? 'Build a cottage\nto keep companions!'
            : 'All cottages are full!\n(max 3 per cottage)';
        const full = scene.add.text(animal.x, animal.y - 30, msg, {
            fontSize: '12px', fill: '#ff8888', stroke: '#000', strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5).setDepth(200);
        scene.tweens.add({ targets: full, y: full.y - 25, alpha: 0, duration: 2000, onComplete: () => full.destroy() });
        return;
    }

    // Move into companion group
    const srcGroup = animal.sourceGroup || deerGroup;
    srcGroup.remove(animal, false, false);
    companionGroup.add(animal);

    animal.isOwned = true;
    animal.isAggressive = false;
    animal.clearTint();
    animal.stats = {
        name: `Tamed ${animal.animalName || 'Animal'}`,
        atk: Phaser.Math.Between(1, 5),
        def: Phaser.Math.Between(1, 5),
        spd: Phaser.Math.Between(1, 5)
    };
    animal.attackCooldown = 0;
    animal.laborCooldown  = 0;
    animal.health = 5;

    // Vanish at current position, then appear at the cottage
    const cx = nearestCottage.x;
    const cy = nearestCottage.y;
    scene.tweens.add({
        targets: animal, alpha: 0, scaleX: 1.6, scaleY: 1.6,
        duration: 350, ease: 'Power2',
        onComplete: () => {
            nearestCottage.count++;
            animal.setPosition(cx, cy - 20);
            animal.setVelocity(0);
            animal.setScale(1);
            animal.setTint(0xFFD700);
            animal.homeCottage = nearestCottage;
            animal.rabbitState = null;
            animal.rabbitTarget = null;
            animal.wolfTarget = null;
            animal.setAlpha(0);
            scene.tweens.add({ targets: animal, alpha: 1, duration: 400 });

            const popup = scene.add.text(cx, cy - 52,
                `Tamed!\nATK ${animal.stats.atk}  DEF ${animal.stats.def}  SPD ${animal.stats.spd}`, {
                fontSize: '12px', fill: '#FFD700', stroke: '#000', strokeThickness: 2,
                align: 'center'
            }).setOrigin(0.5).setDepth(200);
            scene.tweens.add({ targets: popup, y: popup.y - 30, alpha: 0, duration: 2200, onComplete: () => popup.destroy() });

            // Sparkle burst at cottage
            for (let i = 0; i < 8; i++) {
                const spark = scene.add.rectangle(
                    cx + Phaser.Math.Between(-12, 12),
                    cy + Phaser.Math.Between(-12, 12),
                    3, 3, 0xFFD700
                ).setDepth(2);
                scene.tweens.add({
                    targets: spark,
                    x: spark.x + Phaser.Math.Between(-30, 30),
                    y: spark.y - Phaser.Math.Between(15, 40),
                    alpha: 0, duration: 600,
                    onComplete: () => spark.destroy()
                });
            }
        }
    });
}

// Show a companion's stats as a floating card
function showCompanionStats(scene, companion) {
    const mode = laborMode ? 'Labor' : 'Following';
    const text = scene.add.text(companion.x, companion.y - 50,
        `${companion.stats.name}\nATK ${companion.stats.atk}  DEF ${companion.stats.def}  SPD ${companion.stats.spd}\nMode: ${mode}`, {
        fontSize: '12px', fill: '#ffffff', stroke: '#000', strokeThickness: 2,
        backgroundColor: '#00000099', padding: { x: 8, y: 6 }, align: 'center'
    }).setOrigin(0.5).setDepth(300);
    scene.tweens.add({ targets: text, y: text.y - 20, alpha: 0, delay: 2000, duration: 800, onComplete: () => text.destroy() });
}

// Wolf companion — patrols cottage, attacks enemies and wild wolves
function companionWolfProtect(scene, companion) {
    if (companion.attackCooldown > 0) {
        companion.attackCooldown--;
        if (companion.wolfTarget && companion.wolfTarget.active) {
            const a = Math.atan2(companion.wolfTarget.y - companion.y, companion.wolfTarget.x - companion.x);
            companion.setVelocityX(Math.cos(a) * (80 + companion.stats.spd * 10));
            companion.setVelocityY(Math.sin(a) * (80 + companion.stats.spd * 10));
        } else {
            companion.setVelocity(0);
        }
        return;
    }

    // Gather all hostile targets
    let nearest = null, nearestDist = 210;
    const check = (e) => {
        if (!e.active) return;
        const d = Phaser.Math.Distance.Between(companion.x, companion.y, e.x, e.y);
        if (d < nearestDist) { nearestDist = d; nearest = e; }
    };
    enemyGroup.getChildren().forEach(check);
    zombieGroup.getChildren().forEach(check);
    skeletonGroup.getChildren().forEach(check);
    wolfGroup.getChildren().forEach(check);
    deerGroup.getChildren().forEach(d => { if (d.isAggressive) check(d); });

    if (nearest) {
        companion.wolfTarget = nearest;
        const a = Math.atan2(nearest.y - companion.y, nearest.x - companion.x);
        companion.setVelocityX(Math.cos(a) * (80 + companion.stats.spd * 10));
        companion.setVelocityY(Math.sin(a) * (80 + companion.stats.spd * 10));

        if (nearestDist < 40) {
            nearest.health -= (companion.stats.atk >= 4 ? 2 : 1);
            companion.attackCooldown = Math.max(20, 60 - companion.stats.spd * 7);
            const a2 = Phaser.Math.Angle.Between(companion.x, companion.y, nearest.x, nearest.y);
            nearest.setVelocityX(Math.cos(a2) * 140);
            nearest.setVelocityY(Math.sin(a2) * 140);

            if (nearest.health <= 0) {
                for (let i = 0; i < 6; i++) {
                    const p = scene.add.rectangle(
                        nearest.x + Phaser.Math.Between(-8, 8),
                        nearest.y + Phaser.Math.Between(-8, 8),
                        4, 4, 0x4A6A3A).setDepth(2);
                    scene.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-30, 30), y: p.y - Phaser.Math.Between(10, 35), alpha: 0, duration: 450, onComplete: () => p.destroy() });
                }
                nearest.destroy();
            } else {
                nearest.setTint(0xffffff);
                scene.time.delayedCall(100, () => { if (nearest.active) nearest.clearTint(); });
            }
        }
    } else {
        companion.wolfTarget = null;
        companion.setVelocity(0);
    }
}

// Rabbit companion — jumps on an enemy and destroys it in 1 second
function companionRabbitAttack(scene, companion) {
    // Counting down on top of enemy
    if (companion.rabbitState === 'on_enemy') {
        if (!companion.rabbitTarget || !companion.rabbitTarget.active) {
            companion.rabbitState = null;
            companion.setScale(1);
            companion.setVelocity(0);
            return;
        }
        companion.setPosition(companion.rabbitTarget.x, companion.rabbitTarget.y);
        companion.setVelocity(0);
        companion.rabbitKillTimer--;
        // Pulse while latched
        companion.setScale(1 + 0.25 * Math.abs(Math.sin(companion.rabbitKillTimer * 0.16)));

        if (companion.rabbitKillTimer <= 0) {
            const ex = companion.rabbitTarget.x, ey = companion.rabbitTarget.y;
            companion.rabbitTarget.destroy();
            companion.rabbitTarget = null;
            companion.rabbitState = null;
            companion.setScale(1);
            companion.attackCooldown = 180;
            // Bounce back toward cottage
            const cottage = companion.homeCottage || { x: companion.x, y: companion.y + 60 };
            const ba = Math.atan2(cottage.y - ey, cottage.x - ex);
            companion.setVelocityX(Math.cos(ba) * 200);
            companion.setVelocityY(Math.sin(ba) * 200);
            // Explosion burst
            for (let i = 0; i < 12; i++) {
                const p = scene.add.rectangle(
                    ex + Phaser.Math.Between(-14, 14),
                    ey + Phaser.Math.Between(-14, 14),
                    4, 4, 0xFF6600).setDepth(2);
                scene.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-45, 45), y: p.y - Phaser.Math.Between(20, 55), alpha: 0, duration: 600, onComplete: () => p.destroy() });
            }
        }
        return;
    }

    // Rushing toward target
    if (companion.rabbitTarget && companion.rabbitTarget.active) {
        const dist = Phaser.Math.Distance.Between(companion.x, companion.y, companion.rabbitTarget.x, companion.rabbitTarget.y);
        if (dist < 20) {
            companion.rabbitState = 'on_enemy';
            companion.rabbitKillTimer = 60; // 1 second
        } else {
            const a = Math.atan2(companion.rabbitTarget.y - companion.y, companion.rabbitTarget.x - companion.x);
            companion.setVelocityX(Math.cos(a) * 270);
            companion.setVelocityY(Math.sin(a) * 270);
        }
        return;
    }

    if (companion.attackCooldown > 0) {
        companion.attackCooldown--;
        companion.setVelocity(0);
        return;
    }

    // Find nearest enemy/hostile
    companion.rabbitTarget = null;
    let nearestDist = 9999;
    const check = (e) => {
        if (!e.active) return;
        const d = Phaser.Math.Distance.Between(companion.x, companion.y, e.x, e.y);
        if (d < nearestDist) { nearestDist = d; companion.rabbitTarget = e; }
    };
    enemyGroup.getChildren().forEach(check);
    zombieGroup.getChildren().forEach(check);
    skeletonGroup.getChildren().forEach(check);
    wolfGroup.getChildren().forEach(check);
    deerGroup.getChildren().forEach(d => { if (d.isAggressive) check(d); });

    if (companion.rabbitTarget) {
        // Windup crouch before launching
        scene.tweens.add({
            targets: companion, scaleX: 1.4, scaleY: 0.65, duration: 220,
            yoyo: true, ease: 'Power2',
            onComplete: () => { if (companion.active) companion.setScale(1); }
        });
    } else {
        companion.setVelocity(0);
    }
}

// Companion auto-attacks nearest enemy
function companionAutoAttack(scene, companion) {
    const range = 55 + companion.stats.atk * 5;
    let targeted = null;
    let closestDist = range;

    enemyGroup.getChildren().forEach(enemy => {
        if (!enemy.active) return;
        const d = Phaser.Math.Distance.Between(companion.x, companion.y, enemy.x, enemy.y);
        if (d < closestDist) { closestDist = d; targeted = enemy; }
    });

    if (!targeted) return;

    targeted.health -= (companion.stats.atk >= 4 ? 2 : 1);
    companion.attackCooldown = Math.max(20, 70 - companion.stats.spd * 8);

    const angle = Phaser.Math.Angle.Between(companion.x, companion.y, targeted.x, targeted.y);
    targeted.setVelocityX(Math.cos(angle) * 120);
    targeted.setVelocityY(Math.sin(angle) * 120);

    if (targeted.health <= 0) {
        for (let i = 0; i < 6; i++) {
            const p = scene.add.rectangle(targeted.x + Phaser.Math.Between(-8, 8), targeted.y + Phaser.Math.Between(-8, 8), 4, 4, 0x4A6A3A);
            p.setDepth(2);
            scene.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-30, 30), y: p.y - Phaser.Math.Between(10, 35), alpha: 0, duration: 450, onComplete: () => p.destroy() });
        }
        targeted.destroy();
    } else {
        targeted.setTint(0xffffff);
        scene.time.delayedCall(100, () => { if (targeted.active) targeted.clearTint(); });
    }
}

function updateArrowHUD() {
    arrowText.setText('Arrows: ' + arrows);
    arrowText.setVisible(hasBow);
    if (invArrowCountText) invArrowCountText.setText('x ' + arrows);
}

// Open a nearby treasure chest
function openChest(scene, chest) {
    chest.opened = true;
    chest.setTexture('chest_open');

    let msgText, particleColor;

    if (chest.chestType === 'fortress') {
        fortressChestOpened = true;
        hasCrystalSword = true;
        arrows += 10;
        updateArrowHUD();
        if (!hasBow) { hasBow = true; invBowRow.forEach(el => el.setVisible(inventoryVisible)); }
        invCrystalSwordRow.forEach(el => el.setVisible(inventoryVisible));
        msgText = 'Found: Crystal Sword + 10 Arrows!';
        particleColor = 0x88EEFF;
    } else if (chest.chestType === 'desert') {
        desertChestOpened = true;
        hasStoneSword = true;
        arrows += 20;
        updateArrowHUD();
        if (!hasBow) { hasBow = true; invBowRow.forEach(el => el.setVisible(inventoryVisible)); }
        invStoneSwordRow.forEach(el => el.setVisible(inventoryVisible));
        msgText = 'Found: Stone Sword + 20 Arrows!';
        particleColor = 0xaaaacc;
    } else {
        swampChestOpened = true;
        hasBow = true;
        arrows += 5;
        updateArrowHUD();
        invBowRow.forEach(el => el.setVisible(inventoryVisible));
        msgText = 'Found: Bow + 5 Arrows!';
        particleColor = 0xFFD700;
    }

    const msg = scene.add.text(chest.x, chest.y - 48, msgText, {
        fontSize: '15px', fill: '#FFD700',
        stroke: '#000000', strokeThickness: 3,
        backgroundColor: '#00000088', padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setDepth(300);
    scene.tweens.add({ targets: msg, y: msg.y - 36, alpha: 0, delay: 1400, duration: 900, onComplete: () => msg.destroy() });

    for (let i = 0; i < 10; i++) {
        const s = scene.add.rectangle(
            chest.x + Phaser.Math.Between(-14, 14),
            chest.y + Phaser.Math.Between(-14, 14),
            4, 4, particleColor).setDepth(3);
        scene.tweens.add({ targets: s, x: s.x + Phaser.Math.Between(-40, 40), y: s.y - Phaser.Math.Between(20, 50), alpha: 0, duration: 700, onComplete: () => s.destroy() });
    }
}

// Fire an arrow at the nearest enemy within bow range
function fireBow(scene) {
    if (!hasBow || arrows <= 0) return false;
    const bowRange = 270;
    let target = null, targetDist = bowRange;

    const check = (e) => {
        if (!e.active) return;
        const d = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
        if (d < targetDist) { targetDist = d; target = e; }
    };
    enemyGroup.getChildren().forEach(check);
    zombieGroup.getChildren().forEach(check);
    wolfGroup.getChildren().forEach(check);
    deerGroup.getChildren().forEach(d => { if (d.isAggressive) check(d); });
    skeletonGroup.getChildren().forEach(check);
    bossGroup.getChildren().forEach(check);

    if (!target) return false;

    arrows--;
    updateArrowHUD();

    // Arrow visual
    const arrowSprite = scene.add.rectangle(player.x, player.y, 10, 3, 0xCCBB88).setDepth(2);
    arrowSprite.setRotation(Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y));

    scene.tweens.add({
        targets: arrowSprite,
        x: target.x, y: target.y,
        duration: 220, ease: 'Linear',
        onComplete: () => {
            arrowSprite.destroy();
            if (!target.active) return;
            target.health -= Math.max(1, Math.round(4 * playerDamageMult));
            const a = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);
            target.setVelocityX(Math.cos(a) * 160);
            target.setVelocityY(Math.sin(a) * 160);
            if (target.health <= 0) {
                for (let i = 0; i < 7; i++) {
                    const p = scene.add.rectangle(
                        target.x + Phaser.Math.Between(-8, 8),
                        target.y + Phaser.Math.Between(-8, 8),
                        4, 4, 0x4A6A3A).setDepth(2);
                    scene.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-30, 30), y: p.y - Phaser.Math.Between(10, 35), alpha: 0, duration: 450, onComplete: () => p.destroy() });
                }
                target.destroy();
            } else {
                target.setTint(0x88DDFF);
                scene.time.delayedCall(120, () => { if (target.active) target.clearTint(); });
            }
        }
    });
    return true;
}

// Build a cottage at the player's current tile (costs 20 wood)
function buildCottage(scene) {
    if (wood < 20) {
        const need = 20 - wood;
        const msg = scene.add.text(player.x, player.y - 40,
            `Need ${need} more wood!`, {
            fontSize: '13px', fill: '#ff8888', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(300);
        scene.tweens.add({ targets: msg, y: msg.y - 20, alpha: 0, duration: 1400, onComplete: () => msg.destroy() });
        return;
    }

    // Snap player position to the nearest tile centre
    const tileX = Math.floor(player.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    const tileY = Math.floor(player.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

    // Place the visual
    const houseVisual = scene.add.image(tileX, tileY, 'house');
    houseVisual.setDepth(1);
    mapObjects.push(houseVisual);

    // Remember this cottage for companion teleportation
    playerCottages.push({ x: tileX, y: tileY, count: 0 });

    // Add a solid physics body to the existing housesGroup
    const hc = housesGroup.create(tileX, tileY, 'house');
    hc.setAlpha(0).setDepth(-1);
    hc.body.setSize(28, 18);
    hc.body.setOffset(2, 10);

    // Deduct wood and update HUD
    wood -= 20;
    woodText.setText('Wood: ' + wood);
    invWoodCountText.setText('x ' + wood);

    // Celebration effect
    const msg = scene.add.text(tileX, tileY - 48, 'Cottage built!', {
        fontSize: '16px', fill: '#FFD700', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(300);
    scene.tweens.add({ targets: msg, y: msg.y - 32, alpha: 0, duration: 2200, onComplete: () => msg.destroy() });

    for (let i = 0; i < 10; i++) {
        const spark = scene.add.rectangle(
            tileX + Phaser.Math.Between(-16, 16),
            tileY + Phaser.Math.Between(-16, 16),
            4, 4, 0xFFD700
        ).setDepth(2);
        scene.tweens.add({
            targets: spark,
            x: spark.x + Phaser.Math.Between(-40, 40),
            y: spark.y - Phaser.Math.Between(20, 50),
            alpha: 0, duration: 700,
            onComplete: () => spark.destroy()
        });
    }
}

// Activate a checkpoint campfire
function activateCheckpoint(scene, cp) {
    const cpKey = `${cp.mapIndex}_${cp.cpX}_${cp.cpY}`;
    const isNew = !visitedCheckpoints.has(cpKey);

    if (isNew) {
        visitedCheckpoints.add(cpKey);
        checkpointsActivated++;
    }

    const alreadyActive = lastCheckpoint.mapIndex === cp.mapIndex &&
        lastCheckpoint.x === cp.cpX && lastCheckpoint.y === cp.cpY;

    if (!alreadyActive) {
        lastCheckpoint = { mapIndex: cp.mapIndex, x: cp.cpX, y: cp.cpY };
        cp.setTexture('checkpoint_on');
    }

    if (isNew) {
        const maxNow = checkpointsActivated * 2;
        const msg = scene.add.text(cp.cpX, cp.cpY - 40,
            `Checkpoint!\nCompanion limit: ${maxNow}`, {
            fontSize: '13px', fill: '#FFD700', stroke: '#000000', strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(300);
        scene.tweens.add({ targets: msg, y: msg.y - 28, alpha: 0, duration: 2000, onComplete: () => msg.destroy() });
    }
}

// Companion labor: seek and chop nearest tree
function companionLabor(scene, companion) {
    if (companion.laborCooldown > 0) {
        companion.laborCooldown--;
        companion.setVelocity(0);
        return;
    }

    let nearest = null;
    let nearestDist = 9999;
    treesGroup.getChildren().forEach(tree => {
        if (!tree.active) return;
        const d = Phaser.Math.Distance.Between(companion.x, companion.y, tree.x, tree.y);
        if (d < nearestDist) { nearestDist = d; nearest = tree; }
    });

    if (!nearest) { companion.setVelocity(0); return; }

    if (nearestDist < 42) {
        companion.setVelocity(0);
        nearest.health--;
        companion.laborCooldown = Math.max(25, 80 - companion.stats.atk * 10);
        createChopEffect(scene, nearest.x, nearest.y);

        if (nearest.health <= 0) {
            const stump = scene.add.image(nearest.x, nearest.y, 'stump');
            stump.setDepth(0);
            mapObjects.push(stump);
            if (nearest.visual) nearest.visual.destroy();
            nearest.destroy();
            wood++;
            woodText.setText('Wood: ' + wood);
            invWoodCountText.setText('x ' + wood);
        }
    } else {
        const spd = 45 + companion.stats.spd * 12;
        const angle = Math.atan2(nearest.y - companion.y, nearest.x - companion.x);
        companion.setVelocityX(Math.cos(angle) * spd);
        companion.setVelocityY(Math.sin(angle) * spd);
    }
}

// Load a map by index, place player at (px, py)
Phaser.Scene.prototype.loadMap = function(mapIndex, px, py) {
    currentMapIndex = mapIndex;

    // Destroy all tile visuals from the previous map
    mapObjects.forEach(obj => { if (obj && obj.active) obj.destroy(); });
    mapObjects = [];
    playerCottages = [];

    // Clear physics groups (keeps the group objects, removes their children)
    treesGroup.clear(true, true);
    waterGroup.clear(true, true);
    rocksGroup.clear(true, true);
    housesGroup.clear(true, true);
    deerGroup.clear(true, true);
    wolfGroup.clear(true, true);
    rabbitGroup.clear(true, true);
    enemyGroup.clear(true, true);
    zombieGroup.clear(true, true);
    skeletonGroup.clear(true, true);
    catGroup.clear(true, true);
    bossGroup.clear(true, true);
    lichSpawned = false;
    lichFinalAttackTriggered = false;
    cutsceneActive = false;
    checkpointGroup.clear(true, true);
    chestGroup.clear(true, true);

    // Generate new map tiles and populate groups
    this.createMap(mapIndex);

    // Reposition player
    player.setPosition(px, py);
    player.setVelocity(0);

    // NPC appears on Starting Village (map 0) and Death's Keep (map 13)
    const npcOnThisMap = (mapIndex === 0 || mapIndex === 13);
    npc.setVisible(npcOnThisMap);
    npc.body.enable = npcOnThisMap;
    if (mapIndex === 13) {
        npc.setPosition(15 * TILE_SIZE + 16, 10 * TILE_SIZE + 16);
    } else {
        npc.setPosition(10 * TILE_SIZE + 16, 12 * TILE_SIZE + 16);
    }

    // Move companions to spawn near player
    companionGroup.getChildren().forEach((c, i) => {
        const a = (i / Math.max(companionGroup.getLength(), 1)) * Math.PI * 2;
        c.setPosition(px + Math.cos(a) * 50, py + Math.sin(a) * 50);
        c.setVelocity(0);
    });
};

// Transition to the next map in the cycle
function transitionMap(scene, direction, targetMap) {
    if (transitioning) return;
    transitioning = true;
    hideDialogue();

    scene.cameras.main.fadeOut(400, 0, 0, 0);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
        const nextMap = (targetMap !== undefined) ? targetMap : (currentMapIndex + 1) % MAP_COUNT;
        const mapW = 30 * TILE_SIZE;
        const mapH = 25 * TILE_SIZE;
        const margin = 64;

        let newX = Phaser.Math.Clamp(player.x, margin, mapW - margin);
        let newY = Phaser.Math.Clamp(player.y, margin, mapH - margin);

        if (direction === 'left')  newX = mapW - margin;
        if (direction === 'right') newX = margin;
        if (direction === 'up')    newY = mapH - margin;
        if (direction === 'down')  newY = margin;

        scene.loadMap(nextMap, newX, newY);

        // Show map name banner
        const banner = scene.add.text(400, 80, MAP_NAMES[nextMap], {
            fontSize: '26px', fill: '#ffffff',
            stroke: '#000000', strokeThickness: 3,
            backgroundColor: '#00000099',
            padding: { x: 20, y: 10 }
        });
        banner.setOrigin(0.5).setScrollFactor(0).setDepth(500);
        scene.tweens.add({
            targets: banner, alpha: 0, delay: 2000, duration: 1000,
            onComplete: () => banner.destroy()
        });

        scene.cameras.main.fadeIn(400, 0, 0, 0);
        scene.cameras.main.once('camerafadeincomplete', () => {
            transitioning = false;
        });
    });
}

// Build the inventory panel UI (hidden by default)
Phaser.Scene.prototype.createInventoryUI = function() {
    const cx = 400, cy = 300;
    const pw = 420, ph = 460;

    // Background
    const bg = this.add.rectangle(cx, cy, pw, ph, 0x111122, 0.95);
    bg.setScrollFactor(0).setDepth(300).setStrokeStyle(2, 0xaaaacc).setVisible(false);

    // Title
    const title = this.add.text(cx, cy - ph / 2 + 16, 'INVENTORY', {
        fontSize: '18px', fill: '#ffdd44', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(301).setVisible(false);

    // Divider
    const divider = this.add.rectangle(cx, cy - ph / 2 + 42, pw - 20, 2, 0x555577);
    divider.setScrollFactor(0).setDepth(301).setVisible(false);

    // Close hint
    const hint = this.add.text(cx, cy + ph / 2 - 16, 'Press I to close', {
        fontSize: '12px', fill: '#666688'
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(301).setVisible(false);

    invPanel.push(bg, title, divider, hint);

    // --- Sword row (hidden until obtained) ---
    const swordImg = this.add.image(cx - pw / 2 + 28, cy - 30, 'sword');
    swordImg.setScrollFactor(0).setDepth(301).setVisible(false);

    const swordLabel = this.add.text(cx - pw / 2 + 52, cy - 40, 'Wooden Sword', {
        fontSize: '14px', fill: '#e0e0e0'
    }).setScrollFactor(0).setDepth(301).setVisible(false);

    const swordDesc = this.add.text(cx - pw / 2 + 52, cy - 22, 'A sturdy blade for chopping and fighting', {
        fontSize: '11px', fill: '#888899'
    }).setScrollFactor(0).setDepth(301).setVisible(false);

    invSwordRow.push(swordImg, swordLabel, swordDesc);

    // --- Bow row (hidden until obtained) ---
    const bowImg = this.add.image(cx - pw / 2 + 28, cy + 10, 'bow');
    bowImg.setScrollFactor(0).setDepth(301).setVisible(false);

    const bowLabel = this.add.text(cx - pw / 2 + 52, cy, 'Wooden Bow', {
        fontSize: '14px', fill: '#e0e0e0'
    }).setScrollFactor(0).setDepth(301).setVisible(false);

    const bowDesc = this.add.text(cx - pw / 2 + 52, cy + 18, 'Fires arrows at enemies from a distance', {
        fontSize: '11px', fill: '#888899'
    }).setScrollFactor(0).setDepth(301).setVisible(false);

    invArrowCountText = this.add.text(cx + pw / 2 - 16, cy, 'x 0', {
        fontSize: '14px', fill: '#88DDFF'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(301).setVisible(false);

    invBowRow.push(bowImg, bowLabel, bowDesc, invArrowCountText);

    // --- Stone Sword row (hidden until obtained) ---
    const stoneSwordImg = this.add.image(cx - pw / 2 + 28, cy + 50, 'stone_sword');
    stoneSwordImg.setScrollFactor(0).setDepth(301).setVisible(false);

    const stoneSwordLabel = this.add.text(cx - pw / 2 + 52, cy + 40, 'Stone Sword', {
        fontSize: '14px', fill: '#c0c0dd'
    }).setScrollFactor(0).setDepth(301).setVisible(false);

    const stoneSwordDesc = this.add.text(cx - pw / 2 + 52, cy + 58, 'Forged from stone — deals double damage', {
        fontSize: '11px', fill: '#888899'
    }).setScrollFactor(0).setDepth(301).setVisible(false);

    invStoneSwordRow.push(stoneSwordImg, stoneSwordLabel, stoneSwordDesc);

    // --- Crystal Sword row (hidden until obtained) ---
    const crystalSwordImg = this.add.image(cx - pw / 2 + 28, cy + 90, 'crystal_sword');
    crystalSwordImg.setScrollFactor(0).setDepth(301).setVisible(false);

    const crystalSwordLabel = this.add.text(cx - pw / 2 + 52, cy + 80, 'Crystal Sword', {
        fontSize: '14px', fill: '#aaddff'
    }).setScrollFactor(0).setDepth(301).setVisible(false);

    const crystalSwordDesc = this.add.text(cx - pw / 2 + 52, cy + 98, 'A blade of pure crystal — devastating power', {
        fontSize: '11px', fill: '#888899'
    }).setScrollFactor(0).setDepth(301).setVisible(false);

    invCrystalSwordRow.push(crystalSwordImg, crystalSwordLabel, crystalSwordDesc);

    // --- Shield row (hidden until obtained) ---
    const shieldImg = this.add.image(cx - pw / 2 + 28, cy + 130, 'shield');
    shieldImg.setScrollFactor(0).setDepth(301).setVisible(false);
    const shieldLabel = this.add.text(cx - pw / 2 + 52, cy + 120, 'Shield', { fontSize: '14px', fill: '#88ccff' }).setScrollFactor(0).setDepth(301).setVisible(false);
    const shieldDesc  = this.add.text(cx - pw / 2 + 52, cy + 138, 'Hold D to block — reduces damage by 80%', { fontSize: '11px', fill: '#888899' }).setScrollFactor(0).setDepth(301).setVisible(false);
    invShieldRow.push(shieldImg, shieldLabel, shieldDesc);

    // --- Emerald Spear row (hidden until obtained) ---
    const spearImg = this.add.image(cx - pw / 2 + 28, cy + 170, 'emerald_spear');
    spearImg.setScrollFactor(0).setDepth(301).setVisible(false);
    const spearLabel = this.add.text(cx - pw / 2 + 52, cy + 160, 'Emerald Spear', { fontSize: '14px', fill: '#44ffaa' }).setScrollFactor(0).setDepth(301).setVisible(false);
    const spearDesc  = this.add.text(cx - pw / 2 + 52, cy + 178, 'Press S to throw — pierces all enemies', { fontSize: '11px', fill: '#888899' }).setScrollFactor(0).setDepth(301).setVisible(false);
    invSpearCountText = this.add.text(cx + pw / 2 - 16, cy + 160, 'x 0', { fontSize: '14px', fill: '#44ffaa' }).setOrigin(1, 0).setScrollFactor(0).setDepth(301).setVisible(false);
    invSpearRow.push(spearImg, spearLabel, spearDesc, invSpearCountText);

    // --- Wood row (always visible in panel) ---
    const woodSquare = this.add.rectangle(cx - pw / 2 + 20, cy + 210, 16, 16, 0x4a2f1a);
    woodSquare.setStrokeStyle(1, 0x6b4423).setScrollFactor(0).setDepth(301).setVisible(false);

    const woodLabel = this.add.text(cx - pw / 2 + 36, cy + 203, 'Wood', {
        fontSize: '14px', fill: '#e0e0e0'
    }).setScrollFactor(0).setDepth(301).setVisible(false);

    invWoodCountText = this.add.text(cx + pw / 2 - 16, cy + 203, 'x 0', {
        fontSize: '14px', fill: '#ffdd44'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(301).setVisible(false);

    invPanel.push(woodSquare, woodLabel, invWoodCountText);
};

// Helper function to create player textures for all directions
Phaser.Scene.prototype.createPlayerTexture = function() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    // === ADVENTURER (default 'player' textures) ===
    this.drawPlayerDown(graphics);
    graphics.generateTexture('player_down', 32, 32);
    graphics.clear();

    this.drawPlayerUp(graphics);
    graphics.generateTexture('player_up', 32, 32);
    graphics.clear();

    this.drawPlayerSide(graphics, false);
    graphics.generateTexture('player_right', 32, 32);
    graphics.clear();

    this.drawPlayerSide(graphics, true);
    graphics.generateTexture('player_left', 32, 32);
    graphics.clear();

    this.drawPlayerDown(graphics);
    graphics.generateTexture('player', 32, 32);

    graphics.destroy();
};

// Draw player facing down (front view)
Phaser.Scene.prototype.drawPlayerDown = function(graphics) {
    // Shadow
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillEllipse(16, 30, 16, 6);

    // Legs
    graphics.fillStyle(0x3d3d5c);
    graphics.fillRect(9, 22, 5, 8);
    graphics.fillRect(18, 22, 5, 8);

    // Boots
    graphics.fillStyle(0x4a3728);
    graphics.fillRect(8, 27, 6, 4);
    graphics.fillRect(18, 27, 6, 4);
    graphics.fillStyle(0x5c4333);
    graphics.fillRect(8, 27, 6, 1);
    graphics.fillRect(18, 27, 6, 1);

    // Body / Tunic
    graphics.fillStyle(0x2d5a87);
    graphics.fillRect(8, 12, 16, 12);
    graphics.fillStyle(0x1e4060);
    graphics.fillRect(8, 12, 3, 12);
    graphics.fillStyle(0x3d7ab0);
    graphics.fillRect(19, 12, 3, 10);

    // Belt
    graphics.fillStyle(0x6b4423);
    graphics.fillRect(7, 21, 18, 3);
    graphics.fillStyle(0xd4a84b);
    graphics.fillRect(14, 21, 4, 3);

    // Arms
    graphics.fillStyle(0x2d5a87);
    graphics.fillRect(4, 13, 4, 9);
    graphics.fillRect(24, 13, 4, 9);
    graphics.fillStyle(0xf5c9a6);
    graphics.fillRect(4, 20, 4, 3);
    graphics.fillRect(24, 20, 4, 3);

    // Neck
    graphics.fillStyle(0xf5c9a6);
    graphics.fillRect(13, 10, 6, 4);

    // Head
    graphics.fillStyle(0xf5c9a6);
    graphics.fillRoundedRect(9, 1, 14, 12, 3);

    // Hair
    graphics.fillStyle(0x4a3222);
    graphics.fillRoundedRect(9, 0, 14, 6, { tl: 3, tr: 3, bl: 0, br: 0 });
    graphics.fillRect(9, 3, 2, 4);
    graphics.fillRect(21, 3, 2, 4);

    // Eyes
    graphics.fillStyle(0xffffff);
    graphics.fillRect(11, 5, 4, 3);
    graphics.fillRect(17, 5, 4, 3);
    graphics.fillStyle(0x2d5a87);
    graphics.fillRect(13, 5, 2, 3);
    graphics.fillRect(19, 5, 2, 3);
    graphics.fillStyle(0x000000);
    graphics.fillRect(13, 6, 2, 2);
    graphics.fillRect(19, 6, 2, 2);

    // Eyebrows
    graphics.fillStyle(0x3a2515);
    graphics.fillRect(11, 4, 4, 1);
    graphics.fillRect(17, 4, 4, 1);

    // Nose
    graphics.fillStyle(0xe5b896);
    graphics.fillRect(15, 7, 2, 2);

    // Mouth
    graphics.fillStyle(0xc97878);
    graphics.fillRect(14, 10, 4, 1);

    // Ears
    graphics.fillStyle(0xf5c9a6);
    graphics.fillRect(8, 5, 2, 3);
    graphics.fillRect(22, 5, 2, 3);
};

// Draw player facing up (back view)
Phaser.Scene.prototype.drawPlayerUp = function(graphics) {
    // Shadow
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillEllipse(16, 30, 16, 6);

    // Legs
    graphics.fillStyle(0x3d3d5c);
    graphics.fillRect(9, 22, 5, 8);
    graphics.fillRect(18, 22, 5, 8);

    // Boots
    graphics.fillStyle(0x4a3728);
    graphics.fillRect(8, 27, 6, 4);
    graphics.fillRect(18, 27, 6, 4);

    // Body / Tunic (back)
    graphics.fillStyle(0x2d5a87);
    graphics.fillRect(8, 12, 16, 12);
    graphics.fillStyle(0x1e4060);
    graphics.fillRect(8, 12, 3, 12);
    graphics.fillRect(21, 12, 3, 12);

    // Belt (back)
    graphics.fillStyle(0x6b4423);
    graphics.fillRect(7, 21, 18, 3);

    // Arms
    graphics.fillStyle(0x2d5a87);
    graphics.fillRect(4, 13, 4, 9);
    graphics.fillRect(24, 13, 4, 9);
    graphics.fillStyle(0xf5c9a6);
    graphics.fillRect(4, 20, 4, 3);
    graphics.fillRect(24, 20, 4, 3);

    // Neck
    graphics.fillStyle(0xf5c9a6);
    graphics.fillRect(13, 10, 6, 3);

    // Head (back of head - mostly hair)
    graphics.fillStyle(0x4a3222);
    graphics.fillRoundedRect(9, 1, 14, 12, 3);

    // Hair detail
    graphics.fillStyle(0x3a2515);
    graphics.fillRect(11, 4, 10, 6);

    // Ears peeking out
    graphics.fillStyle(0xf5c9a6);
    graphics.fillRect(8, 5, 2, 3);
    graphics.fillRect(22, 5, 2, 3);
};

// Draw player facing side (left or right)
Phaser.Scene.prototype.drawPlayerSide = function(graphics, flipLeft) {
    const offset = flipLeft ? 0 : 0;

    // Shadow
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillEllipse(16, 30, 16, 6);

    // Back leg (further away)
    graphics.fillStyle(0x2d2d42);
    if (flipLeft) {
        graphics.fillRect(15, 22, 5, 8);
        graphics.fillStyle(0x3a2820);
        graphics.fillRect(15, 27, 6, 4);
    } else {
        graphics.fillRect(12, 22, 5, 8);
        graphics.fillStyle(0x3a2820);
        graphics.fillRect(11, 27, 6, 4);
    }

    // Front leg
    graphics.fillStyle(0x3d3d5c);
    if (flipLeft) {
        graphics.fillRect(11, 22, 5, 8);
        graphics.fillStyle(0x4a3728);
        graphics.fillRect(10, 27, 6, 4);
    } else {
        graphics.fillRect(16, 22, 5, 8);
        graphics.fillStyle(0x4a3728);
        graphics.fillRect(16, 27, 6, 4);
    }

    // Body / Tunic (side view - narrower)
    graphics.fillStyle(0x2d5a87);
    graphics.fillRect(10, 12, 12, 12);
    graphics.fillStyle(0x1e4060);
    if (flipLeft) {
        graphics.fillRect(18, 12, 4, 12);
    } else {
        graphics.fillRect(10, 12, 4, 12);
    }

    // Belt
    graphics.fillStyle(0x6b4423);
    graphics.fillRect(9, 21, 14, 3);
    graphics.fillStyle(0xd4a84b);
    if (flipLeft) {
        graphics.fillRect(10, 21, 3, 3);
    } else {
        graphics.fillRect(19, 21, 3, 3);
    }

    // Back arm
    graphics.fillStyle(0x1e4060);
    if (flipLeft) {
        graphics.fillRect(20, 13, 4, 9);
        graphics.fillStyle(0xe5b896);
        graphics.fillRect(20, 20, 4, 3);
    } else {
        graphics.fillRect(8, 13, 4, 9);
        graphics.fillStyle(0xe5b896);
        graphics.fillRect(8, 20, 4, 3);
    }

    // Front arm
    graphics.fillStyle(0x2d5a87);
    if (flipLeft) {
        graphics.fillRect(6, 13, 4, 9);
        graphics.fillStyle(0xf5c9a6);
        graphics.fillRect(5, 20, 4, 3);
    } else {
        graphics.fillRect(22, 13, 4, 9);
        graphics.fillStyle(0xf5c9a6);
        graphics.fillRect(23, 20, 4, 3);
    }

    // Neck
    graphics.fillStyle(0xf5c9a6);
    graphics.fillRect(13, 10, 6, 4);

    // Head (side view)
    graphics.fillStyle(0xf5c9a6);
    if (flipLeft) {
        graphics.fillRoundedRect(8, 1, 14, 12, 3);
    } else {
        graphics.fillRoundedRect(10, 1, 14, 12, 3);
    }

    // Hair (side)
    graphics.fillStyle(0x4a3222);
    if (flipLeft) {
        graphics.fillRoundedRect(12, 0, 12, 7, { tl: 3, tr: 3, bl: 0, br: 0 });
        graphics.fillRect(20, 3, 3, 5);
    } else {
        graphics.fillRoundedRect(8, 0, 12, 7, { tl: 3, tr: 3, bl: 0, br: 0 });
        graphics.fillRect(9, 3, 3, 5);
    }

    // Eye (only one visible from side)
    graphics.fillStyle(0xffffff);
    if (flipLeft) {
        graphics.fillRect(10, 5, 4, 3);
        graphics.fillStyle(0x2d5a87);
        graphics.fillRect(10, 5, 2, 3);
        graphics.fillStyle(0x000000);
        graphics.fillRect(10, 6, 2, 2);
        // Eyebrow
        graphics.fillStyle(0x3a2515);
        graphics.fillRect(10, 4, 4, 1);
    } else {
        graphics.fillRect(18, 5, 4, 3);
        graphics.fillStyle(0x2d5a87);
        graphics.fillRect(20, 5, 2, 3);
        graphics.fillStyle(0x000000);
        graphics.fillRect(20, 6, 2, 2);
        // Eyebrow
        graphics.fillStyle(0x3a2515);
        graphics.fillRect(18, 4, 4, 1);
    }

    // Nose (profile)
    graphics.fillStyle(0xe5b896);
    if (flipLeft) {
        graphics.fillRect(8, 6, 2, 3);
    } else {
        graphics.fillRect(22, 6, 2, 3);
    }

    // Ear
    graphics.fillStyle(0xf5c9a6);
    if (flipLeft) {
        graphics.fillRect(21, 5, 2, 3);
    } else {
        graphics.fillRect(9, 5, 2, 3);
    }
};

// Helper function to create tile textures
Phaser.Scene.prototype.createTileTextures = function() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Grass tile
    graphics.fillStyle(0x3d8b40);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // Add some texture variation
    graphics.fillStyle(0x4a9e4d);
    for (let i = 0; i < 8; i++) {
        const x = Phaser.Math.Between(2, TILE_SIZE - 4);
        const y = Phaser.Math.Between(2, TILE_SIZE - 4);
        graphics.fillRect(x, y, 2, 2);
    }
    graphics.generateTexture('grass', TILE_SIZE, TILE_SIZE);
    graphics.clear();

    // Path/dirt tile
    graphics.fillStyle(0x8b7355);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x9b8365);
    for (let i = 0; i < 5; i++) {
        const x = Phaser.Math.Between(2, TILE_SIZE - 6);
        const y = Phaser.Math.Between(2, TILE_SIZE - 6);
        graphics.fillRect(x, y, 4, 4);
    }
    graphics.generateTexture('path', TILE_SIZE, TILE_SIZE);
    graphics.clear();

    // Water tile
    graphics.fillStyle(0x4488cc);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x66aaee);
    graphics.fillRect(4, 8, 12, 2);
    graphics.fillRect(16, 16, 12, 2);
    graphics.fillRect(8, 24, 10, 2);
    graphics.generateTexture('water', TILE_SIZE, TILE_SIZE);
    graphics.clear();

    // Tree tile
    graphics.fillStyle(0x3d8b40); // grass background
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // Trunk
    graphics.fillStyle(0x4a2f1a);
    graphics.fillRect(12, 18, 8, 14);
    // Trunk highlight
    graphics.fillStyle(0x6b4423);
    graphics.fillRect(14, 18, 2, 12);
    // Leaves - darker green base
    graphics.fillStyle(0x1a5c28);
    graphics.fillCircle(16, 12, 12);
    // Leaves - mid tone
    graphics.fillStyle(0x2d7a3d);
    graphics.fillCircle(14, 10, 8);
    // Leaves - highlight
    graphics.fillStyle(0x3d9450);
    graphics.fillCircle(12, 8, 4);
    // Outline for contrast
    graphics.lineStyle(1, 0x0d3315);
    graphics.strokeCircle(16, 12, 12);
    graphics.generateTexture('tree', TILE_SIZE, TILE_SIZE);
    graphics.clear();

    // Tree stump tile (after chopping)
    graphics.fillStyle(0x3d8b40); // grass background
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // Stump
    graphics.fillStyle(0x4a2f1a);
    graphics.fillEllipse(16, 22, 12, 8);
    // Stump top
    graphics.fillStyle(0x6b4423);
    graphics.fillEllipse(16, 20, 10, 6);
    // Rings
    graphics.lineStyle(1, 0x4a2f1a);
    graphics.strokeEllipse(16, 20, 6, 4);
    graphics.strokeEllipse(16, 20, 3, 2);
    graphics.generateTexture('stump', TILE_SIZE, TILE_SIZE);
    graphics.clear();

    // Rock tile (on grass - for static display)
    graphics.fillStyle(0x3d8b40); // grass background
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(0x707070);
    graphics.fillEllipse(16, 20, 14, 10);
    graphics.fillStyle(0x888888);
    graphics.fillEllipse(16, 18, 12, 8);
    graphics.fillStyle(0xa0a0a0);
    graphics.fillEllipse(14, 16, 6, 4);
    graphics.generateTexture('rock', TILE_SIZE, TILE_SIZE);
    graphics.clear();

    // Pushable rock sprite (no background, transparent)
    graphics.fillStyle(0x606060);
    graphics.fillEllipse(16, 20, 14, 10);
    graphics.fillStyle(0x808080);
    graphics.fillEllipse(16, 18, 12, 8);
    graphics.fillStyle(0xa8a8a8);
    graphics.fillEllipse(14, 16, 6, 4);
    // Rock outline
    graphics.lineStyle(1, 0x404040);
    graphics.strokeEllipse(16, 18, 12, 8);
    graphics.generateTexture('rockSprite', TILE_SIZE, TILE_SIZE);
    graphics.clear();

    // House tile (cozy cottage style)
    // Grass base
    graphics.fillStyle(0x3d8b40);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    // House base/walls
    graphics.fillStyle(0xc4a882); // tan/beige walls
    graphics.fillRect(2, 10, 28, 18);

    // Wall shading
    graphics.fillStyle(0xa89068);
    graphics.fillRect(2, 10, 3, 18);
    graphics.fillStyle(0xd4b892);
    graphics.fillRect(25, 10, 3, 16);

    // Roof
    graphics.fillStyle(0x8b4513); // brown roof
    graphics.beginPath();
    graphics.moveTo(0, 12);
    graphics.lineTo(16, 0);
    graphics.lineTo(32, 12);
    graphics.closePath();
    graphics.fillPath();

    // Roof shading
    graphics.fillStyle(0x6b3503);
    graphics.beginPath();
    graphics.moveTo(0, 12);
    graphics.lineTo(16, 0);
    graphics.lineTo(16, 12);
    graphics.closePath();
    graphics.fillPath();

    // Roof outline
    graphics.lineStyle(1, 0x4a2505);
    graphics.beginPath();
    graphics.moveTo(0, 12);
    graphics.lineTo(16, 0);
    graphics.lineTo(32, 12);
    graphics.strokePath();

    // Door
    graphics.fillStyle(0x5c3d2e);
    graphics.fillRect(12, 18, 8, 10);
    // Door frame
    graphics.fillStyle(0x4a2f1a);
    graphics.fillRect(12, 18, 8, 2);
    graphics.fillRect(12, 18, 2, 10);
    graphics.fillRect(18, 18, 2, 10);
    // Door knob
    graphics.fillStyle(0xd4a84b);
    graphics.fillCircle(18, 24, 1);

    // Window
    graphics.fillStyle(0x87ceeb); // light blue
    graphics.fillRect(22, 14, 6, 6);
    // Window frame
    graphics.lineStyle(1, 0x4a2f1a);
    graphics.strokeRect(22, 14, 6, 6);
    graphics.lineBetween(25, 14, 25, 20);
    graphics.lineBetween(22, 17, 28, 17);

    graphics.generateTexture('house', TILE_SIZE, TILE_SIZE);

    graphics.destroy();
};

// Helper function to create NPC texture
Phaser.Scene.prototype.createNPCTexture = function() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Shadow
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillEllipse(16, 30, 16, 6);

    // Legs (robe covers most)
    graphics.fillStyle(0x2a1a4a);
    graphics.fillRect(11, 24, 4, 6);
    graphics.fillRect(17, 24, 4, 6);

    // Boots
    graphics.fillStyle(0x3a2515);
    graphics.fillRect(10, 27, 5, 4);
    graphics.fillRect(17, 27, 5, 4);

    // Robe body
    graphics.fillStyle(0x4a2a7a); // purple robe
    graphics.fillRect(8, 10, 16, 16);
    graphics.fillStyle(0x3a1a6a);
    graphics.fillRect(8, 10, 4, 16);
    graphics.fillStyle(0x5a3a8a);
    graphics.fillRect(20, 10, 4, 14);

    // Robe trim
    graphics.fillStyle(0xd4a84b);
    graphics.fillRect(8, 24, 16, 2);
    graphics.fillRect(14, 10, 4, 16);

    // Arms in robe
    graphics.fillStyle(0x4a2a7a);
    graphics.fillRect(4, 12, 5, 10);
    graphics.fillRect(23, 12, 5, 10);

    // Hands
    graphics.fillStyle(0xf5c9a6);
    graphics.fillRect(4, 20, 5, 4);
    graphics.fillRect(23, 20, 5, 4);

    // Neck
    graphics.fillStyle(0xf5c9a6);
    graphics.fillRect(13, 8, 6, 4);

    // Head
    graphics.fillStyle(0xf5c9a6);
    graphics.fillRoundedRect(9, 0, 14, 12, 3);

    // Gray beard
    graphics.fillStyle(0xaaaaaa);
    graphics.fillRect(11, 8, 10, 6);
    graphics.fillRect(13, 12, 6, 3);

    // Hair (balding with gray sides)
    graphics.fillStyle(0x999999);
    graphics.fillRect(9, 1, 3, 5);
    graphics.fillRect(20, 1, 3, 5);

    // Eyes
    graphics.fillStyle(0x000000);
    graphics.fillRect(12, 4, 2, 2);
    graphics.fillRect(18, 4, 2, 2);

    // Friendly eyebrows
    graphics.fillStyle(0x888888);
    graphics.fillRect(11, 3, 4, 1);
    graphics.fillRect(17, 3, 4, 1);

    // Nose
    graphics.fillStyle(0xe5b896);
    graphics.fillRect(15, 5, 2, 2);

    graphics.generateTexture('npc', 32, 32);
    graphics.destroy();
};

// Helper function to create sword texture
Phaser.Scene.prototype.createSwordTexture = function() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Blade
    graphics.fillStyle(0xc0c0c0);
    graphics.fillRect(14, 2, 4, 18);
    // Blade shine
    graphics.fillStyle(0xe8e8e8);
    graphics.fillRect(15, 3, 2, 16);
    // Blade tip
    graphics.fillStyle(0xc0c0c0);
    graphics.beginPath();
    graphics.moveTo(14, 2);
    graphics.lineTo(16, 0);
    graphics.lineTo(18, 2);
    graphics.closePath();
    graphics.fillPath();

    // Guard (cross piece)
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(10, 19, 12, 3);
    graphics.fillStyle(0xd4a84b);
    graphics.fillRect(15, 19, 2, 3);

    // Handle
    graphics.fillStyle(0x654321);
    graphics.fillRect(14, 22, 4, 8);
    // Handle wrap
    graphics.fillStyle(0x8b6914);
    graphics.fillRect(14, 23, 4, 2);
    graphics.fillRect(14, 27, 4, 2);

    // Pommel
    graphics.fillStyle(0xd4a84b);
    graphics.fillCircle(16, 31, 2);

    graphics.generateTexture('sword', 32, 32);
    graphics.destroy();
};

// Heart textures for health HUD
Phaser.Scene.prototype.createHeartTextures = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    const drawHeart = () => {
        g.fillRect(1, 0, 3, 2);  // left bump
        g.fillRect(6, 0, 3, 2);  // right bump
        g.fillRect(0, 2, 10, 3); // wide middle
        g.fillRect(1, 5, 8, 2);
        g.fillRect(2, 7, 6, 2);
        g.fillRect(3, 9, 4, 1);
        g.fillRect(4, 10, 2, 1);
    };

    g.fillStyle(0xFF2244);
    drawHeart();
    g.generateTexture('heart_full', 10, 11);
    g.clear();

    // Half heart: left side red, right side dark
    g.fillStyle(0x442233);
    drawHeart();
    g.fillStyle(0xFF2244);
    g.fillRect(1, 0, 2, 2);
    g.fillRect(0, 2, 5, 3);
    g.fillRect(1, 5, 4, 2);
    g.fillRect(2, 7, 3, 2);
    g.fillRect(3, 9, 2, 1);
    g.fillRect(4, 10, 1, 1);
    g.generateTexture('heart_half', 10, 11);
    g.clear();

    g.fillStyle(0x442233);
    drawHeart();
    g.generateTexture('heart_empty', 10, 11);
    g.destroy();
};

// Goblin enemy sprite
Phaser.Scene.prototype.createEnemyTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(16, 31, 16, 5);

    // Legs
    g.fillStyle(0x2A3A1A);
    g.fillRect(10, 22, 4, 8);
    g.fillRect(18, 22, 4, 8);

    // Boots
    g.fillStyle(0x1A1A0A);
    g.fillRect(9, 27, 5, 4);
    g.fillRect(17, 27, 5, 4);

    // Body (ragged tunic)
    g.fillStyle(0x3A4A2A);
    g.fillRect(9, 12, 14, 12);
    g.fillStyle(0x2A3A1A);
    g.fillRect(9, 12, 3, 12);
    g.fillRect(20, 12, 3, 10);

    // Arms
    g.fillStyle(0x4A6A3A);
    g.fillRect(5, 13, 4, 9);
    g.fillRect(23, 13, 4, 9);

    // Clawed hands
    g.fillStyle(0x5A8A4A);
    g.fillRect(4, 21, 3, 3);
    g.fillRect(7, 23, 2, 2);
    g.fillRect(23, 21, 3, 3);
    g.fillRect(25, 23, 2, 2);

    // Neck
    g.fillStyle(0x4A6A3A);
    g.fillRect(13, 9, 6, 4);

    // Head
    g.fillStyle(0x4A6A3A);
    g.fillRoundedRect(8, 0, 16, 12, 3);

    // Pointy ears
    g.fillStyle(0x4A6A3A);
    g.fillTriangle(8, 4, 5, 0, 10, 2);
    g.fillTriangle(24, 4, 27, 0, 22, 2);

    // Red glowing eyes
    g.fillStyle(0xFF2222);
    g.fillRect(10, 3, 4, 3);
    g.fillRect(18, 3, 4, 3);
    g.fillStyle(0xFF6666);
    g.fillRect(11, 4, 2, 2);
    g.fillRect(19, 4, 2, 2);

    // Mouth / fangs
    g.fillStyle(0x1A2A0A);
    g.fillRect(12, 8, 8, 2);
    g.fillStyle(0xEEEEAA);
    g.fillRect(13, 8, 2, 3);
    g.fillRect(17, 8, 2, 3);

    g.generateTexture('enemy', 32, 32);
    g.destroy();
};

// Draw a side-view deer sprite (faces right; flip for left)
Phaser.Scene.prototype.createDeerTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(15, 31, 22, 5);

    // Back legs (darker, behind body)
    g.fillStyle(0x8B5E3C);
    g.fillRect(7, 21, 3, 10);
    g.fillRect(12, 21, 3, 10);

    // Body
    g.fillStyle(0xC8874A);
    g.fillEllipse(14, 17, 22, 12);

    // Belly (lighter)
    g.fillStyle(0xE8C090);
    g.fillEllipse(13, 19, 14, 6);

    // White tail
    g.fillStyle(0xFFFFFF);
    g.fillCircle(3, 15, 3);
    g.fillStyle(0xDDDDDD);
    g.fillCircle(3, 15, 2);

    // Front legs
    g.fillStyle(0xC8874A);
    g.fillRect(17, 21, 3, 10);
    g.fillRect(22, 21, 3, 10);

    // Hooves
    g.fillStyle(0x3D2010);
    g.fillRect(7, 29, 3, 2);
    g.fillRect(12, 29, 3, 2);
    g.fillRect(17, 29, 3, 2);
    g.fillRect(22, 29, 3, 2);

    // Neck
    g.fillStyle(0xC8874A);
    g.fillRect(21, 10, 5, 9);

    // Head
    g.fillEllipse(27, 8, 10, 9);

    // Snout
    g.fillStyle(0xD4955A);
    g.fillEllipse(31, 9, 5, 4);

    // Nostril
    g.fillStyle(0x7A4A2A);
    g.fillCircle(32, 10, 0.8);

    // Eye
    g.fillStyle(0x1A1206);
    g.fillCircle(26, 6, 2);
    g.fillStyle(0x6B4A20);
    g.fillCircle(26, 6, 1.2);
    g.fillStyle(0xFFFFFF);
    g.fillCircle(27, 5, 0.6);

    // Ear
    g.fillStyle(0xC8874A);
    g.fillTriangle(23, 5, 21, 0, 26, 3);
    g.fillStyle(0xF0A080);
    g.fillTriangle(23, 5, 22, 1, 25, 3);

    // Antlers
    g.lineStyle(2, 0x5C3D1A);
    g.lineBetween(23, 4, 20, 1);
    g.lineBetween(20, 1, 17, 0);
    g.lineBetween(20, 1, 19, 3);
    g.lineBetween(25, 3, 26, 0);
    g.lineBetween(26, 0, 24, -1);
    g.lineBetween(26, 0, 28, 1);

    g.generateTexture('deer', 32, 32);
    g.destroy();
};

// Generate the map for the given mapIndex, populating the global physics groups
Phaser.Scene.prototype.createMap = function(mapIndex) {
    const mapWidth = 30;
    const mapHeight = 25;

    // Per-map configuration
    const cfgs = [
        // Map 0: Starting Village
        {
            baseTile: 'grass',
            treeDensity: 8, rockDensity: 3,
            deerCount: 3, wolfCount: 0, rabbitCount: 4, enemyCount: 0, zombieCount: 0, skeletonCount: 0, catCount: 2,
            housePositions: [{ x: 4, y: 8 }, { x: 8, y: 8 }],
            ponds: [{ x1: 22, x2: 26, y1: 4, y2: 8 }],
            pathH: true, pathV: true,
            checkpoint: { x: 10, y: 12 }
        },
        // Map 1: Dark Forest
        {
            baseTile: 'grass',
            treeDensity: 25, rockDensity: 2,
            deerCount: 7, wolfCount: 3, rabbitCount: 2, enemyCount: 3, zombieCount: 0, skeletonCount: 0, catCount: 1,
            housePositions: [],
            ponds: [{ x1: 2, x2: 6, y1: 14, y2: 18 }],
            pathH: false, pathV: true,
            checkpoint: { x: 15, y: 8 }
        },
        // Map 2: Rocky Badlands
        {
            baseTile: 'grass',
            treeDensity: 4, rockDensity: 18,
            deerCount: 2, wolfCount: 2, rabbitCount: 3, enemyCount: 5, zombieCount: 0, skeletonCount: 0,
            housePositions: [],
            ponds: null,
            pathH: true, pathV: false,
            checkpoint: { x: 20, y: 12 }
        },
        // Map 3: Cursed Swamp
        {
            baseTile: 'swamp',
            treeDensity: 18, rockDensity: 1,
            deerCount: 2, wolfCount: 5, rabbitCount: 2, enemyCount: 2, zombieCount: 0, skeletonCount: 0,
            housePositions: [],
            ponds: [
                { x1: 8, x2: 14, y1: 3, y2: 7 },
                { x1: 16, x2: 22, y1: 15, y2: 20 },
                { x1: 2,  x2: 5,  y1: 18, y2: 22 }
            ],
            pathH: false, pathV: false,
            checkpoint: { x: 15, y: 12 }
        },
        // Map 4: Frozen Tundra
        {
            baseTile: 'snow',
            treeDensity: 5, rockDensity: 10,
            deerCount: 2, wolfCount: 7, rabbitCount: 4, enemyCount: 3, zombieCount: 0, skeletonCount: 0, catCount: 1,
            housePositions: [],
            ponds: [{ x1: 12, x2: 18, y1: 10, y2: 14 }],
            pathH: false, pathV: false,
            checkpoint: { x: 10, y: 10 }
        },
        // Map 5: Ancient Desert
        {
            baseTile: 'sand',
            treeDensity: 2, rockDensity: 15,
            deerCount: 0, wolfCount: 3, rabbitCount: 6, enemyCount: 7, zombieCount: 0, skeletonCount: 0,
            housePositions: [],
            ponds: null,
            pathH: true, pathV: false,
            checkpoint: { x: 20, y: 8 }
        },
        // Map 6: Haunted Graveyard
        {
            baseTile: 'graveyard',
            treeDensity: 6, rockDensity: 10,
            deerCount: 1, wolfCount: 2, rabbitCount: 1, enemyCount: 2, zombieCount: 7, skeletonCount: 0,
            housePositions: [],
            ponds: null,
            pathH: true, pathV: false,
            checkpoint: { x: 10, y: 12 }
        },
        // Map 7: Zombie Ruins
        {
            baseTile: 'dark_stone',
            treeDensity: 3, rockDensity: 12,
            deerCount: 0, wolfCount: 3, rabbitCount: 0, enemyCount: 3, zombieCount: 10, skeletonCount: 0,
            housePositions: [],
            ponds: null,
            pathH: true, pathV: true,
            checkpoint: { x: 15, y: 12 }
        },
        // Map 8: Undead Fortress
        {
            baseTile: 'dark_stone',
            treeDensity: 2, rockDensity: 15,
            deerCount: 0, wolfCount: 2, rabbitCount: 0, enemyCount: 5, zombieCount: 14, skeletonCount: 0,
            housePositions: [],
            ponds: null,
            pathH: false, pathV: false,
            checkpoint: { x: 20, y: 12 }
        },
        // Map 9: Crystal Caverns
        {
            baseTile: 'dark_stone',
            treeDensity: 3, rockDensity: 20,
            deerCount: 0, wolfCount: 2, rabbitCount: 0, enemyCount: 3, zombieCount: 3, skeletonCount: 4,
            housePositions: [],
            ponds: [{ x1: 5, x2: 9, y1: 5, y2: 9 }],
            pathH: true, pathV: false,
            checkpoint: { x: 22, y: 12 }
        },
        // Map 10: Shadow Wastes
        {
            baseTile: 'dark_stone',
            treeDensity: 2, rockDensity: 14,
            deerCount: 0, wolfCount: 1, rabbitCount: 0, enemyCount: 4, zombieCount: 4, skeletonCount: 6,
            housePositions: [],
            ponds: null,
            pathH: false, pathV: true,
            checkpoint: { x: 15, y: 20 }
        },
        // Map 11: Bone Fields
        {
            baseTile: 'graveyard',
            treeDensity: 4, rockDensity: 8,
            deerCount: 0, wolfCount: 0, rabbitCount: 0, enemyCount: 2, zombieCount: 3, skeletonCount: 8,
            housePositions: [],
            ponds: null,
            pathH: true, pathV: false,
            checkpoint: { x: 8, y: 12 }
        },
        // Map 12: Plague Marshes
        {
            baseTile: 'swamp',
            treeDensity: 14, rockDensity: 3,
            deerCount: 0, wolfCount: 2, rabbitCount: 0, enemyCount: 2, zombieCount: 5, skeletonCount: 6,
            housePositions: [],
            ponds: [
                { x1: 6, x2: 12, y1: 4, y2: 8 },
                { x1: 18, x2: 24, y1: 14, y2: 19 }
            ],
            pathH: false, pathV: false,
            checkpoint: { x: 14, y: 14 }
        },
        // Map 13: Death's Keep
        {
            baseTile: 'dark_stone',
            treeDensity: 1, rockDensity: 18,
            deerCount: 0, wolfCount: 0, rabbitCount: 0, enemyCount: 4, zombieCount: 4, skeletonCount: 10,
            housePositions: [],
            ponds: null,
            pathH: true, pathV: true,
            checkpoint: { x: 20, y: 8 }
        },
        // Map 14: Lich's Throne (final map — monster army guards the Lich)
        {
            baseTile: 'dark_stone',
            treeDensity: 0, rockDensity: 12,
            deerCount: 0, wolfCount: 0, rabbitCount: 0, enemyCount: 0, zombieCount: 0, skeletonCount: 1, catCount: 2,
            housePositions: [],
            ponds: null,
            pathH: false, pathV: false,
            checkpoint: { x: 15, y: 20 }
        }
    ];

    const cfg = cfgs[mapIndex % cfgs.length];
    const mapData = [];

    for (let y = 0; y < mapHeight; y++) {
        const row = [];
        for (let x = 0; x < mapWidth; x++) {
            let tile = 0;

            if (cfg.pathH && y >= 11 && y <= 13) tile = 1;
            if (cfg.pathV && x >= 14 && x <= 16 && y >= 5) tile = 1;

            const ponds = cfg.ponds || [];
            if (ponds.some(p => x >= p.x1 && x <= p.x2 && y >= p.y1 && y <= p.y2)) tile = 2;

            if (cfg.housePositions.some(pos => pos.x === x && pos.y === y)) tile = 5;

            if ((x === 0 || x === mapWidth - 1 || y === 0 || y === mapHeight - 1) && tile === 0) tile = 3;

            const nearHouse = cfg.housePositions.some(pos =>
                Math.abs(pos.x - x) <= 1 && Math.abs(pos.y - y) <= 1
            );
            if (tile === 0 && !nearHouse && Phaser.Math.Between(0, 100) < cfg.treeDensity) tile = 3;
            if (tile === 0 && Phaser.Math.Between(0, 100) < cfg.rockDensity) tile = 4;

            row.push(tile);
        }
        mapData.push(row);
    }

    // Force exit gaps at left and right boundaries (rows 11-13) for portal openings
    for (let ey = 11; ey <= 13; ey++) {
        if (mapIndex !== 0) mapData[ey][0] = 1; // blocked on starting village
        mapData[ey][mapWidth - 1] = 1;
    }

    const baseTile = cfg.baseTile || 'grass';
    const tileTypes = [baseTile, 'path', 'water', 'tree', 'rock', 'house'];

    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            const tileType = tileTypes[mapData[y][x]];
            const tileX = x * TILE_SIZE + TILE_SIZE / 2;
            const tileY = y * TILE_SIZE + TILE_SIZE / 2;

            if (tileType === 'rock' || tileType === 'tree' || tileType === 'house') {
                const g = this.add.image(tileX, tileY, baseTile);
                g.setDepth(0);
                mapObjects.push(g);
            } else {
                const t = this.add.image(tileX, tileY, tileType);
                t.setDepth(0);
                mapObjects.push(t);
            }

            if (tileType === 'tree') {
                const treeVisual = this.add.image(tileX, tileY, 'tree');
                treeVisual.setDepth(1);
                mapObjects.push(treeVisual);

                const treeCollider = treesGroup.create(tileX, tileY, 'tree');
                treeCollider.setAlpha(0).setDepth(-1);
                treeCollider.body.setSize(20, 20);
                treeCollider.body.setOffset(6, 6);
                treeCollider.visual = treeVisual;
                treeCollider.health = 3;

            } else if (tileType === 'water') {
                const wc = waterGroup.create(tileX, tileY, 'water');
                wc.setAlpha(0).setDepth(-1);

            } else if (tileType === 'rock') {
                const rockSprite = rocksGroup.create(tileX, tileY, 'rockSprite');
                rockSprite.setDepth(1);
                rockSprite.body.setSize(20, 14);
                rockSprite.body.setOffset(6, 12);
                rockSprite.setCollideWorldBounds(true);
                rockSprite.body.setDrag(200);

            } else if (tileType === 'house') {
                const houseVisual = this.add.image(tileX, tileY, 'house');
                houseVisual.setDepth(1);
                mapObjects.push(houseVisual);

                const hc = housesGroup.create(tileX, tileY, 'house');
                hc.setAlpha(0).setDepth(-1);
                hc.body.setSize(28, 18);
                hc.body.setOffset(2, 10);
            }
        }
    }

    this.physics.world.setBounds(0, 0, mapWidth * TILE_SIZE, mapHeight * TILE_SIZE);
    this.cameras.main.setBounds(0, 0, mapWidth * TILE_SIZE, mapHeight * TILE_SIZE);

    // Exit portals — left (previous map) and right (next map)
    const nextMapIdx = (mapIndex + 1) % MAP_COUNT;
    const prevMapIdx = (mapIndex - 1 + MAP_COUNT) % MAP_COUNT;
    const portalY = 12 * TILE_SIZE + TILE_SIZE / 2;

    // Right portal (→ next map) — sealed on Lich's Throne until boss defeated
    const rightLocked = (mapIndex === 14 && !bossDefeated);
    if (!rightLocked) {
        for (let ey = 11; ey <= 13; ey++) {
            const ep = this.add.image((mapWidth - 1) * TILE_SIZE + TILE_SIZE / 2, ey * TILE_SIZE + TILE_SIZE / 2, 'exit_portal');
            ep.setDepth(1);
            mapObjects.push(ep);
        }
        const rightLabel = this.add.text((mapWidth - 2) * TILE_SIZE + TILE_SIZE / 2, portalY,
            '→ ' + MAP_NAMES[nextMapIdx], {
            fontSize: '11px', fill: '#ffffaa',
            stroke: '#000000', strokeThickness: 2,
            backgroundColor: '#00000099', padding: { x: 4, y: 2 }
        }).setOrigin(1, 0.5).setDepth(5);
        mapObjects.push(rightLabel);
    } else {
        const sealLabel = this.add.text((mapWidth - 2) * TILE_SIZE + TILE_SIZE / 2, portalY,
            '⚔ Sealed — Defeat the Lich!', {
            fontSize: '11px', fill: '#ff4444',
            stroke: '#000000', strokeThickness: 2,
            backgroundColor: '#00000099', padding: { x: 4, y: 2 }
        }).setOrigin(1, 0.5).setDepth(5);
        mapObjects.push(sealLabel);
    }

    // Left portal (← previous map) — blocked on starting village only
    const leftLocked = (mapIndex === 0);
    if (!leftLocked) {
        for (let ey = 11; ey <= 13; ey++) {
            const ep = this.add.image(0 * TILE_SIZE + TILE_SIZE / 2, ey * TILE_SIZE + TILE_SIZE / 2, 'exit_portal');
            ep.setDepth(1);
            mapObjects.push(ep);
        }
        const leftLabel = this.add.text(TILE_SIZE + TILE_SIZE / 2, portalY,
            MAP_NAMES[prevMapIdx] + ' ←', {
            fontSize: '11px', fill: '#ffffaa',
            stroke: '#000000', strokeThickness: 2,
            backgroundColor: '#00000099', padding: { x: 4, y: 2 }
        }).setOrigin(0, 0.5).setDepth(5);
        mapObjects.push(leftLabel);
    } else {
        const blockedLabel = this.add.text(TILE_SIZE + TILE_SIZE / 2, portalY,
            '✖ Blocked', {
            fontSize: '11px', fill: '#ff6666',
            stroke: '#000000', strokeThickness: 2,
            backgroundColor: '#00000099', padding: { x: 4, y: 2 }
        }).setOrigin(0, 0.5).setDepth(5);
        mapObjects.push(blockedLabel);
    }

    // Collect open grass tiles and shuffle once for all spawning
    const allGrass = [];
    for (let gy = 3; gy < mapHeight - 3; gy++) {
        for (let gx = 3; gx < mapWidth - 3; gx++) {
            if (mapData[gy][gx] === 0) allGrass.push({ x: gx, y: gy });
        }
    }
    Phaser.Utils.Array.Shuffle(allGrass);

    const aggressive = (mapIndex === 1);
    let spawnIdx = 0;

    // Spawn deer
    allGrass.slice(spawnIdx, spawnIdx + cfg.deerCount).forEach(pos => {
        const dx = pos.x * TILE_SIZE + TILE_SIZE / 2;
        const dy = pos.y * TILE_SIZE + TILE_SIZE / 2;
        const deer = deerGroup.create(dx, dy, 'deer');
        deer.setDepth(1);
        deer.setCollideWorldBounds(true);
        deer.body.setSize(22, 12);
        deer.body.setOffset(4, 16);
        deer.deerState = 'idle';
        deer.wanderTimer = Phaser.Math.Between(30, 120);
        deer.health = 5;
        deer.isAggressive = aggressive;
        deer.sourceGroup = deerGroup;
        deer.animalName = 'Deer';
        if (aggressive) { deer.setTint(0xCC4444); deer.restoreTint = 0xCC4444; }
    });
    spawnIdx += cfg.deerCount;

    // Spawn goblin enemies
    allGrass.slice(spawnIdx, spawnIdx + cfg.enemyCount).forEach(pos => {
        const ex = pos.x * TILE_SIZE + TILE_SIZE / 2;
        const ey = pos.y * TILE_SIZE + TILE_SIZE / 2;
        const enemy = enemyGroup.create(ex, ey, 'enemy');
        enemy.setDepth(1);
        enemy.setCollideWorldBounds(true);
        enemy.body.setSize(16, 18);
        enemy.body.setOffset(8, 12);
        enemy.enemyState = 'idle';
        enemy.wanderTimer = Phaser.Math.Between(30, 120);
        enemy.health = 3;
    });
    spawnIdx += cfg.enemyCount;

    // Spawn wolves
    allGrass.slice(spawnIdx, spawnIdx + (cfg.wolfCount || 0)).forEach(pos => {
        const wx = pos.x * TILE_SIZE + TILE_SIZE / 2;
        const wy = pos.y * TILE_SIZE + TILE_SIZE / 2;
        const wolf = wolfGroup.create(wx, wy, 'wolf');
        wolf.setDepth(1);
        wolf.setCollideWorldBounds(true);
        wolf.body.setSize(22, 12);
        wolf.body.setOffset(4, 16);
        wolf.deerState = 'idle';
        wolf.wanderTimer = Phaser.Math.Between(30, 120);
        wolf.health = 8;
        wolf.isAggressive = true;
        wolf.sourceGroup = wolfGroup;
        wolf.animalName = 'Wolf';
    });
    spawnIdx += (cfg.wolfCount || 0);

    // Spawn rabbits
    allGrass.slice(spawnIdx, spawnIdx + (cfg.rabbitCount || 0)).forEach(pos => {
        const rx = pos.x * TILE_SIZE + TILE_SIZE / 2;
        const ry = pos.y * TILE_SIZE + TILE_SIZE / 2;
        const rabbit = rabbitGroup.create(rx, ry, 'rabbit');
        rabbit.setDepth(1);
        rabbit.setCollideWorldBounds(true);
        rabbit.body.setSize(14, 12);
        rabbit.body.setOffset(9, 16);
        rabbit.deerState = 'idle';
        rabbit.wanderTimer = Phaser.Math.Between(30, 120);
        rabbit.health = 3;
        rabbit.isAggressive = false;
        rabbit.sourceGroup = rabbitGroup;
        rabbit.animalName = 'Rabbit';
    });

    // Spawn zombies
    allGrass.slice(spawnIdx, spawnIdx + (cfg.zombieCount || 0)).forEach(pos => {
        const zx = pos.x * TILE_SIZE + TILE_SIZE / 2;
        const zy = pos.y * TILE_SIZE + TILE_SIZE / 2;
        const zombie = zombieGroup.create(zx, zy, 'zombie');
        zombie.setDepth(1);
        zombie.setCollideWorldBounds(true);
        zombie.body.setSize(18, 20);
        zombie.body.setOffset(7, 10);
        zombie.enemyState = 'idle';
        zombie.wanderTimer = Phaser.Math.Between(30, 90);
        zombie.health = 6;
    });
    spawnIdx += (cfg.zombieCount || 0);

    // Spawn skeletons (faster and harder than zombies)
    allGrass.slice(spawnIdx, spawnIdx + (cfg.skeletonCount || 0)).forEach(pos => {
        const sx = pos.x * TILE_SIZE + TILE_SIZE / 2;
        const sy = pos.y * TILE_SIZE + TILE_SIZE / 2;
        const skeleton = skeletonGroup.create(sx, sy, 'skeleton');
        skeleton.setDepth(1);
        skeleton.setCollideWorldBounds(true);
        skeleton.body.setSize(16, 20);
        skeleton.body.setOffset(8, 10);
        skeleton.enemyState = 'idle';
        skeleton.wanderTimer = Phaser.Math.Between(20, 80);
        skeleton.health = 8;
        // Skeletons on Lich's Throne are archers
        skeleton.isArcher = (mapIndex === 14);
        skeleton.arrowCooldown = Phaser.Math.Between(80, 160);
    });
    spawnIdx += (cfg.skeletonCount || 0);

    // Spawn cats — friendly, bring food to player
    allGrass.slice(spawnIdx, spawnIdx + (cfg.catCount || 0)).forEach(pos => {
        const cx = pos.x * TILE_SIZE + TILE_SIZE / 2;
        const cy = pos.y * TILE_SIZE + TILE_SIZE / 2;
        const cat = catGroup.create(cx, cy, 'cat');
        cat.setDepth(1);
        cat.setCollideWorldBounds(true);
        cat.body.setSize(18, 14);
        cat.body.setOffset(7, 16);
        cat.catState = 'idle';
        cat.wanderTimer = Phaser.Math.Between(60, 180);
        cat.foodTimer = Phaser.Math.Between(400, 700); // first delivery
    });
    spawnIdx += (cfg.catCount || 0);

    // Place treasure chest in Cursed Swamp (map 3)
    if (mapIndex === 3) {
        const ctX = 22 * TILE_SIZE + TILE_SIZE / 2;
        const ctY = 10 * TILE_SIZE + TILE_SIZE / 2;
        const chest = chestGroup.create(ctX, ctY, swampChestOpened ? 'chest_open' : 'chest_closed');
        chest.setDepth(2);
        chest.body.setSize(24, 18);
        chest.body.setOffset(4, 10);
        chest.opened = swampChestOpened;
        chest.chestType = 'swamp';
    }

    // Place treasure chest in Undead Fortress (map 8)
    if (mapIndex === 8) {
        const ctX = 15 * TILE_SIZE + TILE_SIZE / 2;
        const ctY = 12 * TILE_SIZE + TILE_SIZE / 2;
        const chest = chestGroup.create(ctX, ctY, fortressChestOpened ? 'chest_open' : 'chest_closed');
        chest.setDepth(2);
        chest.body.setSize(24, 18);
        chest.body.setOffset(4, 10);
        chest.opened = fortressChestOpened;
        chest.chestType = 'fortress';
    }

    // Place treasure chest in Ancient Desert (map 5)
    if (mapIndex === 5) {
        const ctX = 8 * TILE_SIZE + TILE_SIZE / 2;
        const ctY = 12 * TILE_SIZE + TILE_SIZE / 2;
        const chest = chestGroup.create(ctX, ctY, desertChestOpened ? 'chest_open' : 'chest_closed');
        chest.setDepth(2);
        chest.body.setSize(24, 18);
        chest.body.setOffset(4, 10);
        chest.opened = desertChestOpened;
        chest.chestType = 'desert';
    }

    // Place checkpoint campfire
    const cpTileX = cfg.checkpoint.x * TILE_SIZE + TILE_SIZE / 2;
    const cpTileY = cfg.checkpoint.y * TILE_SIZE + TILE_SIZE / 2;
    const isActive = (lastCheckpoint.mapIndex === mapIndex &&
        lastCheckpoint.x === cpTileX && lastCheckpoint.y === cpTileY);
    const cp = checkpointGroup.create(cpTileX, cpTileY, isActive ? 'checkpoint_on' : 'checkpoint_off');
    cp.setDepth(1);
    cp.body.setSize(20, 20);
    cp.body.setOffset(6, 6);
    cp.mapIndex = mapIndex;
    cp.cpX = cpTileX;
    cp.cpY = cpTileY;
};

// Campfire textures for checkpoints
Phaser.Scene.prototype.createCheckpointTextures = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Unlit campfire (checkpoint_off)
    // Logs
    g.fillStyle(0x5C3D1A);
    g.fillRect(6, 22, 20, 4);
    g.fillRect(8, 18, 4, 8);
    g.fillRect(20, 18, 4, 8);
    // Stone ring
    g.lineStyle(2, 0x808080);
    g.strokeCircle(16, 22, 10);
    g.fillStyle(0x606060);
    g.fillCircle(16, 22, 10);
    g.fillStyle(0x808080);
    g.fillCircle(16, 22, 8);
    // Logs on top
    g.fillStyle(0x5C3D1A);
    g.fillRect(8, 20, 16, 3);
    g.fillRect(13, 16, 6, 8);
    // Ash
    g.fillStyle(0x999999);
    g.fillCircle(16, 22, 4);
    g.generateTexture('checkpoint_off', 32, 32);
    g.clear();

    // Lit campfire (checkpoint_on)
    // Stone ring
    g.fillStyle(0x606060);
    g.fillCircle(16, 22, 10);
    g.fillStyle(0x808080);
    g.fillCircle(16, 22, 8);
    // Logs
    g.fillStyle(0x5C3D1A);
    g.fillRect(8, 20, 16, 3);
    g.fillRect(13, 16, 6, 8);
    // Embers
    g.fillStyle(0xFF4400);
    g.fillCircle(16, 20, 5);
    // Outer flame
    g.fillStyle(0xFF6600);
    g.fillTriangle(16, 6, 10, 20, 22, 20);
    // Mid flame
    g.fillStyle(0xFF9900);
    g.fillTriangle(16, 9, 12, 20, 20, 20);
    // Inner flame
    g.fillStyle(0xFFDD00);
    g.fillTriangle(16, 13, 13, 20, 19, 20);
    // Spark dots
    g.fillStyle(0xFFFFAA);
    g.fillRect(12, 7, 2, 2);
    g.fillRect(19, 10, 2, 2);
    g.fillRect(14, 4, 1, 1);
    g.generateTexture('checkpoint_on', 32, 32);
    g.destroy();
};

// Wolf sprite (side view, faces right)
Phaser.Scene.prototype.createWolfTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(15, 31, 22, 5);

    // Bushy tail
    g.fillStyle(0x999999);
    g.fillEllipse(4, 14, 8, 6);
    g.fillStyle(0xCCCCCC);
    g.fillEllipse(3, 13, 5, 4);

    // Back legs
    g.fillStyle(0x777777);
    g.fillRect(7, 21, 3, 10);
    g.fillRect(11, 21, 3, 10);

    // Body (larger, leaner than deer)
    g.fillStyle(0x888888);
    g.fillEllipse(14, 16, 22, 12);

    // Belly (lighter)
    g.fillStyle(0xC0C0C0);
    g.fillEllipse(13, 18, 13, 6);

    // Front legs
    g.fillStyle(0x777777);
    g.fillRect(17, 21, 3, 10);
    g.fillRect(21, 21, 3, 10);

    // Paws (dark)
    g.fillStyle(0x444444);
    g.fillRect(7, 29, 3, 2);
    g.fillRect(11, 29, 3, 2);
    g.fillRect(17, 29, 3, 2);
    g.fillRect(21, 29, 3, 2);

    // Neck
    g.fillStyle(0x888888);
    g.fillRect(20, 9, 5, 9);

    // Head (angular)
    g.fillStyle(0x888888);
    g.fillRoundedRect(20, 3, 10, 9, 2);

    // Muzzle
    g.fillStyle(0x777777);
    g.fillRect(27, 6, 4, 5);

    // Nose
    g.fillStyle(0x111111);
    g.fillRect(29, 7, 2, 2);

    // Pointed ear
    g.fillStyle(0x888888);
    g.fillTriangle(21, 5, 19, 0, 24, 3);
    g.fillStyle(0xCC8888);
    g.fillTriangle(22, 5, 20, 1, 24, 3);

    // Yellow eye with slit
    g.fillStyle(0xFFBB00);
    g.fillRect(23, 5, 3, 2);
    g.fillStyle(0x000000);
    g.fillRect(24, 5, 1, 2);

    // Teeth hint
    g.fillStyle(0xFFFFFF);
    g.fillRect(27, 10, 2, 1);
    g.fillRect(29, 10, 2, 1);

    g.generateTexture('wolf', 32, 32);
    g.destroy();
};

// Rabbit sprite (small, round, faces right)
Phaser.Scene.prototype.createRabbitTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(16, 31, 14, 4);

    // Fluffy white tail
    g.fillStyle(0xFFFFFF);
    g.fillCircle(8, 22, 3);

    // Back legs (haunches)
    g.fillStyle(0xBBBBBB);
    g.fillRect(9, 22, 4, 8);
    g.fillRect(14, 22, 4, 8);

    // Body (round)
    g.fillStyle(0xCCCCCC);
    g.fillEllipse(16, 20, 16, 12);

    // Belly (white)
    g.fillStyle(0xFFFFFF);
    g.fillEllipse(16, 21, 10, 7);

    // Front paws
    g.fillStyle(0xBBBBBB);
    g.fillRect(20, 24, 3, 6);
    g.fillRect(24, 24, 3, 6);

    // Head (round)
    g.fillStyle(0xCCCCCC);
    g.fillCircle(23, 13, 6);

    // Long upright ears
    g.fillStyle(0xCCCCCC);
    g.fillRect(19, 1, 3, 10);
    g.fillRect(24, 2, 3, 9);
    g.fillStyle(0xFF9999);
    g.fillRect(20, 2, 1, 8);
    g.fillRect(25, 3, 1, 7);

    // Eye (red)
    g.fillStyle(0xFF4444);
    g.fillCircle(25, 12, 2);
    g.fillStyle(0x000000);
    g.fillCircle(25, 12, 1);
    g.fillStyle(0xFFFFFF);
    g.fillRect(26, 11, 1, 1);

    // Nose
    g.fillStyle(0xFF8888);
    g.fillRect(28, 14, 2, 1);

    g.generateTexture('rabbit', 32, 32);
    g.destroy();
};

// Extra terrain tiles: swamp, snow, sand
Phaser.Scene.prototype.createExtraTerrainTextures = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Swamp (dark olive)
    g.fillStyle(0x2E3D1A);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x3A4D22);
    for (let i = 0; i < 7; i++) {
        g.fillRect(Phaser.Math.Between(2, 26), Phaser.Math.Between(2, 26), 4, 3);
    }
    g.fillStyle(0x1E2A10);
    for (let i = 0; i < 4; i++) {
        g.fillRect(Phaser.Math.Between(2, 28), Phaser.Math.Between(2, 28), 2, 2);
    }
    g.generateTexture('swamp', TILE_SIZE, TILE_SIZE);
    g.clear();

    // Snow (pale blue-white)
    g.fillStyle(0xDDEEFF);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0xCCDDEE);
    for (let i = 0; i < 5; i++) {
        g.fillRect(Phaser.Math.Between(2, 26), Phaser.Math.Between(2, 26), 5, 3);
    }
    g.fillStyle(0xEEF5FF);
    for (let i = 0; i < 4; i++) {
        g.fillRect(Phaser.Math.Between(2, 28), Phaser.Math.Between(2, 28), 2, 2);
    }
    g.generateTexture('snow', TILE_SIZE, TILE_SIZE);
    g.clear();

    // Sand (warm tan)
    g.fillStyle(0xC8A84B);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0xD4B862);
    for (let i = 0; i < 6; i++) {
        g.fillRect(Phaser.Math.Between(2, 26), Phaser.Math.Between(2, 26), 4, 2);
    }
    g.fillStyle(0xB89438);
    for (let i = 0; i < 3; i++) {
        g.fillRect(Phaser.Math.Between(2, 28), Phaser.Math.Between(2, 28), 3, 3);
    }
    g.generateTexture('sand', TILE_SIZE, TILE_SIZE);
    g.clear();

    // Graveyard (dark brown-grey, grim)
    g.fillStyle(0x2A2520);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x3A3028);
    for (let i = 0; i < 5; i++) {
        g.fillRect(Phaser.Math.Between(2, 26), Phaser.Math.Between(2, 26), 4, 3);
    }
    g.fillStyle(0x1A1510);
    for (let i = 0; i < 3; i++) {
        g.fillRect(Phaser.Math.Between(2, 28), Phaser.Math.Between(2, 28), 2, 2);
    }
    g.generateTexture('graveyard', TILE_SIZE, TILE_SIZE);
    g.clear();

    // Dark stone (very dark grey)
    g.fillStyle(0x1A1A1E);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x252530);
    for (let i = 0; i < 6; i++) {
        g.fillRect(Phaser.Math.Between(2, 26), Phaser.Math.Between(2, 26), 5, 3);
    }
    g.fillStyle(0x0E0E14);
    for (let i = 0; i < 4; i++) {
        g.fillRect(Phaser.Math.Between(2, 28), Phaser.Math.Between(2, 28), 2, 2);
    }
    g.generateTexture('dark_stone', TILE_SIZE, TILE_SIZE);
    g.destroy();
};

// Treasure chest textures (closed and open)
Phaser.Scene.prototype.createChestTextures = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // chest_closed
    // Base
    g.fillStyle(0x6B3A1F);
    g.fillRect(2, 14, 28, 16);
    // Lid
    g.fillStyle(0x8B4A2A);
    g.fillRect(2, 8, 28, 8);
    g.fillStyle(0x9B5A3A);
    g.fillRect(2, 8, 28, 3);
    // Metal straps
    g.fillStyle(0x888866);
    g.fillRect(2, 13, 28, 3);
    g.fillRect(13, 8, 4, 16);
    // Lock
    g.fillStyle(0xDDBB44);
    g.fillRect(12, 17, 8, 6);
    g.fillStyle(0x000000);
    g.fillRect(14, 19, 4, 3);
    // Hinges
    g.fillStyle(0x888866);
    g.fillRect(3, 12, 5, 4);
    g.fillRect(24, 12, 5, 4);
    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillRect(2, 28, 28, 3);
    g.generateTexture('chest_closed', 32, 32);
    g.clear();

    // chest_open
    // Base (same)
    g.fillStyle(0x6B3A1F);
    g.fillRect(2, 14, 28, 16);
    // Open lid (rotated up, leaning back)
    g.fillStyle(0x8B4A2A);
    g.fillRect(2, 2, 28, 8);
    g.fillStyle(0x9B5A3A);
    g.fillRect(2, 2, 28, 3);
    // Inside (dark)
    g.fillStyle(0x1A0A00);
    g.fillRect(4, 14, 24, 14);
    // Glint of items inside
    g.fillStyle(0xDDCC44);
    g.fillRect(7, 20, 5, 4);
    g.fillStyle(0xCCBB88);
    g.fillRect(15, 17, 10, 3);
    // Metal straps on lid
    g.fillStyle(0x888866);
    g.fillRect(2, 8, 28, 2);
    g.fillRect(13, 2, 4, 8);
    // Hinges
    g.fillRect(3, 9, 5, 4);
    g.fillRect(24, 9, 5, 4);
    g.generateTexture('chest_open', 32, 32);
    g.destroy();
};

// Wooden bow texture (no arc paths — uses rects/triangles only)
Phaser.Scene.prototype.createBowTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Bow limbs (angled rectangles to suggest a curved bow)
    g.fillStyle(0x8B5A2A);
    g.fillRect(20, 3,  4, 11); // upper limb
    g.fillRect(20, 18, 4, 11); // lower limb
    g.fillRect(19, 13, 5,  6); // grip
    g.fillStyle(0xAA7040);
    g.fillRect(21, 4,  2, 9);
    g.fillRect(21, 19, 2, 9);

    // Bowstring (three lines forming a D shape)
    g.lineStyle(1, 0xEEDDAA);
    g.lineBetween(22, 5,  14, 16);
    g.lineBetween(14, 16, 22, 27);

    // Arrow shaft
    g.fillStyle(0xCCBB88);
    g.fillRect(4, 15, 18, 2);

    // Arrowhead
    g.fillStyle(0xBBBBBB);
    g.fillTriangle(22, 16, 18, 13, 18, 19);

    // Fletching
    g.fillStyle(0xFF4444);
    g.fillRect(4, 13, 3, 3);
    g.fillStyle(0xFF8800);
    g.fillRect(4, 17, 3, 3);

    g.generateTexture('bow', 32, 32);
    g.destroy();
};

// Stone sword — grey blocky blade, stronger than wooden sword
Phaser.Scene.prototype.createStoneSwordTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Handle (dark brown grip)
    g.fillStyle(0x5C3D1A);
    g.fillRect(14, 22, 4, 8);
    // Guard (dark grey crossguard)
    g.fillStyle(0x555566);
    g.fillRect(9, 20, 14, 4);
    g.fillStyle(0x777788);
    g.fillRect(10, 21, 12, 2);

    // Blade (stone grey, wide and chunky)
    g.fillStyle(0x888899);
    g.fillRect(12, 4, 8, 17);
    // Blade highlight
    g.fillStyle(0xaaaacc);
    g.fillRect(13, 5, 3, 14);
    // Blade shadow
    g.fillStyle(0x666677);
    g.fillRect(18, 5, 2, 14);
    // Blade crack details (stone texture)
    g.fillStyle(0x555566);
    g.fillRect(14, 9,  4, 1);
    g.fillRect(15, 14, 3, 1);

    // Tip (pointed)
    g.fillStyle(0x888899);
    g.fillTriangle(12, 4, 20, 4, 16, 0);
    g.fillStyle(0xaaaacc);
    g.fillTriangle(13, 4, 16, 1, 16, 4);

    g.generateTexture('stone_sword', 32, 32);
    g.destroy();
};

// Zombie sprite — shambling undead, arms outstretched
Phaser.Scene.prototype.createZombieTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(16, 31, 18, 5);

    // Legs (stiff, uneven)
    g.fillStyle(0x2A3A1A);
    g.fillRect(9,  22, 5, 9);
    g.fillRect(18, 23, 5, 8);

    // Torn boots
    g.fillStyle(0x1A1A0A);
    g.fillRect(8,  28, 6, 4);
    g.fillRect(17, 29, 6, 3);

    // Body (ragged, rotting clothes)
    g.fillStyle(0x2A3820);
    g.fillRect(8, 12, 16, 12);
    g.fillStyle(0x1A2810);
    g.fillRect(8, 12, 3, 12);
    g.fillRect(21, 12, 3, 10);
    // Torn cloth strips
    g.fillStyle(0x3A4830);
    g.fillRect(11, 20, 10, 3);
    g.fillRect(9,  16, 4,  2);

    // Arms outstretched (reaching forward)
    g.fillStyle(0x4A6A38);
    g.fillRect(1,  12, 8, 5);   // left arm extended
    g.fillRect(23, 12, 8, 5);   // right arm extended
    // Clawed hands
    g.fillStyle(0x3A5A28);
    g.fillRect(0,  16, 4, 3);
    g.fillRect(28, 16, 4, 3);
    // Claw tips
    g.fillStyle(0x2A4A18);
    g.fillRect(0,  18, 2, 2);
    g.fillRect(2,  19, 2, 1);
    g.fillRect(28, 18, 2, 2);
    g.fillRect(30, 19, 2, 1);

    // Neck (decayed)
    g.fillStyle(0x4A6A38);
    g.fillRect(13, 9, 6, 4);

    // Head
    g.fillStyle(0x5A7A48);
    g.fillRoundedRect(8, 0, 16, 12, 2);

    // Decayed skin patches
    g.fillStyle(0x3A5A28);
    g.fillRect(9,  1, 4, 4);
    g.fillRect(20, 3, 3, 3);

    // Glowing eyes (sickly yellow-green)
    g.fillStyle(0xAAFF44);
    g.fillRect(10, 4, 4, 3);
    g.fillRect(18, 4, 4, 3);
    g.fillStyle(0x88DD22);
    g.fillRect(11, 5, 2, 2);
    g.fillRect(19, 5, 2, 2);

    // Gaping mouth
    g.fillStyle(0x0A0A05);
    g.fillRect(12, 8, 8, 3);
    // Teeth
    g.fillStyle(0xCCCC99);
    g.fillRect(13, 8, 2, 2);
    g.fillRect(16, 8, 2, 2);
    g.fillRect(19, 8, 2, 2);

    // Blood stains
    g.fillStyle(0x8B0000);
    g.fillRect(14, 11, 3, 2);
    g.fillRect(10, 14, 2, 3);

    g.generateTexture('zombie', 32, 32);
    g.destroy();
};

// Skeleton sprite — bony, white, glowing red eyes
Phaser.Scene.prototype.createSkeletonTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(16, 31, 18, 5);

    // Legs (bone white)
    g.fillStyle(0xDDDDCC);
    g.fillRect(9, 22, 4, 9);
    g.fillRect(19, 22, 4, 9);

    // Feet bones
    g.fillStyle(0xCCCCBB);
    g.fillRect(8, 29, 6, 3);
    g.fillRect(18, 29, 6, 3);

    // Pelvis
    g.fillStyle(0xDDDDCC);
    g.fillRect(7, 20, 18, 4);

    // Rib cage outline
    g.fillStyle(0xDDDDCC);
    g.fillRect(8, 11, 16, 10);
    // Rib gaps (dark cavities)
    g.fillStyle(0x111122);
    g.fillRect(9,  12, 3, 8);
    g.fillRect(13, 12, 3, 8);
    g.fillRect(17, 12, 3, 8);
    // Rib bars
    g.fillStyle(0xCCCCBB);
    g.fillRect(8, 13, 16, 2);
    g.fillRect(8, 16, 16, 2);
    g.fillRect(8, 19, 16, 1);

    // Spine
    g.fillStyle(0xCCCCBB);
    g.fillRect(14, 10, 4, 12);

    // Arms (bone, reaching)
    g.fillStyle(0xDDDDCC);
    g.fillRect(1, 12, 7, 4);   // left arm extended
    g.fillRect(24, 12, 7, 4);  // right arm extended
    // Clawed hands
    g.fillStyle(0xBBBBAA);
    g.fillRect(0,  15, 4, 3);
    g.fillRect(28, 15, 4, 3);
    // Claw tips
    g.fillStyle(0xAAAA99);
    g.fillRect(0,  17, 2, 2);
    g.fillRect(2,  18, 2, 1);
    g.fillRect(28, 17, 2, 2);
    g.fillRect(30, 18, 2, 1);

    // Neck
    g.fillStyle(0xDDDDCC);
    g.fillRect(13, 8, 6, 4);

    // Skull
    g.fillStyle(0xEEEEDD);
    g.fillRoundedRect(8, 0, 16, 11, 3);
    // Cheekbones (slightly darker)
    g.fillStyle(0xCCCCBB);
    g.fillRect(8, 6, 4, 4);
    g.fillRect(20, 6, 4, 4);

    // Eye sockets (dark)
    g.fillStyle(0x111122);
    g.fillRect(10, 3, 5, 4);
    g.fillRect(17, 3, 5, 4);
    // Glowing red eyes
    g.fillStyle(0xFF2200);
    g.fillRect(11, 4, 3, 2);
    g.fillRect(18, 4, 3, 2);
    g.fillStyle(0xFF7755);
    g.fillRect(12, 4, 1, 1);
    g.fillRect(19, 4, 1, 1);

    // Nasal cavity
    g.fillStyle(0x222233);
    g.fillRect(14, 7, 4, 2);

    // Jaw
    g.fillStyle(0xDDDDCC);
    g.fillRect(9, 9, 14, 3);
    // Teeth
    g.fillStyle(0xFFFFEE);
    g.fillRect(10, 9, 2, 3);
    g.fillRect(13, 9, 2, 3);
    g.fillRect(16, 9, 2, 3);
    g.fillRect(19, 9, 2, 3);
    // Jaw gap
    g.fillStyle(0x111122);
    g.fillRect(9, 11, 14, 1);

    g.generateTexture('skeleton', 32, 32);
    g.destroy();
};

// Cat sprite — friendly, brings food to player
Phaser.Scene.prototype.createCatTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(14, 31, 16, 5);

    // Tail (curled up to the right)
    g.fillStyle(0x888888);
    g.fillRect(21, 22, 4, 8);
    g.fillRect(23, 17, 4, 7);
    g.fillRect(25, 14, 3, 5);
    g.fillStyle(0xAAAAAA);
    g.fillRect(22, 14, 2, 3); // tip

    // Body
    g.fillStyle(0x999999);
    g.fillEllipse(13, 23, 18, 13);

    // Tabby stripes on body
    g.fillStyle(0x6E6E6E);
    g.fillRect(7,  20, 2, 5);
    g.fillRect(10, 19, 2, 6);
    g.fillRect(16, 19, 2, 6);
    g.fillRect(19, 20, 2, 4);

    // Belly (lighter)
    g.fillStyle(0xCECECE);
    g.fillEllipse(12, 24, 8, 7);

    // Head
    g.fillStyle(0x999999);
    g.fillCircle(12, 13, 8);

    // Ears (pointed triangles)
    g.fillStyle(0x808080);
    g.fillTriangle(5,  12, 10, 12, 6,  5);
    g.fillTriangle(15, 12, 20, 12, 18, 5);
    // Inner ear (pink)
    g.fillStyle(0xFFAAAA);
    g.fillTriangle(6,  11, 10, 11, 7,  6);
    g.fillTriangle(15, 11, 19, 11, 17, 6);

    // Eyes (green)
    g.fillStyle(0x44BB44);
    g.fillEllipse(9,  13, 4, 3);
    g.fillEllipse(15, 13, 4, 3);
    // Pupils
    g.fillStyle(0x000000);
    g.fillEllipse(9,  13, 2, 3);
    g.fillEllipse(15, 13, 2, 3);
    // Eye shine
    g.fillStyle(0xFFFFFF);
    g.fillRect(9,  12, 1, 1);
    g.fillRect(15, 12, 1, 1);

    // Nose (pink)
    g.fillStyle(0xFF9999);
    g.fillTriangle(11, 16, 13, 16, 12, 18);

    // Mouth
    g.fillStyle(0x555555);
    g.fillRect(10, 18, 2, 1);
    g.fillRect(13, 18, 2, 1);

    // Whiskers
    g.fillStyle(0xDDDDDD);
    g.fillRect(1,  15, 7, 1);
    g.fillRect(2,  17, 6, 1);
    g.fillRect(17, 15, 7, 1);
    g.fillRect(18, 17, 6, 1);

    g.generateTexture('cat', 32, 32);
    g.destroy();
};

// Crystal sword sprite — shimmering blue crystal blade
Phaser.Scene.prototype.createCrystalSwordTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Handle / grip
    g.fillStyle(0x6644AA);
    g.fillRect(13, 20, 6, 10);
    // Grip wrap
    g.fillStyle(0x9966DD);
    g.fillRect(13, 22, 6, 2);
    g.fillRect(13, 26, 6, 2);

    // Cross-guard
    g.fillStyle(0x88BBFF);
    g.fillRect(8, 18, 16, 4);
    g.fillStyle(0xAADDFF);
    g.fillRect(9, 19, 14, 2);

    // Blade (crystal, tapered)
    g.fillStyle(0x66CCFF);
    g.fillRect(12, 4, 8, 16);
    // Blade highlight (lighter center)
    g.fillStyle(0xAAEEFF);
    g.fillRect(14, 4, 4, 14);
    // Inner glow
    g.fillStyle(0xDDFFFF);
    g.fillRect(15, 5, 2, 10);

    // Blade facets (crystal pattern)
    g.fillStyle(0x44AADD);
    g.fillRect(12, 8,  3, 1);
    g.fillRect(17, 11, 3, 1);
    g.fillRect(12, 14, 3, 1);

    // Pointed tip
    g.fillStyle(0x88DDFF);
    g.fillTriangle(12, 4, 20, 4, 16, 0);
    g.fillStyle(0xCCF8FF);
    g.fillTriangle(14, 4, 16, 1, 16, 4);

    // Gem in cross-guard
    g.fillStyle(0xFF88FF);
    g.fillRect(14, 18, 4, 4);
    g.fillStyle(0xFFBBFF);
    g.fillRect(15, 19, 2, 2);

    g.generateTexture('crystal_sword', 32, 32);
    g.destroy();
};

// Lich boss sprite (32×32, dark robed figure with glowing skull)
Phaser.Scene.prototype.createLichTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Robe (tall, dark purple)
    g.fillStyle(0x220033);
    g.fillRect(8, 12, 16, 18);
    // Robe highlight
    g.fillStyle(0x440066);
    g.fillRect(12, 12, 4, 18);
    // Robe hem (jagged)
    g.fillStyle(0x110022);
    g.fillTriangle(8, 30, 12, 28, 10, 32);
    g.fillTriangle(12, 30, 16, 28, 14, 32);
    g.fillTriangle(18, 30, 20, 28, 16, 32);
    g.fillTriangle(22, 30, 24, 28, 20, 32);
    // Sleeves
    g.fillStyle(0x220033);
    g.fillRect(3, 14, 6, 10);
    g.fillRect(23, 14, 6, 10);
    // Bony hands
    g.fillStyle(0xDDDDBB);
    g.fillRect(3, 22, 4, 3);
    g.fillRect(25, 22, 4, 3);

    // Skull head
    g.fillStyle(0xDDDDBB);
    g.fillCircle(16, 8, 7);
    // Dark eye sockets
    g.fillStyle(0x9922FF);
    g.fillCircle(13, 7, 2);
    g.fillCircle(19, 7, 2);
    // Glowing pupils
    g.fillStyle(0xFF88FF);
    g.fillCircle(13, 7, 1);
    g.fillCircle(19, 7, 1);
    // Nose cavity
    g.fillStyle(0x220033);
    g.fillTriangle(15, 10, 17, 10, 16, 12);
    // Grim teeth
    g.fillStyle(0xCCCCBB);
    g.fillRect(13, 13, 2, 2);
    g.fillRect(16, 13, 2, 2);
    g.fillStyle(0x110022);
    g.fillRect(15, 13, 1, 2);

    // Staff (right side)
    g.fillStyle(0x4422AA);
    g.fillRect(26, 2, 3, 26);
    // Orb atop staff
    g.fillStyle(0x9922FF);
    g.fillCircle(27, 3, 4);
    g.fillStyle(0xCC66FF);
    g.fillCircle(27, 3, 2);
    g.fillStyle(0xFFBBFF);
    g.fillCircle(27, 2, 1);

    g.generateTexture('lich', 32, 32);
    g.destroy();
};

// ─── KNIGHT textures ────────────────────────────────────────────────────────
// Heavy steel plate armour, full helmet, blue cape, no visible hair.
Phaser.Scene.prototype.createKnightTextures = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const STEEL  = 0xA8AAC0;
    const DARK   = 0x6E7090;
    const LIGHT  = 0xCCCEE0;
    const CAPE   = 0x1A44AA;
    const SKIN   = 0xF0C898;
    const EYES   = 0x2255CC;

    const knightDown = (g) => {
        // Shadow
        g.fillStyle(0x000000, 0.3); g.fillEllipse(16, 30, 18, 6);
        // Greaves (legs)
        g.fillStyle(DARK);  g.fillRect(9, 22, 6, 8);  g.fillRect(17, 22, 6, 8);
        g.fillStyle(STEEL); g.fillRect(10, 22, 4, 7);  g.fillRect(18, 22, 4, 7);
        g.fillStyle(LIGHT); g.fillRect(10, 22, 4, 1);  g.fillRect(18, 22, 4, 1);
        // Sabatons (boots)
        g.fillStyle(DARK);  g.fillRect(8, 28, 7, 3);  g.fillRect(17, 28, 7, 3);
        // Plate torso
        g.fillStyle(DARK);  g.fillRect(7, 12, 18, 12);
        g.fillStyle(STEEL); g.fillRect(8, 12, 16, 11);
        g.fillStyle(LIGHT); g.fillRect(8, 12, 16, 2);
        // Cross emblem on chest
        g.fillStyle(CAPE);  g.fillRect(14, 14, 4, 8);  g.fillRect(11, 16, 10, 3);
        // Pauldrons (shoulders)
        g.fillStyle(STEEL); g.fillRect(3, 11, 6, 7);  g.fillRect(23, 11, 6, 7);
        g.fillStyle(LIGHT); g.fillRect(3, 11, 6, 2);  g.fillRect(23, 11, 6, 2);
        // Gauntlets
        g.fillStyle(DARK);  g.fillRect(3, 17, 6, 5);  g.fillRect(23, 17, 6, 5);
        g.fillStyle(STEEL); g.fillRect(4, 18, 4, 4);  g.fillRect(24, 18, 4, 4);
        // Neck / gorget
        g.fillStyle(STEEL); g.fillRect(12, 10, 8, 4);
        // Helmet
        g.fillStyle(DARK);  g.fillRoundedRect(8, 0, 16, 13, 4);
        g.fillStyle(STEEL); g.fillRoundedRect(9, 1, 14, 11, 3);
        g.fillStyle(LIGHT); g.fillRect(9, 1, 14, 2);
        // Visor slit
        g.fillStyle(0x111122); g.fillRect(10, 6, 12, 3);
        // Eyes gleam in visor
        g.fillStyle(EYES);  g.fillRect(11, 7, 3, 1);  g.fillRect(18, 7, 3, 1);
        // Cheek guards
        g.fillStyle(DARK);  g.fillRect(8, 5, 3, 6);   g.fillRect(21, 5, 3, 6);
    };

    const knightUp = (g) => {
        g.fillStyle(0x000000, 0.3); g.fillEllipse(16, 30, 18, 6);
        g.fillStyle(DARK);  g.fillRect(9, 22, 6, 8);  g.fillRect(17, 22, 6, 8);
        g.fillStyle(STEEL); g.fillRect(10, 22, 4, 7);  g.fillRect(18, 22, 4, 7);
        g.fillStyle(DARK);  g.fillRect(8, 28, 7, 3);  g.fillRect(17, 28, 7, 3);
        // Cape (visible from back)
        g.fillStyle(CAPE);  g.fillRect(7, 12, 18, 13);
        g.fillStyle(0x0D2E77); g.fillRect(7, 12, 3, 13); g.fillRect(22, 12, 3, 13);
        // Pauldrons
        g.fillStyle(STEEL); g.fillRect(3, 11, 6, 7);  g.fillRect(23, 11, 6, 7);
        g.fillStyle(LIGHT); g.fillRect(3, 11, 6, 2);  g.fillRect(23, 11, 6, 2);
        // Gauntlets
        g.fillStyle(DARK);  g.fillRect(3, 17, 6, 5);  g.fillRect(23, 17, 6, 5);
        // Back of helmet
        g.fillStyle(DARK);  g.fillRoundedRect(8, 0, 16, 13, 4);
        g.fillStyle(STEEL); g.fillRoundedRect(9, 1, 14, 11, 3);
        g.fillStyle(LIGHT); g.fillRect(9, 1, 14, 2);
        // Plume (small)
        g.fillStyle(CAPE);  g.fillRect(14, 0, 4, 3);
    };

    const knightSide = (g, flipLeft) => {
        g.fillStyle(0x000000, 0.3); g.fillEllipse(16, 30, 18, 6);
        // Back leg
        g.fillStyle(DARK);
        if (flipLeft) { g.fillRect(15, 22, 6, 8); g.fillRect(15, 28, 7, 3); }
        else           { g.fillRect(11, 22, 6, 8); g.fillRect(10, 28, 7, 3); }
        // Front leg
        g.fillStyle(STEEL);
        if (flipLeft) { g.fillRect(10, 22, 6, 8); g.fillRect(9, 28, 7, 3); }
        else           { g.fillRect(16, 22, 6, 8); g.fillRect(16, 28, 7, 3); }
        // Cape (back)
        g.fillStyle(CAPE);
        if (flipLeft) { g.fillRect(16, 12, 8, 13); }
        else           { g.fillRect(8, 12, 8, 13); }
        // Plate body (side)
        g.fillStyle(STEEL); g.fillRect(10, 12, 12, 12);
        g.fillStyle(LIGHT); g.fillRect(10, 12, 12, 2);
        g.fillStyle(DARK);
        if (flipLeft) { g.fillRect(10, 12, 4, 12); } else { g.fillRect(18, 12, 4, 12); }
        // Back arm
        g.fillStyle(DARK);
        if (flipLeft) { g.fillRect(20, 12, 5, 9); } else { g.fillRect(7, 12, 5, 9); }
        // Front arm / gauntlet
        g.fillStyle(STEEL);
        if (flipLeft) { g.fillRect(5, 13, 5, 9); } else { g.fillRect(22, 13, 5, 9); }
        g.fillStyle(DARK);
        if (flipLeft) { g.fillRect(5, 18, 5, 5); } else { g.fillRect(22, 18, 5, 5); }
        // Gorget
        g.fillStyle(STEEL); g.fillRect(12, 10, 8, 3);
        // Helmet side
        g.fillStyle(DARK);
        if (flipLeft) { g.fillRoundedRect(8, 0, 16, 13, 4); }
        else           { g.fillRoundedRect(8, 0, 16, 13, 4); }
        g.fillStyle(STEEL); g.fillRoundedRect(9, 1, 14, 11, 3);
        g.fillStyle(LIGHT); g.fillRect(9, 1, 14, 2);
        // Visor
        g.fillStyle(0x111122);
        if (flipLeft) { g.fillRect(9, 6, 9, 3); }
        else           { g.fillRect(14, 6, 9, 3); }
        // Eye gleam
        g.fillStyle(EYES);
        if (flipLeft) { g.fillRect(10, 7, 2, 1); }
        else           { g.fillRect(20, 7, 2, 1); }
    };

    knightDown(g); g.generateTexture('knight_down', 32, 32); g.clear();
    knightUp(g);   g.generateTexture('knight_up',   32, 32); g.clear();
    knightSide(g, false); g.generateTexture('knight_right', 32, 32); g.clear();
    knightSide(g, true);  g.generateTexture('knight_left',  32, 32); g.clear();
    knightDown(g); g.generateTexture('knight', 32, 32);
    g.destroy();
};

// ─── ROGUE textures ─────────────────────────────────────────────────────────
// Dark leather armour, deep hood, glowing red eyes, lean build.
Phaser.Scene.prototype.createRogueTextures = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const LEATHER = 0x1A1530;
    const DARK    = 0x0D0B1A;
    const ACCENT  = 0x3A1155;
    const TRIM    = 0x4A2070;
    const SKIN    = 0xE8C8A0;
    const EYES    = 0xFF4422;

    const rogueDown = (g) => {
        g.fillStyle(0x000000, 0.3); g.fillEllipse(16, 30, 14, 5);
        // Legs (lean)
        g.fillStyle(DARK);  g.fillRect(10, 22, 5, 8);  g.fillRect(17, 22, 5, 8);
        g.fillStyle(LEATHER); g.fillRect(11, 22, 3, 7); g.fillRect(18, 22, 3, 7);
        // Boots
        g.fillStyle(DARK);  g.fillRect(9, 27, 6, 4);   g.fillRect(17, 27, 6, 4);
        g.fillStyle(TRIM);  g.fillRect(9, 27, 6, 1);   g.fillRect(17, 27, 6, 1);
        // Body (lean dark vest)
        g.fillStyle(DARK);  g.fillRect(9, 12, 14, 12);
        g.fillStyle(LEATHER); g.fillRect(10, 12, 12, 11);
        g.fillStyle(ACCENT); g.fillRect(14, 12, 4, 11); // vertical stripe
        // Belt with dagger
        g.fillStyle(TRIM);  g.fillRect(8, 21, 16, 2);
        g.fillStyle(0x888888); g.fillRect(19, 19, 2, 6); // dagger blade
        g.fillStyle(TRIM);  g.fillRect(18, 22, 4, 2);   // dagger hilt
        // Arms (narrow)
        g.fillStyle(LEATHER); g.fillRect(5, 13, 4, 9);  g.fillRect(23, 13, 4, 9);
        g.fillStyle(SKIN);  g.fillRect(5, 20, 4, 3);   g.fillRect(23, 20, 4, 3);
        // Neck
        g.fillStyle(SKIN);  g.fillRect(13, 10, 6, 4);
        // Hood (deep, covering forehead + sides)
        g.fillStyle(DARK);  g.fillRoundedRect(8, 0, 16, 14, { tl: 5, tr: 5, bl: 2, br: 2 });
        g.fillStyle(ACCENT); g.fillRect(9, 1, 14, 3); // hood highlight
        // Face in shadow — just a sliver of skin
        g.fillStyle(SKIN);  g.fillRect(11, 7, 10, 6);
        // Glowing red eyes
        g.fillStyle(EYES);  g.fillRect(12, 7, 3, 2);  g.fillRect(17, 7, 3, 2);
        g.fillStyle(0xFF8866); g.fillRect(13, 7, 1, 1); g.fillRect(18, 7, 1, 1);
        // Scarf/cowl edge below hood
        g.fillStyle(TRIM);  g.fillRect(9, 12, 14, 2);
    };

    const rogueUp = (g) => {
        g.fillStyle(0x000000, 0.3); g.fillEllipse(16, 30, 14, 5);
        g.fillStyle(DARK);  g.fillRect(10, 22, 5, 8);  g.fillRect(17, 22, 5, 8);
        g.fillStyle(DARK);  g.fillRect(9, 27, 6, 4);   g.fillRect(17, 27, 6, 4);
        // Back (dark cloak)
        g.fillStyle(DARK);  g.fillRect(8, 12, 16, 12);
        g.fillStyle(LEATHER); g.fillRect(9, 12, 14, 11);
        g.fillStyle(ACCENT); g.fillRect(8, 12, 3, 12); g.fillRect(21, 12, 3, 12);
        // Arms
        g.fillStyle(LEATHER); g.fillRect(5, 13, 4, 9);  g.fillRect(23, 13, 4, 9);
        // Back of hood
        g.fillStyle(DARK);  g.fillRoundedRect(8, 0, 16, 14, { tl: 5, tr: 5, bl: 2, br: 2 });
        g.fillStyle(ACCENT); g.fillRect(9, 1, 14, 3);
        // Cloak tail hint
        g.fillStyle(ACCENT); g.fillRect(11, 12, 10, 2);
    };

    const rogueSide = (g, flipLeft) => {
        g.fillStyle(0x000000, 0.3); g.fillEllipse(16, 30, 14, 5);
        // Back leg
        g.fillStyle(DARK);
        if (flipLeft) { g.fillRect(15, 22, 5, 8); g.fillRect(15, 27, 6, 4); }
        else           { g.fillRect(12, 22, 5, 8); g.fillRect(11, 27, 6, 4); }
        // Front leg
        g.fillStyle(LEATHER);
        if (flipLeft) { g.fillRect(10, 22, 5, 8); g.fillRect(9, 27, 6, 4); }
        else           { g.fillRect(17, 22, 5, 8); g.fillRect(16, 27, 6, 4); }
        // Body side
        g.fillStyle(DARK);   g.fillRect(10, 12, 12, 12);
        g.fillStyle(LEATHER); g.fillRect(11, 12, 10, 11);
        // Belt
        g.fillStyle(TRIM);  g.fillRect(9, 21, 14, 2);
        // Cloak hanging
        g.fillStyle(ACCENT);
        if (flipLeft) { g.fillRect(17, 12, 6, 12); }
        else           { g.fillRect(9, 12, 6, 12); }
        // Back arm
        g.fillStyle(DARK);
        if (flipLeft) { g.fillRect(19, 13, 4, 9); }
        else           { g.fillRect(9, 13, 4, 9); }
        // Front arm
        g.fillStyle(LEATHER);
        if (flipLeft) { g.fillRect(6, 13, 4, 9); g.fillStyle(SKIN); g.fillRect(5, 20, 4, 3); }
        else           { g.fillRect(22, 13, 4, 9); g.fillStyle(SKIN); g.fillRect(23, 20, 4, 3); }
        // Neck
        g.fillStyle(SKIN); g.fillRect(13, 10, 6, 3);
        // Hood side
        g.fillStyle(DARK);
        if (flipLeft) { g.fillRoundedRect(8, 0, 16, 14, { tl: 5, tr: 5, bl: 2, br: 2 }); }
        else           { g.fillRoundedRect(8, 0, 16, 14, { tl: 5, tr: 5, bl: 2, br: 2 }); }
        g.fillStyle(ACCENT); g.fillRect(9, 1, 14, 3);
        // Side face sliver
        g.fillStyle(SKIN);
        if (flipLeft) { g.fillRect(9, 7, 7, 6); }
        else           { g.fillRect(16, 7, 7, 6); }
        // Eye glow
        g.fillStyle(EYES);
        if (flipLeft) { g.fillRect(10, 8, 2, 2); }
        else           { g.fillRect(20, 8, 2, 2); }
        // Nose profile
        g.fillStyle(SKIN);
        if (flipLeft) { g.fillRect(9, 9, 2, 2); }
        else           { g.fillRect(21, 9, 2, 2); }
    };

    rogueDown(g);  g.generateTexture('rogue_down',  32, 32); g.clear();
    rogueUp(g);    g.generateTexture('rogue_up',    32, 32); g.clear();
    rogueSide(g, false); g.generateTexture('rogue_right', 32, 32); g.clear();
    rogueSide(g, true);  g.generateTexture('rogue_left',  32, 32); g.clear();
    rogueDown(g);  g.generateTexture('rogue', 32, 32);
    g.destroy();
};

// Shield inventory icon (round kite shield, blue and silver)
Phaser.Scene.prototype.createShieldTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Shield body (kite shape)
    g.fillStyle(0x2255AA);
    g.fillRoundedRect(6, 2, 20, 22, 4);
    g.fillTriangle(6, 18, 26, 18, 16, 30); // kite point

    // Silver border
    g.fillStyle(0xBBCCDD);
    g.fillRect(6, 2, 3, 22);   // left edge
    g.fillRect(23, 2, 3, 22);  // right edge
    g.fillRect(6, 2, 20, 3);   // top edge
    g.fillTriangle(6, 18, 9, 18, 16, 30);  // left kite border
    g.fillTriangle(26, 18, 23, 18, 16, 30); // right kite border

    // Inner face (lighter blue)
    g.fillStyle(0x3366CC);
    g.fillRoundedRect(9, 5, 14, 15, 3);

    // Cross emblem
    g.fillStyle(0xDDEEFF);
    g.fillRect(15, 6, 2, 14);  // vertical
    g.fillRect(10, 11, 12, 2); // horizontal

    // Boss / center rivet
    g.fillStyle(0xCCDDEE);
    g.fillCircle(16, 12, 3);
    g.fillStyle(0xEEF4FF);
    g.fillCircle(16, 12, 1);

    g.generateTexture('shield', 32, 32);
    g.destroy();
};

// Emerald spear inventory icon (tall, green crystal head on dark shaft)
Phaser.Scene.prototype.createEmeraldSpearTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Shaft (dark wood)
    g.fillStyle(0x3A2810);
    g.fillRect(14, 8, 4, 24);
    g.fillStyle(0x5A3F1A);
    g.fillRect(15, 8, 2, 24);

    // Butt cap
    g.fillStyle(0x22AA66);
    g.fillRect(13, 28, 6, 3);

    // Spear head (emerald crystal)
    g.fillStyle(0x1A9955);
    g.fillRect(12, 2, 8, 10);
    // Highlight
    g.fillStyle(0x22EE88);
    g.fillRect(14, 2, 4, 9);
    // Inner glow
    g.fillStyle(0x88FFCC);
    g.fillRect(15, 3, 2, 6);
    // Pointed tip
    g.fillStyle(0x22EE88);
    g.fillTriangle(12, 2, 20, 2, 16, 0);
    // Tip highlight
    g.fillStyle(0xBBFFDD);
    g.fillTriangle(15, 2, 16, 0, 17, 2);
    // Side blades (barbs)
    g.fillStyle(0x1A9955);
    g.fillTriangle(12, 8, 8, 10, 12, 12);
    g.fillTriangle(20, 8, 24, 10, 20, 12);
    g.fillStyle(0x22CC77);
    g.fillTriangle(12, 9, 9, 10, 12, 11);
    g.fillTriangle(20, 9, 23, 10, 20, 11);

    g.generateTexture('emerald_spear', 32, 32);
    g.destroy();
};

// Dragon — 64×32, facing right, green scaled beast with wings
Phaser.Scene.prototype.createDragonTexture = function() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Tail (left, tapered)
    g.fillStyle(0x1A6630);
    g.fillTriangle(0, 18, 14, 14, 14, 22);
    g.fillStyle(0x22883F);
    g.fillTriangle(2, 18, 14, 15, 14, 21);
    // Tail spikes
    g.fillStyle(0x0D4420);
    g.fillTriangle(4, 14, 7, 10, 10, 14);
    g.fillTriangle(8, 12, 11, 8, 14, 12);

    // Body (large central oval)
    g.fillStyle(0x1A6630);
    g.fillEllipse(30, 18, 34, 14);
    g.fillStyle(0x22883F);
    g.fillEllipse(30, 17, 28, 10);
    // Scale rows
    g.fillStyle(0x0D4420);
    g.fillRect(16, 14, 3, 2); g.fillRect(22, 13, 3, 2); g.fillRect(28, 13, 3, 2);
    g.fillRect(34, 14, 3, 2); g.fillRect(40, 15, 3, 2);
    // Belly (lighter)
    g.fillStyle(0x77CC88);
    g.fillEllipse(28, 21, 22, 6);

    // Wings (upper, bat-style)
    g.fillStyle(0x0D4420);
    g.fillTriangle(18, 14, 10, 0, 30, 8);
    g.fillTriangle(28, 12, 22, 0, 40, 4);
    g.fillStyle(0x1A6630);
    g.fillTriangle(19, 13, 12, 2, 29, 9);
    g.fillTriangle(29, 11, 24, 2, 39, 5);
    // Wing membranes (semi-transparent lines)
    g.lineStyle(1, 0x0D4420, 0.8);
    g.lineBetween(12, 2, 20, 13); g.lineBetween(18, 1, 24, 12);
    g.lineBetween(24, 2, 30, 11); g.lineBetween(30, 3, 38, 10);

    // Neck
    g.fillStyle(0x1A6630);
    g.fillRect(42, 10, 10, 10);
    g.fillStyle(0x22883F);
    g.fillRect(43, 11, 8, 8);

    // Head (wedge, facing right)
    g.fillStyle(0x1A6630);
    g.fillRoundedRect(50, 8, 14, 12, 3);
    g.fillStyle(0x22883F);
    g.fillRoundedRect(51, 9, 11, 9, 2);
    // Snout / jaw
    g.fillStyle(0x0D4420);
    g.fillRect(58, 13, 6, 6);
    g.fillStyle(0x1A6630);
    g.fillRect(58, 14, 6, 4);
    // Teeth
    g.fillStyle(0xEEEECC);
    g.fillRect(59, 18, 2, 2); g.fillRect(62, 18, 2, 2);
    // Eye (orange, fierce)
    g.fillStyle(0xFF8800);
    g.fillCircle(55, 11, 3);
    g.fillStyle(0xFF4400);
    g.fillCircle(55, 11, 2);
    g.fillStyle(0x000000);
    g.fillRect(55, 10, 1, 2); // slit pupil
    // Horns
    g.fillStyle(0x0D4420);
    g.fillTriangle(51, 9, 49, 3, 54, 8);
    g.fillTriangle(55, 8, 53, 2, 58, 7);

    // Legs (small, tucked)
    g.fillStyle(0x1A6630);
    g.fillRect(24, 22, 4, 8);  g.fillRect(36, 22, 4, 8);
    g.fillStyle(0x0D4420);
    g.fillRect(22, 28, 7, 2);  g.fillRect(34, 28, 7, 2); // claws

    g.generateTexture('dragon', 64, 32);
    g.destroy();
};