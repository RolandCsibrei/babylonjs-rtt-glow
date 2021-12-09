// Roland Csibrei, 2021

const BASE_URL = 'orb/'

import {
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  Scene,
  Color4,
  CubeTexture,
  Mesh,
  Color3,
  StandardMaterial,
  Texture,
  MeshBuilder,
  DefaultRenderingPipeline,
  RenderTargetTexture,
  VolumetricLightScatteringPostProcess,
  AbstractMesh,
  TransformNode,
  ParticleHelper,
  IParticleSystem
} from '@babylonjs/core'
import '@babylonjs/loaders'

import { moveCameraTo } from 'src/utils/camera'
import { RenderTargetGlowPostProcess } from 'src/utils/RenderTargetGlowPostProcess'
import { BaseScene } from './BaseScene'

export class RenderTargetGlowScene extends BaseScene {
  private _glow?: RenderTargetGlowPostProcess
  private _glow2?: RenderTargetGlowPostProcess
  private _orbRoot?: TransformNode

  private _rtt?: RenderTargetTexture

  private _orbScene: Scene
  private _orbCamera: ArcRotateCamera
  private get _arcCamera() {
    return <ArcRotateCamera>this._camera
  }

  constructor(canvas: HTMLCanvasElement) {
    super(canvas)

    this._scene.autoClear = false

    this._orbScene = new Scene(this._engine)

    this._orbScene.autoClear = false

    // const light2 = new HemisphericLight('light2', new Vector3(-1, 1, 1), this._orbScene)
    // light2.intensity = 0

    this._orbCamera = new ArcRotateCamera('orb-camera', 1.62, 1.6, 60, new Vector3(0, 0, 0), this._orbScene)
    this._orbCamera.layerMask = 2
  }

  protected setupRenderLoop() {
    setInterval(() => {
      this._findButtonbyTextContent('Refresh')?.click()
    }, 1000)
    this._engine.runRenderLoop(() => {
      this._scene.render()
      // this._glow?.render(false)

      // this._orbCamera.position = this._arcCamera.position
      // this._orbCamera.target = this._arcCamera.target
      // this._orbCamera.alpha = this._arcCamera.alpha
      // this._orbCamera.beta = this._arcCamera.beta
      // this._orbCamera.radius = this._arcCamera.radius
      this._orbScene.render()
    })
  }

  private _findButtonbyTextContent(text: string) {
    var buttons = document.querySelectorAll('button')
    for (var i = 0, l = buttons.length; i < l; i++) {
      if (buttons[i].firstChild?.nodeValue == text) {
        return buttons[i]
      }
    }
  }

  private _enableGlow() {
    const glow = new RenderTargetGlowPostProcess('glow', this._scene, this._engine, {
      // mainTextureFixedSize: 1024,
      blurKernelSize: 100,
      camera: this._camera
    })
    this._glow = glow
    glow.intensity = 10
  }

  private _createRtt() {
    const renderTarget = new RenderTargetTexture(
      'rtt',
      {
        width: 1920,
        height: 1080
      },
      this._scene,
      false
    )
    this._rtt = renderTarget
    this._arcCamera.outputRenderTarget = this._rtt
  }

