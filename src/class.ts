import { sequence } from "./main";

export class Canvas2dUtility {
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = this.canvas.getContext("2d");
    if (context === null) {
      throw new Error("2D context not supported or canvas already initialized");
    }
    this.context = context;
  }

  drawRect(x: number, y: number, w: number, h: number, color: string = "#000") {
    this.context.fillStyle = color;
    this.context.fillRect(x, y, w, h);
  }

  drawImage(image: HTMLImageElement, x: number, y: number) {
    this.context.drawImage(image, x, y);
  }
}

export class Position {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static initialize(x: number, y: number) {
    let scaler = Math.sqrt(x ** 2 + y ** 2);
    return new Position(x / scaler, y / scaler);
  }

  static calcScaler(x: number, y: number) {
    return Math.sqrt(x ** 2 + y ** 2);
  }
}

export class Character {
  public ctx: CanvasRenderingContext2D;
  public position: Position;
  public width: number;
  public height: number;
  public life: number;
  private image: HTMLImageElement;
  public ready: boolean;
  public vector: Position;
  private angle: number;
  public target: Character[];

  constructor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, life: number, imagePath: string) {
    this.ctx = ctx;
    this.position = new Position(x, y);
    this.width = w;
    this.height = h;
    this.life = life;
    this.ready = false;
    this.image = new Image();
    this.image.src = imagePath;
    this.image.addEventListener("load", () => {
      this.ready = true;
    });
    this.vector = new Position(0, -1);
    this.angle = (270 * Math.PI) / 180;
    this.target = [];
  }

  normalize(target: Character) {
    let vectorX = target.position.x - this.position.x;
    let vectorY = target.position.y - this.position.y;
    let scaler = Position.calcScaler(vectorX, vectorY);
    return new Position(vectorX / scaler, vectorY / scaler);
  }

  setTarget(target: Character[]) {
    this.target = target;
  }

  setVectorFromAngle(angle: number) {
    let c = Math.cos(angle);
    let s = Math.sin(angle);
    this.vector.set(c, s);
  }

  setVector(x: number, y: number) {
    this.vector.set(x, y);
  }

  draw() {
    let offsetX = this.width / 2;
    let offsetY = this.height / 2;

    this.ctx.drawImage(this.image, this.position.x - offsetX, this.position.y - offsetY);
  }

  rotationDraw() {
    this.ctx.save();

    this.ctx.translate(this.position.x, this.position.y);
    this.ctx.rotate(this.angle - 1.5 * Math.PI);

    let offsetX = this.width / 2;
    let offsetY = this.height / 2;

    this.ctx.drawImage(this.image, -offsetX, -offsetY);
    this.ctx.restore();
  }

  calcDistance(target: Character) {
    return Math.sqrt((this.position.x - target.position.x) ** 2 + (this.position.y - target.position.y) ** 2);
  }
}

export class Explosion {
  ctx: CanvasRenderingContext2D;
  range: number; // 範囲（半径）
  size: number;
  count: number;
  color: string;
  life: number;
  position: Position[];
  timeRange: number; // 終わるまでの時間（秒）
  startTime: number | undefined;
  vector: Position[];
  fireSizes: number[];

  constructor(ctx: CanvasRenderingContext2D, range: number, size: number, count: number, timeRange: number, color: string) {
    this.ctx = ctx;
    this.range = range;
    this.size = size;
    this.count = count;
    this.color = color;
    this.life = 0;
    this.timeRange = timeRange;
    this.startTime;
    this.position = [];
    this.vector = [];
    this.fireSizes = [];
  }

  set(x: number, y: number) {
    this.life = 1;
    this.startTime = Date.now();
    for (const i of sequence(0, this.count)) {
      this.position[i] = new Position(x, y);

      let r = Math.random() * Math.PI * 2;
      let vx = Math.cos(r);
      let vy = Math.sin(r);
      let rm = Math.random();
      this.vector[i] = new Position(vx * rm, vy * rm);

      this.fireSizes[i] = this.size * (Math.random() * 0.5 + 0.5);
    }
  }

  update() {
    if (this.life <= 0 || !this.startTime) return;

    this.ctx.fillStyle = this.color;
    this.ctx.globalAlpha = 0.5;

    /** 経過時間（秒） */
    let elapsedTime = (Date.now() - this.startTime) / 1000;

    // /** 経過進捗状況（0 ~ 1） */
    // let progres = Math.min(elapsedTime / this.timeRange, 1);

    // /** 1 ~ 0 */
    // let s = 1 - progres;
    // let ease = simpleEaseIn(s);

    let ease = simpleEaseIn(1 - Math.min(elapsedTime / this.timeRange, 1));
    let progres = 1 - ease;
    let s = 1 - progres;

    for (const i of sequence(0, this.count)) {
      this.ctx.fillRect(
        this.position[i].x + this.range * progres * this.vector[i].x - (this.fireSizes[i] * s) / 2,
        this.position[i].y + this.range * progres * this.vector[i].y - (this.fireSizes[i] * s) / 2,
        this.fireSizes[i] * s,
        this.fireSizes[i] * s
      );
    }

    this.ctx.globalAlpha = 1;

    // 終了
    if (progres >= 1) {
      this.life = 0;
    }
  }
}

function simpleEaseIn(t: number) {
  return t ** 4;
}

export class BackgroundStar {
  ctx: CanvasRenderingContext2D;
  size: number;
  speed: number;
  color: string;
  position: Position | undefined;

  constructor(ctx: CanvasRenderingContext2D, size: number, speed: number, color: string = "#fff") {
    this.ctx = ctx;
    this.size = size;
    this.speed = speed;
    this.color = color;
  }

  set(x: number, y: number) {
    this.position = new Position(x, y);
  }

  update() {
    if (!this.position) return;

    this.ctx.fillStyle = this.color;
    this.position.y += this.speed;
    if (this.position.y >= this.ctx.canvas.height + this.size) {
      this.position.y = -this.size;
    }
    this.ctx.fillRect(this.position.x, this.position.y, this.size, this.size);
  }
}
