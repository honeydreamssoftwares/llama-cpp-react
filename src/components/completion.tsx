interface Params {
  api_key?: string;
  n_predict: number,
  stream: boolean
}

interface Config {
  controller?: AbortController;
  api_url?: string;
}

interface CompletionParams extends Params {
  prompt: string;
}

interface EventError {
  message: string;
  code: number;
  type: string;
}

interface GenerationSettings {
  n_ctx: number;
  n_predict: number;
  model: string;
  seed: number;
  temperature: number;
  dynatemp_range: number;
  dynatemp_exponent: number;
  top_k: number;
  top_p: number;
  min_p: number;
  tfs_z: number;
  typical_p: number;
  repeat_last_n: number;
  repeat_penalty: number;
  presence_penalty: number;
  frequency_penalty: number;
  penalty_prompt_tokens: string[];
  use_penalty_prompt_tokens: boolean;
  mirostat: number;
  mirostat_tau: number;
  mirostat_eta: number;
  penalize_nl: boolean;
  stop: string[];
  n_keep: number;
  n_discard: number;
  ignore_eos: boolean;
  stream: boolean;
  logit_bias: boolean[];
  n_probs: number;
  min_keep: number;
  grammar: string;
  samplers: string[];
}

interface EventData {
  content: string;
  id_slot: number;
  stop: boolean;
  model: string;
  tokens_predicted: number;
  tokens_evaluated: number;
  generation_settings: GenerationSettings;
  prompt: string;
  truncated: boolean;
  stopped_eos: boolean;
  stopped_word: boolean;
  stopped_limit: boolean;
  stopping_word: string;
  tokens_cached: number;
  timings: {
      prompt_n: number;
      prompt_ms: number;
      prompt_per_token_ms: number;
      prompt_per_second: number;
      predicted_n: number;
      predicted_ms: number;
      predicted_per_token_ms: number;
      predicted_per_second: number;
  };
}

interface SSEEvent {
  event?: unknown;
  data?: EventData;
  id?: string;
  retry?: number;
  error?: EventError; // Define a more specific error interface if possible
  [key: string]: unknown;
}


type ParsedValue = string | EventData | EventError | undefined;

export async function* llama(prompt: string, params: Params, config: Config = {}): AsyncGenerator<SSEEvent, string, undefined> {
  const controller = config.controller ?? new AbortController();
  const api_url = config.api_url ?? "";

  const completionParams: CompletionParams = {
      ...params,
      prompt
  };

  const response = await fetch(`${api_url}/completion`, {
      method: 'POST',
      body: JSON.stringify(completionParams),
      headers: {
          'Connection': 'keep-alive',
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(params.api_key ? { 'Authorization': `Bearer ${params.api_key}` } : {})
      },
      signal: controller.signal,
  });

  if(response.body===null){
    return "No response";
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let content = "";
  let leftover = "";

  try {
      let cont = true;

      while (cont) {
          const result = await reader.read();
          if (result.done) {
              break;
          }

          const text = leftover + decoder.decode(result.value);
          const endsWithLineBreak = text.endsWith('\n');
          const lines = text.split('\n');

          if (!endsWithLineBreak) {
              leftover = lines.pop() ?? "";
          } else {
              leftover = "";
          }

          for (const line of lines) {
            const match = /^(\S+):\s(.*)$/.exec(line);
            if (match) {
                let key = match[1];
                const value:ParsedValue = match[2];
        
                const event: Partial<SSEEvent> = {};
                if (key === "data" || key === "error") {
                    // Attempt to parse JSON for data or error fields
                    try {
                      if(value){
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        event[key] = JSON.parse(value);
                      }
                    } catch {
                        event[key] = value as unknown as EventData & EventError;  // Use raw value if JSON parsing fails
                    }
                } else {
                  if(!key){
                    key='0';
                  }
                    event[key] = value;
                }
        
                // Specific processing for parsed data
                if (key === "data" && event.data) {
                    content += event.data.content;
                    yield event as SSEEvent;
        
                    if (event.data.stop) {
                        cont = false;
                        break;
                    }
                }
        
                // Handling errors
                if (key === "error" && event.error) {
                    try {
                        if (event.error.message.includes('slot unavailable')) {
                            throw new Error('slot unavailable');
                        } else {
                            console.error(`llama.cpp error [${event.error.code} - ${event.error.type}]: ${event.error.message}`);
                        }
                    } catch(e) {
                        console.error(`Error parsing error data:`, event.error);
                    }
                }
            }
        }
      }
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "name" in e && (e as { name: string }).name !== 'AbortError') {
        console.error("llama error: ", e);
    } else if (e instanceof Error) {
        // This checks if it's an Error object which is more specific and safer
        console.error("llama error: ", e.message);
    } else {
        // Handle cases where error is not an object or unexpected type
        console.error("Unexpected error type:", e);
    }
    throw e;
} finally {
      controller.abort();
  }

  return content;
}
