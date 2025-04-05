import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight, Download, Share2, ZoomIn, ZoomOut } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

interface Image {
  _id: string;
  url: string;
  titulo: string;
  fecha: string; // ISO date string
  tipo: string;
  pacienteId?: string;
  tratamientoId?: string;
}

interface BeforeAfterComparisonProps {
  beforeImage: Image;
  afterImage: Image;
  title?: string;
  description?: string;
  onClose?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

export const BeforeAfterComparison: React.FC<BeforeAfterComparisonProps> = ({
  beforeImage,
  afterImage,
  title = 'Comparación Antes/Después',
  description,
  onClose,
  onShare,
  onDownload
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side'>('split');

  // Fecha formateada para antes y después
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Calcula los días entre las dos imágenes
  const getDaysBetween = (): number => {
    const beforeDate = new Date(beforeImage.fecha);
    const afterDate = new Date(afterImage.fecha);
    const diffTime = Math.abs(afterDate.getTime() - beforeDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Handler para el movimiento del slider
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateSliderPosition(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && viewMode === 'split') {
      updateSliderPosition(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateSliderPositionTouch(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging && viewMode === 'split') {
      updateSliderPositionTouch(e);
      e.preventDefault(); // Prevenir scroll mientras se arrastra
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Actualizar posición del slider basado en la posición del mouse
  const updateSliderPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - containerRect.left;
    const newPosition = (offsetX / containerRect.width) * 100;
    
    setSliderPosition(Math.max(0, Math.min(100, newPosition)));
  };

  // Actualizar posición del slider para eventos táctiles
  const updateSliderPositionTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || !e.touches[0]) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const offsetX = e.touches[0].clientX - containerRect.left;
    const newPosition = (offsetX / containerRect.width) * 100;
    
    setSliderPosition(Math.max(0, Math.min(100, newPosition)));
  };

  // Cambiar el zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  // Cambiar el modo de visualización
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'split' ? 'side-by-side' : 'split');
  };

  // Manejar descarga
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      try {
        // Crear un lienzo para combinar las imágenes
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('No se pudo crear el contexto para la descarga');
          return;
        }
        
        // Cargar las imágenes
        const beforeImg = new Image();
        const afterImg = new Image();
        
        beforeImg.crossOrigin = 'Anonymous';
        afterImg.crossOrigin = 'Anonymous';
        
        beforeImg.src = beforeImage.url;
        afterImg.src = afterImage.url;
        
        beforeImg.onload = () => {
          afterImg.onload = () => {
            // Configurar el tamaño del canvas
            canvas.width = beforeImg.width * 2;
            canvas.height = beforeImg.height;
            
            // Dibujar las imágenes una al lado de la otra
            ctx.drawImage(beforeImg, 0, 0);
            ctx.drawImage(afterImg, beforeImg.width, 0);
            
            // Agregar etiquetas de texto
            ctx.font = '20px Arial';
            ctx.fillStyle = 'white';
            ctx.fillRect(10, 10, 80, 30);
            ctx.fillStyle = 'black';
            ctx.fillText('Antes', 20, 30);
            
            ctx.fillStyle = 'white';
            ctx.fillRect(beforeImg.width + 10, 10, 90, 30);
            ctx.fillStyle = 'black';
            ctx.fillText('Después', beforeImg.width + 20, 30);
            
            // Descargar la imagen
            const link = document.createElement('a');
            link.download = `comparacion_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          };
        };
        
        // Manejar errores de carga
        beforeImg.onerror = () => setError('Error al cargar la imagen "antes"');
        afterImg.onerror = () => setError('Error al cargar la imagen "después"');
      } catch (err: any) {
        setError('Error al descargar la comparación: ' + err.message);
      }
    }
  };

  // Efecto para limpiar el estado de arrastre cuando el mouse sale de la ventana
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <Card className="bg-white p-0 overflow-hidden">
      {/* Cabecera */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="light"
              size="sm"
              icon={<ArrowLeftRight className="h-4 w-4" />}
              onClick={toggleViewMode}
            >
              {viewMode === 'split' ? 'Ver lado a lado' : 'Ver con slider'}
            </Button>
            <Button
              variant="light"
              size="sm"
              icon={<ZoomOut className="h-4 w-4" />}
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            />
            <Button
              variant="light"
              size="sm"
              icon={<ZoomIn className="h-4 w-4" />}
              onClick={handleZoomIn}
              disabled={zoom >= 3}
            />
            <Button
              variant="light"
              size="sm"
              icon={<Download className="h-4 w-4" />}
              onClick={handleDownload}
            >
              Descargar
            </Button>
            {onShare && (
              <Button
                variant="light"
                size="sm"
                icon={<Share2 className="h-4 w-4" />}
                onClick={onShare}
              >
                Compartir
              </Button>
            )}
          </div>
        </div>
        
        {/* Información de fechas */}
        <div className="mt-2 flex justify-between text-sm">
          <div>
            <span className="font-medium">Antes:</span> {formatDate(beforeImage.fecha)}
          </div>
          <div>
            <span className="font-medium">Después:</span> {formatDate(afterImage.fecha)} ({getDaysBetween()} días después)
          </div>
        </div>
      </div>
      
      {error && (
        <Alert
          variant="error"
          title="Error"
          onDismiss={() => setError(null)}
          dismissible
        >
          {error}
        </Alert>
      )}
      
      {/* Contenedor de comparación */}
      <div 
        className="relative overflow-hidden bg-gray-900"
        style={{ height: '500px' }}
      >
        {viewMode === 'split' ? (
          // Modo de vista con slider
          <div 
            ref={containerRef}
            className="relative w-full h-full cursor-col-resize overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Imagen Después (fondo completo) */}
            <div className="absolute top-0 left-0 w-full h-full">
              <img 
                src={afterImage.url} 
                alt="Después" 
                className="object-contain w-full h-full"
                style={{ 
                  transform: `scale(${zoom})`, 
                  transformOrigin: 'center',
                  transition: 'transform 0.2s ease-out'
                }}
              />
            </div>
            
            {/* Imagen Antes (con clip-path) */}
            <div 
              className="absolute top-0 left-0 w-full h-full"
              style={{ 
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` 
              }}
            >
              <img 
                src={beforeImage.url} 
                alt="Antes" 
                className="object-contain w-full h-full"
                style={{ 
                  transform: `scale(${zoom})`, 
                  transformOrigin: 'center',
                  transition: 'transform 0.2s ease-out'
                }}
              />
            </div>
            
            {/* Slider */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize"
              style={{ 
                left: `${sliderPosition}%`,
                boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <ArrowLeftRight className="h-4 w-4 text-gray-800" />
              </div>
            </div>
            
            {/* Etiquetas */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded">
              Antes
            </div>
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded">
              Después
            </div>
          </div>
        ) : (
          // Modo de vista lado a lado
          <div className="flex h-full">
            <div className="flex-1 relative overflow-hidden">
              <img 
                src={beforeImage.url} 
                alt="Antes" 
                className="object-contain w-full h-full"
                style={{ 
                  transform: `scale(${zoom})`, 
                  transformOrigin: 'center',
                  transition: 'transform 0.2s ease-out'
                }}
              />
              <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded">
                Antes
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
              <img 
                src={afterImage.url} 
                alt="Después" 
                className="object-contain w-full h-full"
                style={{ 
                  transform: `scale(${zoom})`, 
                  transformOrigin: 'center',
                  transition: 'transform 0.2s ease-out'
                }}
              />
              <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded">
                Después
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Pie con información adicional */}
      <div className="p-4 border-t">
        <div className="flex justify-between">
          <div>
            <h3 className="text-sm font-medium">{beforeImage.titulo}</h3>
            <p className="text-xs text-gray-500">{beforeImage.tipo}</p>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-medium">{afterImage.titulo}</h3>
            <p className="text-xs text-gray-500">{afterImage.tipo}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BeforeAfterComparison;