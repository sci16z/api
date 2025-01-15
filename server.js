   // server.js
   const express = require('express');
   const app = express();
   const PORT = process.env.PORT || 3000;
   const { fetchPaperStats } = require('./scraper');

   app.use(express.json());

   app.get('/', (req, res) => {
       res.send('欢迎来到我的 RESTful API!');
   });

   app.get('/api/papers', async (req, res) => {
       try {
           const papers = await fetchPaperStats();
           res.json(papers);
       } catch (error) {
           res.status(500).json({ message: '无法获取论文数据' });
       }
   });

   app.listen(PORT, () => {
       console.log(`服务器正在运行在 http://localhost:${PORT}`);
   });