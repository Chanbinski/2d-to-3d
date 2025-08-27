import { useState } from 'react'
import './App.css'
import TextPrompt from './components/TextPrompt'
import ImagePrompt from './components/ImagePrompt'
import { ModelViewer } from './components/ModelViewer'

function App() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedModel, setGeneratedModel] = useState<string | null>(null)
  const [modelBlobs, setModelBlobs] = useState<{ trellis?: Blob; hunyuan?: Blob }>({})
  const [activeInput, setActiveInput] = useState<'text' | 'image'>('text')
  const [loadingStates, setLoadingStates] = useState<{ trellis: boolean; hunyuan: boolean }>({ trellis: false, hunyuan: false })

  const handleLoadingStart = (models: ('trellis' | 'hunyuan')[]) => {
    if (models.length === 0) {
      // Reset all loading states (used for error handling)
      setLoadingStates({ trellis: false, hunyuan: false });
      setIsGenerating(false);
    } else {
      // Start loading for specified models
      setIsGenerating(true);
      const newLoadingStates = { ...loadingStates };
      models.forEach(model => {
        newLoadingStates[model] = true;
      });
      setLoadingStates(newLoadingStates);
    }
  };

  const handleResult = (results: { trellis?: string; hunyuan?: string }) => {
    setIsGenerating(false);
    try {
      const blobs: { trellis?: Blob; hunyuan?: Blob } = {};
      
      // Handle TRELLIS result
      if (results.trellis) {
        fetch(results.trellis)
          .then(response => response.blob())
          .then(blob => {
            blobs.trellis = blob;
            setModelBlobs(prev => ({ ...prev, trellis: blob }));
            setLoadingStates(prev => ({ ...prev, trellis: false }));
            setGeneratedModel('model.glb');
          });
      }
      
      // Handle Hunyuan result
      if (results.hunyuan) {
        fetch(results.hunyuan)
          .then(response => response.blob())
          .then(blob => {
            blobs.hunyuan = blob;
            setModelBlobs(prev => ({ ...prev, hunyuan: blob }));
            setLoadingStates(prev => ({ ...prev, hunyuan: false }));
            setGeneratedModel('model.glb');
          });
      }
    } catch (error) {
      console.error('Error processing GLB data:', error);
      // Reset loading states on error
      setLoadingStates({ trellis: false, hunyuan: false });
    }
    console.log('API Response received');
  };

  const handleDownload = (modelType?: 'trellis' | 'hunyuan') => {
    const blobs = modelType ? { [modelType]: modelBlobs[modelType as keyof typeof modelBlobs] } : modelBlobs;
    
    Object.entries(blobs).forEach(([type, blob]) => {
      if (blob && generatedModel) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated-model-${type}.glb`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    });
  }

  const hasAnyModel = Object.keys(modelBlobs).some(key => modelBlobs[key as keyof typeof modelBlobs]);
  //const hasMultipleModels = Object.keys(modelBlobs).filter(key => modelBlobs[key as keyof typeof modelBlobs]).length > 1;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            3D Model Generator
          </h1>
          <p className="mt-3 text-gray-600 text-lg">
            Generate 3D assets from text or image
          </p>
        </div>
        
        <div className="flex gap-12">
          {/* Left side - Inputs Container */}
          <div className="w-2/5">
            <div className="border border-gray-200 rounded-2xl p-8 bg-white">
              <h2 className="text-2xl font-semibold mb-8 text-gray-800 text-left">Input</h2>
              
              {/* Input Method Selector */}
              <div className="flex gap-4 mb-2">
                <button
                  onClick={() => setActiveInput('text')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    activeInput === 'text'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Text Prompt
                </button>
                <button
                  onClick={() => setActiveInput('image')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    activeInput === 'image'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Image Upload
                </button>
              </div>

              {/* Input Methods */}
              <div className="input-gradient rounded-xl p-6">
                {activeInput === 'text' && (
                  <div>
                    <TextPrompt onResult={handleResult} onLoadingStart={handleLoadingStart} isGenerating={isGenerating} />
                  </div>
                )}

                {activeInput === 'image' && (
                  <div>
                    <ImagePrompt onResult={handleResult} onLoadingStart={handleLoadingStart} isGenerating={isGenerating} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Output Container */}
          <div className="w-3/5">
            <div className="border border-gray-200 rounded-2xl p-8 bg-white sticky top-8">
              <h2 className="text-2xl font-semibold mb-8 text-gray-800 text-left">Output</h2>
              <div className="rounded-xl p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* TRELLIS Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">TRELLIS</h3>
                    {loadingStates.trellis ? (
                      <div className="border border-dashed border-blue-300 rounded-lg p-6 text-center text-blue-600 text-sm">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span>Generating TRELLIS model...</span>
                        </div>
                      </div>
                    ) : modelBlobs.trellis ? (
                      <>
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                          <ModelViewer modelUrl={URL.createObjectURL(modelBlobs.trellis)} />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleDownload('trellis')}
                            className="btn-primary px-4 py-2 text-sm text-white rounded-lg font-medium"
                          >
                            Download TRELLIS
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 text-sm">
                        No TRELLIS model yet
                      </div>
                    )}
                  </div>

                  {/* Hunyuan Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Hunyuan</h3>
                    {loadingStates.hunyuan ? (
                      <div className="border border-dashed border-purple-300 rounded-lg p-6 text-center text-purple-600 text-sm">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                          <span>Generating Hunyuan model...</span>
                        </div>
                      </div>
                    ) : modelBlobs.hunyuan ? (
                      <>
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                          <ModelViewer modelUrl={URL.createObjectURL(modelBlobs.hunyuan)} />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleDownload('hunyuan')}
                            className="btn-primary px-4 py-2 text-sm text-white rounded-lg font-medium"
                          >
                            Download Hunyuan
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 text-sm">
                        No Hunyuan model yet
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => handleDownload()}
                    disabled={!hasAnyModel}
                    className="btn-primary px-6 py-3 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Download All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
