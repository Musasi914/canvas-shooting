import { Character, Explosion, Position, Sound } from "./class";
import { isKeydown, sequence } from "./main";

export class Viper extends Character {
  public isComing: boolean;
  private startPosition: Position | undefined;
  private endPosition: Position | undefined;
  private comingFrame: number;
  private speed: number;
  private shots: Shot[];
  private shotCoolTime: number;
  private shotCounter: number;
  private explosion: Explosion[];

  constructor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, imagePath: string) {
    super(ctx, x, y, w, h, 1, imagePath);
    this.isComing = false;
    this.comingFrame = 0;
    this.speed = 10;
    this.shots = [];
    this.shotCoolTime = 10;
    this.shotCounter = 0;
    this.explosion = [];
  }

  setExplosion(explosion: Explosion[]) {
    this.explosion = explosion;
  }

  setLife(num: number) {
    this.life = num;
  }

  setIsComing(startX: number, startY: number, endX: number, endY: number) {
    this.isComing = true;
    this.startPosition = new Position(startX, startY);
    this.endPosition = new Position(endX, endY);
    this.position.set(startX, startY);
    this.comingFrame = 0;
    this.life = 1;
  }

  setShotsArray(shots: Shot[]) {
    this.shots = shots;
  }

  update() {
    // lifeが0の時、処理しない
    if (this.life <= 0 || !this.startPosition || !this.endPosition) return;
    this.ctx.globalAlpha = 1;

    // 衝突判定
    for (const target of this.target) {
      if (target.life <= 0) continue;
      let distance = this.calcDistance(target);
      if (distance < (this.width + target.width) / 3) {
        target.life -= 1;
        this.life -= 1;
        if (this.life <= 0) {
          for (const i of sequence(0, this.explosion.length)) {
            if (this.explosion[i].life <= 0) {
              this.explosion[i].set(this.position.x, this.position.y);
              this.explosion[i].sound?.play();
              break;
            }
          }
        }
      }
    }

    // isComing
    if (this.isComing) {
      this.position.y = this.startPosition.y - this.comingFrame * 2;

      // 点滅
      if (this.comingFrame % 2 === 0) {
        this.ctx.globalAlpha = 0.5;
      }

      // isComing終了条件
      if (this.position.y <= this.ctx.canvas.height - 100) {
        this.position.y = this.ctx.canvas.height - 100;
        this.isComing = false;
      }
      this.comingFrame++;
    } else {
      // キーイベント（移動）
      if (isKeydown.ArrowLeft) this.position.x -= this.speed;
      if (isKeydown.ArrowRight) this.position.x += this.speed;
      if (isKeydown.ArrowUp) this.position.y -= this.speed;
      if (isKeydown.ArrowDown) this.position.y += this.speed;

      // キーイベント（ショット）
      if (isKeydown.z && this.shotCounter >= 0) {
        for (const shot of this.shots) {
          if (shot.life <= 0) {
            shot.setShot(this.position.x, this.position.y, 1);
            this.shotCounter = -this.shotCoolTime;
            break;
          }
        }
      }
      this.shotCounter++;
    }

    let tx = Math.min(Math.max(this.position.x, 0), this.ctx.canvas.width);
    let ty = Math.min(Math.max(this.position.y, 0), this.ctx.canvas.height);
    this.position.set(tx, ty);
    this.draw();
  }
}

export class Shot extends Character {
  protected speed: number;
  protected power: number;
  protected explosion: Explosion[];

  constructor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, imagePath: string) {
    super(ctx, x, y, w, h, 0, imagePath);
    this.speed = 10;
    this.power = 1;
    this.explosion = [];
  }

  setExplosion(explosion: Explosion[]) {
    this.explosion = explosion;
  }

  setShot(x: number, y: number, power: number) {
    this.life = 1;
    this.position.set(x, y);
    this.power = power;
  }

  setSpeed(speed = 5) {
    this.speed = speed;
  }

  update() {
    if (this.life <= 0) return;
    this.position.x += this.vector.x * this.speed;
    this.position.y += this.vector.y * this.speed;

    // 衝突判定
    for (const target of this.target) {
      if (target.life <= 0) continue;
      let distance = this.calcDistance(target);
      if (distance < (this.width + target.width) / 4) {
        // iscomingならreturn
        if (target instanceof Viper && target.isComing) {
          break;
        }

        target.life -= this.power;
        if (target.life <= 0) {
          for (const i of sequence(0, this.explosion.length)) {
            if (this.explosion[i].life <= 0) {
              this.explosion[i].set(target.position.x, target.position.y);
              this.explosion[i].sound?.play();
              break;
            }
          }
        }
        this.life = 0;
      }
    }

    // ショット消す
    if (
      this.position.x < 0 - this.width ||
      this.position.x > this.ctx.canvas.width + this.width ||
      this.position.y < 0 - this.height ||
      this.position.y > this.ctx.canvas.height + this.height
    ) {
      this.life = 0;
    }

    this.rotationDraw();
  }
}

type EnemyType = "default" | "wave" | "large";

export class Enemy extends Character {
  private speed: number;
  private shots: Shot[];
  private type: EnemyType;
  private frame: number;

