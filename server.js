const express = require('express');
const app = express();

const cors = require('cors');
const PORT = 4000;

app.use(cors());
app.use(express.json());


var testAPIRouter = require("./routes/testAPI");

// Routes
app.use("/testAPI", testAPIRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});