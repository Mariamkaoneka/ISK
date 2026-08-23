import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { LanguageMode } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  languageMode: LanguageMode;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  languageMode,
}) => {
  const isSwahili = languageMode === 'sw' || languageMode === 'both';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setIsLoadingCamera(true);
    setCameraError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        isSwahili
          ? 'Kamera haikuweza kufunguka. Tafadhali ruhusu kamera kwenye kivinjari chako au tumia kupakia picha.'
          : 'Could not access camera. Please allow camera permissions in your browser or upload an image instead.'
      );
    } finally {
      setIsLoadingCamera(false);
    }
  }, [facingMode, isSwahili, stopStream]);

  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, capturedPhoto, startCamera, stopStream]);

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhoto(dataUrl);
    stopStream();
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
      setCapturedPhoto(null);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border-2 border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1EB53A]/15 text-[#1EB53A] flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {isSwahili ? 'Piga Picha ya Ripoti' : 'Capture Radiology Report Photo'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isSwahili
                  ? 'Weka karatasi ya ripoti au filamu ya eksirei iwe wazi'
                  : 'Align the paper report or scan film inside the frame'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Container */}
        <div className="relative bg-black flex-1 min-h-[300px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-white max-w-sm">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
              <p className="text-sm mb-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100"
              >
                {isSwahili ? 'Jaribu Tena' : 'Retry Camera'}
              </button>
            </div>
          ) : capturedPhoto ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedPhoto}
                alt="Captured Report"
                className="max-h-[380px] max-w-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-[#1EB53A] text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                {isSwahili ? 'Picha Imenaswa' : 'Photo Captured'}
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[380px]"
              />

              {/* Viewfinder Overlay Box */}
              <div className="absolute inset-4 sm:inset-6 pointer-events-none border-2 border-dashed border-[#1EB53A]/70 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-4 border-l-4 border-[#1EB53A] -mt-1 -ml-1 rounded-tl-sm" />
                  <div className="w-6 h-6 border-t-4 border-r-4 border-[#00A3DD] -mt-1 -mr-1 rounded-tr-sm" />
                </div>
                <div className="text-center bg-slate-900/80 text-white text-[11px] font-bold py-1.5 px-4 rounded-full mx-auto backdrop-blur-xs border border-white/20">
                  {isSwahili
                    ? 'Hakikisha maandishi yanasomeka vizuri na mwanga unatosha'
                    : 'Ensure text is clearly readable with adequate lighting'}
                </div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-4 border-l-4 border-[#FCD116] -mb-1 -ml-1 rounded-bl-sm" />
                  <div className="w-6 h-6 border-b-4 border-r-4 border-[#1EB53A] -mb-1 -mr-1 rounded-br-sm" />
                </div>
              </div>

              {isLoadingCamera && (
                <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-white text-xs gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#1EB53A]" />
                  <span>{isSwahili ? 'Inawasha kamera...' : 'Starting camera...'}</span>
                </div>
              )}
            </div>
          )}

          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Controls */}
        <div className="p-4 sm:p-5 bg-white border-t-2 border-slate-100 flex items-center justify-between gap-3">
          {capturedPhoto ? (
            <>
              <button
                id="btn-camera-retake"
                type="button"
                onClick={handleRetake}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {isSwahili ? 'Piga Tena (Retake)' : 'Retake Photo'}
              </button>
              <button
                id="btn-camera-use"
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 px-4 py-3 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                {isSwahili ? 'Tumia Picha Hii' : 'Use This Photo'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5"
                title={isSwahili ? 'Badili kamera ya mbele/nyuma' : 'Switch front/back camera'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{facingMode === 'environment' ? 'Back' : 'Front'}</span>
              </button>

              <button
                id="btn-camera-snap"
                type="button"
                onClick={takeSnapshot}
                disabled={isLoadingCamera || !!cameraError}
                className="px-6 py-3 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#1EB53A]" />
                <span>{isSwahili ? 'Piga Picha Sasa' : 'Capture Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopStream();
                  onClose();
                }}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                {isSwahili ? 'Ghairi' : 'Cancel'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
