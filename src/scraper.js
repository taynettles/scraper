const cheerio = require('cheerio');
const axios = require('axios');
const router = require('express').Router();
const { generateFilename, saveProductJson, generateTitle } = require('./utils');

const baseUrl = 'https://www.amazon.com';

router.post('/scrape', async (req, res) => {
    const { url } = req.body;
    //validate url
    if (!url.includes(baseUrl)) {
        console.log("Invalid URL");
        return;
    }

    try {
        //Get HTML from URL
        axios.get(url).then((response) => {
            // Load HTML to cheerio
            const $ = cheerio.load(response.data);

            // Create empty array to store products
            const products = [];

            // Loop through each product on the page
            $('.s-result-item').each((i, el) => {
                const product = $(el);

                const priceWhole = product.find(".a-price-whole").text();
                const priceFraction = product.find(".a-price-fraction").text();
                const price = priceWhole + priceFraction;

                const link = product.find(".a-link-normal.a-text-normal").attr("href");
                const title = generateTitle(product, link);

                // If both title, price and link are not empty, add to products array
                if (title !== '' && price !== '' && link !== '') {
                    products.push({ title, price, link });
                }
            });
            // Call the saveProductJson function to save the products array to a JSON file
            saveProductJson(products);

            //return a success message with the number of products scraped and the filename
            res.json({
                products_saved: products.length,
                message: "Products scraped successfully",
                filename: generateFilename(),
            });
        });
    } catch(error) {
        res.statusCode(500).json({
            message: "Error scraping products",
            error: error.message,
        });
    }
});

// Export router so it can be used in server.js file
module.exports = router;