  private async _loadScene() {
    const box = MeshBuilder.CreateBox('box', { size: 2 }, this._scene)
    const boxMaterial = new StandardMaterial('boxMat', this._scene)
    box.layerMask = this._arcCamera.layerMask
    box.material = boxMaterial
    boxMaterial.emissiveColor = Color3.Magenta()
    boxMaterial.wireframe = true
    box.position.x -= 3

    const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 2 }, this._scene)
    const sphereMaterial = new StandardMaterial('sphereMat', this._scene)
    sphere.layerMask = this._arcCamera.layerMask
    sphere.material = sphereMaterial
    sphereMaterial.emissiveColor = Color3.Yellow()

    const tetra = MeshBuilder.CreatePolyhedron('tetra', { size: 1 }, this._scene)
    const tetraMaterial = new StandardMaterial('tetraMat', this._scene)
    tetra.layerMask = this._arcCamera.layerMask
    tetra.material = tetraMaterial
    tetraMaterial.emissiveColor = Color3.Green()
    tetra.position.x += 3

    //

    const box2 = MeshBuilder.CreateBox('box2', { size: 20 }, this._orbScene)
    const box2Material = new StandardMaterial('box2Mat', this._orbScene)
    box2.material = box2Material
    if (this._rtt) {
      box2Material.emissiveTexture = this._rtt
    }
    box2.layerMask = this._orbCamera.layerMask

    const box2Clone = MeshBuilder.CreateBox('box2Clone', { size: 20 }, this._orbScene)
    const box2CloneMaterial = new StandardMaterial('box2CloneMat', this._orbScene)
    box2CloneMaterial.alpha = 0

    box2Clone.enableEdgesRendering()
    box2Clone.edgesWidth = 6
    box2Clone.edgesColor = new Color4(1, 1, 1, 0.5)

    box2Clone.material = box2CloneMaterial
    box2Clone.layerMask = this._orbCamera.layerMask

    let i = 0
    this._scene.onBeforeRenderObservable.add(() => {
      box.rotation.x += 0.004
      box.rotation.z -= 0.002

      const s = Math.sin(i / 500) + 0.4
      sphere.scaling.setAll(s)

      tetra.rotation.x -= 0.004
      tetra.rotation.z += 0.001

      this._glow!.intensity = (Math.sin(i / 500) + 1) * 10
      this._glow!.blurKernelSize = (Math.sin(i / 500) + 1) * 100 + 10
      i++
    })

    this._orbScene.onBeforeRenderObservable.add(() => {
      box2.rotation.x += 0.008
      box2.rotation.z += 0.004

      box2Clone.rotation.x = box2.rotation.x
      box2Clone.rotation.z = box2.rotation.z
    })

    await this._scene.debugLayer.show({
      embedMode: true,
      overlay: true
    })

    this._scene.debugLayer.select(this._rtt)
    // this._orbScene.debugLayer.setAsActiveScene()
  }

  createCamera() {
    const camera = new ArcRotateCamera('camera', 1.67, 1, 8, new Vector3(0, 0, 0), this._scene)
    camera.layerMask = 1
    this._camera = camera
    // camera.inertia = 0.8
    // camera.speed = 0.05
    camera.minZ = 0.05
    camera.maxZ = 10000
    //     camera.lowerBetaLimit = 0
    // camera.upperBetaLimit = 1.45
    // camera.lowerRadiusLimit = 1.5
    // camera.upperRadiusLimit = 600
    camera.angularSensibilityX = 2000
    camera.angularSensibilityY = 2000
    camera.panningSensibility = 1000
    camera.wheelPrecision = 30
    // camera.pinchDeltaPercentage = 0.2
    // camera.wheelDeltaPercentage = 0.2
    camera.speed = 0.05

    camera.attachControl(this._canvas, true)
    // this.setCamera0()
  }

  createLight(scene: Scene) {
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
    light.intensity = 0.7

    // const insideLight = new DirectionalLight('spotLight1', new Vector3(1, 1, 1), scene)
    // insideLight.specular = new Color3(0, 1, 0)
    // insideLight.position = this._orbRoot?.position.clone() ?? Vector3.Zero()
    // this._scene.onBeforeRenderObservable.add(() => {
    // })
  }

  public async initScene() {
    this._scene.clearColor = new Color4(0, 0, 0, 1)
    this.createCamera()
    this.createLight(this._scene)

    await this._createDemo()
  }

  public setCamera0() {
    const alpha = 2.1237
    const beta = 1.94
    const radius = 156
    const target = new Vector3(0, -4, -1.7)
    this._animateCamera(alpha, beta, radius, target)
  }

  private async _createDemo(): Promise<void> {
    this._crateEnvironment()
    this._createRtt()

    this._enableGlow()
    await this._loadScene()
    await this._createSkyBox()

    // this._createSunRays()
  }

  private _createSunRays(mesh?: Mesh) {
    if (!this._camera) {
      return
    }

    // const godrays = new VolumetricLightScatteringPostProcess('godrays', 1.0, this._camera, undefined, 100, Texture.BILINEAR_SAMPLINGMODE, this._engine, false)
    // // godrays._volumetricLightScatteringRTT.renderParticles = true;

    // // some advanced godrays settings for you to play-with
    // godrays.exposure = 0.2
    // godrays.decay = 0.96815
    // godrays.weight = 0.58767
    // godrays.density = 0.926

    const name = 'a-sun'
    mesh = mesh ?? Mesh.CreatePlane(name, 1.2, this._scene)
    const material = new StandardMaterial(`${name}Material`, this._scene)
    mesh.material = material
    material.diffuseColor = new Color3(0.0, 1.0, 0.0)
    material.emissiveColor = new Color3(1, 1, 1)
    // material.emissiveColor = new Color3(0.3, 0.1, 0.1);
    material.backFaceCulling = false
    mesh.position = new Vector3(0, 0, 0)
    mesh.visibility = 1
    mesh.billboardMode = AbstractMesh.BILLBOARDMODE_ALL
    mesh.scaling = new Vector3(40, 40, 40)

    material.diffuseTexture = new Texture('textures/rainbow.png', this._scene)
    material.diffuseTexture.hasAlpha = true

    const sunRays = new VolumetricLightScatteringPostProcess('sunRays', 1, this._camera, mesh, 100, Texture.BILINEAR_SAMPLINGMODE, this._engine, false)

    sunRays.exposure = 0.3
    sunRays.decay = 0.96815
    sunRays.weight = 0.98767
    sunRays.density = 0.996

    if (this._orbRoot) {
      sunRays.mesh.position = this._orbRoot.position.clone()
    }

    // sunRays.excludedMeshes = [sunMesh];
    // this._sunRays = sunRays.mesh
  }

  private _animateCamera(alpha: number, beta: number, radius: number, target?: Vector3) {
    const arcCamera = <ArcRotateCamera>this._camera
    moveCameraTo(arcCamera, null, target, alpha, beta, radius)
  }

  private _crateEnvironment() {
    const hdrTexture = CubeTexture.CreateFromPrefilteredData('env/decor-shop.env', this._scene)
    hdrTexture.coordinatesMode = Texture.SKYBOX_MODE
    this._scene.environmentTexture = hdrTexture
  }

  private async _createSkyBox(): Promise<void> {
    return new Promise((resolve, reject) => {
      const skybox = MeshBuilder.CreateBox('skyBox', { size: 10000.0 }, this._scene)
      skybox.layerMask = this._arcCamera.layerMask
      const skyboxMaterial = new StandardMaterial('skyBox', this._scene)
      skyboxMaterial.backFaceCulling = false
      const files = [
        'textures/space_left.jpg',
        'textures/space_up.jpg',
        'textures/space_front.jpg',
        'textures/space_right.jpg',
        'textures/space_down.jpg',
        'textures/space_back.jpg'
      ]
      const reflectionTexture = CubeTexture.CreateFromImages(files, this._scene)
      // not working
      // const reflectionTexture = new CubeTexture('', this._scene, null, undefined, files, () => {

      reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE
      skyboxMaterial.reflectionTexture = reflectionTexture
      skyboxMaterial.disableLighting = true
      skyboxMaterial.diffuseColor = new Color3(0, 0, 0)
      skyboxMaterial.specularColor = new Color3(0, 0, 0)
      skybox.material = skyboxMaterial
      resolve()
      // })

      setTimeout(() => {
        reject()
      }, 60000)
    })
  }
}

