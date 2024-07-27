import { NextRequest, NextResponse } from 'next/server';
import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Process the data with Anthropic
    const { text } = await generateText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      prompt: `What does this say: ${JSON.stringify(data)}`
    })

    console.log(text)


    // Return a success response with the analysis
    return NextResponse.json({ message: text, }, { status: 200 });
  } catch (error) {
    console.error('Error processing submission:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}