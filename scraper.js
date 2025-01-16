const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://sci-hub.se'; // 定义基础 URL

/**
 * 获取详情页面中的实际 PDF 链接
 * @param {string} detailUrl - 详情页面的 URL
 * @returns {string|null} - 实际的 PDF 链接或 null
 */
async function getPdfUrl(detailUrl) {
    try {
        const response = await axios.get(detailUrl);
        const html = response.data;
        const $ = cheerio.load(html);
        const embedSrc = $('#pdf').attr('src');

        if (!embedSrc) {
            console.error(`在详情页 ${detailUrl} 中未找到 #pdf embed 元素的 src 属性。`);
            return null;
        }

        // 处理可能的相对路径
        if (embedSrc.startsWith('//')) {
            return 'https:' + embedSrc;
        } else if (embedSrc.startsWith('http')) {
            return embedSrc;
        } else {
            return BASE_URL + embedSrc; // 使用全局变量
        }
    } catch (error) {
        console.error(`无法获取详情页 ${detailUrl} 的 PDF 链接:`, error.message);
        return null;
    }
}

/**
 * 抓取 Sci-Hub 统计页面的论文信息
 */
async function fetchPaperStats() {
    try {
        const response = await axios.get(`${BASE_URL}/stats`); // 使用全局变量
        const html = response.data;
        const $ = cheerio.load(html);
        const papers = [];

        $('#papers .paper').each((index, element) => {
            const href = $(element).find('a').attr('href');
            const doi = href ? href.substring(1) : ''; // 去掉开头的 '/'
            const dt = $(element).find('.dt').text().trim();
            const title = $(element).find('.title').text().trim();
            const journal = $(element).find('.journal').text().trim();
            const author = $(element).find('.author').text().trim();
            const year = $(element).find('.year').text().trim();
            const pdfLink = `${BASE_URL}${href}`; // 使用全局变量构建完整的详情页面 URL

            papers.push({
                doi,
                datetime: dt,
                title,
                journal,
                author,
                year,
                pdfLink // 先存储详情页面的链接
            });
        });

        console.log(`共抓取到 ${papers.length} 篇论文的信息。`);

        // 获取每篇论文的实际 PDF 链接
        const paperPromises = papers.map(async (paper) => {
            const realPdfLink = await getPdfUrl(paper.pdfLink);
            paper.pdfLink = realPdfLink || "404"; // 如果获取失败，保留原始链接
        });

        await Promise.all(paperPromises);

        console.log('所有论文的 PDF 链接已更新。');
        console.log(papers);
        return papers;
    } catch (error) {
        console.error('抓取'+BASE_URL+'数据时出错:', error.message);
    }
}

module.exports = { fetchPaperStats }; 