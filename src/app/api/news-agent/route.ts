import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import * as cheerio from 'cheerio';
import axios from 'axios';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY
});

async function fetchAndParseURL(url: string) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Remove script tags, style tags, and comments
    $('script').remove();
    $('style').remove();
    $('comments').remove();
    
    // Get the main content (focusing on article tags, main content divs, etc.)
    const title = $('title').text() || $('h1').first().text();
    const mainContent = $('article').text() || $('main').text() || $('body').text();
    
    // Clean up the text
    const cleanText = mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 15000); // Limit text length
    
    return {
      title,
      content: cleanText,
      url
    };
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw new Error('Failed to fetch and parse the URL');
  }
}

async function searchNews(query: string) {
  try {
    const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const response = await axios.get(searchUrl);
    const $ = cheerio.load(response.data, { xmlMode: true });
    
    const articles = $('item').map((_, item) => {
      const $item = $(item);
      return {
        title: $item.find('title').text(),
        link: $item.find('link').text(),
        pubDate: $item.find('pubDate').text(),
        description: $item.find('description').text()
      };
    }).get().slice(0, 5); // Get top 5 related news
    
    return articles;
  } catch (error) {
    console.error('Error searching news:', error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { input, type } = await req.json();

    if (!input) {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    let content = '';
    let relatedNews = [];
    
    // Handle URL input
    if (type === 'url' && input.startsWith('http')) {
      const articleData = await fetchAndParseURL(input);
      content = articleData.content;
      relatedNews = await searchNews(articleData.title);
    } 
    // Handle keyword/topic input
    else {
      content = input;
      relatedNews = await searchNews(input);
    }

    // Generate AI analysis using Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a knowledgeable news analyst and researcher. Analyze the provided content and create a comprehensive summary that includes:\n1. Main points and key takeaways\n2. Background context\n3. Potential implications\n4. Critical analysis\nBe informative, objective, and thorough in your analysis."
        },
        {
          role: "user",
          content: `Please analyze this content and provide insights: ${content}`
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 2048,
    });

    const analysis = completion.choices[0]?.message?.content || 'No analysis generated';

    return NextResponse.json({
      analysis,
      relatedNews
    });

  } catch (error) {
    console.error('Error in news agent:', error);
    return NextResponse.json(
      { error: 'Failed to process the request' },
      { status: 500 }
    );
  }
} 