/*


// Roland Csibrei, 2021

class Playground {
    public static async CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new BABYLON.Scene(engine);

        const pg = new Playground(engine, scene, canvas)
        await pg._start()

        return scene;
    }

    constructor(private _engine: BABYLON.Engine, private _scene: BABYLON.Scene, private _canvas: HTMLCanvasElement) {
    }

    private async _start() {
        const scene = this._scene
        const canvas = this._canvas

        const camera1 = new BABYLON.ArcRotateCamera("camera1", -5.1, 1.629, 490, new BABYLON.Vector3(104, -31, -44.6), scene);
        camera1.attachControl(canvas, true);
        camera1.panningSensibility = 1

        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        //

        // camera1.layerMask = 0x10000000
        // camera2.layerMask = 0x20000000
        const renderTarget = new BABYLON.RenderTargetTexture(
            'rtt',
            {

                width: 2048,
                height: 2048,
            },
            scene,
            true
        );
        renderTarget.activeCamera = camera1

        scene.customRenderTargets.push(renderTarget); // add RTT to the scene

        const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("https://playgrounds.babylonjs.xyz/helmet-environment.dds", scene);
        scene.environmentTexture = hdrTexture;

        const level = await BABYLON.SceneLoader.AppendAsync("https://playgrounds.babylonjs.xyz/scifi-level/", "scene.gltf", scene)
        const levelRoot = level.meshes[0]
        levelRoot.scaling = new BABYLON.Vector3(100, 100, -100)
        level.meshes.forEach(m => {
            renderTarget.renderList.push(m)
        })

        const orbContent = await BABYLON.SceneLoader.ImportMeshAsync("", "https://playgrounds.babylonjs.xyz/", "DamagedHelmet.gltf", scene)
        const root = orbContent.meshes[0]
        root.scalingDeterminant = 30
        root.position = new BABYLON.Vector3(237, -103, -255)
        root.rotation = new BABYLON.Vector3(0, 0, 0)
        orbContent.meshes.forEach(m => {
            renderTarget.renderList.push(m)
        })


        // first pass, render scene with original materials
        var imagePass = new BABYLON.PassPostProcess("imagePass", 1.0, camera1, BABYLON.Texture.NEAREST_SAMPLINGMODE, scene.getEngine());
        const glow = new BABYLON.GlowLayer('glow', scene, {
            mainTextureFixedSize: 1024,
            blurKernelSize: 40
        })
        glow.intensity = 3.13


        scene.onBeforeRenderObservable.add(() => {
            root.rotation.y += 0.01
        })


        const material = await BABYLON.NodeMaterial.ParseFromSnippetAsync("6MCVHR#5", scene)

        const orb = BABYLON.MeshBuilder.CreateSphere("sphere1", { diameter: 100, segments: 100 }, scene);
        const textureBlock = <BABYLON.TextureBlock>material.getBlockByName("Texture")
        if (textureBlock) {
            textureBlock.texture = renderTarget
        }
        material.backFaceCulling = false
        orb.rotation = new BABYLON.Vector3(Math.PI, 4.9, Math.PI * 1.85)
        orb.position = root.position.clone()
        orb.material = material
        orb.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL
    }

}

*/
