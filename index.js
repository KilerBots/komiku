const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

async function Detail(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        let result = [];
        $('img[itemprop="image"]').each((i, el) => {
            result.push($(el).attr('src'));
        });
        return result;
    } catch (error) {
        console.error(error);
        return { error: "Gagal mengambil detail." };
    }
}

async function Search(query, type = 'manga') {
    try {
        const { data } = await axios.get(`https://api.komiku.id?post_type=${type}&s=${query.replace(' ', '+')}`);
        const $ = cheerio.load(data);
        let result = [];
        $('.bge').each((i, el) => {
            let cover = $(el).find('.bgei img').attr('src');
            let title = $(el).find('.kan h3').text().trim();
            let title2 = $(el).find('.judul2').text();
            let link = 'https://komiku.id' + $(el).find('.kan a').attr('href');
            let type = $(el).find('.tpe1_inf b').text();
            result.push({ title, title2, type, cover, link });
        });
        return result;
    } catch (error) {
        console.error(error);
        return { error: "Gagal mengambil hasil pencarian." };
    }
}

async function Info(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let sinopsis = $('.desc').text().trim();
        let title = $('.inftable tr:nth-child(1) td:nth-child(2)').text();
        let title2 = $('.inftable tr:nth-child(2) td:nth-child(2)').text();
        let type = $('.inftable tr:nth-child(3) td:nth-child(2) b').text();
        let konsep = $('.inftable tr:nth-child(4) td:nth-child(2)').text();
        let author = $('.inftable tr:nth-child(5) td:nth-child(2)').text();
        let status = $('.inftable tr:nth-child(6) td:nth-child(2)').text();
        let genre = $('.genre span[itemprop="genre"]').map((i, el) => $(el).text()).get();
        let cover = $('img[itemprop="image"]').attr('src');
        let chapter = [];

        $('.judulseries').each((i, el) => {
            if ($(el).html().includes('Nomor')) return;
            let link = 'https://komiku.id' +  $(el).find('a').attr('href');
            chapter.push({ link });
        });

        $('.tanggalseries').each((i, el) => {
            if ($(el).html().includes('Tanggal')) return;
            let upDate = $(el).text().trim();
            if (chapter[i - 1]) {
                chapter[i - 1].upDate = upDate;
            }
        });

        return { title, title2, type, author, status, konsep, genre, sinopsis, cover, chapter };
    } catch (error) {
        console.error(error);
        return { error: "Gagal mengambil informasi manga/manhwa." };
    }
}

// Route API
app.get('/search', async (req, res) => {
    const { query, type } = req.query;
    if (!query) return res.status(400).json({ error: "Parameter 'query' diperlukan." });

    const result = await Search(query, type);
    res.json(result);
});

app.get('/detail', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Parameter 'url' diperlukan." });

    const result = await Detail(url);
    res.json(result);
});

app.get('/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Parameter 'url' diperlukan." });

    const result = await Info(url);
    res.json(result);
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
