// components/AudioSetupStep.tsx
import React, { useState } from "react";

interface AudioSetupStepProps {
  audioFile: File | null;
  onAudioUpload: (file: File | null) => void;
  onContinue: () => void;
  onBack: () => void;
}

const AudioSetupStep: React.FC<AudioSetupStepProps> = ({
  audioFile,
  onAudioUpload,
  onContinue,
  onBack,
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        setError("Please upload a valid audio file");
        return;
      }

      onAudioUpload(file);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(file));
      setError("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Audio Setup</h2>

      <div className="mb-6">
        <label className="block mb-2 font-medium">Background Audio</label>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-8 h-8 mb-2 text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 13h6m-3 3v-6M6.5 12.5A4.5 4.5 0 1 0 2 8V6a4.5 4.5 0 0 1 4.5 4.5h2Z"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-400">
                {audioFile ? audioFile.name : "Click to upload audio"}
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="audio/*"
              onChange={handleFileChange}
            />
          </label>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {audioUrl && (
        <div className="mb-6">
          <label className="block mb-2 font-medium">Preview Audio</label>
          <audio controls className="w-full">
            <source src={audioUrl} />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          disabled={!audioFile}
        >
          Continue to Preview
        </button>
      </div>
    </div>
  );
};

export default AudioSetupStep;
