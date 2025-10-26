// src/app/api/ai-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { openai, AI_CONFIG } from '@/lib/openai';
import { traceable } from 'langsmith/traceable';
import {
  // Tool 1: Personalized Rankings
  rankSchoolsTool,
  executeRankSchools,
  rankSchoolsSchema,
  RankSchoolsParams,
  // Tool 2: Sport Search
  searchSchoolsBySportTool,
  executeSearchSchoolsBySport,
  searchSchoolsBySportSchema,
  SearchSchoolsBySportParams,
  // Tool 3: CCA Search
  searchSchoolsByCCATool,
  executeSearchSchoolsByCCA,
  searchSchoolsByCCASchema,
  SearchSchoolsByCCAParams,
  // Tool 4: Academic Search
  searchSchoolsByAcademicTool,
  executeSearchSchoolsByAcademic,
  searchSchoolsByAcademicSchema,
  SearchSchoolsByAcademicParams,
  // Tool 5: School Details
  getSchoolDetailsTool,
  executeGetSchoolDetails,
  getSchoolDetailsSchema,
  GetSchoolDetailsParams,
  // Tool 6: Affiliation Search
  searchSchoolsByAffiliationTool,
  executeSearchSchoolsByAffiliation,
  searchSchoolsByAffiliationSchema,
  SearchSchoolsByAffiliationParams,
  // Tool 7: Simple Personalized Ranking
  rankSchoolsSimpleTool,
  executeRankSchoolsSimple,
  rankSchoolsSimpleSchema,
  RankSchoolsSimpleParams
} from '@/lib/ai-tools';
import { AI_SYSTEM_PROMPT, RESPONSE_TEMPLATES } from '@/lib/ai-prompts';
import { getCachedRanking, setCachedRanking } from '@/lib/cache';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Message schema for validation
const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  tool_calls: z.array(z.any()).optional(),
  tool_call_id: z.string().optional(),
  name: z.string().optional()
});

const requestSchema = z.object({
  messages: z.array(messageSchema),
  sessionId: z.string().optional(),
  stream: z.boolean().default(true)
});

