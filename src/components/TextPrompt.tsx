import { useState } from 'react';

interface TextPromptProps {
  onResult?: (result: { glb: string }) => void;
}

const TextPrompt: React.FC<TextPromptProps> = ({ onResult }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            text: prompt
          }),
        });
      
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      
        const data = await response.json();
        if (onResult && data.glb) {
          onResult(data);
        } else {
          throw new Error('Response did not contain base64 data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="flex flex-col gap-4 flex-1">
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
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
};

export default TextPrompt; 