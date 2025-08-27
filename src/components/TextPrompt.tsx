import { useState } from 'react';

interface TextPromptProps {
  onResult?: (results: { trellis?: string; hunyuan?: string }) => void;
  onLoadingStart?: (models: ('trellis' | 'hunyuan')[]) => void;
}

type ModelOption = 'trellis' | 'hunyuan' | 'both';

const TextPrompt: React.FC<TextPromptProps> = ({ onResult, onLoadingStart }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption>('trellis');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (selectedModel === 'both') {
        // Make two separate API calls for both models
        const [trellisResponse, hunyuanResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_ENDPOINT}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_name: 'trellis', text: prompt }),
          }),
          fetch(`${import.meta.env.VITE_API_ENDPOINT}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_name: 'hunyuan', text: prompt }),
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
        const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_name: selectedModel,
            text: prompt
          }),
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

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your character..."
        className="w-full p-3 border border-gray-300 rounded-lg resize-none flex-1 disabled:opacity-50"
        disabled={loading}
      />

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || loading}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
};

export default TextPrompt; 