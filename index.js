const express = require("express");
const mainRouter = require("./routes/index");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/v1", mainRouter);

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});
