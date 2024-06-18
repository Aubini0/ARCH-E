import { ChatOpenAI } from "@langchain/openai";
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";
import * as hub from "langchain/hub";
import { SerpAPI } from "@langchain/community/tools/serpapi";


const prompt = await hub.pull("hwchase17/openai-functions-agent");

const searchBotInvoke = async (req, res) => {
    try {
        //const message = req.query.message;
        //console.log(message)
        //const { query } = req.body;
        const query = req.query.message;
        
        if (typeof query === "string" && query) {
            
            const llm = new ChatOpenAI({
                model: "gpt-4",
                temperature: 0,
                streaming: true,
            });
            
            const tools = [
                new SerpAPI(process.env.SERAP_API_KEY)
            ];
            const agent = await createOpenAIFunctionsAgent({
                llm,
                tools,
                prompt,
            });
            
            const agentExecutor = new AgentExecutor({
                agent,
                tools,
                verbose: false,
            });
            
            const eventStream = await agentExecutor.streamEvents(
                { input: query },
                { version: "v1" }
            );
            for await (const event of eventStream) {
                const eventType = event.event;
                //console.log(eventType)
                //res.write(eventType)
                
                if (eventType === "on_chain_start") {
                // Was assigned when creating the agent with `.withConfig({"runName": "Agent"})` above
                    if (event.name === "Agent") {
                        console.log(eventType)
                        // console.log("\n-----");
                        // console.log(
                        //     `Starting agent: ${event.name} with input: ${JSON.stringify(
                        //         event.data.input
                        //     )}`
                        // );
                    }
                } else if (eventType === "on_chain_end") {
                    // Was assigned when creating the agent with `.withConfig({"runName": "Agent"})` above
                    if (event.name === "Agent") {
                        console.log(eventType)
                        // console.log("\n-----");
                        // console.log(`Finished agent: ${event.name}\n`);
                        // console.log(`Agent output was: ${event.data.output}`);
                        // console.log("\n-----");
                    }
                } else if (eventType === "on_llm_stream") {
                    const content = event.data?.chunk?.message?.content;
                    // Empty content in the context of OpenAI means
                    // that the model is asking for a tool to be invoked via function call.
                    // So we only print non-empty content
                    if (content !== undefined && content !== "") {
                        //token = `| ${content}`
                        //console.log(eventType)
                        //console.log(content);
                        //res.write(content)
                        res.write(JSON.stringify({"event_type": eventType, "name": "llm", "data": content}))
                    }
                    
                    
                } else if (eventType === "on_tool_start") {
                    console.log(eventType)
                    console.log("\n-----");
                    console.log(
                        `Starting tool: ${event.name} with inputs: ${event.data.input}`
                    );
                    res.write(JSON.stringify({"event_type": eventType, "name": event.name, "data": event.data.input}))
                    
                } else if (eventType === "on_tool_end") {
                    console.log(eventType)
                    console.log("\n-----");
                    console.log(`Finished tool: ${event.name}\n`);
                    console.log(`Tool output was: ${event.data.output}`);
                    console.log("\n-----");
                    res.write(JSON.stringify({"event_type": eventType, "name": event.name}))
                }
                
                //await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            res.end();
        } else {
            res.json({ error: "No message provided" });
        }
        
        //console.log(result.output)
        console.log('>>>> Chain End')
        res.end();
        
    } catch (err) {
        console.log(err)
        
        const { status } = err;
        const s = status ? status : 500;
        res.status(s).send({
            success: err.success,
            error: err.message,
        });
    }
};


export {
    searchBotInvoke
};
