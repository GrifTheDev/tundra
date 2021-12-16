const { prefix, defaultColor } = require('../json/graphic_config.json');
const { default: axios } = require('axios')
const { MessageEmbed } = require('discord.js')

module.exports = {
    name: 'ping',
    desc: 'Text version of the ping command. A bit more advanced.',
    cooldown: 10,
    permissions: ['MANAGE_MESSAGES'],
    commandUsage: `${prefix}ping`,
    async execute(message, args, client) {

        const msg = await message.reply({ content: `<a:loop:919687254727884850> Retrieving GET Request time...`, allowedMentions: { repliedUser: false } });

        var startTime = Date.now()

        axios.get('https://discord.com')
            .then(async (res) => {

                var endTime = Date.now()
                var timeTaken = endTime - startTime

                var msgEditStart = Date.now()

                await msg.edit({ content: `<a:loop:919687254727884850> Retrieving Message Edit time...`, allowedMentions: { repliedUser: false } })

                var msgEditEnd = Date.now()
                var msgEditTime = msgEditEnd - msgEditStart

                await msg.edit({ content: `<a:loop:919687254727884850> Retrieving Client Websocket ping...`, allowedMentions: { repliedUser: false } })

                var clientPing = client.ws.ping

                var overAllPing = (timeTaken + msgEditTime + clientPing) / 3
                var ovrl = ''

                if (overAllPing <= 250) {
                    ovrl = 'Great'
                } else if (overAllPing > 250 && overAllPing <= 500) {
                    ovrl = 'Okay'
                } else if (overAllPing > 500) {
                    ovrl = 'Bad'
                }

                const resEmbed = new MessageEmbed()
                    .setColor(defaultColor)
                    .setTitle(`Overall Ping: ${ovrl}`)
                    .setDescription
                    (
                        `
                More info:

                - **GET Request Time:** ${timeTaken} ms

                - **Message Edit Time:** ${msgEditTime} ms

                - **Client Websocket Ping:** ${clientPing} ms
                `
                    )
                    .setTimestamp()

                await msg.edit({ embeds: [resEmbed], content: ' ', allowedMentions: { repliedUser: false } })

            })
            .catch((err) => {
                console.log(err)
            })


    }
}