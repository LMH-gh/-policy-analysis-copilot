import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisStep, AnalysisInterpretation } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

const backgroundSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { 
      type: Type.STRING, 
      description: '关于政策背景、上下文和发布机构的简明摘要。' 
    },
    glossary: {
      type: Type.ARRAY,
      description: '关键术语及其定义的列表。',
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: '关键术语，例如“输配电费”。' },
          definition: { type: Type.STRING, description: '在政策背景下该术语的清晰定义。' },
        },
        required: ['term', 'definition'],
      },
    },
  },
  required: ['summary', 'glossary'],
};

const interpretationSchema = {
    type: Type.OBJECT,
    properties: {
        sentences: {
            type: Type.ARRAY,
            description: "政策中每个句子或条款的解读数组。",
            items: {
                type: Type.OBJECT,
                properties: {
                    sentence: { type: Type.STRING, description: "政策文本中的原始句子或条款。" },
                    whatItSays: { type: Type.STRING, description: "对句子字面意思的通俗易懂的解释。" },
                    whyItSaysIt: { type: Type.STRING, description: "句子背后的根本监管意图或目标。" },
                },
                required: ["sentence", "whatItSays", "whyItSaysIt"],
            }
        }
    },
    required: ["sentences"],
};

const vulnerabilitySchema = {
    type: Type.OBJECT,
    properties: {
        vulnerabilities: {
            type: Type.ARRAY,
            description: "潜在漏洞、缺陷或意外后果的列表。",
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING, description: "漏洞的类别（例如，'经济套利'、'定义模糊'、'实施挑战'）。" },
                    vulnerability: { type: Type.STRING, description: "对潜在漏洞或缺陷的详细描述。" },
                    example: { type: Type.STRING, description: "关于如何利用此漏洞的具体示例。" },
                },
                required: ["category", "vulnerability", "example"],
            }
        }
    },
    required: ["vulnerabilities"],
};


const outlookSchema = {
    type: Type.OBJECT,
    properties: {
        predictions: {
            type: Type.ARRAY,
            description: "基于已识别漏洞对未来政策演变的预测。",
            items: {
                type: Type.OBJECT,
                properties: {
                    vulnerability: { type: Type.STRING, description: "正在解决的具体漏洞。" },
                    prediction: { type: Type.STRING, description: "为弥补漏洞而预测的政策修订或演变，格式为：“下一个合乎逻辑的政策演变将是引入修正案 Y...”" },
                },
                required: ["vulnerability", "prediction"],
            }
        }
    },
    required: ["predictions"],
};

const synthesisSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "一个精炼且概括性的报告标题。" },
    introduction: { type: Type.STRING, description: "报告的引言，简要介绍政策的核心目标和分析得出的主要结论。" },
    sections: {
      type: Type.ARRAY,
      description: "报告的主体部分，由多个段落组成。",
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING, description: "该段落的小标题，例如‘核心条款解读’或‘主要风险：经济套利漏洞’。" },
          content: { type: Type.STRING, description: "该段落的具体内容，对一个或多个分析点进行深入阐述。" },
          example: { type: Type.STRING, description: "（可选）一个具体的案例，用以说明该段落的核心观点，尤其是针对漏洞的说明。" },
        },
        required: ["heading", "content"],
      }
    },
    conclusion: { type: Type.STRING, description: "报告的结论，总结政策的潜在影响，并根据漏洞分析和未来预判给出最终建议或展望。" },
  },
  required: ["title", "introduction", "sections", "conclusion"],
};

const interpretationStreamPrompt = (policyText: string) => `
请逐句解析以下政策文本的主体部分。对于每一个句子或逻辑相连的条款，请生成一个单独的JSON对象并立即输出。
每个JSON对象必须在**单独的一行**上，并且不包含任何额外的格式化或标记。

严格遵循以下JSON结构：
{
  "sentence": "政策文本中的原始句子或条款。",
  "whatItSays": "对句子字面意思的通俗易懂的解释。",
  "whyItSaysIt": "句子背后的根本监管意图或目标。"
}

**重要**: 不要将所有JSON对象包裹在一个数组（[...]）中。每个JSON对象都应该自成一行，作为一个独立的实体。所有输出内容请务必使用简体中文。

政策文本:
"""
${policyText}
"""
`;


