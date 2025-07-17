import { useState } from 'react';

interface ImagePromptProps {
  onResult?: (result: { glb: string }) => void;
}

interface GenerationParams {
  image: string;
  seed: number;
  octree_resolution: number;
  num_inference_steps: number;
  guidance_scale: number;
  texture: boolean;
  face_count: number;
  type: 'glb';
}

const DEFAULT_PARAMS: Omit<GenerationParams, 'image'> = {
  seed: 1234,
  octree_resolution: 128,
  num_inference_steps: 5,
  guidance_scale: 5.0,
  texture: true,
  face_count: 40000,
  type: 'glb'
};

const ImagePrompt: React.FC<ImagePromptProps> = ({ onResult }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<Omit<GenerationParams, 'image'>>(DEFAULT_PARAMS);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setSelectedImage(file);
      setError(null);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
    if (!selectedImage) return;

    setLoading(true);
    setError(null);

    try {
      const base64Image = await convertToBase64(selectedImage);

      const payload: GenerationParams = {
        ...params,
        image: base64Image
      };

      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle binary GLB response
      const blob = await response.blob();
      const glbUrl = URL.createObjectURL(blob);
      
      if (onResult) {
        onResult({ glb: glbUrl });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleParamChange = (key: keyof Omit<GenerationParams, 'image' | 'type'>, value: number | boolean) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex flex-col items-center justify-center w-full">
        <label 
          htmlFor="image-upload" 
          className={`w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
            imagePreview ? 'flex items-center justify-center' : 'flex flex-col items-center justify-center'
          }`}
        >
          {imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-h-60 max-w-full object-contain"
            />
          ) : (
            <>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
              </div>
            </>
          )}
          <input
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Seed</label>
          <input
            type="number"
            value={params.seed}
            onChange={(e) => handleParamChange('seed', parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Octree Resolution</label>
          <input
            type="number"
            value={params.octree_resolution}
            onChange={(e) => handleParamChange('octree_resolution', parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Inference Steps</label>
          <input
            type="number"
            value={params.num_inference_steps}
            onChange={(e) => handleParamChange('num_inference_steps', parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Guidance Scale</label>
          <input
            type="number"
            value={params.guidance_scale}
            onChange={(e) => handleParamChange('guidance_scale', parseFloat(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Face Count</label>
          <input
            type="number"
            value={params.face_count}
            onChange={(e) => handleParamChange('face_count', parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={params.texture}
              onChange={(e) => handleParamChange('texture', e.target.checked)}
              className="rounded border-gray-300"
            />
            Enable Texture
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!selectedImage || loading}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
};

export default ImagePrompt; 