  constructor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, imagePath: string) {
    super(ctx, x, y, w, h, 0, imagePath);
    this.speed = 3;
    this.setVector(0, 1);
    this.shots = [];
    this.type = "default";
    this.frame = -1;
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  setEnemy(x: number, y: number, life: number, type: EnemyType = "default", speed: number = 3) {
    this.position.set(x, y);
    this.life = life;
    this.frame = 0;
    this.type = type;
    this.speed = speed;
  }

  setShotsArray(shots: Shot[]) {
    this.shots = shots;
  }

  update() {
    if (this.life <= 0) return;

    this.ctx.globalAlpha = 1;

    switch (this.type) {
      case "wave":
        if (this.frame % 60 === 0) {
          let normalizedVector = this.normalize(this.target[0]);
          this.fire(normalizedVector.x, normalizedVector.y, 5);
        }
        this.position.x += Math.sin(this.frame / 10) * 6;
        this.position.y += this.vector.y * this.speed;
        break;

      case "large":
        if (this.frame % 60 === 0) {
          for (let i = 0; i <= 360; i += 45) {
            let radian = (i * Math.PI) / 180;
            this.fire(Math.cos(radian), Math.sin(radian), 5);
          }
        }
        this.position.x += Math.sin((this.frame + 80) / 50) * 2;
        this.position.y < 100 ? (this.position.y += this.vector.y * this.speed) : this.position.y;
        break;

      case "default":
      default:
        if (this.frame % 70 === 0) {
          let normalizedVector = this.normalize(this.target[0]);
          this.fire(normalizedVector.x, normalizedVector.y, 5);
        }
        this.position.x += this.vector.x * this.speed;
        this.position.y += this.vector.y * this.speed;
        break;
    }

    // 敵消す
    if (
      this.position.x < 0 - this.width ||
      this.position.x > this.ctx.canvas.width + this.width ||
      this.position.y < 0 - this.height ||
      this.position.y > this.ctx.canvas.height + this.height
    ) {
      this.life = 0;
      this.frame = -1;
    }

    this.draw();
    this.frame++;
  }

  fire(x: number, y: number, speed: number) {
    for (const shot of this.shots) {
      if (shot.life <= 0) {
        shot.setVector(x, y);
        shot.setShot(this.position.x, this.position.y, 1);
        shot.setSpeed(speed);
        break;
      }
    }
  }
}

export class Boss extends Character {
  speed: number;
  frame: number;
  homingShots: Shot[];

  constructor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, imagePath: string) {
    super(ctx, x, y, w, h, 0, imagePath);
    this.speed = 3;
    this.frame = -1;
    this.homingShots = [];
  }

  set(x: number, y: number) {
    this.position.set(x, y);
    this.life = 80;
    this.frame = 0;
  }

  setShotsArray(shots: Shot[]) {
    this.homingShots = shots;
  }

  homingfire(x: number, y: number, speed: number = 5) {
    for (const shot of this.homingShots) {
      if (shot.life <= 0) {
        shot.setVector(x, y);
        shot.setShot(this.position.x, this.position.y, 1);
        shot.setSpeed(speed);
        break;
      }
    }
  }

  update() {
    if (this.life <= 0) return;
    this.ctx.globalAlpha = 1;

    this.position.x += Math.cos(this.frame / 80) * 2;
    if (this.position.y <= 100) {
      this.position.y += this.speed;
    }

    if (this.frame % 50 === 0) {
      let normalized = this.normalize(this.target[0]);
      this.homingfire(normalized.x, normalized.y);
    }

    // 敵消す
    if (
      this.position.x < 0 - this.width ||
      this.position.x > this.ctx.canvas.width + this.width ||
      this.position.y < 0 - this.height ||
      this.position.y > this.ctx.canvas.height + this.height
    ) {
      this.life = 0;
      this.frame = -1;
    }
    this.draw();
    this.frame++;
  }
}

export class Homing extends Shot {
  frame: number;

  constructor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, imagePath: string) {
    super(ctx, x, y, w, h, imagePath);
    this.frame = 0;
  }

  update() {
    if (this.life <= 0) return;

    // this.vectorには単位化したヴェクトルが入る
    // 弾の行き先をきめる
    /** 自分とタゲの位置ベクトル */
    let normalized = this.normalize(this.target[0]);

    /** 自分の進行単位ベクトル */
    this.vector = this.vector.normalize(this.vector);

    /** 外積 */
    let cross = this.vector.cross(normalized);

    if (cross > 0) {
      this.vector.rotate(Math.PI / 180);
    } else if (cross < 0) {
      this.vector.rotate(-Math.PI / 180);
    }

    let radian = Math.atan2(this.vector.y, this.vector.x);

    this.angle = radian;

    this.position.x += this.vector.x * this.speed;
    this.position.y += this.vector.y * this.speed;

    // 衝突判定
    for (const target of this.target) {
      if (target.life <= 0) continue;
      let distance = this.calcDistance(target);
      if (distance < (this.width + target.width) / 4) {
        // iscomingならreturn
        if (target instanceof Viper && target.isComing) {
          break;
        }

        target.life -= this.power;
        if (target.life <= 0) {
          for (const i of sequence(0, this.explosion.length)) {
            if (this.explosion[i].life <= 0) {
              this.explosion[i].set(target.position.x, target.position.y);
              this.explosion[i].sound?.play();
              break;
            }
          }
        }
        this.life = 0;
      }
    }

    // ショット消す
    if (
      this.position.x < 0 - this.width ||
      this.position.x > this.ctx.canvas.width + this.width ||
      this.position.y < 0 - this.height ||
      this.position.y > this.ctx.canvas.height + this.height
    ) {
      this.life = 0;
    }

    this.rotationDraw();
    this.frame++;
  }
}
