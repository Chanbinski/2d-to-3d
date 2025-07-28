import { useState } from 'react'
import './App.css'
import TextPrompt from './components/TextPrompt'
import ImagePrompt from './components/ImagePrompt'
import { ModelViewer } from './components/ModelViewer'

function App() {
  const [_, setIsGenerating] = useState(false)
  const [generatedModel, setGeneratedModel] = useState<string | null>(null)
  const [modelBlobs, setModelBlobs] = useState<{ trellis?: Blob; hunyuan?: Blob }>({})
  const [activeInput, setActiveInput] = useState<'text' | 'image'>('text')

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
            setGeneratedModel('model.glb');
          });
      }
    } catch (error) {
      console.error('Error processing GLB data:', error);
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
  const hasMultipleModels = Object.keys(modelBlobs).filter(key => modelBlobs[key as keyof typeof modelBlobs]).length > 1;

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
          <div className="w-1/2">
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
                    <TextPrompt onResult={handleResult} />
                  </div>
                )}

                {activeInput === 'image' && (
                  <div>
                    <ImagePrompt onResult={handleResult} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Output Container */}
          <div className="w-1/2">
            <div className="border border-gray-200 rounded-2xl p-8 bg-white sticky top-8">
              <h2 className="text-2xl font-semibold mb-8 text-gray-800 text-left">Output</h2>
              <div className={`rounded-xl p-6 ${!generatedModel ? 'upload-area' : ''}`}>
                {generatedModel ? (
                  <div className="space-y-6">
                    {hasMultipleModels ? (
                      <div className="space-y-4">
                        {modelBlobs.trellis && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700">TRELLIS Model</h3>
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
                          </div>
                        )}
                        {modelBlobs.hunyuan && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700">Hunyuan Model</h3>
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
                          </div>
                        )}
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleDownload()}
                            className="btn-primary px-6 py-3 text-white rounded-xl font-medium"
                          >
                            Download All Models
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {hasAnyModel && (
                          <div className="bg-gray-50 rounded-lg overflow-hidden">
                            <ModelViewer modelUrl={URL.createObjectURL(modelBlobs.trellis || modelBlobs.hunyuan!)} />
                          </div>
                        )}
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleDownload()}
                            disabled={!hasAnyModel}
                            className="btn-primary px-6 py-3 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            Download Model
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="p-4 rounded-full bg-gray-50 w-16 h-16 mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">No model generated yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
