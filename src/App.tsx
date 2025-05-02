// App.tsx
import React, { useState } from "react";
import SetupStep from "./components/SetupStep";
import AudioSetupStep from "./components/AudioSetupStep";
import PreviewRecordStep from "./components/PreviewRecordStep";
import { longText } from "./constants";

const App = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState("EPISODE IV\nA NEW HOPE");
  const [storyText, setStoryText] = useState(longText); // Replace with actual text
  const [resolution, setResolution] = useState<"720p" | "1080p">("720p");
  const [speed, setSpeed] = useState(1);
  const [font, setFont] = useState("'StarJedi', sans-serif");
  const [titleColor, setTitleColor] = useState("#FFDD00");
  const [textColor, setTextColor] = useState("white");
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Step indicators
  const renderStepIndicator = () => (
    <div className="w-full max-w-3xl mx-auto mb-4">
      <div className="flex items-center justify-between">
        {[
          { step: 1, name: "Setup" },
          { step: 2, name: "Audio" },
          { step: 3, name: "Preview & Record" },
        ].map(({ step, name }) => (
          <React.Fragment key={step}>
            <div className="flex items-center">
              <div
                className={`rounded-full w-8 h-8 flex items-center justify-center ${
                  currentStep >= step ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                {step}
              </div>
              <div className="ml-2">{name}</div>
            </div>
            {step < 3 && (
              <div
                className={`h-1 flex-1 mx-4 ${
                  currentStep > step ? "bg-blue-600" : "bg-gray-700"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-900 min-h-screen text-white w-screen">
      {renderStepIndicator()}

      {currentStep === 1 ? (
        <SetupStep
          title={title}
          setTitle={setTitle}
          storyText={storyText}
          setStoryText={setStoryText}
          resolution={resolution}
          setResolution={setResolution}
          speed={speed}
          setSpeed={setSpeed}
          font={font}
          setFont={setFont}
          titleColor={titleColor}
          setTitleColor={setTitleColor}
          textColor={textColor}
          setTextColor={setTextColor}
          onContinue={() => setCurrentStep(2)}
        />
      ) : currentStep === 2 ? (
        <AudioSetupStep
          audioFile={audioFile}
          onAudioUpload={setAudioFile}
          onContinue={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      ) : (
        <PreviewRecordStep
          title={title}
          storyText={storyText}
          resolution={resolution}
          speed={speed}
          font={font}
          titleColor={titleColor}
          textColor={textColor}
          audioFile={audioFile}
          onBackToSetup={() => setCurrentStep(2)}
        />
      )}
    </div>
  );
};

export default App;
