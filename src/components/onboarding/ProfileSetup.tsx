import { useState, useRef, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, CheckCircle2, AlertCircle, ArrowRight, Crop } from 'lucide-react';
import { MirrorIcon } from '../common/MirrorIcon';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { compressImage } from '../../utils/imageCompressor';
import { ImageCropModal } from './ImageCropModal';

export function ProfileSetup() {
  const { user, refreshProfile, signOut } = useAuth();

  const [name, setName] = useState<string>(
    user?.user_metadata?.full_name || user?.user_metadata?.name || ''
  );
  const [admissionNo, setAdmissionNo] = useState<string>('');
  const [department, setDepartment] = useState<string>('');

  // Image & Cropping State
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressionStats, setCompressionStats] = useState<{ originalSize: number; compressedSize: number } | null>(null);

  // Status State
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WEBP)');
      return;
    }

    setErrorMsg(null);
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setIsCropModalOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob, croppedPreviewUrl: string) => {
    setIsProcessingImage(true);
    setErrorMsg(null);

    try {
      // Compress the cropped image to target maximum resolution & quality
      const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const result = await compressImage(croppedFile, { maxWidth: 900, maxHeight: 1200, quality: 0.88 });

      setCompressedBlob(result.blob);
      setPreviewUrl(result.previewUrl || croppedPreviewUrl);
      setCompressionStats({
        originalSize: croppedBlob.size,
        compressedSize: result.compressedSize,
      });
    } catch (err: unknown) {
      console.error('Image compression error:', err);
      // Fallback to the cropped blob if compressor throws
      setCompressedBlob(croppedBlob);
      setPreviewUrl(croppedPreviewUrl);
      setCompressionStats({
        originalSize: croppedBlob.size,
        compressedSize: croppedBlob.size,
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setErrorMsg('Please provide your full name');
      return;
    }

    if (!admissionNo.trim()) {
      setErrorMsg('Please enter your unique Admission No. (e.g. MEC22CS045)');
      return;
    }

    if (!compressedBlob) {
      setErrorMsg('Please upload and crop a photo of yourself');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const fileExt = 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Photo upload failed: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      const photoUrl = publicUrlData.publicUrl;

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        name: name.trim(),
        college_id: admissionNo.trim().toUpperCase(),
        photo_url: photoUrl,
        department: department.trim() || null,
        elo_rating: 1200,
        matches_played: 0,
        wins: 0,
        is_opted_in: true,
        is_admin: false,
      });

      if (insertError) {
        if (insertError.code === '23505' || insertError.message.includes('unique')) {
          throw new Error('This Admission No. is already registered to another account.');
        }
        throw new Error(`Profile creation failed: ${insertError.message}`);
      }

      await refreshProfile();
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Registration error:', error);
      setErrorMsg(error.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh bg-[#f8fafc] text-slate-900 flex flex-col justify-center items-center px-4 py-12 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-2xl shadow-slate-200/70"
      >
        <div className="flex items-center space-x-3 mb-6">
          <MirrorIcon className="w-9 h-9" useGradient />
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Create Profile</h2>
            <p className="text-xs text-slate-400 font-medium">Step 2 of 2 &bull; Put yourself in the showdown</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Profile Photo <span className="text-[#ff5864]">* (Square 1:1)</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              className={`relative border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center select-none overflow-hidden ${
                previewUrl
                  ? 'border-[#ff5864]/50 bg-slate-50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 cursor-pointer'
              }`}
              onClick={() => {
                if (!previewUrl) fileInputRef.current?.click();
              }}
            >
              {isProcessingImage ? (
                <div className="py-8 flex flex-col items-center space-y-2">
                  <Loader2 className="w-7 h-7 text-[#ff5864] animate-spin" />
                  <span className="text-xs text-slate-500 font-medium">Processing cropped photo...</span>
                </div>
              ) : previewUrl ? (
                <div className="flex flex-col items-center space-y-3 w-full">
                  {/* Fixed 1:1 square preview */}
                  <div className="relative w-36 aspect-square rounded-2xl overflow-hidden border-2 border-[#ff5864]/40 shadow-lg group">
                    <img
                      src={previewUrl}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                    <div
                      onClick={() => rawImageSrc && setIsCropModalOpen(true)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold cursor-pointer space-y-1"
                    >
                      <Crop className="w-5 h-5" />
                      <span>Adjust Crop</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {rawImageSrc && (
                      <button
                        type="button"
                        onClick={() => setIsCropModalOpen(true)}
                        className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      >
                        <Crop className="w-3 h-3 text-[#ff5864]" />
                        <span>Adjust Crop</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>

                  {compressionStats && (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        Optimized: {(compressionStats.compressedSize / 1024).toFixed(0)} KB (Square Aspect)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#ff5864]/10 text-[#ff5864] flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800">Upload your best picture</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG or WEBP (with square crop guide)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Full Name <span className="text-[#ff5864]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Thanzi Rahman"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#ff5864] text-sm text-slate-900 outline-none transition font-medium"
            />
          </div>

          {/* Admission No. */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Admission No. <span className="text-[#ff5864]">*</span>
            </label>
            <input
              type="text"
              required
              value={admissionNo}
              onChange={(e) => setAdmissionNo(e.target.value.toUpperCase())}
              placeholder="e.g. MEC22CS045"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#ff5864] text-sm font-mono text-slate-900 uppercase outline-none transition font-bold"
            />
          </div>

          {/* Department (Full Width) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#ff5864] text-sm text-slate-900 outline-none transition font-medium"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isProcessingImage || !compressedBlob}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#fd297b] via-[#ff5864] to-[#ff655b] hover:opacity-95 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm transition shadow-lg shadow-[#ff5864]/25 disabled:shadow-none flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Profile...</span>
                </>
              ) : (
                <>
                  <span>Finalize & Enter Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={signOut}
            className="text-xs text-slate-400 hover:text-slate-600 transition font-medium"
          >
            Cancel and Sign Out
          </button>
        </div>
      </motion.div>

      {/* Image Crop Modal */}
      <ImageCropModal
        imageSrc={rawImageSrc}
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
