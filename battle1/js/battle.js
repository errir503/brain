PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
const app = new PIXI.Application({height:600, width:1000, transparent:true})
document.body.appendChild(app.view)

class Player {
  constructor(normal, saiyan, attack_start, attack_end, attack_middle, s) {
    this.textures = {normal, saiyan, attack_start, attack_end, attack_middle, s}
    this.sprite_init(normal, attack_start, attack_end, attack_middle, s)
    this.score = 0
    this.nscore = 0
  }

  sprite_init() {
    let sprite = this.sprite = new PIXI.extras.AnimatedSprite(this.textures.normal.map(frame => PIXI.Texture.fromFrame(frame)))
    sprite.animationSpeed = 0.05
    sprite.play()
    sprite.scale.set(2)
    sprite.anchor.set(0.5)
    app.stage.addChild(sprite)

    let sprite1 = this.sprite1 = new PIXI.extras.AnimatedSprite(this.textures.attack_start.map(frame => PIXI.Texture.fromFrame(frame)))
    sprite1.animationSpeed = 0.15
    sprite1.play()
    sprite1.anchor.x = this.textures.s < 0 ? 1 : 0
    app.stage.addChild(sprite1)

    let sprite12 = this.sprite12 = new PIXI.Sprite.fromFrame(this.textures.attack_middle)
    sprite12.anchor.x = this.textures.s < 0 ? 1 : 0
    app.stage.addChild(sprite12)

    let sprite2 = this.sprite2 = new PIXI.extras.AnimatedSprite(this.textures.attack_end.map(frame => PIXI.Texture.fromFrame(frame)))
    sprite2.animationSpeed = 0.15
    sprite2.play()

    sprite2.anchor.x = this.textures.s < 0 ? 1 : 0
    app.stage.addChild(sprite2)
    app.ticker.add(() => {
      this.score += Math.sign(this.nscore - this.score)
      this.sprite12.width = this.score||0 + 2
      this.sprite2.position.set(this.sprite12.x+this.textures.s*(this.sprite12.width - 2), this.sprite12.y)
    })

    let sprite3 = this.sprite3 = new PIXI.extras.AnimatedSprite(["60.png", "61.png"].map(frame => PIXI.Texture.fromFrame(frame)))
    sprite3.animationSpeed = 0.15
    sprite3.anchor.set(0.5, 1)
    sprite3.y = 35
    sprite3.play()
    this.sprite.addChild(sprite3)
    sprite3.alpha = 0.5
    sprite3.visible = false
  }

  position_init() {
    this.sprite1.position.set(this.sprite.x+(this.textures.s*this.sprite.width/2), this.sprite.y-this.sprite.height/4)
    this.sprite12.position.set(this.sprite1.x+this.textures.s*(this.sprite1.width), this.sprite1.y)
    this.sprite2.position.set(this.sprite12.x+this.textures.s*(this.sprite12.width - 2), this.sprite12.y)
  }

  set saiyan(v) {
    this._saiyan = v
    this.sprite.textures = (v ? this.textures.saiyan : this.textures.normal).map(frame => PIXI.Texture.fromFrame(frame))
    this.sprite.play()
    this.sprite3.visible = v
  }

  get saiyan() {
    return !!this._saiyan
  }
}

class Goku extends Player {
  constructor() {
    super(["00.png", "01.png"], ["40.png", "41.png"], ["10.png", "11.png"], ["13.png", "14.png"], "12.png", 1)
    this.sprite.position.set(this.sprite.width, app.view.height/2)
    this.position_init()
  }
}

class Vegeta extends Player {
  constructor() {
    super(["20.png", "21.png"], ["50.png", "51.png"], ["30.png", "31.png"], ["33.png", "34.png"], "32.png", -1)
    this.sprite.position.set(app.view.width - this.sprite.width, app.view.height/2)
    this.position_init()
  }
}


app.loader.onComplete.add(() => {
  const bg = new PIXI.Sprite.fromFrame("bg.png")
  bg.alpha = 0.7
  bg.height = app.view.height
  bg.width = app.view.width
  app.stage.addChild(bg)

  const goku = new Goku()
  window.goku = goku
  const vegeta = new Vegeta()
  window.vegeta = vegeta

  function update(scores, force) {
    const total = scores[0] + scores[1]
    goku.nscore = 365 * (scores[0]/total)
    vegeta.nscore = 365 * (scores[1]/total)
    if (force) {
      goku.score = goku.nscore
      vegeta.score = vegeta.nscore
    }
  }

  update([1, 1], true)
  window.update = update

})
app.loader.add("sprites/textures.json").load()

//Websocket connection
  const ws = new WebSocket(`ws://${(window.location.href.match(/\d+\.\d+\.\d+\.\d+/)||["localhost"])[0]}:3001`)
  let prefered, a = 1, b = 1
  ws.onmessage = event => {
    const data = JSON.parse(event.data)
    const type = data.shift()
    const headset = data.shift()
    if ((type === "pow")&&(window.update)) {
      if(headset.includes(prefered)) {
        a = Math.log10(data.reduce((w, v) => w + v))
      } else {
        b = Math.log10(data.reduce((w, v) => w + v))
      }
      update([a, b])
    }
    if(type === "hdw") {
      if(!prefered) prefered = data[3]
    }
  }
