/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Camera, MapPin, UploadCloud, Loader2, X, Check } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MediaCapture({ onMediaCaptured }: { onMediaCaptured: (data: any) => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const [showCamera, setShowCamera] = useState(false);

    const startCamera = async () => {
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch {
            setError("Camera access denied.");
            setShowCamera(false);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
            if (blob) {
                const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                setFile(capturedFile);
                setPreviewUrl(URL.createObjectURL(capturedFile));
                stopCamera();
            }
        }, 'image/jpeg');
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(t => t.stop());
        }
        setShowCamera(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const uploadedFile = e.target.files[0];
            setFile(uploadedFile);
            setPreviewUrl(URL.createObjectURL(uploadedFile));
        }
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation not supported.");
            return;
        }
        navigator.geolocation.getCurrentPosition((position) => {
            setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            setError("");
        }, () => {
            setError("Location permissions required for reporting.");
        });
    };

    const handleSubmit = async () => {
        if (!file || !location) return;
        setIsUploading(true);
        try {
            const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
            const filePath = `reports/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(filePath);
            onMediaCaptured({ imageUrl: publicUrlData.publicUrl, location, timestamp: new Date().toISOString() });
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "Upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="relative w-full max-w-xl mx-auto h-[70vh] md:h-[600px] bg-secondary rounded-[2.5rem] overflow-hidden shadow-2xl border border-border">
            {/* Main View Area */}
            <div className="absolute inset-0 z-0">
                {!previewUrl && !showCamera && (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                            <Camera className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Capture Evidence</h2>
                        <p className="text-muted-foreground text-sm max-w-xs">Take a clear photo of the civic issue to begin the automated report.</p>
                        <div className="flex gap-4 w-full pt-4">
                            <button onClick={startCamera} className="primary-action flex-1">
                                <Camera className="w-5 h-5" /> Open Camera
                            </button>
                            <label className="flex-1 h-12 flex items-center justify-center bg-secondary border border-border rounded-2xl cursor-pointer hover:bg-muted transition-colors font-medium text-sm">
                                <UploadCloud className="w-4 h-4 mr-2" /> Upload
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                        </div>
                    </div>
                )}

                {showCamera && (
                    <div className="h-full relative bg-black">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-12 px-8">
                            <button onClick={stopCamera} className="w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white">
                                <X className="w-6 h-6" />
                            </button>
                            <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1">
                                <div className="w-full h-full bg-white rounded-full" />
                            </button>
                            <div className="w-12 h-12" /> {/* Spacer */}
                        </div>
                    </div>
                )}

                {previewUrl && (
                    <div className="h-full relative">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button onClick={() => {setPreviewUrl(null); setFile(null);}} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-md rounded-full text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Floating Location Control */}
            {previewUrl && (
                <div className="absolute inset-x-6 bottom-32 z-10">
                    <button 
                        onClick={getLocation} 
                        className={`w-full py-4 px-6 rounded-2xl flex items-center justify-between border shadow-xl transition-all ${
                            location ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400' : 'bg-secondary/90 backdrop-blur-md border-border text-foreground'
                        }`}
                    >
                        <div className="flex items-center gap-3 font-semibold">
                            <MapPin className={location ? "text-emerald-500" : "text-primary"} />
                            <span>{location ? 'Location Secured' : 'Tag Location'}</span>
                        </div>
                        {location ? <Check className="w-5 h-5" /> : <div className="text-xs text-muted-foreground">Required</div>}
                    </button>
                </div>
            )}

            {/* Final Action Button */}
            {previewUrl && (
                <div className="absolute inset-x-6 bottom-8 z-10">
                    <button 
                        onClick={handleSubmit} 
                        disabled={isUploading || !location}
                        className="primary-action w-full h-16 text-lg disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        {isUploading ? <Loader2 className="animate-spin h-6 w-6" /> : "Continue to Analysis"}
                    </button>
                </div>
            )}

            {error && (
                <div className="absolute top-6 left-6 right-6 z-20">
                    <div className="bg-red-500 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-lg flex items-center justify-between">
                        <span>{error}</span>
                        <X className="w-4 h-4 cursor-pointer" onClick={() => setError("")} />
                    </div>
                </div>
            )}
        </div>
    );
}

