// api/cat.js
// 這個版本改為使用 fetch 直接呼叫 Google's REST API，只需要一個 API 金鑰。

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
        // --- 第一步：獲取隨機貓咪圖片 ---
        const catApiResponse = await fetch('https://api.thecatapi.com/v1/images/search');
        if (!catApiResponse.ok) {
            throw new Error('從 The Cat API 獲取圖片失敗');
        }
        const catData = await catApiResponse.json();
        const imageUrl = catData[0].url;

        // --- 第二步：準備並呼叫 Vertex AI REST API ---
        const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${apiKey}`;

        // 下載圖片並轉換為 Base64
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        
        // 建立請求的 payload
        const payload = {
            contents: [{
                parts: [{
                    inline_data: {
                        mime_type: 'image/jpeg',
                        data: imageBase64
                    }
                }, {
                    text: '用繁體中文，以一句有趣且富有想像力的短句描述這隻貓。'
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
        const description = result.candidates[0].content.parts[0].text;

        // --- 第三步：將結果回傳給前端 ---
        response.status(200).json({
            imageUrl: imageUrl,
            description: description.trim(),
        });

    } catch (error) {
        console.error('後端處理錯誤:', error);
        response.status(500).json({
            error: '處理請求時發生內部錯誤。',
            details: error.message
        });
    }
}

