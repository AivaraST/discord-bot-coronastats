// Import libraries;
const Discord = require('discord.js');
const axios = require('axios');
const moment = require('moment');
const dotenv = require('dotenv').config();
const statesData = require('./states');

// Create discord bot instance;
const client = new Discord.Client();

// Check is bot are ready to go;
client.once('ready', () => {
    console.log('Bot are ready!');
});

// Connect bot to the server;
client.login(process.env.CLIENT_KEY);

// Commands
const BOT_COMMAND = '!costats';

// Check is command was writed;
client.on('message', async (message) => {
    
    // Check is message in channel which name has 'covid';
    if(message.channel.name.search('covid') == -1) {
        return;
    }

    // Extract message;
    let splitMessage = message.content.split(' ');
    let command = splitMessage[0];
    let country = splitMessage[1];

    // Check is message are good;
    if(splitMessage.length > 2) {
        return;
    }

    if(command !== BOT_COMMAND) {
        return;
    }

    if(country.length < 2) {
        return;
    }

    // Check is input is only country code;
    statesData.states.map((state) => {
        if(state.code.toLowerCase() === country.toLowerCase()) {
            country = state.name; 
        }
    });

    // Get stats from axios;
    const data = await getCoronaStatsByCountry(country);

    // Check is data good;
    if(data === null) {
        return;
    }

    if(data === undefined) {
        return;
    }

    const stats = {
        total: data.total_cases.length > 0 ? data.total_cases : 0,
        active: data.active_cases.length > 0 ? data.active_cases : 0,
        new: data.new_cases.length > 0 ? data.new_cases : 0,
        recovered: data.total_recovered.length > 0 ? data.total_recovered : 0,
        deaths: data.total_deaths.length > 0 ? data.total_deaths : 0
    };
    
    // Format and send message via discord bot;
    const formatMessage = new Discord.MessageEmbed()
        .setColor('#ff0000')

        .setTitle('COVID-19 ' + data.country_name + ' statistika')
        .setDescription('Koronavirusai – tai didelė grupė virusų, kurie gali sukelti įvairias ligas. Dažniausiai koronavirusai sukelia lengvas ar net besimptomes infekcijas, tačiau gali sukelti ir sunkias kvėpavimo takų infekcijas. Naujajam koronavirusui būdingi į gripą panašūs simptomai: karščiavimas, kosulys, dusulys ir kiti kvėpavimo sutrikimai. Sunkesniais atvejais naujasis koronavirusas sukelia plaučių uždegimą, sunkų ūmų respiracinį sindromą, inkstų nepakankamumą ar mirtį. Prašome būti supratingais ir laikytis karantino, taip apsaugosite save, bei kitus.')

        .addField('Paskutinį kartą atnaujinta', moment(data.record_date).format('YYYY-MM-D HH:mm:ss'))
        .addField('Nauji susirgimai šiandieną', stats.new)
        .addField('Šiuo metų sergantys', stats.active, true)
        .addField('Pasveikę nuo viruso', stats.recovered, true)
        .addField('Mirę nuo viruso', stats.deaths, true)
        .addField('Iš viso virusu sirgo', stats.total)
        
        .setFooter(`Paskutinį kartą atnaujinta ${moment(data.record_date).format('YYYY-MM-D HH:mm:ss')}`);
    message.channel.send(formatMessage);

    console.log(`[${message.guild.name}] used by ${message.author.username}`);
});

// Function to get data from API.
async function getCoronaStatsByCountry(country) {
    let responseData;

    await axios({
        method: 'GET',
        url: 'https://coronavirus-monitor.p.rapidapi.com/coronavirus/latest_stat_by_country.php',
        headers: {
            'x-rapidapi-host': 'coronavirus-monitor.p.rapidapi.com',
	        'x-rapidapi-key': '15d20185f4msheda1de7459f4045p1e1c41jsn93e179c8337c'
        },
        params: {
            'country': country
        }
    })
    .then((response) => {
        responseData = response.data.latest_stat_by_country[0];
    })
    .catch((error) => {
        responseData = null;
    });

    return responseData;
}