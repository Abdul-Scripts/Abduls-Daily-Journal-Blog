//jshint esversion:6

import express from 'express';
import bodyParser from 'body-parser';
import _ from 'lodash';
import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config'

const app = express();

const itemsPool = new Pool({
    connectionString: process.env.DBCONLINK,
    ssl: {
        rejectUnauthorized: false
    }
});

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', async (req, res) => {
    const client = await itemsPool.connect();

    try {
        const result = await client.query('SELECT title, content, author FROM posts');
        const posts = result.rows;

        if (posts.length < 1) {
            // Insert example post if the database is empty
            const examplePost = {
                title: 'Example post',
                content: 'This is an example blog post for test purposes.',
                author: 'Abdul Wahib'
            };

            await client.query('INSERT INTO posts (title, content, author) VALUES ($1, $2, $3)', [examplePost.title, examplePost.content, examplePost.author]);

            res.render('home', { startingContent: homeStartingContent, posts: [examplePost] });
        } else {
            res.render('home', { startingContent: homeStartingContent, posts: posts });
        }
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
});

app.get("/about", function(req, res){
    res.render("about", {aboutContent: aboutContent});
  });
  
app.get("/contact", function(req, res){
res.render("contact", {contactContent: contactContent});
});

app.get("/compose", function(req, res){
res.render("compose");
});

app.post("/compose", async (req, res) => {
    const client = await itemsPool.connect();

    try {
        const { postTitle, postBody, postAuthor } = req.body;
        await client.query('INSERT INTO posts (title, content, author) VALUES ($1, $2, $3)', [postTitle, postBody, postAuthor]);
        res.redirect("/");
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
});

app.get("/posts/:postName", async (req, res) => {
    const requestedTitle = _.lowerCase(req.params.postName);

    const client = await itemsPool.connect();

    try {
        const result = await client.query('SELECT id, title, content, author FROM posts');
        const posts = result.rows;

        posts.forEach(post => {
            const storedTitle = _.lowerCase(post.title);

            if (storedTitle === requestedTitle) {
                res.render("post", {
                    id: post.id, // Add the post ID to the rendered page
                    title: post.title,
                    content: post.content,
                    author: post.author
                });
            }
        });
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
});

app.post("/delete", async (req, res) => {
    const client = await itemsPool.connect();

    try {
        const postIdToDelete = req.body.postId; // Assuming you have a hidden input in your form with name="postId"
        await client.query('DELETE FROM posts WHERE id = $1', [postIdToDelete]);
        res.redirect("/");
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
});

// Route to handle rendering the edit form
app.get('/edit/:postId', async (req, res) => {
    const postId = req.params.postId;
  
    try {
      const result = await itemsPool.query('SELECT * FROM posts WHERE id = $1', [postId]);
      const post = result.rows[0]; // Assuming there's only one post with the given ID
  
      res.render('edit', { post });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching post data');
    }
  });

  // Handle form submission for editing a post
app.post('/edit/:postId', async (req, res) => {
    const postId = req.params.postId;
    const { postTitle, postAuthor, postBody } = req.body;
  
    try {
      await itemsPool.query('UPDATE posts SET title = $1, author = $2, content = $3 WHERE id = $4', [postTitle, postAuthor, postBody, postId]);
      res.redirect('/');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error updating post data');
    }
  });

app.listen(5432, function() {
    console.log("Server started on port 5432");
});