// Wrap chat completion with LangSmith tracing
const createChatCompletion = traceable(
  async (conversationMessages: any[], sessionId: string, stream: boolean) => {
    return await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: conversationMessages as any,
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      tools: [
        {
          type: 'function',
          function: rankSchoolsTool
        },
        {
          type: 'function',
          function: searchSchoolsBySportTool
        },
        {
          type: 'function',
          function: searchSchoolsByCCATool
        },
        {
          type: 'function',
          function: searchSchoolsByAcademicTool
        },
        {
          type: 'function',
          function: getSchoolDetailsTool
        },
        {
          type: 'function',
          function: searchSchoolsByAffiliationTool
        },
        {
          type: 'function',
          function: rankSchoolsSimpleTool
        }
      ],
      tool_choice: 'auto',
      stream: stream
    });
  },
  {
    name: 'OpenAI Chat Completion',
    run_type: 'llm',
    metadata: (conversationMessages: any[], sessionId: string) => ({
      session_id: sessionId,
      message_count: conversationMessages.length,
      has_tool_calls: conversationMessages.some((m: any) => m.tool_calls),
      model: AI_CONFIG.model
    })
  }
);

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request
    const body = await req.json();
    const { messages, sessionId = nanoid(), stream = true } = requestSchema.parse(body);

    console.log('🤖 AI Chat Request:', {
      sessionId,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 100) + '...',
      stream
    });

    // Build conversation history with system prompt
    const conversationMessages: Array<any> = [
      {
        role: 'system',
        content: AI_SYSTEM_PROMPT
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
        ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
        ...(msg.name && { name: msg.name })
      }))
    ];

    // Create OpenAI chat completion with function calling and LangSmith tracing
    const response = await createChatCompletion(conversationMessages, sessionId, stream);

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // Track multiple tool calls with separate buffers
            const toolCallsMap = new Map<string, {
              id: string;
              name: string;
              argsBuffer: string;
            }>();
            let allToolCallsComplete = false;

            for await (const chunk of response as any) {
              const delta = chunk.choices[0]?.delta;

              if (delta?.content) {
                // Regular content streaming
                const data = JSON.stringify({
                  type: 'content',
                  content: delta.content,
                  sessionId
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }

              if (delta?.tool_calls) {
                // OpenAI can send multiple tool calls in parallel
                for (const toolCall of delta.tool_calls) {
                  // Use index as the key - this is consistent across all chunks
                  const index = toolCall.index ?? 0;
                  const callKey = `tool_${index}`;

                  if (toolCall?.function?.name) {
                    // Initialize new tool call with function name
                    if (!toolCallsMap.has(callKey)) {
                      toolCallsMap.set(callKey, {
                        id: toolCall.id || callKey,
                        name: toolCall.function.name,
                        argsBuffer: ''
                      });

                      console.log(`[DEBUG] Initialized tool call at index ${index}: ${toolCall.function.name}`);

                      // Notify frontend about tool call start
                      const toolStartData = JSON.stringify({
                        type: 'tool_start',
                        toolName: toolCall.function.name,
                        sessionId
                      });
                      controller.enqueue(encoder.encode(`data: ${toolStartData}\n\n`));
                    }
                  }

                  // Accumulate arguments for this specific tool call
                  if (toolCall?.function?.arguments) {
                    const existingCall = toolCallsMap.get(callKey);
                    if (existingCall) {
                      existingCall.argsBuffer += toolCall.function.arguments;
                      console.log(`[DEBUG] Added ${toolCall.function.arguments.length} chars to tool at index ${index}, total: ${existingCall.argsBuffer.length}`);
                    } else {
                      console.warn(`[WARN] Received arguments for index ${index} but tool not initialized yet`);
                    }
                  }
                }
              }

              // Check if all tool calls are complete
              if (toolCallsMap.size > 0 && chunk.choices[0]?.finish_reason === 'tool_calls') {
                try {
                  // Execute all tool calls in parallel
                  const toolResults: any[] = [];
                  const toolCallsList = Array.from(toolCallsMap.values());

                  console.log(`🔧 Processing ${toolCallsList.length} tool call(s)`);

                  for (const toolCall of toolCallsList) {
                    // Validate and parse tool arguments
                    if (!toolCall.argsBuffer || toolCall.argsBuffer.trim() === '') {
                      throw new Error(`Empty tool call arguments buffer for ${toolCall.name}`);
                    }

                    // Validate JSON completeness before parsing
                    const trimmed = toolCall.argsBuffer.trim();

                    // Check if JSON looks complete (must start with { and end with })
                    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
                      console.error('[JSON ERROR] Incomplete JSON buffer:', {
                        name: toolCall.name,
                        bufferLength: trimmed.length,
                        firstChars: trimmed.substring(0, 50),
                        lastChars: trimmed.substring(Math.max(0, trimmed.length - 50))
                      });
                      throw new Error(`Incomplete JSON buffer for ${toolCall.name}: does not start with { or end with }`);
                    }

                    let toolArgs: any;
                    try {
                      toolArgs = JSON.parse(toolCall.argsBuffer);
                      console.log('🔧 Tool Call:', toolCall.name, toolArgs);
                    } catch (parseError: any) {
                      console.error('[JSON PARSE ERROR]:', {
                        name: toolCall.name,
                        error: parseError.message,
                        buffer: toolCall.argsBuffer,
                        bufferLength: toolCall.argsBuffer.length,
                        position: parseError.message.match(/position (\d+)/)?.[1]
                      });
                      throw new Error(`Failed to parse tool arguments for ${toolCall.name}: ${parseError.message}`);
                    }

                    let result: any;

                    // Route to appropriate tool executor based on tool name
                    switch (toolCall.name) {
                      case 'rankSchools': {
                        const validatedParams = rankSchoolsSchema.parse(toolArgs);
                        result = await executeRankSchools(validatedParams);
                        break;
                      }

                      case 'searchSchoolsBySport': {
                        const validatedParams = searchSchoolsBySportSchema.parse(toolArgs);
                        result = await executeSearchSchoolsBySport(validatedParams, sessionId);
                        break;
                      }

                      case 'searchSchoolsByCCA': {
                        const validatedParams = searchSchoolsByCCASchema.parse(toolArgs);
                        result = await executeSearchSchoolsByCCA(validatedParams, sessionId);
                        break;
                      }

                      case 'searchSchoolsByAcademic': {
                        const validatedParams = searchSchoolsByAcademicSchema.parse(toolArgs);
                        result = await executeSearchSchoolsByAcademic(validatedParams, sessionId);
                        break;
                      }

                      case 'getSchoolDetails': {
                        const validatedParams = getSchoolDetailsSchema.parse(toolArgs);
                        result = await executeGetSchoolDetails(validatedParams, sessionId);
                        break;
                      }

                      case 'searchSchoolsByAffiliation': {
                        const validatedParams = searchSchoolsByAffiliationSchema.parse(toolArgs);
                        result = await executeSearchSchoolsByAffiliation(validatedParams);
                        break;
                      }

                      case 'rankSchoolsSimple': {
                        const validatedParams = rankSchoolsSimpleSchema.parse(toolArgs);
                        result = await executeRankSchoolsSimple(validatedParams);
                        break;
                      }

                      default:
                        throw new Error(`Unknown tool: ${toolCall.name}`);
                    }

                    // Send tool result to frontend
                    const toolResultData = JSON.stringify({
                      type: 'tool_result',
                      toolName: toolCall.name,
                      result: result,
                      sessionId
                    });
                    controller.enqueue(encoder.encode(`data: ${toolResultData}\n\n`));

                    // Store for follow-up message construction
                    toolResults.push({
                      toolCall,
                      toolArgs,
                      result
                    });
                  }

                  // Build follow-up messages with ALL tool results
                  const followUpMessages = [
                    ...conversationMessages,
                    {
                      role: 'assistant' as const,
                      content: null,
                      tool_calls: toolResults.map(tr => ({
                        id: tr.toolCall.id,
                        type: 'function' as const,
                        function: {
                          name: tr.toolCall.name,
                          arguments: JSON.stringify(tr.toolArgs)
                        }
                      }))
                    },
                    ...toolResults.map(tr => ({
                      role: 'tool' as const,
                      content: JSON.stringify(tr.result),
                      tool_call_id: tr.toolCall.id
                    }))
                  ];

                  // Get AI's follow-up response
                  const followUpResponse = await openai.chat.completions.create({
                    model: AI_CONFIG.model,
                    messages: followUpMessages,
                    max_tokens: AI_CONFIG.maxTokens,
                    temperature: AI_CONFIG.temperature,
                    stream: true
                  });

                  // Stream the follow-up response
                  for await (const followUpChunk of followUpResponse) {
                    const followUpDelta = followUpChunk.choices[0]?.delta;
                    if (followUpDelta?.content) {
                      const data = JSON.stringify({
                        type: 'content',
                        content: followUpDelta.content,
                        sessionId
                      });
                      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    }

                    if (followUpChunk.choices[0]?.finish_reason) {
                      break;
                    }
                  }

                } catch (error) {
                  console.error('Tool execution error:', error);
                  console.error('Tool calls in map:', Array.from(toolCallsMap.entries()).map(([id, tc]) => ({
                    id,
                    name: tc.name,
                    argsLength: tc.argsBuffer.length,
                    argsPreview: tc.argsBuffer.substring(0, 100)
                  })));

                  const errorMessage = error instanceof SyntaxError
                    ? 'Received incomplete data from AI. Please try again.'
                    : 'Failed to process school search. Please try again.';

                  const errorData = JSON.stringify({
                    type: 'error',
                    error: errorMessage,
                    sessionId
                  });
                  controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
                }

                // Reset tool calls map
                toolCallsMap.clear();
              }

              // Check for completion
              if (chunk.choices[0]?.finish_reason &&
                  chunk.choices[0]?.finish_reason !== 'tool_calls') {
                break;
              }
            }

            // Send completion signal
            const doneData = JSON.stringify({
              type: 'done',
              sessionId
            });
            controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          } catch (error) {
            console.error('Streaming error:', error);
            const errorData = JSON.stringify({
              type: 'error',
              error: 'An error occurred during the conversation.',
              sessionId
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          } finally {
            controller.close();
          }
        }
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });

    } else {
      // Handle non-streaming response (fallback)
      const completion = response as any; // Type assertion for non-streaming

      let assistantMessage = completion.choices[0]?.message;
      let toolResults: any[] = [];

      // Handle tool calls if present
      if (assistantMessage?.tool_calls) {
        for (const toolCall of assistantMessage.tool_calls) {
          try {
            const toolArgs = JSON.parse(toolCall.function.arguments);
            let result: any;

            // Route to appropriate tool executor
            switch (toolCall.function.name) {
              case 'rankSchools': {
                const validatedParams = rankSchoolsSchema.parse(toolArgs);
                result = await executeRankSchools(validatedParams);
                break;
              }

              case 'searchSchoolsBySport': {
                const validatedParams = searchSchoolsBySportSchema.parse(toolArgs);
                result = await executeSearchSchoolsBySport(validatedParams, sessionId);
                break;
              }

              case 'searchSchoolsByCCA': {
                const validatedParams = searchSchoolsByCCASchema.parse(toolArgs);
                result = await executeSearchSchoolsByCCA(validatedParams, sessionId);
                break;
              }

              case 'searchSchoolsByAcademic': {
                const validatedParams = searchSchoolsByAcademicSchema.parse(toolArgs);
                result = await executeSearchSchoolsByAcademic(validatedParams, sessionId);
                break;
              }

              case 'getSchoolDetails': {
                const validatedParams = getSchoolDetailsSchema.parse(toolArgs);
                result = await executeGetSchoolDetails(validatedParams, sessionId);
                break;
              }

              default:
                throw new Error(`Unknown tool: ${toolCall.function.name}`);
            }

            toolResults.push({
              toolCall,
              result
            });

          } catch (error) {
            console.error('Tool execution error:', error);
            toolResults.push({
              toolCall,
              error: `Failed to execute ${toolCall.function.name}`
            });
          }
        }
      }

      return NextResponse.json({
        message: assistantMessage,
        toolResults,
        sessionId,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('AI Chat API Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}