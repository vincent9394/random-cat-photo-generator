// api/cat-diagnostic.js
// 這是一個診斷版本，用來測試與基礎文字模型的連線。
// 檔案已被重新命名以繞過 Vercel 的快取。

// --- 後端函式主體 ---
export default async function handler(request, response) {
    // 只允許 GET 請求
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // 從 Vercel 環境變數中讀取您的 API 金鑰
    const apiKey = process.env.VERTEX_AI_API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: '伺服器未設定 API 金鑰。' });
    }

    try {
        // --- 第一步：仍然獲取貓咪圖片，因為前端需要顯示它 ---
        const catApiResponse = await fetch('https://api.thecatapi.com/v1/images/search');
        if (!catApiResponse.ok) {
            throw new Error('從 The Cat API 獲取圖片失敗');
        }
        const catData = await catApiResponse.json();
        const imageUrl = catData[0].url;

        // --- 第二步：呼叫 Google AI 的純文字模型進行診斷 ---
        // *** 最終診斷：使用具體的 gemini-1.0-pro 模型版本號 ***
        const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`;
        
        // 建立一個純文字的 payload
        const payload = {
            contents: [{
                parts: [{
                    text: '用繁體中文，寫一個關於貓的有趣事實。'
                }]
            }]
        };

        const vertexAIResponse = await fetch(GOOGLE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!vertexAIResponse.ok) {
            const errorBody = await vertexAIResponse.json();
            console.error('Vertex AI API 錯誤:', errorBody);
            throw new Error(`Google AI API 請求失敗: ${errorBody.error?.message || '未知錯誤'}`);
        }

        const result = await vertexAIResponse.json();
        
        if (!result.candidates || result.candidates.length === 0 || !result.candidates[0].content.parts[0].text) {
            console.error('Vertex AI API 回應中沒有有效的 candidates:', result);
            throw new Error('AI 未能生成描述。');
        }
        const description = result.candidates[0].content.parts[0].text;

        // --- 第三步：將圖片 URL 和 AI 生成的文字事實回傳給前端 ---
        response.status(200).json({
            imageUrl: imageUrl,
            description: description.trim(),
        });

    } catch (error) {
        console.error('後端處理錯誤:', error);
        response.status(500).json({
            error: '處理請求時發生內部錯誤。'
        });
    }
}

