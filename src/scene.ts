export class Scene {
  private scene: Map<string, (frame: number) => void>;
  public activeScene: string | undefined;
  public frame: number;

  constructor() {
    this.scene = new Map();
    this.activeScene;
    this.frame = -1;
  }

  add(name: string, func: (frame: number) => void) {
    this.scene.set(name, () => func(this.frame));
  }

  activate(sceneName: string) {
    this.activeScene = sceneName;
    this.frame = 0;
  }

  update() {
    if (!this.activeScene) return;
    let func = this.scene.get(this.activeScene);
    if (!func) throw new Error("そんな名前のシーンはない");
    func(this.frame);
    this.frame++;
  }
}
