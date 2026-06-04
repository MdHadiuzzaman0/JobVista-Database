const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URL;
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("JobVista");
    const jobCollection = database.collection("jobCollection");
    const appliedCollection = database.collection("appliedCollection");
    const savedCollection = database.collection("savedCollection");
    const personalInfoCollection = database.collection("personalInfoCollection");

    //get all job
    app.get("/explore_jobs", async (req, res) => {
      const result = await jobCollection.find().toArray();
      res.json(result);
    });

    //get job by id
    app.get("/explore_jobs/:id", async (req, res) => {
      const { id } = req.params;
      const result = await jobCollection.findOne({ _id: new ObjectId(id) });
      res.json(result);
    });

    //insert applied jobs
    app.post("/applied_jobs", async (req, res) => {
      try {
        const appliedData = req.body;
        const result = await appliedCollection.insertOne(appliedData);
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: "Database insertion failed" });
      }
    });

    //insert saved jobs
    app.post("/saved_jobs", async (req, res) => {
      try {
        const savedData = req.body;
        const result = await savedCollection.insertOne(savedData);
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: "Database insertion failed" });
      }
    });

    //get applied job
    app.get("/applied_jobs/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await appliedCollection.find({ email: email }).toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch applied jobs" });
      }
    });

    //get saved job
    app.get("/saved_jobs/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await savedCollection.find({ email: email }).toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch saved jobs" });
      }
    });

    //delete applied data
    app.delete("/removeJob/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const appliedResult = await appliedCollection.deleteOne({ _id: new ObjectId(id) });
        res.status(200).json({
          success: true,
          appliedDeletedCount: appliedResult.deletedCount,
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    //delete save data
    app.delete("/removeSavedJob/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const savedResult = await savedCollection.deleteOne({ _id: new ObjectId(id) });
        res.status(200).json({
          success: true,
          savedDeletedCount: savedResult.deletedCount,
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    //update personal info
    app.put("/profile/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const updatedData = req.body; 
        const result = await personalInfoCollection.updateOne({ email: email }, { $set: updatedData });
        return res.status(200).json({
          success: true,
          message: "Profile updated successfully via URL param",
        });

      } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
      }
    });









    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
