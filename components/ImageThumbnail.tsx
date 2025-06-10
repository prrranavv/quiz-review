import React from 'react';

interface ImageThumbnailProps {
  src: string;
  alt: string;
  onClick: () => void;
}

const ImageThumbnail: React.FC<ImageThumbnailProps> = ({ src, alt, onClick }) => (
  <div 
    className="w-16 h-16 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
    onClick={onClick}
  >
    <img 
      src={src} 
      alt={alt} 
      className="w-full h-full object-cover"
    />
  </div>
);

export default ImageThumbnail; 