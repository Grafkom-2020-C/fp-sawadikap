function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.setSize(window.innerWidth, window.innerHeight);

  const fov = 40;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 200;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(10, 10, 20);

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.update();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('lightblue');


  {
    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0x000000;  // black
    const intensity = 1;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
  }

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(5, 10, 2);
    scene.add(light);
    scene.add(light.target);
  }

  const manager = new THREE.LoadingManager();
  manager.onLoad = init;

  
  function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.3;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
    // compute a unit vector that points in the direction the camera is now
    // in the xz plane from the center of the box
    const direction = (new THREE.Vector3())
        .subVectors(camera.position, boxCenter)
        .multiply(new THREE.Vector3(1, 0, 1))
        .normalize();

    // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();

    // point the camera to look at the center of the box
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
  }

  {
    const gltfLoader = new THREE.GLTFLoader();
    gltfLoader.load('/resources/models/land_final_gltf.glb', (gltf) => {
      const root = gltf.scene;
      scene.add(root);

      // compute the box that contains all the stuff
      // from root and below
      const box = new THREE.Box3().setFromObject(root);

      const boxSize = box.getSize(new THREE.Vector3()).length();
      const boxCenter = box.getCenter(new THREE.Vector3());

      // set the camera to frame the box
      frameArea(boxSize * 0.5, boxSize, boxCenter, camera);

      // update the Trackball controls to handle the new size
      controls.maxDistance = boxSize * 10;
      controls.target.copy(boxCenter);
      controls.update();
    });
  }

  const models = {
    pig:    { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Pig.gltf' },
    cow:    { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Cow.gltf' },
    llama:  { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Llama.gltf' },
    pug:    { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Pug.gltf' },
    sheep:  { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Sheep.gltf' },
    zebra:  { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Zebra.gltf' },
    horse:  { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Horse.gltf' },
    shark:  { url: '/resources/models/shark.glb' },
    whale:  { url: '/resources/models/whale.glb' },
    mantaRay:  { url: '/resources/models/mantaRay.glb' },
    bird:  { url: '/resources/models/simple_bird/scene.gltf' },
};
  {
    const gltfLoader = new THREE.GLTFLoader(manager);
    for (const model of Object.values(models)) {
      gltfLoader.load(model.url, (gltf) => {
        model.gltf = gltf;
      });
    }
  }

  function prepModelsAndAnimations() {
    Object.values(models).forEach(model => {
      const animsByName = {};
      model.gltf.animations.forEach((clip) => {
        animsByName[clip.name] = clip;
      });
      model.animations = animsByName;
    });
  }

  const mixerInfos = [];

  function init() {
    prepModelsAndAnimations();

    Object.values(models).forEach((model, ndx) => {
      const clonedScene = THREE.SkeletonUtils.clone(model.gltf.scene);
      const root = new THREE.Object3D();
      root.add(clonedScene);
      scene.add(root);
      root.position.x = (ndx - 3) * 9;
      root.position.z = (ndx - 20);
      root.position.y = -1;
      if(ndx>6){
        root.position.x = (ndx-10) * 9;
        root.position.z = (ndx+20);
        root.position.y = -4;
      }
      if(ndx>9){
        root.position.x = (ndx-8) * 9;
        root.position.y = 20;
        root.position.z = (ndx-20);
      }

      const mixer = new THREE.AnimationMixer(clonedScene);
      const actions = Object.values(model.animations).map((clip) => {
        return mixer.clipAction(clip);
      });
      const mixerInfo = {
        mixer,
        actions,
        actionNdx: -1,
      };
      mixerInfos.push(mixerInfo);
      playNextAction(mixerInfo);
    });
  }

  function playNextAction(mixerInfo) {
    const {actions, actionNdx} = mixerInfo;
    const nextActionNdx = (actionNdx + 1) % actions.length;
    mixerInfo.actionNdx = nextActionNdx;
    actions.forEach((action, ndx) => {
      const enabled = ndx === nextActionNdx;
      action.enabled = enabled;
      if (enabled) {
        action.play();
      }
    });
  }

  const webs = ['https://en.wikipedia.org/wiki/Pig','https://en.wikipedia.org/wiki/Cow','https://en.wikipedia.org/wiki/Llama','https://en.wikipedia.org/wiki/Pug','https://en.wikipedia.org/wiki/Sheep','https://en.wikipedia.org/wiki/Zebra','https://en.wikipedia.org/wiki/Horse','https://en.wikipedia.org/wiki/Shark', 'https://en.wikipedia.org/wiki/Whale', 'https://en.wikipedia.org/wiki/Manta_ray'];

  window.addEventListener('keydown', (e) => {
    const mixerInfo = mixerInfos[e.keyCode - 49];
    if (!mixerInfo) {
      return;
    }
    playNextAction(mixerInfo);

    location.href = webs[e.keyCode - 49];
  });

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  let then = 0;
  function render(now) {
    now *= 0.001;  // convert to sections
    const deltaTime = now - then;
    then = now;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    for (const {mixer} of mixerInfos) {
      mixer.update(deltaTime);
    }

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
