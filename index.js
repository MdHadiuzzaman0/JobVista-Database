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
    await jobCollection.createIndex({ "$**": "text" }); // it's like an index is created
    const appliedCollection = database.collection("appliedCollection");
    const savedCollection = database.collection("savedCollection");
    const userInfoCollection = database.collection("userInfoCollection");

    // get all job (used for initially)
    // app.get("/explore_jobs", async (req, res) => {
    //   const result = await jobCollection.find().toArray();
    //   res.json(result);
    // });

    // get all jobs, Filter, Search
    app.get("/jobs", async (req, res) => {
      try {
        const { category, type, search } = req.query;
        let query = {}; // we can use any word instead of query.

        if (category) {
          query.category = { $regex: category, $options: "i" };
        }
        if (type) {
          const typeArray = type.split(",");
          query.type = { $in: typeArray };
        }
        if (search) {
          query.$text = { $search : search } // ne need to write more line

          // query.$or = [
          //   { title: { $regex: search, $options: "i" } },
          //   { company: { $regex: search, $options: "i" } },
          //   { description: { $regex: search, $options: "i" } }
          // ];
        }

        const jobs = await jobCollection.find(query).toArray();
        return res.status(200).json({ success: true, count: jobs.length, data: jobs });
      } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
      }
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

    //add personal info of create_profile section
    app.post('/user', async (req, res) => {
      try {
        const userData = req.body;
        const result = await userInfoCollection.insertOne(userData);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to insert data to database" });
      }
    });

    //get user info
    app.get("/user/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await userInfoCollection.findOne({ email: email });
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch saved jobs" });
      }
    });

    //update personal info of manage profile section
    app.put("/profile/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const updatedData = req.body;
        const result = await userInfoCollection.updateOne({ email: email }, { $set: { ...updatedData, updatedAt: new Date() } });
        return res.status(200).json({

          success: true,
          message: "Profile updated successfully via URL param",
        });

      } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
      }
    });

    //single Filter
    // app.get("/jobs", async (req, res) => {
    //   try {
    //     const typesQuery = req.query.types;
    //     // 🎯 লাইন চেঞ্জ: action.js যেহেতু ?types=Remote পাঠিয়েছিল, 
    //     // তাই এক্সপ্রেস কুয়েরি রিড করে পেল: typesQuery = "Remote" (স্ট্রিং)

    //     let query = {}; // ২. মঙ্গোডিবির ফাঁকা কুয়েরি খাঁচা তৈরি হলো।

    //     if (typesQuery) {
    //       // 🎯 লাইন চেঞ্জ: typesQuery-তে "Remote" থাকায় শর্ত সত্য হলো এবং কোড ব্লকের ভেতরে ঢুকলো।

    //       const typesArray = typesQuery.split(",");
    //       // 🎯 লাইন চেঞ্জ: .split(",") মেথড স্ট্রিং "Remote" কে ভেঙে অ্যারে বানিয়ে দিল।
    //       // এখন: typesArray = ['Remote']

    //       query.type = { $in: typesArray };
    //       // 🎯 লাইন চেঞ্জ: মঙ্গোডিবির $in অপারেটর কুয়েরি অবজেক্টের চেহারা বদলে দিল।
    //       // এখন মেইন কুয়েরি অবজেক্ট: query = { type: { $in: ['Remote'] } }
    //     }

    //     const result = await jobCollection.find(query).toArray();
    //     // 🎯 লাইন চেঞ্জ: ডাটাবেজে ফাইনাল কুয়েরি রান হলো: jobCollection.find({ type: { $in: ['Remote'] } })
    //     // মঙ্গোডিবি শুধু সেইসব জব খুঁজে বের করলো যাদের টাইপ 'Remote' এবং সেগুলোকে result ভ্যারিয়েবলে অ্যারে আকারে রাখলো।

    //     res.send(result);
    //     // 🎯 লাইন চেঞ্জ: এই ছেঁকে নেওয়া রিমোট জবের লিস্টটি এক্সপ্রেস সার্ভার রেসপন্স আকারে ফ্রন্টএন্ডে ব্যাক পাঠিয়ে দিল!
    //   } catch (error) {
    //     console.error("Server error during filtering:", error);
    //     res.status(500).send({ error: "Failed to fetch filtered data" });
    //   }
    // });












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