const getPromptAndSchema = (step: AnalysisStep, policyText: string, context?: any) => {
  const chineseInstruction = "所有输出内容请务必使用简体中文。";
  switch (step) {
    case AnalysisStep.BACKGROUND:
      return {
        prompt: `分析以下政府政策文本。识别关键术语、发布机构和潜在背景。提供一份简明的背景摘要和一份关键术语表。${chineseInstruction}

政策文本:
"""
${policyText}
"""`,
        schema: backgroundSchema,
      };
    case AnalysisStep.INTERPRETATION:
       // This case will now be handled by the streaming function, but kept for potential fallback.
      return {
        prompt: `解析以下政策文本的主体部分。对于每个句子或逻辑上连接的子句，提供详细的解读，解释“它说了什么”（用通俗语言解释字面意思）和“为什么这么说”（监管意图）。${chineseInstruction}

政策文本:
"""
${policyText}
"""`,
        schema: interpretationSchema,
      };
    case AnalysisStep.VULNERABILITY:
      return {
        prompt: `批判性地分析以下政策的潜在漏洞、缺陷或意想不到的后果。考虑经济套利、定义模糊、监管空白和实施挑战。对于每个已识别的漏洞，提供一个如何被利用的具体例子。${chineseInstruction}

政策文本:
"""
${policyText}
"""

先前分析步骤的上下文:
${JSON.stringify(context, null, 2)}
`,
        schema: vulnerabilitySchema,
      };
    case AnalysisStep.OUTLOOK:
      return {
        prompt: `针对所提供上下文中识别出的每个漏洞，预测政策可能会如何演变以解决这些问题。你的预测应该是合乎逻辑的，并直接针对漏洞。${chineseInstruction}

已识别的漏洞:
"""
${JSON.stringify(context, null, 2)}
"""

政策文本参考:
"""
${policyText}
"""
`,
        schema: outlookSchema,
      };
    case AnalysisStep.SYNTHESIS:
      return {
        prompt: `作为一名资深的政策分析师，请根据以下提供的政策文本和已经完成的多阶段分析结果，撰写一篇结构完整、可读性强的综合分析报告。

报告要求：
1.  **整合性**：将背景、解读、漏洞和预判等所有信息融合成一篇连贯的文章，而不是简单罗列。
2.  **洞察力**：提炼出最重要的发现，特别是政策的核心意图和最关键的潜在漏洞。
3.  **案例化**：为关键的分析点（尤其是漏洞部分）设计或引用具体的案例，使其更易于理解。
4.  **结构化**：报告必须包含标题、引言、带有小标题的主体段落和结论。

${chineseInstruction}

政策原文:
"""
${policyText}
"""

已有的分析数据:
"""
${JSON.stringify(context, null, 2)}
"""
`,
        schema: synthesisSchema,
      };
    default:
      throw new Error("无效的分析步骤");
  }
};

export async function* generateAnalysisStream(policyText: string): AsyncGenerator<AnalysisInterpretation> {
  try {
    const stream = await ai.models.generateContentStream({
      model,
      contents: interpretationStreamPrompt(policyText),
    });

    let buffer = '';
    for await (const chunk of stream) {
      buffer += chunk.text;
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.substring(0, newlineIndex).trim();
        buffer = buffer.substring(newlineIndex + 1);
        if (line) {
          try {
            // Trim potential markdown backticks for JSON
            const cleanedLine = line.replace(/^```json/, '').replace(/```$/, '').trim();
            if (cleanedLine) {
                 yield JSON.parse(cleanedLine);
            }
          } catch (e) {
            console.warn("Skipping malformed JSON line:", line);
          }
        }
      }
    }
    // Process any remaining text in the buffer after the loop
    if (buffer.trim()) {
        try {
            const cleanedLine = buffer.trim().replace(/^```json/, '').replace(/```$/, '').trim();
            if (cleanedLine) {
                 yield JSON.parse(cleanedLine);
            }
        } catch (e) {
            console.warn("Skipping malformed JSON line at end of stream:", buffer);
        }
    }

  } catch (error) {
    console.error(`Error during Gemini API stream for interpretation:`, error);
    throw new Error(`“${AnalysisStep.INTERPRETATION}”分析失败。请检查您的 API 密钥和网络连接。`);
  }
}

export const generateAnalysis = async <T,>(step: AnalysisStep, policyText: string, context?: any): Promise<T> => {
  const { prompt, schema } = getPromptAndSchema(step, policyText, context);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString) as T;
    } catch (parseError) {
        console.error("Failed to parse JSON response:", jsonString);
        throw new Error("AI 返回的响应格式不正确，请重试。");
    }

  } catch (error) {
    console.error(`Error during Gemini API call for step "${step}":`, error);
    throw new Error(`“${step}”分析失败。请检查您的 API 密钥和网络连接。`);
  }
};