import { useState } from 'react';

interface ImagePromptProps {
  onResult?: (results: { trellis?: string; hunyuan?: string }) => void;
  onLoadingStart?: (models: ('trellis' | 'hunyuan')[]) => void;
}

type ModelOption = 'trellis' | 'hunyuan' | 'both';

const ImagePrompt: React.FC<ImagePromptProps> = ({ onResult, onLoadingStart }) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption>('trellis');
  
  // Hunyuan parameters
  const [numInferenceSteps, setNumInferenceSteps] = useState(5);
  const [octreeResolution, setOctreeResolution] = useState(128);
  const [guidanceScale, setGuidanceScale] = useState(5.0);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files are images
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Please select only image files');
      return;
    }

    setSelectedImages(files);
    setError(null);
    
    // Create preview URLs for all images
    const previews: string[] = [];
    let loadedCount = 0;

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews[index] = reader.result as string;
        loadedCount++;
        
        if (loadedCount === files.length) {
          setImagePreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedImages.length === 0) return;

    setLoading(true);
    setError(null);

    // Notify parent about loading start
    if (onLoadingStart) {
      if (selectedModel === 'both') {
        onLoadingStart(['trellis', 'hunyuan']);
      } else {
        onLoadingStart([selectedModel]);
      }
    }

    try {
      // Convert all images to base64
      const base64Images = await Promise.all(
        selectedImages.map(image => convertToBase64(image))
      );

      if (selectedModel === 'both') {
        // Make two separate API calls for both models
        const trellisPayload = {
          model_name: 'trellis',
          images: base64Images
        };

        const hunyuanPayload = {
          model_name: 'hunyuan',
          images: base64Images,
          num_inference_steps: numInferenceSteps,
          octree_resolution: octreeResolution,
          guidance_scale: guidanceScale
        };

        const [trellisResponse, hunyuanResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_ENDPOINT}/generate_from_image/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(trellisPayload),
          }),
          fetch(`${import.meta.env.VITE_API_ENDPOINT}/generate_from_image/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hunyuanPayload),
          })
        ]);

        if (!trellisResponse.ok) {
          throw new Error(`TRELLIS error! status: ${trellisResponse.status}`);
        }
        if (!hunyuanResponse.ok) {
          throw new Error(`Hunyuan error! status: ${hunyuanResponse.status}`);
        }

        const [trellisBlob, hunyuanBlob] = await Promise.all([
          trellisResponse.blob(),
          hunyuanResponse.blob()
        ]);

        const trellisUrl = URL.createObjectURL(trellisBlob);
        const hunyuanUrl = URL.createObjectURL(hunyuanBlob);

        if (onResult) {
          onResult({ trellis: trellisUrl, hunyuan: hunyuanUrl });
        }
      } else {
        // Single model request
        const payload: any = {
          model_name: selectedModel,
          images: base64Images
        };

        // Add Hunyuan parameters if Hunyuan is selected
        if (selectedModel === 'hunyuan') {
          payload.num_inference_steps = numInferenceSteps;
          payload.octree_resolution = octreeResolution;
          payload.guidance_scale = guidanceScale;
        }

        const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/generate_from_image/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const glbUrl = URL.createObjectURL(blob);
        
        if (onResult) {
          if (selectedModel === 'trellis') {
            onResult({ trellis: glbUrl });
          } else if (selectedModel === 'hunyuan') {
            onResult({ hunyuan: glbUrl });
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="model"
            value="trellis"
            checked={selectedModel === 'trellis'}
            onChange={(e) => setSelectedModel(e.target.value as ModelOption)}
            className="text-indigo-600"
          />
          TRELLIS
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="model"
            value="hunyuan"
            checked={selectedModel === 'hunyuan'}
            onChange={(e) => setSelectedModel(e.target.value as ModelOption)}
            className="text-indigo-600"
          />
          Hunyuan
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="model"
            value="both"
            checked={selectedModel === 'both'}
            onChange={(e) => setSelectedModel(e.target.value as ModelOption)}
            className="text-indigo-600"
          />
          Both
        </label>
      </div>

      <div className="flex flex-col items-center justify-center w-full">
        <label 
          htmlFor="image-upload" 
          className={`w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
            imagePreviews.length > 0 ? 'flex items-center justify-center' : 'flex flex-col items-center justify-center'
          }`}
        >
          {imagePreviews.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 p-2 w-full h-full overflow-hidden">
              {imagePreviews.slice(0, 6).map((preview, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-full object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removeImage(index);
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              {imagePreviews.length > 6 && (
                <div className="flex items-center justify-center bg-gray-200 rounded text-xs text-gray-600">
                  +{imagePreviews.length - 6}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center pt-4 pb-4">
                <svg className="w-6 h-6 mb-3 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-1 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">Select multiple images</p>
              </div>
            </>
          )}
          <input
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={loading}
          />
        </label>
      </div>

      {selectedImages.length > 0 && (
        <div className="text-sm text-gray-600">
          {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
        </div>
      )}

      {/* Hunyuan Parameters - Only show when Hunyuan is selected */}
      {(selectedModel === 'hunyuan' || selectedModel === 'both') && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">Hunyuan Parameters</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inference Steps: {numInferenceSteps}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={numInferenceSteps}
                onChange={(e) => setNumInferenceSteps(parseInt(e.target.value))}
                className="w-full slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>20</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Octree Resolution: {octreeResolution}
              </label>
              <input
                type="range"
                min="64"
                max="256"
                step="64"
                value={octreeResolution}
                onChange={(e) => setOctreeResolution(parseInt(e.target.value))}
                className="w-full slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>64</span>
                <span>256</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guidance Scale: {guidanceScale}
              </label>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={guidanceScale}
                onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                className="w-full slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1.0</span>
                <span>10.0</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={selectedImages.length === 0 || loading}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
};

export default ImagePrompt; 