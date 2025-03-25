import { Boss, Enemy, Homing, Shot, Viper } from "./character";
import { BackgroundStar, Canvas2dUtility, Explosion, Sound } from "./class";
import { Scene } from "./scene";
import "./style.css";

//---------------------------settings---------------------------//
export let isKeydown: { [key: string]: boolean } = {};

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 480;

// 自機
let viper: Viper;
const VIPER_SHOT_MAX_COUNT = 10;
let viperShots: Shot[] = [];

// 敵
const ENEMY_MAX_COUNT = 15;
let enemyArray: Enemy[] = [];
const ENEMY_SHOT_MAX_COUNT = 30;
let enemyShots: Shot[] = [];

// 中敵
const ENEMY_LARGE_COUNT = 3;
let largeEnemyArray: Enemy[] = [];

// シーン
let scene: Scene;

// ポーズ
let isPaused = false;

// 爆発
const EXPLOSION_MAX_COUNT = 10;
let explosion: Explosion[] = [];

// 星
const BACKGROUNT_STAR_AMOUNT = 100;
const STAR_SPEED = 6;
const STAR_SIZE = 3;
let backgroundStars: BackgroundStar[] = [];

// 音
let sound: Sound;
const SOUND_PATH = "/sound/explosion.mp3";

// ボス
let boss: Boss;

const HOMING_MAX_COUNT = 20;
let homingShots: Homing[] = [];

//---------------------------main---------------------------//
const main_canvas: HTMLCanvasElement | null = document.querySelector("#main_canvas");
if (!main_canvas) throw new Error("canvasがnullです");
const util = new Canvas2dUtility(main_canvas);
const canvas = util.canvas;
const ctx = util.context;

const btn: HTMLButtonElement | null = document.querySelector("#btn_start");
// const btn_nosound = document.querySelector("btn_start_sound");

btn?.addEventListener("click", () => {
  btn.disabled = true;
  initialize();
  loadCheck(render);
});

//---------------------------initialize & render---------------------------//
function initialize() {
  keyEventSetting();
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // 音
  sound = new Sound();
  sound.load(SOUND_PATH);

  // 自機
  viper = new Viper(ctx, 0, 0, 64, 64, "/images/viper.png");
  viper.setIsComing(CANVAS_WIDTH / 2, CANVAS_HEIGHT, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);

  // 自機ショット
  for (const i of sequence(0, VIPER_SHOT_MAX_COUNT)) {
    viperShots[i] = new Shot(ctx, 0, 0, 32, 32, "/images/viper_shot.png");
    viperShots[i].setExplosion(explosion);
  }
  viper.setShotsArray(viperShots);

  //敵
  for (const i of sequence(0, ENEMY_MAX_COUNT)) {
    enemyArray[i] = new Enemy(ctx, 0, 0, 48, 48, "/images/enemy_small.png");
    enemyArray[i].setShotsArray(enemyShots);
    enemyArray[i].setTarget([viper]);
  }
  for (const i of sequence(0, ENEMY_SHOT_MAX_COUNT)) {
    enemyShots[i] = new Shot(ctx, 0, 0, 32, 32, "/images/enemy_shot.png");
    enemyShots[i].setTarget([viper]);
    enemyShots[i].setExplosion(explosion);
  }

  // 中敵
  for (const i of sequence(0, ENEMY_LARGE_COUNT)) {
    largeEnemyArray[i] = new Enemy(ctx, 0, 0, 64, 64, "/images/enemy_large.png");
    largeEnemyArray[i].setShotsArray(enemyShots);
    largeEnemyArray[i].setTarget([viper]);
  }

  // ボス
  boss = new Boss(ctx, 0, 0, 128, 128, "/images/boss.png");
  boss.setShotsArray(homingShots);
  boss.setTarget([viper]);
  for (const i of sequence(0, HOMING_MAX_COUNT)) {
    homingShots[i] = new Homing(ctx, 0, 0, 32, 32, "/images/homing_shot.png");
    homingShots[i].setTarget([viper]);
    homingShots[i].setExplosion(explosion);
  }

  // 爆発
  for (const i of sequence(0, EXPLOSION_MAX_COUNT)) {
    explosion[i] = new Explosion(ctx, 80, 50, 20, 0.5, "#ff1166");
    explosion[i].setSound(sound);
  }

  let concatEnemyArray: (Enemy | Boss)[] = enemyArray.concat(largeEnemyArray);
  concatEnemyArray = concatEnemyArray.concat([boss]);

  // 衝突判定
  for (const i of sequence(0, VIPER_SHOT_MAX_COUNT)) {
    viper.setTarget(concatEnemyArray);
    viper.setExplosion(explosion);
    viperShots[i].setTarget(concatEnemyArray);
  }

  // 星
  for (const i of sequence(0, BACKGROUNT_STAR_AMOUNT)) {
    let size = 1 + (STAR_SIZE - 1) * Math.random();
    let speed = 3 + (Math.random() * STAR_SPEED - 2);
    backgroundStars[i] = new BackgroundStar(ctx, size, speed);
    backgroundStars[i].set(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT);
  }

  // シーン
  scene = new Scene();
  sceneInitialize();
}

