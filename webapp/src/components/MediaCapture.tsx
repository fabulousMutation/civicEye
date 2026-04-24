/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Camera, MapPin, UploadCloud, Loader2 } from 'lucide-react';

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
            setError("Camera access denied or unavailable.");
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
            setError("Geolocation is not supported by your browser");
            return;
        }
        navigator.geolocation.getCurrentPosition((position) => {
            setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
            setError("");
        }, () => {
            setError("Unable to retrieve your location. Please allow location permissions.");
        });
    };

    const handleSubmit = async () => {
        if (!file) return setError("Please capture or upload an image.");
        if (!location) return setError("Please allow location access to proceed.");
        
        setIsUploading(true);
        setError("");

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `reports/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            onMediaCaptured({
                imageUrl: publicUrlData.publicUrl,
                location,
                timestamp: new Date().toISOString()
            });

        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "Failed to upload image.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-6 border rounded-xl bg-white shadow-sm w-full mx-auto">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">1. Capture Evidence</h2>
            
            {!previewUrl && !showCamera && (
                <div className="flex gap-4 w-full">
                    <button onClick={startCamera} className="shadow-md flex-1 flex flex-col items-center justify-center py-8 border border-gray-100 rounded-xl hover:bg-blue-50 text-blue-600 transition-all font-semibold">
                        <Camera className="w-8 h-8 mb-2" />
                        <span>Take Photo</span>
                    </button>
                    <label className="shadow-md flex-1 flex flex-col items-center justify-center py-8 border border-gray-100 rounded-xl hover:bg-blue-50 text-blue-600 cursor-pointer transition-all font-semibold">
                        <UploadCloud className="w-8 h-8 mb-2" />
                        <span>Upload Image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                </div>
            )}

            {showCamera && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full shadow-lg">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-blue-600 px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                        Capture
                    </button>
                    <button onClick={stopCamera} className="absolute top-4 right-4 bg-gray-900/50 text-white px-3 py-1 rounded-full text-sm">
                        Cancel
                    </button>
                </div>
            )}

            {previewUrl && (
                <div className="relative rounded-xl overflow-hidden aspect-video border shadow-sm w-full">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => {setPreviewUrl(null); setFile(null);}} className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1 px-3 text-sm font-semibold shadow-md transition-colors">
                        Remove
                    </button>
                </div>
            )}

            <div className="pt-6 border-t mt-2 w-full">
                <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">2. Tag Location</h2>
                <button onClick={getLocation} className="w-full flex items-center justify-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-700 font-medium shadow-sm transition-colors">
                    <MapPin className="w-5 h-5 text-purple-500" />
                    {location ? `Location Tagged (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : "Get Current Location"}
                </button>
            </div>

            {error && <p className="text-red-500 text-sm mt-2 font-medium bg-red-50 p-3 rounded-lg">{error}</p>}

            <button 
                onClick={handleSubmit} 
                disabled={isUploading || !file || !location}
                className={`w-full p-4 rounded-xl font-bold text-white mt-4 flex items-center justify-center gap-2 shadow-md transition-all ${
                    (isUploading || !file || !location) ? 'bg-blue-300 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02]'
                }`}
            >
                {isUploading ? <><Loader2 className="animate-spin" /> Uploading...</> : 'Continue to AI Analysis'}
            </button>
        </div>
    );
}
