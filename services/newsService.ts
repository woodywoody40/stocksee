/**
 * Fetches the content of the first news article found on Google News for a given query.
 * This is a multi-step process that involves scraping and can be brittle if the
 * source website's structure changes.
 *
 * @param query The search query (e.g., a stock name and code).
 * @returns A promise that resolves to the text content of the first article.
 */
export const fetchFirstNewsArticle = async (query: string): Promise<string> => {
    // We use a public CORS proxy to bypass browser security restrictions.
    const proxyUrl = 'https://corsproxy.io/?';

    // 1. Search on Google News
    const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
    const proxiedSearchUrl = `${proxyUrl}${encodeURIComponent(searchUrl)}`;
    
    let articleUrl: string;

    try {
        const searchResponse = await fetch(proxiedSearchUrl);
        if (!searchResponse.ok) throw new Error(`Google News search failed with status: ${searchResponse.status}`);
        
        const searchHtml = await searchResponse.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(searchHtml, 'text/html');
        
        // Find the first article link. Google News links are relative and start with './articles/'.
        const firstArticleLink = doc.querySelector('a[href^="./articles/"]');
        if (!firstArticleLink) {
            console.warn("Could not find a news article link on the search results page.");
            throw new Error("找不到相關新聞，請稍後再試。");
        }
        
        // Reconstruct the full URL
        const relativeUrl = firstArticleLink.getAttribute('href');
        if(!relativeUrl) throw new Error("Found a link but could not extract href.");
        
        articleUrl = new URL(relativeUrl, 'https://news.google.com').href;

    } catch (error) {
        console.error("Error during news search:", error);
        throw new Error("搜尋新聞時發生錯誤，請檢查您的網路連線。");
    }

    // 2. Fetch the actual article page from its full URL
    try {
        const proxiedArticleUrl = `${proxyUrl}${encodeURIComponent(articleUrl)}`;
        const articleResponse = await fetch(proxiedArticleUrl);
        if (!articleResponse.ok) throw new Error(`Failed to fetch article page with status: ${articleResponse.status}`);

        const articleHtml = await articleResponse.text();
        const articleDoc = new DOMParser().parseFromString(articleHtml, 'text/html');

        // 3. Extract text content. This is a generic approach targeting paragraph tags.
        const paragraphs = articleDoc.querySelectorAll('p');
        if (paragraphs.length === 0) {
           throw new Error("無法從新聞頁面中提取文章內容，來源網站結構可能不相容。");
        }
        
        const articleText = Array.from(paragraphs)
            .map(p => p.textContent?.trim())
            .filter(Boolean)
            .join('\n\n');
        
        if (articleText.length < 100) { // Arbitrary threshold for meaningful content
            console.warn("Extracted article text seems too short:", articleText);
            throw new Error("提取的文章內容過短，可能無法進行有效分析。");
        }

        return articleText;

    } catch (error) {
        console.error("Error fetching or parsing article content:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("讀取新聞內容時發生錯誤。");
    }
};
