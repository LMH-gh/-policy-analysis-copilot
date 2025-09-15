import React, { useState, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadIcon } from './icons/UploadIcon';
import { LoadingSpinner } from './LoadingSpinner';

// Configure the worker script for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs`;


interface PolicyInputProps {
  onAnalyze: (text: string) => void;
}

const examplePolicyText = `关于做好新能源发电就近消纳试点工作的通知
... (示例政策文本) ...
为解决新能源发电在部分地区出现的“弃风”、“弃光”问题，促进可再生能源高效利用，现就有关事项通知如下：
一、鼓励地方政府结合本地实际，组织开展新能源发电就近消纳试点。
二、试点项目应实现“自发自用、余电上网”，通过市场化交易方式确定上网电价。
三、电网企业应对试点项目提供公平、无歧视的电网接入服务，并合理核定输配电费。
四、探索建立辅助服务市场，通过价格信号引导储能等灵活性资源参与系统调节。
五、加强对试点工作的监管，确保政策执行不走样，防范利用政策进行套利的行为。
... (更多条款) ...`;


export const PolicyInput: React.FC<PolicyInputProps> = ({ onAnalyze }) => {
  const [text, setText] = useState<string>('');
  const [showExample, setShowExample] = useState<boolean>(false);
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyzeClick = () => {
    if (text.trim()) {
      onAnalyze(text);
    }
  };
  
  const handleUseExample = () => {
    setText(examplePolicyText);
    setShowExample(false);
  }

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
        setPdfError('请上传一个有效的 PDF 文件。');
        return;
    }

    setIsParsingPdf(true);
    setPdfError(null);
    setShowExample(false);

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Using 'str' property which is available on TextItem type
            const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
            fullText += pageText + '\n\n';
        }
        setText(fullText);
    } catch (error: unknown) {
        console.error("Error parsing PDF:", error);
        let message = '解析 PDF 文件时出错。';
        if (error instanceof Error && error.name === 'PasswordException') {
            message = '无法解析受密码保护的 PDF 文件。';
        } else {
            message = '文件可能已损坏或格式不受支持。';
        }
        setPdfError(message);
    } finally {
        setIsParsingPdf(false);
         if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }, []);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // This is necessary to allow dropping
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-card p-6 sm:p-8 rounded-lg shadow-lg animate-fade-in">
      <h2 className="text-2xl font-bold text-text-primary mb-4">分析政府政策</h2>
      <p className="text-text-secondary mb-6">
        请在下方粘贴政策全文，或上传一份 PDF 文档。AI 将进行多阶段分析，深入洞察其背景、含义、潜在漏洞及未来走向。
      </p>

      {/* PDF Upload Area */}
      <div 
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 mb-6 text-center transition-colors duration-300 ${isDragging ? 'border-primary bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
      >
        <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            accept=".pdf"
            className="hidden"
            id="pdf-upload"
        />
        {isParsingPdf ? (
            <div className="flex flex-col items-center justify-center">
                <LoadingSpinner />
                <p className="mt-2 text-sm font-medium text-text-secondary">正在解析 PDF...</p>
            </div>
        ) : (
            <>
                <UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
                <label htmlFor="pdf-upload" className="mt-2 block text-sm font-medium text-primary hover:text-primary-dark cursor-pointer">
                    选择一个文件
                </label>
                <p className="text-xs text-text-secondary mt-1">或将文件拖拽到此处</p>
                <p className="text-xs text-gray-500 mt-1">仅限 PDF 格式</p>
            </>
        )}
      </div>
      
      {pdfError && (
        <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-md" role="alert">
          {pdfError}
        </div>
      )}
      
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在此处粘贴政策文本或从PDF上传..."
          className="w-full h-64 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-shadow duration-200 text-sm"
        />
        {!text && !isParsingPdf && (
           <button 
             onClick={() => setShowExample(true)} 
             className="absolute bottom-3 right-3 text-xs text-primary-light hover:underline"
           >
             使用示例
           </button>
        )}
      </div>

       {showExample && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-sm">
            <p className="font-semibold text-blue-800">要使用示例政策吗？</p>
            <p className="text-blue-700 mt-1">这将使用一份关于新能源消纳的示例政策填充文本框。</p>
            <div className="mt-3">
                <button onClick={handleUseExample} className="px-3 py-1 bg-primary text-white rounded-md text-xs font-semibold hover:bg-primary-dark">是的，使用示例</button>
                <button onClick={() => setShowExample(false)} className="ml-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-xs font-semibold hover:bg-gray-300">取消</button>
            </div>
        </div>
       )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleAnalyzeClick}
          disabled={!text.trim() || isParsingPdf}
          className="px-8 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-dark transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          开始分析
        </button>
      </div>
    </div>
  );
};