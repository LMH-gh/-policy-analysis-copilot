import React, { useState, useCallback } from 'react';
import { Stepper } from './components/Stepper';
import { PolicyInput } from './components/PolicyInput';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorDisplay } from './components/ErrorDisplay';
import { AnalysisResult, AnalysisStep, AnalysisVulnerability, AnalysisInterpretation, AnalysisOutlook, AnalysisBackground, AnalysisSynthesis } from './types';
import { generateAnalysis, generateAnalysisStream } from './services/geminiService';
import { STEPS } from './constants';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [policyText, setPolicyText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisStart = useCallback(async (text: string) => {
    setPolicyText(text);
    setError(null);
    setIsLoading(true);
    let cumulativeResult: AnalysisResult = {
      interpretation: { sentences: [] },
    };

    try {
      setCurrentStep(1);
      const backgroundResult = await generateAnalysis<AnalysisBackground>(AnalysisStep.BACKGROUND, text);
      cumulativeResult.background = backgroundResult;
      setAnalysisResult({ ...cumulativeResult });
      
      setCurrentStep(2);
      const stream = generateAnalysisStream(text);
      for await (const interpretation of stream) {
        setAnalysisResult(prev => {
          const newSentences = [...(prev?.interpretation?.sentences || []), interpretation];
          const newResult = { ...prev, interpretation: { sentences: newSentences } };
          cumulativeResult.interpretation = { sentences: newSentences };
          return newResult;
        });
      }
      
      setCurrentStep(3);
      const vulnerabilityResult = await generateAnalysis<{ vulnerabilities: AnalysisVulnerability[] }>(AnalysisStep.VULNERABILITY, text, cumulativeResult.interpretation);
      cumulativeResult.vulnerabilities = vulnerabilityResult;
      setAnalysisResult({ ...cumulativeResult });
      
      setCurrentStep(4);
      const outlookResult = await generateAnalysis<{ predictions: AnalysisOutlook[] }>(AnalysisStep.OUTLOOK, text, vulnerabilityResult);
      cumulativeResult.outlook = outlookResult;
      setAnalysisResult({ ...cumulativeResult });

      setCurrentStep(5);
      const synthesisResult = await generateAnalysis<AnalysisSynthesis>(AnalysisStep.SYNTHESIS, text, cumulativeResult);
      cumulativeResult.synthesis = synthesisResult;
      setAnalysisResult({ ...cumulativeResult });
      
      setCurrentStep(6);
      
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : '发生未知错误。');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleReset = () => {
    setCurrentStep(0);
    setPolicyText('');
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
  };

  const renderContent = () => {
    if (isLoading && currentStep > 0 && currentStep !== 2) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg shadow-md mt-6">
          <LoadingSpinner />
          <p className="mt-4 text-text-secondary text-lg font-medium">
            {STEPS[currentStep]}...
          </p>
        </div>
      );
    }

    if (error) {
      return <ErrorDisplay message={error} onRetry={() => handleAnalysisStart(policyText)} />;
    }
    
    // During step 2 (streaming), we show the AnalysisDisplay immediately
    if (currentStep > 0 && analysisResult) {
      return (
        <AnalysisDisplay
          result={analysisResult}
          currentStep={currentStep}
          policyText={policyText}
          onReset={handleReset}
        />
      );
    }
    
    return <PolicyInput onAnalyze={handleAnalysisStart} />;
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="bg-primary shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <svg className="w-8 h-8 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <h1 className="text-2xl font-bold text-white">AI 政策分析助手</h1>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:gap-12">
          <aside className="w-full lg:w-60 lg:flex-shrink-0 mb-8 lg:mb-0">
            <Stepper currentStep={currentStep} />
          </aside>
          <div className="flex-grow min-w-0">
            {renderContent()}
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-text-secondary text-sm">
        <p>由 Gemini API 驱动</p>
      </footer>
    </div>
  );
};

export default App;