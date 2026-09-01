import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Image as ImageIcon, Check } from 'lucide-react';
import Button from './Button';

export const CameraCaptureModal = ({ isOpen, onClose, onCapture }) => {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (back)
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start Camera Stream
  const startCamera = useCallback(async (facing = facingMode) => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 480 },
          height: { ideal: 480 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraError(err.message || 'Live camera stream blocked. Use Phone Camera or Gallery below.');
    }
  }, [facingMode, stream]);

  useEffect(() => {
    let activeStream = null;

    if (isOpen && !capturedPreview) {
      const initCamera = async () => {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 480 },
              height: { ideal: 480 }
            },
            audio: false
          });
          activeStream = mediaStream;
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (err) {
          console.warn('Camera initialization error:', err);
          setCameraError(err.message || 'Camera blocked. Use Phone Camera or Gallery below.');
        }
      };

      initCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen, facingMode, capturedPreview]);

  const handleFlipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  // Capture from live stream
  const handleSnap = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const size = Math.min(video.videoWidth, video.videoHeight) || 360;
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;

      if (facingMode === 'user') {
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setCapturedBlob(file);
          setCapturedPreview(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleConfirm = () => {
    if (capturedBlob) {
      onCapture(capturedBlob);
      handleClose();
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    setCapturedBlob(null);
    startCamera();
  };

  const handleNativeFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedPreview(null);
    setCapturedBlob(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/95 flex flex-col justify-between items-center p-4 overflow-hidden select-none">
      
      {/* Top Header */}
      <div className="w-full max-w-sm flex justify-between items-center py-2 text-white shrink-0">
        <span className="text-xs font-bold uppercase tracking-widest text-[#d4ff00]">Take Member Photo</span>
        <button 
          onClick={handleClose} 
          className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={nativeCameraInputRef} 
        onChange={handleNativeFile} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleNativeFile} 
        accept="image/*" 
        className="hidden" 
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewfinder Circle */}
      <div className="w-full max-w-sm flex flex-col items-center justify-center relative my-auto">
        {capturedPreview ? (
          <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-[#d4ff00] shadow-2xl relative bg-zinc-900">
            <img src={capturedPreview} alt="Captured" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-dashed border-zinc-700 bg-zinc-950 shadow-2xl flex items-center justify-center">
            {cameraError ? (
              <div className="p-3 text-center text-xs text-zinc-400 space-y-1">
                <Camera className="w-6 h-6 text-zinc-600 mx-auto mb-1" />
                <p className="text-[11px] text-zinc-300">Tap below to capture</p>
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            )}
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="w-full max-w-sm space-y-3 pb-8 shrink-0">
        {capturedPreview ? (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={handleRetake} className="py-3 text-xs">
              <RefreshCw className="w-4 h-4" /> RETAKE
            </Button>
            <Button variant="primary" onClick={handleConfirm} className="py-3 text-xs shadow-[0_0_15px_rgba(212,255,0,0.3)]">
              <Check className="w-4 h-4" /> USE PHOTO
            </Button>
          </div>
        ) : (
          <>
            {/* Shutter / Flip Controls */}
            {!cameraError && (
              <div className="flex justify-center items-center gap-6 py-1">
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 active:bg-zinc-800 flex items-center justify-center transition-colors"
                  title="Switch Camera (Front/Back)"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleSnap}
                  className="w-18 h-18 rounded-full border-4 border-zinc-900 bg-[#d4ff00] flex items-center justify-center text-black shadow-[0_0_25px_rgba(212,255,0,0.5)] active:scale-95 transition-all"
                  title="Take Photo"
                >
                  <div className="w-13 h-13 rounded-full border-2 border-black/20 flex items-center justify-center">
                    <Camera className="w-7 h-7 text-black" />
                  </div>
                </button>

                <div className="w-12 h-12" />
              </div>
            )}

            {/* Direct Phone Camera & Gallery Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="py-3 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-100 active:bg-zinc-800 flex items-center justify-center gap-1.5 transition-colors shadow-lg"
              >
                <Camera className="w-4 h-4 text-[#d4ff00]" /> Phone Camera
              </button>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-100 active:bg-zinc-800 flex items-center justify-center gap-1.5 transition-colors shadow-lg"
              >
                <ImageIcon className="w-4 h-4 text-zinc-400" /> Photo Gallery
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default CameraCaptureModal;
