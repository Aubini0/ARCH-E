
const searchBotInvoke = async (req, res) => {
    try {
        const message = req.query.message;
        console.log(message)
        
        if (typeof message === "string" && message) {
            
            for(let i = 0; i < 10; i++) {
                let token = "hello " + i + " "
                
                console.log(token)
                res.write(token);
                
                //await sleep(100);
            }
            res.end();
        } else {
            res.json({ error: "No message provided" });
        }
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
