import { useState } from 'react'
import type { ChangeEvent } from 'react'

function App() {
  const [textPrompt, setTextPrompt] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedModel, setGeneratedModel] = useState<string | null>(null)

  const handleTextSubmit = async () => {
    if (!textPrompt.trim()) return
    
    setIsGenerating(true)
    console.log('Generating from text:', textPrompt)
    
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false)
      setGeneratedModel('model.glb') // Placeholder
    }, 3000)
  }

  const handleImageSubmit = async () => {
    if (!selectedImage) return
    
    setIsGenerating(true)
    console.log('Generating from image:', selectedImage.name)
    
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false)
      setGeneratedModel('model.glb') // Placeholder
    }, 3000)
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
    }
  }

  const handleDownload = () => {
    if (generatedModel) {
      // Simulate download
      const link = document.createElement('a')
      link.href = '#'
      link.download = 'generated-character.glb'
      link.click()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center"></h1>
        { /* Input */}
        <div className="flex gap-8">
          <div className="flex-1 bg-white p-6 rounded-lg shadow min-h-80 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Text Prompt</h2>
            <div className="flex flex-col gap-4 flex-1">
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="Describe your character..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none flex-1 disabled:opacity-50"
                disabled={isGenerating}
              />
              <button
                onClick={handleTextSubmit}
                disabled={!textPrompt.trim() || isGenerating}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white p-6 rounded-lg shadow min-h-80 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Image Upload</h2>
            <div className="flex flex-col gap-4 flex-1">
              <div className="relative flex-1 min-h-48">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  disabled={isGenerating}
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="block w-full h-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">
                      {selectedImage ? selectedImage.name : 'Click to upload image'}
                    </span>
                    <span className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</span>
                  </div>
                </label>
              </div>
              <button
                onClick={handleImageSubmit}
                disabled={!selectedImage || isGenerating}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        { /* Output */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">3D Model Output</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {generatedModel ? (
              <div className="space-y-4">
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">3D Model Viewer (Placeholder)</p>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  Download Model
                </button>
              </div>
            ) : (
              <p className="text-gray-500">Generated 3D model will appear here</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
