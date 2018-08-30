//import the express module
var express = require('express');
const request = require("request");


const servPort = 80;
const k = '';

//remove for ssl, localhost configuration solves self_signed_cert error
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var repId = [2159,2160,2161,2162,2163,2164];
var wowHeadbase = 'https://www.wowhead.com/item=';

var returnObjects = [];

var baseURL = 'http://localhost:80/';

//store the express in a variable 
var app = express();


//init html
app.get('/', function(req, res) {
    res.sendFile(__dirname + "/" + "index.html");
});

app.get('/query', async function outp(req, res){

    var character = req.query.char;
    var realm     = req.query.real;

    res.write("<html><head><title>" + character + "(" + realm + ")" + "</title><style>p{margin-left: 5px;} body{background-color:#000;}</style></head>");
    var footer = '<br><p style="float: right; margin-right: 10%;">Run another <a href="' + baseURL + '">query</a>';
    
    if ( character == "" || realm == "" ){ 
        res.end("Character/realm combination not found."); 
    } else {
    try{
    var query     = await getCharData(character,realm); 
    if ( query == 404 ){
        res.end("Character/realm combination not found."); 
    }
    var charArray = query.items;

    for ( t in query.titles ){
  
        if ( query.titles[t].selected == true ){
          var title = query.titles[t].name.replace("%s","");
        } else { var title = ""; }
    }
    if (query.talents[0].spec.calcTalent != null || query.talents[0].spec.calcTalent != '' ){
        var spec = query.talents[0].spec.name;
    }
    var charIMG = query.thumbnail.replace("avatar","main");
    res.write('<div style="margin-left:8%; background-image: url(http://render-us.worldofwarcraft.com/character/' + charIMG + '); background-repeat:no-repeat; width:100%; height:100%;">')
    res.write("<div style='background: white; float:left; width:30%; height:50%; border: 1px solid #000;'> <p>Character Report for <b>" + title + query.name + "</b>, equipped iLevel: <b>" + query.items.averageItemLevelEquipped + "</b><br></p>");
    res.write("<p>Showing results for current spec <b>" + spec + "</b></p>");
    for( var i in charArray ){
      
        var thisObject = charArray[i];
        var iURL       = wowHeadbase + thisObject.id;
        
        returnObjects.push([i,iURL,thisObject.name,thisObject.itemLevel,thisObject.context]);

    }

    returnObjects.splice(0,2);
        for ( var s in returnObjects ){
            var plURL = '<a href="' + returnObjects[s][1] + '" target="_new">' + returnObjects[s][2] + '</a>';
            var slot  = returnObjects[s][0];
            var lvl   = returnObjects[s][3];
            var drop  = returnObjects[s][4].replace("dungeon-","");
            res.write("&nbsp;Slot: " + slot + " " + plURL + " (<b>" + lvl + "</b>) Drop type: " + drop + "<br>");
        }
    returnObjects = [];
    res.write(footer);
    res.end("</html>");
    console.log("completed query");

    } catch(error){
        res.write("Character/realm combination not found.<br>");
        res.write(footer);
        res.end("</html>");
    }
}
    
});

function getCharData(character,realm){
    
    var scope = 'items+titles+talents';
    var baseURI = 'https://us.api.battle.net/wow/';
    var charURI = 'character/' + realm + '/' + character + '?fields=' + scope;
    var postURI = '&locale=en_US&apikey=' + k;
    var requestURI = baseURI + charURI + postURI;

    console.log("Initiating query for: " + character + " on realm: " + realm + " uri: " + requestURI);

    return new Promise((resolve, reject) => {

        request(requestURI, {json: true }, (err, response, char) => {
            if (err) reject(err);
            if (response.statusCode != 200) {
                console.log('Invalid status code <' + response.statusCode + '>');
                reject(response.statusCode);
            }
            resolve(char);
        });

    });
}

//init server
var server = app.listen(servPort, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log("Application started running on port %s", port);
});
