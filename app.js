const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

// const date = require(__dirname + "/date.js");
const Schema = mongoose.Schema;
const model = mongoose.model;

const user = process.env.USER;

const password = process.env.PASSWORD;

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  `mongodb+srv://${user}:${password}@cluster0.2i8wuhu.mongodb.net/todolistDB`
);

const itemsSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
});

const Item = model("Item", itemsSchema);

const item_1 = new Item({
  name: "Welcome to your todolist",
});

const item_2 = new Item({
  name: "Hit the + button to add a new item",
});

const item_3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item_1, item_2, item_3];

const listSchema = new Schema({
  name: String,
  items: [itemsSchema],
});

const List = model("List", listSchema);

app.get("/", function (req, res) {
  // const day = date.getDate();
  Item.find()
    .then((items) => {
      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => console.log("Succesfully saved items to database"))
          .catch((err) => console.log("ERROR!!!!", err));
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }
    })
    .catch((err) => console.log("ERROR!!!!", err));
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: req.body.newItem,
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((response) => {
      response.items.push(newItem);
      response.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log(`Deleted ${checkedItemId} Successfully`);
        res.redirect("/");
      })
      .catch((err) => console.log("Deletion Error: " + err));
  } else {
    // The $pull operator removes from an existing array all instances of a value or values that match a specified condition.(mongodb)
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => console.log("Deletion Error: " + err));
  }
});

app.get("/:customList", function (req, res) {
  const customListName = _.capitalize(req.params.customList);

  List.findOne({ name: customListName })
    .then((response) => {
      if (response) {
        res.render("list", {
          listTitle: response.name,
          newListItems: response.items,
        });
      } else {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      }
    })
    .catch((err) => console.log(err));
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
