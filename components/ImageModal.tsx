import React from 'react';

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ src, alt, onClose }) => (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    onClick={onClose}
  >
    <div className="max-w-4xl max-h-[90vh] relative">
      <img 
        src={src} 
        alt={alt} 
        className="max-w-full max-h-full object-contain"
      />
      <button 
        className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-colors"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  </div>
);

export default ImageModal; 