import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, ShieldCheck, Eye, RefreshCw, Cpu, Skull, Terminal, Play, Square, Settings } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';
import { playDigitalSound } from '../lib/sounds';

interface ReconComponentProps {
  onLogTriggered?: (log: { id: string; time: string; level: 'INFO' | 'WARN' | 'CRIT'; message: string }) => void;
}

export default function ReconComponent({ onLogTriggered }: ReconComponentProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectIntervalRef = useRef<number | null>(null);

  // Calibration and verification states
  const [isInitializing, setIsInitializing] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelsLoadingError, setModelsLoadingError] = useState<string | null>(null);
  const [cameraState, setCameraState] = useState<'off' | 'starting' | 'active' | 'denied'>('off');
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);

  // Refs for tracking verification time
  const faceDetectedSinceRef = useRef<number | null>(null);
  const simulationFrameRef = useRef<number | null>(null);

  // Initialize and load face-api models from /models
  useEffect(() => {
    let active = true;

    async function loadModels() {
      setIsInitializing(true);
      try {
        console.log("[Recon Loader] Initializing neural configurations...");
        // Wait, loading from /models which has been synchronized on server boot
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        if (active) {
          console.log("[Recon Loader] SsdMobilenetV1 & FaceLandmark68 weight systems fully mapped.");
          setModelLoaded(true);
        }
      } catch (err: any) {
        console.warn("[Recon Loader] Direct public/models load encountered a latency bounds error, applying fallback cdn mapping...", err);
        try {
          // Fallback loader directly fetching weights from jsDelivr to handle static deployment configurations
          const cdnPath = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
          await faceapi.nets.ssdMobilenetv1.loadFromUri(cdnPath);
          await faceapi.nets.faceLandmark68Net.loadFromUri(cdnPath);
          if (active) {
            console.log("[Recon Loader] Successfully resolved files from cdn weights secondary gateway.");
            setModelLoaded(true);
          }
        } catch (fallbackErr: any) {
          console.error("[Recon Loader] Absolute fallback loads collapsed:", fallbackErr);
          if (active) {
            setModelsLoadingError(fallbackErr?.message || "Weights loading failed. Please verify neural stream online.");
          }
        }
      } finally {
        if (active) setIsInitializing(false);
      }
    }

    loadModels();

    return () => {
      active = false;
      cleanupVideo();
    };
  }, []);

  // Cleanup help to close active stream tracks
  const cleanupVideo = () => {
    if (detectIntervalRef.current) {
      window.clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (simulationFrameRef.current) {
      window.cancelAnimationFrame(simulationFrameRef.current);
      simulationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Failed stopping media stream track:", e);
        }
      });
      streamRef.current = null;
    }
    setCameraState('off');
    setFaceDetected(false);
    setVerificationProgress(0);
    setIsVerifying(false);
    faceDetectedSinceRef.current = null;
  };

  // Start real webcam stream
  const startCamera = async () => {
    cleanupVideo();
    setIsSimulating(false);
    setCameraState('starting');
    playDigitalSound('click');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraState('active');
            playDigitalSound('ping');
            startDetectionLoop();
          }).catch(err => {
            console.error("Video play promise rejected:", err);
            setCameraState('denied');
          });
        };
      }
    } catch (err) {
      console.error("Camera access request refused or restricted:", err);
      setCameraState('denied');
      playDigitalSound('click');
    }
  };

  // Automated face detection interval cycle
  const startDetectionLoop = () => {
    if (detectIntervalRef.current) window.clearInterval(detectIntervalRef.current);

    detectIntervalRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.paused || video.ended) return;

      try {
        const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
        if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
          canvas.width = displaySize.width;
          canvas.height = displaySize.height;
          faceapi.matchDimensions(canvas, displaySize);
        }

        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.45 })
        ).withFaceLandmarks();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        if (resizedDetections.length > 0) {
          setFaceDetected(true);
          const primaryFace = resizedDetections[0];
          setDetectionConfidence(Math.round(primaryFace.detection.score * 100));

          // Draw custom neon hacker HUD boundaries
          drawNeonFaceHUD(ctx, primaryFace);

          // Chronological check for identity verification (>2 seconds)
          if (!faceDetectedSinceRef.current) {
            faceDetectedSinceRef.current = Date.now();
            setIsVerifying(true);
          } else {
            const duration = Date.now() - faceDetectedSinceRef.current;
            const progress = Math.min(100, Math.floor((duration / 2000) * 100));
            setVerificationProgress(progress);

            if (duration >= 2000 && !alertTriggered) {
              triggerIdentityRelease();
            }
          }
        } else {
          setFaceDetected(false);
          setDetectionConfidence(0);
          setVerificationProgress(0);
          setIsVerifying(false);
          faceDetectedSinceRef.current = null;
        }
      } catch (err) {
        console.warn("Detection cycle skipped due to initialization race:", err);
      }
    }, 120);
  };

  // High-fidelity Neon hacker-style vector face drawing
  const drawNeonFaceHUD = (ctx: CanvasRenderingContext2D, prediction: any) => {
    const { box } = prediction.detection;
    const landmarks = prediction.landmarks;

    // Save context
    ctx.save();

    // Box dimensions
    const x = box.x;
    const y = box.y;
    const w = box.width;
    const h = box.height;

    // Draw Cyber Neon Bracket Box
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2.5;

    // Corner brackets
    const bracketLen = Math.min(w * 0.25, 40);
    // Top Left
    ctx.beginPath();
    ctx.moveTo(x, y + bracketLen);
    ctx.lineTo(x, y);
    ctx.lineTo(x + bracketLen, y);
    ctx.stroke();

    // Top Right
    ctx.beginPath();
    ctx.moveTo(x + w, y + bracketLen);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - bracketLen, y);
    ctx.stroke();

    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(x, y + h - bracketLen);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + bracketLen, y + h);
    ctx.stroke();

    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(x + w, y + h - bracketLen);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w - bracketLen, y + h);
    ctx.stroke();

    // Thin cyan center crosshairs inside box
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 15, y + h / 2);
    ctx.lineTo(x + w / 2 + 15, y + h / 2);
    ctx.moveTo(x + w / 2, y + h / 2 - 15);
    ctx.lineTo(x + w / 2, y + h / 2 + 15);
    ctx.stroke();

    // Draw Face Landmarks in glowing neon details
    if (landmarks) {
      const positions = landmarks.positions;
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      
      positions.forEach((pt: any) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Highlight left eye & right eye with circles
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // Red target outline for eyes
      ctx.lineWidth = 1;
      
      if (leftEye.length > 0) {
        const lx = leftEye.reduce((sum: number, p: any) => sum + p.x, 0) / leftEye.length;
        const ly = leftEye.reduce((sum: number, p: any) => sum + p.y, 0) / leftEye.length;
        ctx.beginPath();
        ctx.arc(lx, ly, 12, 0, 2 * Math.PI);
        ctx.stroke();
      }

      if (rightEye.length > 0) {
        const rx = rightEye.reduce((sum: number, p: any) => sum + p.x, 0) / rightEye.length;
        const ry = rightEye.reduce((sum: number, p: any) => sum + p.y, 0) / rightEye.length;
        ctx.beginPath();
        ctx.arc(rx, ry, 12, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    // Diagnostics overlays text on the box
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`TARGET: HUMAN_SUBJECT_A`, x + 5, y - 25);
    ctx.fillText(`CONFIDENCE: ${Math.round(prediction.detection.score * 100)}%`, x + 5, y - 10);

    ctx.restore();
  };

  // High-fidelity fallback simulated scan frame
  const startSimulation = () => {
    cleanupVideo();
    setIsSimulating(true);
    setCameraState('active');
    setAlertTriggered(false);
    playDigitalSound('whir');

    let startSimTime = Date.now();

    const animateSim = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw simulated matrix static scanning bars
      const w = canvas.width = 640;
      const h = canvas.height = 480;
      ctx.clearRect(0, 0, w, h);

      // Camera feed simulate background
      ctx.fillStyle = 'rgba(10, 8, 14, 0.85)';
      ctx.fillRect(0, 0, w, h);

      // Tech details grid backplane
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let i = 0; i < w; i += gridSize) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      }
      for (let j = 0; j < h; j += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke();
      }

      // Live sweeping scanline
      const elapsed = Date.now() - startSimTime;
      const sweepY = (elapsed / 4) % h;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, sweepY);
      ctx.lineTo(w, sweepY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw virtual futuristic green-cyan skull or head outline mesh in center
      const headX = w / 2;
      const headY = h / 2 - 20;
      const boxW = 200;
      const boxH = 240;

      // Simulated detection score has noise
      const simConfidence = 96 + Math.floor(Math.sin(elapsed / 200) * 3);
      setDetectionConfidence(simConfidence);

      const prediction = {
        detection: {
          score: simConfidence / 100,
          box: { x: headX - boxW / 2, y: headY - boxH / 2, width: boxW, height: boxH }
        },
        landmarks: {
          positions: [
            // Chin
            { x: headX, y: headY + 110 }, { x: headX - 30, y: headY + 100 }, { x: headX + 30, y: headY + 100 },
            { x: headX - 60, y: headY + 80 }, { x: headX + 60, y: headY + 80 },
            // Left Brow
            { x: headX - 50, y: headY - 50 }, { x: headX - 30, y: headY - 55 }, { x: headX - 10, y: headY - 52 },
            // Right Brow
            { x: headX + 10, y: headY - 52 }, { x: headX + 30, y: headY - 55 }, { x: headX + 50, y: headY - 50 },
            // Nose bridge & tip
            { x: headX, y: headY - 30 }, { x: headX, y: headY - 10 }, { x: headX, y: headY + 10 }, { x: headX, y: headY + 30 },
            { x: headX - 15, y: headY + 30 }, { x: headX + 15, y: headY + 30 },
            // Left Eye
            { x: headX - 35, y: headY - 20 }, { x: headX - 25, y: headY - 20 },
            // Right Eye
            { x: headX + 25, y: headY - 20 }, { x: headX + 35, y: headY - 20 },
            // Outer Mouth
            { x: headX - 30, y: headY + 60 }, { x: headX, y: headY + 50 }, { x: headX + 30, y: headY + 60 },
            { x: headX, y: headY + 70 },
          ],
          getLeftEye: () => [{ x: headX - 30, y: headY - 20 }],
          getRightEye: () => [{ x: headX + 30, y: headY - 20 }]
        }
      };

      setFaceDetected(true);
      drawNeonFaceHUD(ctx, prediction);

      // Simulation clock calculations to support 2-second hold trigger
      const currentElapsed = Date.now() - startSimTime;
      const progress = Math.min(100, Math.floor((currentElapsed / 2000) * 100));
      setVerificationProgress(progress);
      setIsVerifying(true);

      if (currentElapsed >= 2000) {
        if (!alertTriggered) {
          triggerIdentityRelease();
        }
      }

      simulationFrameRef.current = requestAnimationFrame(animateSim);
    };

    simulationFrameRef.current = requestAnimationFrame(animateSim);
  };

  // Trigger main identity confirmed sequence & logs broadcast
  const triggerIdentityRelease = () => {
    setAlertTriggered(true);
    setVerificationProgress(100);
    setIsVerifying(false);
    playDigitalSound('ping');

    // Create system alert logs
    const logItem = {
      id: `rc-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour12: false }),
      level: 'CRIT' as const,
      message: '[IDENTITY_CONFIRMED: ARCHITECT_ANSH_SINGH]'
    };

    // Store in Session storage so other modules check it
    sessionStorage.setItem("mainframe_recon_bypass", "ACTIVE_ARCHITECT_RECON_TRUE");
    window.dispatchEvent(new Event('recon-override-registered'));

    // Emit standard Neural Log custom event to update globally synchronized items (like home feed marquee)
    window.dispatchEvent(new CustomEvent('neural-log', {
      detail: {
        text: 'IDENTITY_CONFIRMED: ARCHITECT_ANSH_SINGH',
        source: 'RECON-HUD-ALPHA',
        timestamp: logItem.time
      }
    }));

    // Cascade local dispatch
    if (onLogTriggered) {
      onLogTriggered(logItem);
    }
  };

  const resetBypassProtocol = () => {
    setAlertTriggered(false);
    setVerificationProgress(0);
    setIsVerifying(false);
    faceDetectedSinceRef.current = null;
    sessionStorage.removeItem("mainframe_recon_bypass");
    playDigitalSound('click');
    if (isSimulating) {
      startSimulation();
    } else {
      startCamera();
    }
  };

  return (
    <div className="neural-glass p-6 rounded-3xl relative overflow-hidden border-[0.5px] border-white/10 flex flex-col gap-5 w-full text-white">
      {/* Absolute Aesthetic Lines */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-60" />
      <div className="absolute bottom-2 right-4 text-[7px] font-mono text-zinc-600 select-none pointer-events-none uppercase tracking-widest">
        UNIT: RECON_RESONATOR_MODEL_S // DECRYPT: SYNCED
      </div>

      {/* Header telemetry blocks */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <span className="text-[8px] font-mono font-black text-[#00f0ff] uppercase tracking-[0.25em] flex items-center gap-1">
            <span className="w-1 h-1 bg-[#00f0ff] rounded-full animate-ping" />
            VANGUARD NEURAL RECONNAISSANCE GATES
          </span>
          <h3 className="text-sm font-bold font-sans uppercase tracking-tight text-white flex items-center gap-2 mt-1">
            <Eye size={15} className="text-[#00f0ff]" />
            Optic Matrix Reconnaissance
          </h3>
        </div>
        
        {/* State badges */}
        <div className="flex items-center gap-2">
          {isInitializing ? (
            <span className="text-[8px] font-mono text-amber-400 bg-amber-400/5 border border-amber-400/20 px-2 py-0.5 rounded uppercase flex items-center gap-1">
              <RefreshCw size={10} className="animate-spin" /> Load Nets...
            </span>
          ) : modelLoaded ? (
            <span className="text-[8px] font-mono text-emerald-400 bg-emerald-400/5 border border-emerald-400/15 px-2 py-0.5 rounded uppercase flex items-center gap-1 select-none">
              <ShieldCheck size={9} /> Models Armed
            </span>
          ) : (
            <span className="text-[8px] font-mono text-red-500 bg-red-500/5 border border-red-500/15 px-2 py-0.5 rounded uppercase italic">
              Models Stalled
            </span>
          )}

          <span className={`text-[8px] font-mono px-2 py-0.5 rounded uppercase select-none tracking-wider ${
            cameraState === 'active' 
              ? 'text-cyan-400 bg-cyan-400/5 border border-cyan-400/15 animate-pulse'
              : 'text-zinc-500 bg-zinc-800/10 border border-zinc-800/20'
          }`}>
            FEED: {cameraState.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main interactive segment stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Video Viewfinder Container */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-3 relative">
          <div className="aspect-video w-full bg-black/85 border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Ambient inner scanning guidelines */}
            <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-2xl z-10" />
            <div className="absolute top-4 left-4 border-l border-t border-white/10 w-4 h-4 rounded-tl pointer-events-none z-10" />
            <div className="absolute top-4 right-4 border-r border-t border-white/10 w-4 h-4 rounded-tr pointer-events-none z-10" />
            <div className="absolute bottom-4 left-4 border-l border-b border-white/10 w-4 h-4 rounded-bl pointer-events-none z-10" />
            <div className="absolute bottom-4 right-4 border-r border-b border-white/10 w-4 h-4 rounded-br pointer-events-none z-10" />

            {/* Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover transform scale-x-[-1] ${cameraState === 'active' && !isSimulating ? 'block' : 'hidden'}`}
            />

            {/* Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20"
            />

            {/* Simulated Signal Viewport static noise */}
            {isSimulating && (
              <div className="absolute inset-0 w-full h-full bg-cyan-950/5 pointer-events-none z-5" />
            )}

            {/* Feed Status Standby Overlay */}
            {cameraState === 'off' && (
              <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-950/60 border border-[#00f0ff]/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.05)] animate-pulse">
                  <Camera size={26} className="text-[#00f0ff]/60" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#00f0ff]">RECON_VIEWFINDER_IDLE</p>
                  <p className="text-[9px] text-[#A8A8B2] font-mono leading-relaxed lowercase">
                    Arm face-api models and initialize direct peer camera streams or trigger artificial signal loop simulation to evaluate opto-cybernetic recognition coordinates.
                  </p>
                </div>
              </div>
            )}

            {cameraState === 'starting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95">
                <RefreshCw size={24} className="text-[#00f0ff] animate-spin mb-3" />
                <p className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest animate-pulse">Establishing camera handshake...</p>
              </div>
            )}

            {cameraState === 'denied' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 p-6 text-center space-y-3">
                <Skull size={32} className="text-red-500 animate-bounce" />
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-red-500 tracking-wider">▲ CAM_ACCESS_RESTRICTED</p>
                  <p className="text-[9px] text-zinc-500 font-mono max-w-xs lowercase leading-relaxed">
                    Browser security protocols filtered frame permissions. Please configure manual security overrides inside the settings menu or utilize the artificial signal simulator to run validation tests.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startSimulation}
                  className="px-4 py-2 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10 rounded bg-[#00f0ff]/5 text-[9px] font-mono uppercase tracking-widest font-black transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                >
                  Launch Simulated Scan
                </button>
              </div>
            )}

            {/* Neural verification overlay bar */}
            {isVerifying && (
              <div className="absolute bottom-5 inset-x-6 bg-[#0B0A0E]/90 border border-[#00f0ff]/30 rounded-xl p-3 backdrop-blur shadow-2xl z-40 animate-fade-in flex flex-col gap-2">
                <div className="flex items-center justify-between text-[8px] font-mono text-[#00f0ff] font-black uppercase tracking-widest">
                  <span>▲ CALIBRATING TARGET ID WEIGHT MATRIX</span>
                  <span>{verificationProgress}% SYNC_ETA</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-[#00f0ff] shadow-[0_0_8px_#00f0ff] transition-all duration-100" 
                    style={{ width: `${verificationProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Command controls node parameters */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 justify-between">
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-black uppercase text-zinc-400 pb-2 border-b border-white/5 tracking-wider select-none">
              MATRIX CONTROL DECK
            </h4>

            {/* Control buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isInitializing || !modelLoaded}
                onClick={cameraState === 'active' && !isSimulating ? cleanupVideo : startCamera}
                className={`py-3 rounded-xl font-mono text-[9px] uppercase tracking-widest font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  cameraState === 'active' && !isSimulating
                    ? 'bg-red-950/10 border-red-500/25 text-red-400 hover:bg-red-950/20'
                    : 'bg-black/60 border-white/5 hover:border-[#00f0ff] text-zinc-300 hover:text-white hover:bg-[#00f0ff]/5'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {cameraState === 'active' && !isSimulating ? (
                  <>
                    <Square size={10} />
                    <span>Kill Feed</span>
                  </>
                ) : (
                  <>
                    <Camera size={10} />
                    <span>Run Camera</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isInitializing || !modelLoaded}
                onClick={isSimulating ? cleanupVideo : startSimulation}
                className={`py-3 rounded-xl font-mono text-[9px] uppercase tracking-widest font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  isSimulating
                    ? 'bg-red-950/10 border-red-500/25 text-red-400 hover:bg-red-950/20'
                    : 'bg-black/60 border-white/5 hover:border-[#00f0ff] text-zinc-300 hover:text-white hover:bg-[#00f0ff]/5'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isSimulating ? (
                  <>
                    <Square size={10} />
                    <span>Stop Simul</span>
                  </>
                ) : (
                  <>
                    <Play size={10} className="fill-current text-[#00f0ff]" />
                    <span>Simulate Scan</span>
                  </>
                )}
              </button>
            </div>

            {/* Dynamic details overlay block */}
            <div className="bg-black/45 border border-white/5 rounded-xl p-4 font-mono text-[9.5px] uppercase text-zinc-400 space-y-2">
              <div className="flex justify-between items-center select-none">
                <span className="text-zinc-600">FACE_DETECTION:</span>
                <span className={faceDetected ? 'text-[#00f0ff] font-bold' : 'text-zinc-500'}>
                  {faceDetected ? 'TARGET_DETECTED' : 'AWAITING_TARGET'}
                </span>
              </div>
              <div className="flex justify-between items-center select-none">
                <span className="text-zinc-600">SIGNAL_CONFIDENCE:</span>
                <span className={faceDetected ? 'text-[#00f0ff]' : 'text-zinc-500'}>
                  {faceDetected ? `${detectionConfidence}%` : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center select-none">
                <span className="text-zinc-600">SECURITY_GATEWAY:</span>
                <span className={alertTriggered ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                  {alertTriggered ? 'AUTHENTICATED' : 'LOCKED'}
                </span>
              </div>
            </div>

            {/* Neural outputs alert stack */}
            <AnimatePresence>
              {alertTriggered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-4 text-center space-y-2 animate-fade-in relative overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-emerald-500/30" />
                  
                  <ShieldCheck className="text-emerald-400 mx-auto animate-pulse" size={32} />
                  
                  <div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase block tracking-[0.2em]">
                      ▲ [ACCESS_GRANTED: SYSTEM_ARCHITECT]
                    </span>
                    <p className="text-[10px] text-zinc-300 font-mono uppercase font-black leading-relaxed mt-1">
                      [IDENTITY_CONFIRMED: ARCHITECT_ANSH_SINGH]
                    </p>
                    <p className="text-[7.5px] text-zinc-500 text-center font-mono leading-relaxed lowercase mt-1.5 select-none">
                      bypass authentication keys unlocked. Session terminal logs printed. Core operator tokens successfully dispatched.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-white/5 mt-2">
                    <button
                      type="button"
                      onClick={resetBypassProtocol}
                      className="w-full bg-white/5 border border-white/10 text-white rounded py-1.5 text-[8.5px] font-mono tracking-widest uppercase hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                    >
                      Sweep & Re-scan
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertTriggered(false)}
                      className="w-full bg-emerald-500 text-black py-1.5 text-[8.5px] font-mono rounded font-black tracking-widest uppercase hover:bg-emerald-600 transition-all cursor-pointer"
                    >
                      Maintain Gateway
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-white/5 pt-4 text-[8px] font-mono text-zinc-500 uppercase leading-relaxed select-none tracking-normal">
            ▲ NOTE: Face-api is powered by MobileNet convolution vectors loaded to memory. Standard calibration requires the webcam target to stay centered in frame during matrix overlay calibration mapping.
          </div>
        </div>

      </div>
    </div>
  );
}
