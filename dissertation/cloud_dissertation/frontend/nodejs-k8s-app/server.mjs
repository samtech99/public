process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// server.mjs
import { app } from './common.mjs';
import './get.mjs';
import './post.mjs';

const port = 8080;
app.listen(port, () => {
    console.log(`Node.js app listening at http://localhost:${port}`);
});
