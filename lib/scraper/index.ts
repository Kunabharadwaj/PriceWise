
import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractCurrency, extractDescription, extractPrice } from '../utils';


export async function scrapeAmazonProduct(url:string) {
    if(!url) return;

    // BrightData proxy configuration

    const userName = String(process.env.BRIGHT_DATA_USERNAME);
    const password = String(process.env.BRIGHT_DATA_PASSWORD);
    const port = 22225;
    const session_id = (1000000 * Math.random()) | 0;

    const options = {
        auth: {
          username: `${userName}-session-${session_id}`,
          password,
        },
        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized: false,
      }

      try{
        const response = await axios.get(url, options)
        const $ = cheerio.load(response.data);

        const title = $('#productTitle').text().trim();
        const currentPrice = extractPrice(
          $('.priceToPay span.a-price-whole'),
          $('.a.size.base.a-color-price'),
          $('.a-button-selected .a-color-base'),
        ).substring(0,2)

        const originalPrice = extractPrice(
          $('#priceblock_ourprice'),
          $('.a-price.a-text-price span.a-offscreen'),
          $('#listPrice'),
          $('#priceblock_dealPrice'),
          $('.a-size-base .a-color-price')
        ).substring(0,2)

        const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable'

        const images = $('#imgBlkFront').attr('data-a-dynamic-image') || $('#landingImage').attr('data-a-dynamic-image') || '{}'

        const imageUrls = Object.keys(JSON.parse(images))

        const currency = extractCurrency(
          $('.a-price-symbol'),
        )

        const description = extractDescription($);

        const discountRate = $('.savingsPercentage').text().replace(/[-%]/g,"").substring(0,2);
        // construct data object with the scraped data
        const data ={
          url,
          image: imageUrls[0],
          currency: currency || '£',
          title,
          currentPrice: Number(currentPrice),
          originalPrice: Number(originalPrice),
          priceHistory: [],
          discountRate: Number(discountRate),
          category: 'category',
          reviewsCount: 1,
          stars: 4.5,
          isOutOfStock: outOfStock,
          description: String(description),
          lowestPrice: Number(currentPrice) || Number(originalPrice),
          highestPrice: Number(originalPrice) || Number(currentPrice),
          averagePrice: Number(currentPrice) || Number(originalPrice)
        }

        return data;
        console.log({title,currentPrice,originalPrice,outOfStock,imageUrls,currency,discountRate, data});
        
      }catch(error: any){
        throw new Error(`Failed to scrape product:${error.message}`)
      }
}