import React from 'react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
}

const PromptInput: React.FC<PromptInputProps> = ({ value, onChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Original Prompt (Used to generate the code)
      </label>
      <textarea
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter the prompt you used to generate this code..."
      />
    </div>
  );
};

export default PromptInput;
