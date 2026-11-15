import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useApp } from '../context/AppContext';
import {
  AR_PLANT_CATALOGUE,
  ARPlantDefinition,
  createMonsteraModel,
  createTomatoModel,
  createRoseModel,
  createSnakePlantModel,
  createBonsaiModel
} from '../utils/arPlantModels';
import {
  Camera,
  Compass,
  RotateCw,
  Maximize2,
  Trash2,
  Sun,
  CameraOff,
  SwitchCamera,
  Sparkles,
  Info,
  CheckCircle2,
  Download,
  Share2,
  Plus,
  HelpCircle,
  X,
  Layers,
  Move
} from 'lucide-react';

interface PlacedPlantInstance {
  id: string;
  plantDefId: string;
  name: string;
  group: THREE.Group;
  scale: number;
  rotationY: number;
  position: { x: number; y: number; z: number };
  baseHeightMeters: number;
  baseWidthMeters: number;
}

interface ARGardenOverlayViewProps {
  initialPlantName?: string;
  onBackToGarden?: () => void;
}

export const ARGardenOverlayView: React.FC<ARGardenOverlayViewProps> = ({
  initialPlantName,
  onBackToGarden
}) => {
  const { t, language, plants: userGardenPlants } = useApp();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stream & Sensor states
  const [hasCameraStream, setHasCameraStream] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [orientationData, setOrientationData] = useState<{ alpha: number; beta: number; gamma: number }>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const [hasSensorPermission, setHasSensorPermission] = useState<boolean>(false);

  // AR Selected Plant & Placed Instances
  const [selectedCatalogueId, setSelectedCatalogueId] = useState<string>('ar-monstera');

  // Auto-select catalogue plant if initialPlantName is passed
  useEffect(() => {
    if (initialPlantName) {
      const q = initialPlantName.toLowerCase();
      const match = AR_PLANT_CATALOGUE.find(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.scientificName.toLowerCase().includes(q) ||
          (p.nameVi && p.nameVi.toLowerCase().includes(q)) ||
          (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
          q.includes(p.name.toLowerCase())
      );
      if (match) {
        setSelectedCatalogueId(match.id);
      }
    }
  }, [initialPlantName]);
  const [placedPlants, setPlacedPlants] = useState<PlacedPlantInstance[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);

  // Sunlight Mode Simulation
  const [sunlightTime, setSunlightTime] = useState<'morning' | 'noon' | 'afternoon'>('morning');

  // UI Modals
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraThreeRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const groundGridRef = useRef<THREE.GridHelper | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Raycaster for tapping on ground plane
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseVecRef = useRef(new THREE.Vector2());
  const groundPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  // Initialize Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
          setHasCameraStream(true);
        };
      }
    } catch (err: any) {
      console.warn('Camera stream error or permission denied:', err);
      setCameraError(
        language === 'en'
          ? 'Unable to access camera. Please allow camera permissions or use simulated garden backdrop mode.'
          : language === 'zh'
          ? '无法访问摄像头。请授予相机权限或使用模拟花园背景模式。'
          : language === 'km'
          ? 'មិនអាចបើកកាមេរ៉ាបានទេ។ សូមអនុញ្ញាតសិទ្ធិកាមេរ៉ា ឬប្រើផ្ទាំងសួនសាកល្បង។'
          : language === 'ja'
          ? 'カメラにアクセスできません。カメラ権限を許可するか、シミュレーション背景をご利用ください。'
          : 'Không thể truy cập camera. Vui lòng cấp quyền camera hoặc sử dụng chế độ phông nền vườn mẫu.'
      );
      setHasCameraStream(false);
    }
  }, [facingMode, language]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  // Request & Listen to Device Orientation Sensors
  const requestSensorPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setHasSensorPermission(true);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setHasSensorPermission(true);
    }
  };

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const alpha = event.alpha || 0; // Compass heading 0-360
      const beta = event.beta || 0;   // Front-back pitch -180 to 180
      const gamma = event.gamma || 0; // Left-right roll -90 to 90

      setOrientationData({ alpha, beta, gamma });

      // Apply subtle orientation compensation to Three.js camera to lock onto ground
      if (cameraThreeRef.current) {
        // Map beta (tilt angle)
        const radBeta = THREE.MathUtils.degToRad(beta - 45); // Assuming holding phone at ~45 deg angle looking at floor
        const radGamma = THREE.MathUtils.degToRad(gamma);

        cameraThreeRef.current.rotation.x = THREE.MathUtils.clamp(radBeta, -Math.PI / 3, Math.PI / 4);
        cameraThreeRef.current.rotation.z = -THREE.MathUtils.clamp(radGamma, -Math.PI / 4, Math.PI / 4);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 1.8); // 1.4m standing eye-level looking downward
    camera.lookAt(0, 0, 0);
    cameraThreeRef.current = camera;

    // 3. Renderer with transparent background overlaying the camera video
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8eb, 1.4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 15;
    dirLight.shadow.camera.left = -3;
    dirLight.shadow.camera.right = 3;
    dirLight.shadow.camera.top = 3;
    dirLight.shadow.camera.bottom = -3;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 5. Subtle AR Ground Grid Helper (visual cue where the garden floor is)
    const grid = new THREE.GridHelper(6, 12, 0x10b981, 0x34d399);
    grid.position.y = 0;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    scene.add(grid);
    groundGridRef.current = grid;

    // Render Loop
    const animate = () => {
      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      const w = canvas.parentElement?.clientWidth || window.innerWidth;
      const h = canvas.parentElement?.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Initial default plant placement on start
    spawnPlantInstance('ar-monstera', 0, 0, scene);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  // Update Sunlight simulation position
  useEffect(() => {
    if (!dirLightRef.current) return;
    const light = dirLightRef.current;
    if (sunlightTime === 'morning') {
      light.position.set(3, 4, 2);
      light.color.setHex(0xfff1d6); // Warm soft morning light
      light.intensity = 1.3;
    } else if (sunlightTime === 'noon') {
      light.position.set(0.5, 6, 0.5);
      light.color.setHex(0xffffff); // Overhead crisp midday light
      light.intensity = 1.7;
    } else {
      light.position.set(-3.5, 2.5, 1.5);
      light.color.setHex(0xffc58d); // Golden hour angled evening sunset
      light.intensity = 1.5;
    }
  }, [sunlightTime]);

  // Spawn a plant in the Three.js scene
  const spawnPlantInstance = (plantDefId: string, posX: number = 0, posZ: number = 0, targetScene?: THREE.Scene) => {
    const scene = targetScene || sceneRef.current;
    if (!scene) return;

    const def = AR_PLANT_CATALOGUE.find(p => p.id === plantDefId) || AR_PLANT_CATALOGUE[0];
    const group = def.createModel();

    group.position.set(posX, 0, posZ);
    group.scale.set(1, 1, 1);
    scene.add(group);

    const newInst: PlacedPlantInstance = {
      id: `plant-inst-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      plantDefId: def.id,
      name: def.name,
      group,
      scale: 1.0,
      rotationY: 0,
      position: { x: posX, y: 0, z: posZ },
      baseHeightMeters: def.defaultHeightMeters,
      baseWidthMeters: def.defaultWidthMeters,
    };

    setPlacedPlants(prev => [...prev, newInst]);
    setActiveInstanceId(newInst.id);
  };

  // Handle tap on camera canvas to place or move plant
  const handleCanvasTap = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraThreeRef.current || !sceneRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    mouseVecRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseVecRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseVecRef.current, cameraThreeRef.current);
    const intersectPoint = new THREE.Vector3();
    const hit = raycasterRef.current.ray.intersectPlane(groundPlaneRef.current, intersectPoint);

    if (hit) {
      // If we have an active plant, move it here; otherwise place a new one!
      if (activeInstanceId) {
        const target = placedPlants.find(p => p.id === activeInstanceId);
        if (target) {
          target.group.position.set(intersectPoint.x, 0, intersectPoint.z);
          target.position = { x: intersectPoint.x, y: 0, z: intersectPoint.z };
          setPlacedPlants([...placedPlants]);
        }
      } else {
        spawnPlantInstance(selectedCatalogueId, intersectPoint.x, intersectPoint.z);
      }
    }
  };

  // Adjust active plant scale
  const handleScaleChange = (scaleValue: number) => {
    if (!activeInstanceId) return;
    const target = placedPlants.find(p => p.id === activeInstanceId);
    if (!target) return;

    target.scale = scaleValue;
    target.group.scale.set(scaleValue, scaleValue, scaleValue);
    setPlacedPlants([...placedPlants]);
  };

  // Rotate active plant
  const handleRotate = () => {
    if (!activeInstanceId) return;
    const target = placedPlants.find(p => p.id === activeInstanceId);
    if (!target) return;

    target.rotationY = (target.rotationY + Math.PI / 4) % (Math.PI * 2);
    target.group.rotation.y = target.rotationY;
    setPlacedPlants([...placedPlants]);
  };

  // Remove active plant from scene
  const handleRemoveActivePlant = () => {
    if (!activeInstanceId || !sceneRef.current) return;
    const target = placedPlants.find(p => p.id === activeInstanceId);
    if (target) {
      sceneRef.current.remove(target.group);
      setPlacedPlants(prev => prev.filter(p => p.id !== activeInstanceId));
      setActiveInstanceId(null);
    }
  };

  // Clear all plants from scene
  const handleClearAll = () => {
    if (!sceneRef.current) return;
    placedPlants.forEach(p => sceneRef.current?.remove(p.group));
    setPlacedPlants([]);
    setActiveInstanceId(null);
  };

  // Capture Photo Snapshot combining live video and WebGL overlay
  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = canvasRef.current.width;
    snapCanvas.height = canvasRef.current.height;
    const ctx = snapCanvas.getContext('2d');
    if (!ctx) return;

    // Draw video background if available
    if (hasCameraStream) {
      ctx.drawImage(videoRef.current, 0, 0, snapCanvas.width, snapCanvas.height);
    } else {
      // Draw garden garden backdrop
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, snapCanvas.width, snapCanvas.height);
    }

    // Overlay Three.js 3D rendered plants
    ctx.drawImage(canvasRef.current, 0, 0, snapCanvas.width, snapCanvas.height);

    // Add watermark
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('🌾 Nông Trợ Xanh AI • Ướm Vườn AR', 30, snapCanvas.height - 35);

    const dataUrl = snapCanvas.toDataURL('image/jpeg', 0.92);
    setCapturedSnapshot(dataUrl);
  };

  const activePlant = placedPlants.find(p => p.id === activeInstanceId);
  const currentHeightCm = activePlant
    ? Math.round(activePlant.baseHeightMeters * activePlant.scale * 100)
    : 85;
  const currentWidthCm = activePlant
    ? Math.round(activePlant.baseWidthMeters * activePlant.scale * 100)
    : 65;

  return (
    <div className="relative w-full h-[calc(100vh-120px)] min-h-[580px] bg-zinc-950 overflow-hidden select-none flex flex-col justify-between">
      {/* 1. Live Camera Feed Video Element (Background) */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-300 ${
          hasCameraStream ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Fallback Garden Realistic Backdrop if Camera Disabled or Denied */}
      {!hasCameraStream && (
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-sky-950/80 via-emerald-950/70 to-zinc-950 flex items-center justify-center pointer-events-none">
          <div className="text-center p-6 space-y-2 opacity-80">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-pulse">
              <CameraOff className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-zinc-200">
              {language === 'en' ? 'Simulated Garden Space Backdrop' : 'Chế Độ Giả Lập Không Gian Vườn AR'}
            </p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {cameraError || 'Đang sử dụng sàn 3D mô phỏng ban công & sân vườn để bạn tự do ướm thử cây trồng.'}
            </p>
          </div>
        </div>
      )}

      {/* 2. Three.js Transparent AR Overlay Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasTap}
        onTouchEnd={handleCanvasTap}
        className="absolute inset-0 w-full h-full z-10 cursor-crosshair touch-none"
      />

      {/* 3. Top HUD: Status, Sensors, Sunlight, Camera Controls */}
      <div className="relative z-20 p-3 sm:p-4 flex items-center justify-between gap-2 pointer-events-auto">
        {/* Sensor & Level HUD */}
        <div className="flex items-center gap-2">
          {onBackToGarden && (
            <button
              onClick={onBackToGarden}
              className="px-3 py-1.5 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors"
              title="Quay lại danh sách Vườn Cây"
            >
              <span>← {language === 'en' ? 'Back' : 'Vườn'}</span>
            </button>
          )}
          <div className="px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md text-white border border-white/10 text-xs font-semibold flex items-center gap-2 shadow-lg">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>{Math.round(orientationData.alpha)}°</span>
            <span className="text-zinc-500">|</span>
            <span className="text-emerald-300">Nghiêng: {Math.round(orientationData.beta)}°</span>
          </div>

          {!hasSensorPermission && (
            <button
              onClick={requestSensorPermission}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
            >
              <span>Bật Cảm Biến</span>
            </button>
          )}
        </div>

        {/* Sunlight Direction Simulation */}
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-2xl border border-white/10 text-xs text-white">
          <button
            onClick={() => setSunlightTime('morning')}
            className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
              sunlightTime === 'morning' ? 'bg-amber-500 text-amber-950' : 'text-zinc-300 hover:text-white'
            }`}
            title="Nắng sớm (Bóng đổ dài sang Tây)"
          >
            🌅 Sáng
          </button>
          <button
            onClick={() => setSunlightTime('noon')}
            className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
              sunlightTime === 'noon' ? 'bg-amber-400 text-amber-950' : 'text-zinc-300 hover:text-white'
            }`}
            title="Nắng trưa (Bóng đổ đứng gốc)"
          >
            ☀️ Trưa
          </button>
          <button
            onClick={() => setSunlightTime('afternoon')}
            className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
              sunlightTime === 'afternoon' ? 'bg-orange-500 text-white' : 'text-zinc-300 hover:text-white'
            }`}
            title="Nắng chiều (Bóng đổ chếch sang Đông)"
          >
            🌇 Chiều
          </button>
        </div>

        {/* Top Right: Camera Switch & Help */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))}
            className="p-2.5 rounded-2xl bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 transition-colors cursor-pointer"
            title="Đổi camera trước / sau"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2.5 rounded-2xl bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 transition-colors cursor-pointer"
            title="Hướng dẫn sử dụng AR"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Active Plant Real-Time Dimension Badge & Placement Guide */}
      <div className="relative z-20 px-4 pointer-events-none flex items-center justify-between">
        {activePlant ? (
          <div className="bg-black/70 backdrop-blur-md border border-emerald-500/40 px-3.5 py-2 rounded-2xl text-white text-xs space-y-0.5 shadow-xl pointer-events-auto">
            <div className="flex items-center gap-2 font-extrabold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{activePlant.name}</span>
            </div>
            <div className="text-[11px] text-zinc-300">
              Kích thước thực tế: <strong>Cao {currentHeightCm} cm</strong> • <strong>Tán rộng {currentWidthCm} cm</strong>
            </div>
          </div>
        ) : (
          <div className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-zinc-300 text-xs border border-white/10 pointer-events-auto flex items-center gap-2">
            <Move className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Chạm vào mặt sàn / ban công trên camera để đặt cây vào vườn</span>
          </div>
        )}

        {placedPlants.length > 0 && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa hết ({placedPlants.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Bottom Controls: Plant Palette & AR Manipulation Bar */}
      <div className="relative z-20 p-3 sm:p-4 space-y-3 pointer-events-auto">
        {/* Active Plant Transformation Controls (Slider + Rotate + Delete) */}
        {activePlant && (
          <div className="bg-black/75 backdrop-blur-xl border border-white/15 rounded-3xl p-3 sm:p-4 text-white shadow-2xl flex flex-wrap items-center justify-between gap-3">
            {/* Scale Slider */}
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cỡ cây:</span>
              </span>
              <input
                type="range"
                min="0.4"
                max="2.2"
                step="0.05"
                value={activePlant.scale}
                onChange={e => handleScaleChange(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-extrabold text-emerald-300 w-12 text-right">
                {Math.round(activePlant.scale * 100)}%
              </span>
            </div>

            {/* Rotation & Delete Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRotate}
                className="px-3 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Xoay cây 45 độ đón nắng"
              >
                <RotateCw className="w-4 h-4 text-emerald-400" />
                <span>Xoay 45°</span>
              </button>

              <button
                onClick={handleRemoveActivePlant}
                className="p-2 rounded-2xl bg-zinc-800 hover:bg-rose-900/60 text-zinc-300 hover:text-rose-400 transition-colors cursor-pointer"
                title="Xóa cây này khỏi vị trí"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Plant Selection Ribbon */}
        <div className="bg-black/80 backdrop-blur-xl border border-white/15 rounded-3xl p-2.5 sm:p-3 shadow-2xl space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chọn cây cảnh để ướm thử vào không gian:</span>
            </span>

            {/* Snap Photo Button */}
            <button
              onClick={handleCaptureSnapshot}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:opacity-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Chụp Ảnh Vườn</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {AR_PLANT_CATALOGUE.map(plant => (
              <button
                key={plant.id}
                onClick={() => {
                  setSelectedCatalogueId(plant.id);
                  spawnPlantInstance(plant.id, 0, 0);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCatalogueId === plant.id
                    ? 'bg-emerald-600/90 text-white border-emerald-400 shadow-md font-bold'
                    : 'bg-zinc-900/80 text-zinc-300 border-white/10 hover:bg-zinc-800'
                }`}
              >
                <span className="text-xl">{plant.icon}</span>
                <div className="text-left">
                  <div className="text-xs">{plant.name.split('(')[0]}</div>
                  <div className="text-[10px] text-zinc-400 font-normal">
                    {plant.defaultHeightMeters * 100}cm • {plant.category}
                  </div>
                </div>
              </button>
            ))}

            {/* Quick import from user's current garden */}
            {userGardenPlants.slice(0, 3).map(up => (
              <button
                key={up.id}
                onClick={() => {
                  // Spawn best matching procedural model based on category
                  let modelKey = 'ar-monstera';
                  if (up.category === 'vegetable') modelKey = 'ar-tomato';
                  if (up.category === 'flower') modelKey = 'ar-rose';
                  if (up.category === 'bonsai') modelKey = 'ar-bonsai';
                  spawnPlantInstance(modelKey, 0.4, 0);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-zinc-900/80 text-zinc-300 border border-emerald-500/30 hover:bg-zinc-800 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <span className="text-xl">🌿</span>
                <div className="text-left">
                  <div className="text-xs">{up.name}</div>
                  <div className="text-[10px] text-emerald-400 font-normal">Từ Vườn Của Bạn</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Snapshot Preview Modal */}
      {capturedSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-100 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <span>Ảnh Chụp Ướm Thử Vườn AR</span>
              </h3>
              <button
                onClick={() => setCapturedSnapshot(null)}
                className="p-1 rounded-xl text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-zinc-800 max-h-[50vh] flex items-center justify-center bg-black">
              <img
                src={capturedSnapshot}
                alt="AR Garden Capture"
                className="w-full h-auto object-contain max-h-[50vh]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={capturedSnapshot}
                download="vuon-cay-ar-nong-tro-xanh.jpg"
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải Ảnh Về Máy</span>
              </a>

              <button
                onClick={() => {
                  alert('✓ Đã lưu hình ảnh vườn AR vào nhật ký canh tác của bạn!');
                  setCapturedSnapshot(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Lưu Vào Vườn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AR Guidance Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-zinc-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-extrabold text-base">Hướng Dẫn Ướm Cây AR</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-zinc-300">
              <div className="flex gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </span>
                <p>
                  <strong>Quét mặt sàn / ban công:</strong> Hướng camera xuống sàn nhà, góc ban công hoặc khoảng đất trong vườn.
                </p>
              </div>

              <div className="flex gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </span>
                <p>
                  <strong>Chạm để đặt cây:</strong> Chạm vào bất kỳ điểm nào trên màn hình camera để đặt chậu cây 3D vào đúng vị trí đó.
                </p>
              </div>

              <div className="flex gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </span>
                <p>
                  <strong>Kéo thanh kích thước & Xoay:</strong> Điều chỉnh tỷ lệ phần trăm để xem cây lúc nhỏ (50%) hay lúc trưởng thành (150-200%), kiểm tra xem có vừa vặn ban công không.
                </p>
              </div>

              <div className="flex gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  4
                </span>
                <p>
                  <strong>Mô phỏng bóng nắng:</strong> Chuyển giữa Nắng Sáng, Nắng Trưa, Nắng Chiều để xem bóng râm đổ hướng nào, tránh che khuất các cây khác!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
            >
              Đã hiểu, Bắt đầu trải nghiệm!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
