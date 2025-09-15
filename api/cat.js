// api/cat.js
// 簡化版本：只從 The Cat API 獲取圖片 URL。

export default async function handler(request, response) {
    // 只允許 GET 請求
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 從 The Cat API 獲取隨機圖片
        const catApiResponse = await fetch('https://api.thecatapi.com/v1/images/search');
        if (!catApiResponse.ok) {
            throw new Error('從 The Cat API 獲取圖片失敗');
        }
        const catData = await catApiResponse.json();
        const imageUrl = catData[0].url;

        // 直接將圖片 URL 回傳給前端
        response.status(200).json({
            imageUrl: imageUrl,
        });

    } catch (error) {
        console.error('後端處理錯誤:', error);
        response.status(500).json({
            error: '處理請求時發生內部錯誤。',
            details: error.message || '未知錯誤',
        });
    }
}

