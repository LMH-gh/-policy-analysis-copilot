import React from 'react';
import { AnalysisResult } from '../types';
import { DocumentIcon } from './icons/DocumentIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { WarningIcon } from './icons/WarningIcon';
import { TelescopeIcon } from './icons/TelescopeIcon';
import { ArticleIcon } from './icons/ArticleIcon';
// Fix: Import LoadingSpinner component
import { LoadingSpinner } from './LoadingSpinner';

interface AnalysisDisplayProps {
  result: AnalysisResult;
  currentStep: number;
  policyText: string;
  onReset: () => void;
}

const DetailSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; isVisible: boolean, defaultOpen?: boolean }> = ({ title, icon, children, isVisible, defaultOpen = false }) => {
  if (!isVisible) return null;
  return (
    <details className="bg-card p-4 rounded-lg shadow-sm mb-4 border border-gray-200" open={defaultOpen}>
      <summary className="flex items-center cursor-pointer text-lg font-semibold text-text-primary hover:text-primary transition-colors">
        {icon}
        <span className="ml-3">{title}</span>
      </summary>
      <div className="mt-4 pt-4 border-t border-gray-200">
        {children}
      </div>
    </details>
  );
};

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result, currentStep, policyText, onReset }) => {
  
  const generateMarkdown = () => {
    let md = `# 政策分析报告\n\n`;

    if(result.synthesis) {
      md += `## 综合分析报告: ${result.synthesis.title}\n\n`;
      md += `### 引言\n${result.synthesis.introduction}\n\n`;
      result.synthesis.sections.forEach(section => {
        md += `### ${section.heading}\n${section.content}\n`;
        if (section.example) {
          md += `**案例说明:** ${section.example}\n`;
        }
        md += `\n`;
      });
      md += `### 结论\n${result.synthesis.conclusion}\n\n`;
      md += `---\n\n## 附录：详细分析\n\n`;
    }
    
    if(result.background) {
      md += `### 一、政策背景与专业术语解析\n\n`;
      md += `**背景摘要:** ${result.background.summary}\n\n`;
      md += `**术语表:**\n`;
      result.background.glossary.forEach(item => {
        md += `*   **${item.term}:** ${item.definition}\n`;
      });
      md += `\n`;
    }

    if(result.interpretation) {
      md += `### 二、政策正文逐句解读\n\n`;
      result.interpretation.sentences.forEach(item => {
        md += `**条款: "${item.sentence}"**\n`;
        md += `*   字面含义: ${item.whatItSays}\n`;
        md += `*   背后意图: ${item.whyItSaysIt}\n\n`;
      });
    }

    if(result.vulnerabilities) {
      md += `### 三、潜在漏洞分析\n\n`;
      result.vulnerabilities.vulnerabilities.forEach(item => {
        md += `**类别: ${item.category}**\n`;
        md += `*   漏洞: ${item.vulnerability}\n`;
        md += `*   示例: ${item.example}\n\n`;
      });
    }

    if(result.outlook) {
      md += `### 四、未来政策走向预判\n\n`;
      result.outlook.predictions.forEach(item => {
        md += `*   **针对漏洞:** ${item.vulnerability}\n`;
        md += `*   **预测:** ${item.prediction}\n\n`;
      });
    }
    
    return md;
  };

  const downloadMarkdown = () => {
    const markdownContent = generateMarkdown();
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '政策分析报告.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
       {currentStep >= 6 && result.synthesis && (
        <div className="bg-card p-6 sm:p-8 rounded-lg shadow-xl mb-10 animate-fade-in border-t-4 border-primary">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center">
                  <ArticleIcon />
                  <h2 className="text-2xl font-bold text-primary ml-4">综合分析报告</h2>
              </div>
              <button onClick={downloadMarkdown} className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                下载报告 (.md)
              </button>
            </div>
            <h3 className="text-xl font-bold text-text-primary text-center mb-4">{result.synthesis.title}</h3>
            <p className="text-text-secondary mb-6 p-4 bg-gray-50 rounded-md italic">{result.synthesis.introduction}</p>
            
            <div className="space-y-6">
                {result.synthesis.sections.map((section, index) => (
                    <div key={index}>
                        <h4 className="font-semibold text-lg text-primary-dark mb-2">{section.heading}</h4>
                        <p className="text-text-secondary whitespace-pre-wrap mb-3">{section.content}</p>
                        {section.example && (
                            <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-sm text-blue-800 rounded-r-md">
                                <p><span className="font-bold">案例说明:</span> {section.example}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <hr className="my-8" />
            <h4 className="font-semibold text-lg text-primary-dark mb-2">结论与展望</h4>
            <p className="text-text-secondary whitespace-pre-wrap">{result.synthesis.conclusion}</p>
        </div>
      )}

      {currentStep >= 6 && (
        <h3 className="text-xl font-semibold text-text-secondary mb-4">附录：详细分析</h3>
      )}

      <div className="space-y-4">
        <DetailSection title="政策背景与专业术语" icon={<DocumentIcon />} isVisible={currentStep >= 1 && !!result.background}>
          {result.background && (
            <>
              <h3 className="text-lg font-semibold text-text-primary mb-2">背景摘要</h3>
              <p className="text-text-secondary whitespace-pre-wrap">{result.background.summary}</p>
              <hr className="my-6" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">术语表</h3>
              <ul className="space-y-3">
                {result.background.glossary.map((item, index) => (
                  <li key={index} className="p-3 bg-gray-50 rounded-md">
                    <p className="font-semibold text-primary-dark">{item.term}</p>
                    <p className="text-text-secondary text-sm">{item.definition}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DetailSection>
        
        <DetailSection title="政策正文逐句解读" icon={<LightbulbIcon />} isVisible={currentStep >= 2 && !!result.interpretation} defaultOpen={true}>
          {result.interpretation && result.interpretation.sentences.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 mb-3 transition-all duration-500 ease-out transform motion-safe:animate-[slide-down-fade_0.5s_ease-out]">
              <p className="font-semibold text-primary-dark">{item.sentence}</p>
              <div className="mt-3 pl-4 border-l-2 border-primary-light">
                <p className="text-sm font-semibold text-text-primary">字面含义：</p>
                <p className="text-sm text-text-secondary mb-2">{item.whatItSays}</p>
                <p className="text-sm font-semibold text-text-primary">背后意图：</p>
                <p className="text-sm text-text-secondary">{item.whyItSaysIt}</p>
              </div>
            </div>
          ))}
          {currentStep === 2 && (
             <div className="flex items-center justify-center p-4 text-sm text-text-secondary">
                <LoadingSpinner />
                <span className="ml-3">正在实时分析，请稍候...</span>
            </div>
          )}
        </DetailSection>

        <DetailSection title="潜在漏洞分析" icon={<WarningIcon />} isVisible={currentStep >= 3 && !!result.vulnerabilities}>
          {result.vulnerabilities && result.vulnerabilities.vulnerabilities.map((item, index) => (
              <div key={index} className="border border-yellow-300 bg-yellow-50 rounded-lg p-4 mb-4">
                  <p className="font-bold text-yellow-800 mb-1">{item.category}</p>
                  <p className="text-sm text-yellow-900"><span className="font-semibold">漏洞：</span> {item.vulnerability}</p>
                  <p className="text-sm text-yellow-900 mt-2"><span className="font-semibold">示例：</span> {item.example}</p>
              </div>
          ))}
        </DetailSection>

        <DetailSection title="未来政策走向预判" icon={<TelescopeIcon />} isVisible={currentStep >= 4 && !!result.outlook}>
          {result.outlook && result.outlook.predictions.map((item, index) => (
              <div key={index} className="border border-green-300 bg-green-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">针对漏洞: <span className="font-semibold italic">"{item.vulnerability}"</span></p>
                  <p className="text-green-800 font-semibold">{item.prediction}</p>
              </div>
          ))}
        </DetailSection>
      </div>

      {currentStep === 6 && (
        <div className="mt-8 flex justify-center">
           <button onClick={onReset} className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors duration-300 flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 9a9 9 0 0114.1-5.93M20 15a9 9 0 01-14.1 5.93"></path></svg>
            分析另一份政策
          </button>
        </div>
      )}
    </div>
  );
};