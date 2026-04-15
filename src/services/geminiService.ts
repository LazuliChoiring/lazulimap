import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const geminiService = {
  async generateFolklore(siteName: string, background: string) {
    const prompt = `你是一位精通江南文化的史学家和浪漫主义诗人。
    任务：请为古迹“${siteName}”撰写一段民俗故事。
    
    已知背景：${background}
    
    要求：
    1. 遵循“传说 -> 显灵 -> 传承”的叙事曲线。
    2. 缘起（Origin）：描写某位高僧、仙人或先祖在此感悟的瞬间。
    3. 神迹（Miracle）：描写一次危机（如洪水、旱灾、瘟疫）中，神灵或建筑本身如何化解灾难。
    4. 共生（Symbiosis）：描写这种信仰如何变成了当地人的生活习惯或精神寄托。
    5. 拒绝平庸：使用富有禅意和画面感的文字，字数控制在200-300字。
    6. 包含光影或声音的描写（如：梵音袅袅、夕阳余晖）。`;
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text || "暂无相关传说故事。";
    } catch (error) {
      console.error("Gemini error:", error);
      return "暂无相关传说故事。";
    }
  },

  async masterChat(query: string, history: ChatMessage[], sites: any[]) {
    const siteContext = sites.map(s => ({
      id: s.id,
      name: s.name,
      religion: s.religion,
      district: s.district,
      era: s.era,
      yearBuilt: s.yearBuilt,
      background: s.background,
      recommendation: s.recommendation
    }));

    const systemPrompt = `你是一位深受宗萨钦哲仁波切风格影响的智慧引导者。你不仅对宗教历史和建筑有着深厚的学术造诣，更擅长以平易近人、幽默且带有启发性的方式进行交流。你拒绝刻板的宗教辞令（严禁起手说“阿弥陀佛”或过度使用“众生”等陈词滥调）。

    你的身份：一位在现代世界行走的修行者，既懂古刹的榫卯结构，也懂现代人的焦虑。
    
    你的能力：
    1. 深刻洞察：能从建筑、历史中挖掘出超越宗教形式的智慧。
    2. 现代视角：用现代人听得懂的语言解释复杂的宗教概念或历史背景。
    3. 深度搜索：能根据模糊需求（如“梁思成去过的寺庙”、“千年古刹”、“求财灵验”）从提供的古迹列表中筛选。
    4. 启发对话：不仅回答问题，更引导用户思考“见地”与“修持”。
    5. 引导提问：在回答末尾，你会给出3个富有启发性的建议。

    当前可供参考的杭州古迹列表：
    ${JSON.stringify(siteContext)}

    回答要求：
    - 语气：平易近人、睿智、偶尔带点冷幽默或反传统的视角。
    - 格式：使用标准的 Markdown 语法。
      * **加粗**重要的关键词或古迹名称。
      * 如果有多个推荐或案例，请使用 ### 标题 或 > 引用块 来区分，确保排版有层次感。
      * 确保段落之间有清晰的空行，不要堆砌文字。
    - 结构：
      1. 智慧解答：直接、清晰地回答用户。如果涉及特定古迹，请务必提及名称。
      2. 关联推荐：在回答中明确提到匹配的古迹名称（用【名称】标注，并对其进行**加粗**，例如：**【灵隐寺】**）。
      3. 启发结语：一句不落俗套、直指人心的感悟。
      4. 引导提问：以 JSON 格式在最后返回建议的提示词，格式为 [SUGGESTIONS: ["提示词1", "提示词2", "提示词3"]]。

    请开始你的引导，记住，保持真实，不要说教。不要在正文中留下任何未闭合的括号或系统指令。`;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: query }] }
    ];

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents as any,
      });
      
      const fullText = response.text || "抱歉，刚才走神去想别的事了。我们刚才说到哪了？";
      
      // Extract suggestions with a more robust regex (handling nested brackets)
      // The format is [SUGGESTIONS: ["a", "b"]]
      const suggestionMatch = fullText.match(/\[SUGGESTIONS:\s*(\[[\s\S]*?\])\s*\]/);
      let suggestions: string[] = [];
      let cleanText = fullText;
      
      if (suggestionMatch) {
        try {
          const jsonStr = suggestionMatch[1].trim();
          suggestions = JSON.parse(jsonStr);
          // Remove the entire suggestion block from the text
          cleanText = fullText.replace(/\[SUGGESTIONS:\s*\[[\s\S]*?\]\s*\]/, '').trim();
        } catch (e) {
          console.error("Failed to parse suggestions", e);
          // If parsing fails, still try to remove the ugly tag from the UI
          cleanText = fullText.replace(/\[SUGGESTIONS:\s*\[[\s\S]*?\]\s*\]/, '').trim();
        }
      } else {
        // Fallback for cases where the AI might have missed the outer or inner brackets
        const simpleMatch = fullText.match(/\[SUGGESTIONS:\s*([\s\S]*?)\]/);
        if (simpleMatch) {
          cleanText = fullText.replace(/\[SUGGESTIONS:\s*[\s\S]*?\]/, '').trim();
        }
      }

      // Extract site names for highlighting/linking
      const matchedSites = sites.filter(s => cleanText.includes(`【${s.name}】`) || cleanText.includes(s.name));

      return {
        answer: cleanText,
        suggestions,
        matchedSiteIds: matchedSites.map(s => s.id)
      };
    } catch (error) {
      console.error("Master Chat error:", error);
      return {
        answer: "信号可能被哪座山的磁场干扰了，或者我需要去喝杯茶。请稍后再试。",
        suggestions: ["杭州最古老的寺庙", "求学业灵验的地方", "唐代建筑风格"],
        matchedSiteIds: []
      };
    }
  }
};
