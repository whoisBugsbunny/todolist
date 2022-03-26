//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const monngoose = require("mongoose");
const _ = require('lodash');
const { disabled } = require("express/lib/application");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const dbname = "todolistDB";
monngoose.connect(`mongodb+srv://admin-aekit:aekitpassme@cluster0.ikrgy.mongodb.net/${dbname}`);

const itemSchema = {
    name: String
};

const listSchema = {
    name: String,
    items: [itemSchema]
};

const Item = monngoose.model("Item", itemSchema);
const List = monngoose.model("List", listSchema);

const item1 = new Item({ name: "to do list" });
const item2 = new Item({ name: "hit + to add a new item" });
const item3 = new Item({ name: "hit <- to delete an item" });

const defaultItems = [item1, item2, item3];

const items = [];

const workItems = [];

app.get("/", function (req, res) {
    Item.find((err, r) => {
        if (err) {
            console.log(err);
        } else {
            if (r.length === 0) {
                Item.insertMany(defaultItems, (err) => {
                    err ? console.log(err) : console.log("default data inserted");
                })
            }
            res.render("list", { listTitle: "Today", newListItems: r });
        }
    })
});

app.get("/:customRoute", function (req, res) {
    const customRoute = _.capitalize(req.params.customRoute);
    List.findOne({ name: customRoute }, function (err, results) {
        if (!err) {
            if (!results) {
                //create new list
                const list = new List({
                    name: customRoute,
                    items: defaultItems
                });

                list.save();
                res.redirect('/' + customRoute);
            } else {
                //show the list
                res.render("list", { listTitle: customRoute, newListItems: results.items });
            }
        }
    });

});

app.post("/", function (req, res) {
    const newItem = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({ name: newItem });

    if (req.body.list === "Today") {
        item.save();
        setTimeout(function () {
            res.redirect("/");
        }, 0);
    } else {
        List.findOne({ name: listName }, function (err, result) {
            result.items.push(item);
            result.save();
            setTimeout(function () {
                res.redirect('/' + listName);
            }, 0);
        });
    }
});

app.post("/delete", function (req, res) {
    const del_item = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndRemove(del_item, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("successfully deleted.");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: del_item } } }, function (err, result) {
            if (!err) {
                res.redirect('/' + listName);
            }
        });
    }
});


app.get("/work", function (req, res) {
    res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
    res.render("about");
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});