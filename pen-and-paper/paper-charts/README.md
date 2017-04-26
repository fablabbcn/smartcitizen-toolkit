Paper Charts
============================

This is a tool under ongoing development for generating printable charts from Smart Citizen data for workshops.

The script pulls the data from a **tag** and generates the charts for a time interval and a selected sensor.

![in action](https://raw.githubusercontent.com/fablabbcn/smartcitizen-toolkit/75c35192/pen-and-paper/paper-charts/inaction.jpg)

##  Run

Download the repository. As on many other examples you will also need nodejs and npm install. Check the instructions for [Mac](https://changelog.com/posts/install-node-js-with-homebrew-on-os-x) or [Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04).

On the folder run to install the dependencies

```
npm install
``` 

Adjust any settings on `js/index.js` file and run the server like.

``` 
gulp
```

Open http://localhost:3000/ and print the charts as a regular webpage.


![pdf](https://rawgit.com/fablabbcn/smartcitizen-toolkit/master/pen-and-paper/paper-charts/example.png)



