// components/ui/ImageGallery.jsx - Lazy loaded image gallery
'use client';

import { useState, useEffect } from 'react';

export default function ImageGallery({ images, currentImage, onImageChange, alt }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="aspect-square bg-muted/10 rounded-lg flex items-center justify-center">
        <div className="spinner h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-square bg-muted/10 rounded-lg overflow-hidden relative">
        <img 
          src={images[currentImage]} 
          alt={`${alt} - Image ${currentImage + 1}`}
          className="h-full w-full object-cover transition-opacity duration-300"
          loading="lazy"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => onImageChange(index)}
              className={`h-16 w-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                currentImage === index ? 'border-primary' : 'border-border'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <img 
                src={img} 
                alt={`${alt} - Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}