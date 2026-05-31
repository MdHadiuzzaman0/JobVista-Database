const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_URL
const port = process.env.PORT

app.use(cors());
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const database = client.db("JobVista");
    const jobCollection = database.collection("jobCollection");
    const appliedCollection = database.collection("appliedCollection");

    //get all data
    app.get('/explore_jobs', async (req, res) => {
      const result = await jobCollection.find().toArray()
      res.json(result)
    })

    //get job by id
    app.get("/explore_jobs/:id", async (req, res) => {
      const { id } = req.params
      const result = await jobCollection.findOne({ _id: new ObjectId(id) })
      res.json(result)
    })

    //applied jobs
    app.post("/appliedData", async (req, res) => {
      try {
        const appliedData = req.body;
        const result = await appliedCollection.insertOne(appliedData)
        res.status(200).json({ result, message: "Application saved successfully!" });
      } catch (error) {
        res.status(500).json({ error: "Database insertion failed" });
      }
    });

    //get applied job
    app.get("/appliedData/:email", async (req, res) => {
  try {
    const email = req.params.email;
    // ডাটাবেজ থেকে ওই ইমেইলের সব অ্যাপ্লাইড জব খুঁজে বের করবে
    const result = await appliedCollection.find({ email: email }).toArray();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch applied jobs" });
  }
});







    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
