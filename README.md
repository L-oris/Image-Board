# Image Board

Image Board is a Full Stack application that allow users to upload images and interact with pictures uploaded by others, by commenting and liking them.

Main technologies used:
*   Backbone
*   Express JS
*   PostgreSQL
*   AWS S3


### Description

Latest uploaded pictures are displayed on the main page.
![](./public/README_gifs/home.png)
<br/>
<br/>

When clicking on 'Upload' a modal is rendered. There you can select a file from your file system, give it name & description and finally upload it on AWS S3.
![](./public/README_gifs/uploader.png)
<br/>
<br/>

Clicking on an picture shows it at full size.<br/>
Users can add comments and/or like the image.<br/>
The application doesn't require login, so I used cookies to keep track of likes.
![](./public/README_gifs/comment.gif)
<br/>
<br/>