function render() {
  if (isPaused) {
    setTimeout(render, 100);
    return;
  }
  util.drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, "#000022");
  backgroundStars.forEach((star) => star.update());

  scene.update();
  if (viper.life <= 0 && scene.activeScene !== "gameover") {
    scene.activate("gameover");
  }

  ctx.globalAlpha = 1;
  viper.update();
  viperShots.forEach((shot) => shot.update());
  enemyArray.forEach((enemy) => enemy.update());
  boss.update();
  largeEnemyArray.forEach((enemy) => enemy.update());
  enemyShots.forEach((shot) => shot.update());
  explosion.forEach((explosion) => explosion.update());
  homingShots.forEach((shot) => shot.update());

  setTimeout(render, 20);
  // requestAnimationFrame(render);
}

//---------------------------functions---------------------------//
function loadCheck(callback: () => void) {
  if (
    viper.ready &&
    viperShots.every((shot) => shot.ready === true) &&
    enemyArray.every((enemy) => enemy.ready === true) &&
    enemyShots.every((shot) => shot.ready === true) &&
    largeEnemyArray.every((enemy) => enemy.ready === true) &&
    sound.ready &&
    boss.ready &&
    homingShots.every((shot) => shot.ready)
  ) {
    callback();
  } else {
    setTimeout(() => {
      loadCheck(callback);
    }, 100);
  }
}

function keyEventSetting() {
  window.addEventListener("keydown", (e) => {
    isKeydown[e.key] = true;
    if (e.key === "q") isPaused = !isPaused;
    if (e.key === "Enter") {
      isPaused = false;
      enemyArray.forEach((enemy) => (enemy.life = 0));
      enemyShots.forEach((shot) => (shot.life = 0));
      largeEnemyArray.forEach((enemy) => (enemy.life = 0));
      viper.setIsComing(CANVAS_WIDTH / 2, CANVAS_HEIGHT, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
      scene.activate("isComing");
    }
  });
  window.addEventListener("keyup", (e) => {
    isKeydown[e.key] = false;
  });
}

export function sequence(start: number, end: number): number[] {
  return Array.from({ length: end - start }, (_, i) => i + start);
}

function sceneInitialize() {
  scene.add("isComing", (frame) => {
    if (frame > 50) {
      scene.activate("boss");
    }
  });

  scene.add("invade", (frame) => {
    if (frame % 50 === 0) {
      for (const enemy of enemyArray) {
        if (enemy.life <= 0) {
          enemy.setEnemy(Math.random() * (CANVAS_WIDTH - 200) + 100, -enemy.height, 2);
          break;
        }
      }
    }

    if (frame === 200) {
      scene.activate("wave");
    }
  });

  scene.add("wave", (frame) => {
    if (frame <= 300 && frame % 60 === 0) {
      for (const enemy of enemyArray) {
        if (enemy.life <= 0) {
          enemy.setEnemy(Math.random() * (CANVAS_WIDTH - 200) + 100, -enemy.height, 2, "wave", 2);
          break;
        }
      }
    }

    if (frame === 400) {
      scene.activate("invade_large");
    }
  });

  scene.add("invade_large", (frame) => {
    if (frame === 50) {
      for (const enemy of largeEnemyArray) {
        if (enemy.life <= 0) {
          enemy.setEnemy(CANVAS_WIDTH / 2, -enemy.height, 20, "large", 2);
          break;
        }
      }
    }
    if (frame > 500) {
      scene.activate("invade");
    }
  });

  scene.add("boss", (frame) => {
    if (boss.life <= 0) {
      boss.set(CANVAS_WIDTH / 2, -boss.height);
    }

    if (frame > 500) {
      scene.activate("invade");
    }
  });

  scene.add("gameover", (frame) => {
    ctx.font = "bold 72px sans-serif";
    ctx.fillStyle = "#ff0000";
    let y = frame;
    if (y > CANVAS_HEIGHT / 2) {
      y = CANVAS_HEIGHT / 2;
    }

    ctx.fillText("GAME OVER", CANVAS_WIDTH / 2 - CANVAS_WIDTH / 4, y, CANVAS_WIDTH / 2);
  });

  scene.activate("isComing");
}
