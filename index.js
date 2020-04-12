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
    // if(message.channel.name.search('covid') == -1) {
    //     return;
    // }

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
        total: data.total_cases.length > 0 ? parseInt(data.total_cases.replace(/,/g, '')) : 0,
        active: data.active_cases.length > 0 ? parseInt(data.active_cases.replace(/,/g, '')) : 0,
        new: data.new_cases.length > 0 ? parseInt(data.new_cases.replace(/,/g, '')) : 0,
        recovered: data.total_recovered.length > 0 ? parseInt(data.total_recovered.replace(/,/g, '')) : 0,
        deaths: data.total_deaths.length > 0 ? parseInt(data.total_deaths.replace(/,/g, '')) : 0,
        new_deaths: data.new_deaths.length > 0 ? parseInt(data.new_deaths.replace(/,/g, '')) : 0,
    };

    let deathRate = parseFloat(((stats.deaths / stats.total) * 100)).toFixed(2);
    let recoverRate = parseFloat(((stats.recovered / stats.total) * 100)).toFixed(2);
    console.log(stats.deaths, stats.recovered, stats.total);
    // Format and send message via discord bot;
    const formatMessage = new Discord.MessageEmbed()
        .setColor('#ff0000')

        .setTitle('COVID-19 ' + data.country_name + ' statistika')

        .addField('Serga', `**${stats.active}** ${stats.new > 0 ? `(+${stats.new})` : ``}`, true)
        .addField('Mirė', `**${stats.deaths}** ${stats.new_deaths > 0 ? `(+${stats.new_deaths})` : ``}`, true)
        .addField('Pasveiko', `**${stats.recovered}**`, true)

        .addField('Iš viso virusu sirgo', `**${stats.total}**`)

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