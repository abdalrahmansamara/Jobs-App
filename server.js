'use strict'

require('dotenv').config()
const express = require('express')
const server = express();
const pg = require('pg')
const superagent = require('superagent');
const methodOverride = require('method-override');

const client = new pg.Client(process.env.DATABASE_URL)
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

server.set('view engine','ejs')
server.use(methodOverride('_method'))
server.use(express.static('./public'))
server.use(methodOverride('_method'))
server.use(express.urlencoded({extended:true})); 
// for storing the data inside the body, instead of the url or the form data

const PORT = process.env.PORT || 3000;

client.connect()
.then(()=>{
server.listen(PORT, () => {
    console.log(`listening to port ${PORT}`)
})
});



server.get('/', mainPage)
server.get('/search', handleSearch)
server.get('/results', renderResults)
server.post('/MyList', addToDatabase)
server.get('/MyList',renderMyList)
server.get('/details/:id', detailsPage)
server.delete('/delete/:id', handleDelete)
server.put('/update/:id',handleUpdate)

function mainPage(req,res){
    let jobsArray=[];
    let url = `https://jobs.github.com/positions.json?location=usa`;
    superagent.get(url)
    .then(jobs=>{
        jobs.body.forEach(job=>{
            let newJob = new Jobs(job)
            jobsArray.push(newJob);
        })
        res.render('main',{jobs: jobsArray})
    })
}

function handleSearch(req,res){
    res.render('search')
}

function renderResults(req,res){
    let description = req.query.description;
    let jobsArray=[];
    let url = `https://jobs.github.com/positions.json?description=${description}&location=usa`;
    superagent.get(url)
    .then(jobs=>{
        jobs.body.forEach(job=>{
            let newJob = new Jobs(job)
            jobsArray.push(newJob);
        })
        res.render('viewResults',{jobs:jobsArray})
    })
}

function addToDatabase(req,res){
    let {title,company,location,url, description}=req.body;
    let sql = `insert into jobs (title,company,location,url, description) values ($1,$2,$3,$4,$5);`
    let safeValues = [title,company,location,url, description];
    client.query(sql,safeValues)
    .then(()=>{
        res.redirect('/MyList')
    })
}

function renderMyList (req,res){
    let sql = `select * from jobs;`
    client.query(sql)
    .then(data=>{
        res.render('MyList',{jobs:data.rows})
    })
}

function detailsPage(req,res){
    let id= req.params.id;
    let sql = `select * from jobs where id=$1;`
    let safeValues=[id];
    client.query(sql,safeValues)
    .then(data=>{
        res.render('details',{job:data.rows[0]})
    })
}

function handleDelete(req,res){
    let sql = `delete from jobs where id=$1;`
    let safeValues=[req.params.id]
    client.query(sql,safeValues)
    .then(()=>{
        res.redirect('/MyList')
    })
}

function handleUpdate(req,res){
    let id= req.params.id;
    let {title,company,location,url, description}=req.body;
    let sql = `update jobs set title=$1, company=$2, location=$3, url=$4, description=$5 where id=$6;`
    let safeValues = [title,company,location,url, description,id]
    client.query(sql,safeValues)
    .then(()=>{
        res.redirect(`/details/${id}`)
    })
}


function Jobs(element){
    this.title=element.title
    this.company=element.company
    this.location=element.location
    this.url=element.url
    this.description = element.description;
}
// this was fun