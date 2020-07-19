const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemsSchema = {
  name: String,
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Get After It',
});

const item2 = new Item({
  name: 'Game Time',
});

const item3 = new Item({
  name: 'Play to Win The Game',
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model('List', listSchema);

// ================================================
// HOME ROUTE
// ================================================
app.get('/', function (req, res) {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        err ? console.log(err) : console.log('Successfully added items to DB');
        res.redirect('/');
      });
    }

    res.render('list', { listTitle: 'Today', newListItems: foundItems });
  });
});

// ================================================
// EXPRESS ROUTE PARAMETERS
// ================================================
app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();

        res.redirect(`/${customListName}`);
      } else {
        // Show an existing list
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

// ================================================
// ADD TO LIST
// ================================================

app.post('/', function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect(`/${listName}`);
    });
  }
});

app.post('/delete', function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      err ? console.log(err) : console.log('Deleted Item Successfully');

      res.redirect('/');
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

app.get('/work', function (req, res) {
  res.render('list', { listTitle: 'Work List', newListItems: workItems });
});

app.get('/about', function (req, res) {
  res.render('about');
});

app.listen(3000, function () {
  console.log('Server started on port 3000');
});
