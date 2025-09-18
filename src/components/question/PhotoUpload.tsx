'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

interface PhotoUploadProps {
  onImageSelected: (imageBase64: string, imageFile: File) => void;
  loading?: boolean;
}

export const PhotoUpload = ({ onImageSelected, loading = false }: PhotoUploadProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageBase64 = e.target?.result as string;
        const base64Data = imageBase64.split(',')[1]; // Remove data:image/jpeg;base64, part
        setSelectedImage(imageBase64);
        onImageSelected(base64Data, file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto" variant="glass">
      <CardContent className="p-6">
        {selectedImage ? (
          <div className="relative">
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img
                src={selectedImage}
                alt="Uploaded question"
                className="w-full h-auto max-h-96 object-contain bg-surface"
              />
              <button
                onClick={clearImage}
                className="absolute top-3 right-3 w-8 h-8 bg-error-solid text-white rounded-full flex items-center justify-center hover:bg-error-hover transition-colors"
                disabled={loading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-foreground-muted text-sm mb-3">
                📸 Soru fotoğrafın yüklendi! AI ile çözüm için butona bas.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="secondary" size="lg" onClick={clearImage} disabled={loading}>
                  Değiştir
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              dragActive
                ? 'border-primary-solid bg-primary-solid/10 scale-[1.02]'
                : 'border-border hover:border-primary-solid/50 hover:bg-primary-solid/5'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="sr-only"
              disabled={loading}
            />

            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">📸 Soru Fotoğrafın Yükle</h3>
                <p className="text-foreground-muted mb-4">
                  Matematik, Fizik, Kimya, Biyoloji ve Türkçe sorularını fotoğrafla!
                </p>
                <p className="text-sm text-foreground-muted mb-6">
                  Fotoğrafı sürükle-bırak veya tıklayarak seç
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="gradient"
                  size="lg"
                  leftIcon={<Upload className="w-5 h-5" />}
                  disabled={loading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Dosya Seç
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<ImageIcon className="w-5 h-5" />}
                  disabled={loading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Galeri
                </Button>
              </div>

              <p className="text-xs text-foreground-muted">
                JPG, PNG formatları desteklenir • Max 10MB
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
