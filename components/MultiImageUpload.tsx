import { DeleteOutlined, StarFilled, StarOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import { useEffect, useState } from 'react';

interface ImageItem {
  uid: string;
  url?: string;
  file?: File;
  preview?: string;
  isMain: boolean;
}

interface MultiImageUploadProps {
  value?: ImageItem[];
  onChange?: (images: ImageItem[]) => void;
  maxCount?: number;
}

export default function MultiImageUpload({ value = [], onChange, maxCount = 5 }: MultiImageUploadProps) {
  const [images, setImages] = useState<ImageItem[]>(value);

  // Sync internal state with external value prop
  useEffect(() => {
    setImages(value);
  }, [value]);

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg,image/webp';
    input.multiple = true;

    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files || []) as File[];
      
      if (images.length + files.length > maxCount) {
        message.error(`Maximum ${maxCount} images allowed`);
        return;
      }

      const newImages: ImageItem[] = [];
      
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          message.error(`${file.name}: File size must be less than 5MB`);
          continue;
        }

        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          message.error(`${file.name}: Only PNG, JPG, JPEG, and WEBP files are allowed`);
          continue;
        }

        const preview = await readFileAsDataURL(file);
        newImages.push({
          uid: `${Date.now()}-${file.name}`,
          file,
          preview,
          isMain: images.length === 0 && newImages.length === 0, // First image is main
        });
      }

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onChange?.(updatedImages);
    };

    input.click();
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSetMain = (uid: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isMain: img.uid === uid,
    }));
    setImages(updatedImages);
    onChange?.(updatedImages);
  };

  const handleRemove = (uid: string) => {
    const updatedImages = images.filter(img => img.uid !== uid);
    
    // If removed image was main, set first image as main
    if (updatedImages.length > 0 && !updatedImages.some(img => img.isMain)) {
      updatedImages[0].isMain = true;
    }
    
    setImages(updatedImages);
    onChange?.(updatedImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {images.length < maxCount && (
        <Button
          type="dashed"
          icon={<UploadOutlined />}
          onClick={handleUploadClick}
          block
        >
          Upload Images ({images.length}/{maxCount})
        </Button>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <div
              key={img.uid}
              className="relative group rounded-lg overflow-hidden border-2"
              style={{
                borderColor: img.isMain ? '#FF380B' : 'var(--border)',
                aspectRatio: '4/3',
              }}
            >
              {/* Image */}
              <img
                src={img.preview || img.url}
                alt="Preview"
                className="w-full h-full object-cover"
              />

              {/* Main Badge */}
              {img.isMain && (
                <div className="absolute top-2 left-2 bg-orange-500 text-white px-3 py-1.5 rounded text-sm font-bold shadow-lg">
                  Main Image
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                {!img.isMain && (
                  <Button
                    type="primary"
                    size="large"
                    shape="circle"
                    icon={<StarOutlined />}
                    onClick={() => handleSetMain(img.uid)}
                    title="Set as main image"
                    style={{ width: '48px', height: '48px' }}
                  />
                )}
                {img.isMain && (
                  <Button
                    type="primary"
                    size="large"
                    shape="circle"
                    icon={<StarFilled />}
                    disabled
                    title="Main image"
                    style={{ width: '48px', height: '48px' }}
                  />
                )}
                <Button
                  type="primary"
                  danger
                  size="large"
                  shape="circle"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(img.uid)}
                  title="Remove image"
                  style={{ width: '48px', height: '48px' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      <p className="text-sm text-gray-500">
        Upload up to {maxCount} images. Click the star button to set the main image displayed on the menu card.
      </p>
    </div>
  );
}
