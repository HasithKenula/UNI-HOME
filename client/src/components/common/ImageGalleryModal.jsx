import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

const ImageGalleryModal = ({ images, activeIndex, onClose, onNavigate }) => {
    const [zoom, setZoom] = React.useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && activeIndex > 0) onNavigate(activeIndex - 1);
            if (e.key === 'ArrowRight' && activeIndex < images.length - 1) onNavigate(activeIndex + 1);
        };

        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [activeIndex, images.length, onClose, onNavigate]);

    if (!images || images.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all z-10"
                aria-label="Close gallery"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 flex gap-2 z-10">
                <button
                    onClick={() => setZoom(!zoom)}
                    className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all"
                    aria-label={zoom ? 'Zoom out' : 'Zoom in'}
                >
                    {zoom ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                </button>
            </div>

            {/* Image Counter */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full bg-white bg-opacity-20 text-white text-sm font-semibold">
                {activeIndex + 1} / {images.length}
            </div>

            {/* Previous Button */}
            {activeIndex > 0 && (
                <button
                    onClick={() => onNavigate(activeIndex - 1)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all"
                    aria-label="Previous image"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
            )}

            {/* Next Button */}
            {activeIndex < images.length - 1 && (
                <button
                    onClick={() => onNavigate(activeIndex + 1)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all"
                    aria-label="Next image"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            )}

            {/* Main Image */}
            <div className="max-w-7xl max-h-[90vh] flex items-center justify-center">
                <img
                    src={images[activeIndex]}
                    alt={`Gallery image ${activeIndex + 1}`}
                    className={`max-w-full max-h-[90vh] object-contain rounded-lg transition-transform duration-300 ${
                        zoom ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                    }`}
                    onClick={() => setZoom(!zoom)}
                />
            </div>

            {/* Thumbnail Strip */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 max-w-4xl overflow-x-auto">
                <div className="flex gap-2 px-4">
                    {images.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => onNavigate(index)}
                            className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                                index === activeIndex
                                    ? 'border-blue-500 scale-110'
                                    : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                        >
                            <img
                                src={img}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-16 h-16 object-cover"
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ImageGalleryModal;
