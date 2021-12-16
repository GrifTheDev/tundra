const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const { token, MongoSRV, prefix } = require('./json/config.json');
const { error_color, XEmoji, info, defaultColor, tickEmoji, botStatus, statusType } = require('./json/graphic_config.json')
const { adminBypassCmdCooldowns } = require('./json/admin_config.json')
const { deleteMessageOnInvalidPerms, deleteUserCommandOnInvalidPerms, pingOnInvalidPermsMessage, deleteMessageAfter, replyOnInvalidPerms, replyOnInvalidPermsForm, replyOnInvalidPermsMessage } = require('./json/permissions_config.json')

const fs = require('fs')
const mongoose = require('mongoose')
const cooldowns = new Map()
const { MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_WEBHOOKS, Intents.FLAGS.GUILD_INVITES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_TYPING] })
client.textCommands = new Collection()

const textCommandFiles = fs.readdirSync('./text_commands').filter(file => file.endsWith('.js'))


for (const textFile of textCommandFiles) {
    const textCommand = require(`./text_commands/${textFile}`)

    client.textCommands.set(textCommand.name, textCommand)
}


client.once('ready', async () => {

    //if (!MongoSRV) throw new Error('No monogoDB SRV was found in the config.json file. The bot does not function without a database.')

    console.log(`[Tundra] (Info) :: Logged in as ${client.user.username}.`);

    client.user.setActivity(botStatus, { type: statusType })



});


//commandHandler

client.on('messageCreate', async (message) => {

    if (message.author.bot || !message.guild || !message.content.toLowerCase().startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const textCommandQuery = args.shift().toLowerCase()
    const textCommandEx = client.textCommands.get(textCommandQuery) || client.textCommands.find(a => a.aliases && a.aliases.includes(textCommandQuery))

    if (!textCommandEx) return

    if (textCommandEx.permissions != undefined) {

        let invalidPerms = []
        var missingPerms = ''

        for (const permission of textCommandEx.permissions) {
            if (!message.member.permissions.has(textCommandEx.permissions)) {
                invalidPerms.push(permission)

                if (missingPerms == '') {
                    missingPerms = permission
                } else {
                    missingPerms = missingPerms + " " + permission
                }

            }
        }

        if (invalidPerms.length > 0) {
            var messageOnFail = replyOnInvalidPermsMessage.replace('{missingPerms}', missingPerms).replace('{commandName}', textCommandEx.name)

            if (replyOnInvalidPerms == true) {


                if (replyOnInvalidPermsForm == "message") {
                    message.reply({ content: messageOnFail, allowedMentions: { repliedUser: pingOnInvalidPermsMessage } }).then(msg => {
                        if (deleteMessageOnInvalidPerms == true) {
                            setTimeout(() => {

                                if (msg.deletable == true && deleteMessageOnInvalidPerms == true) {
                                    msg.delete()
                                }

                                if (message.deletable == true && deleteUserCommandOnInvalidPerms == true) {
                                    message.delete()
                                }

                            }, deleteMessageAfter * 1000);
                        }
                    })
                } else if (replyOnInvalidPermsForm == "embed") {
                    const embedToReply = new MessageEmbed()
                    .setDescription(messageOnFail)
                    .setColor(error_color)

                    message.reply({ embeds: [embedToReply], allowedMentions: { repliedUser: pingOnInvalidPermsMessage } }).then(msg => {
                        if (deleteMessageOnInvalidPerms == true) {
                            setTimeout(() => {

                                if (msg.deletable == true && deleteMessageOnInvalidPerms == true) {
                                    msg.delete()
                                }

                                if (message.deletable == true && deleteUserCommandOnInvalidPerms == true) {
                                    message.delete()
                                }

                            }, deleteMessageAfter * 1000);
                        }
                    })
                }

            } else {

                if (message.deletable == true && deleteUserCommandOnInvalidPerms == true) {
                    message.delete()
                }

                return
            }

            return
        }
    }

    if (textCommandEx.cooldown != undefined && typeof textCommandEx.cooldown == 'number') {

        if (message.member.permissions.has('ADMINISTRATOR') && adminBypassCmdCooldowns == true) {

        } else {

            if (!cooldowns.has(textCommandEx.name)) {
                cooldowns.set(textCommandEx.name, new Collection())
            }

            const CurrentTime = Date.now();
            const TimeStamps = cooldowns.get(textCommandEx.name)
            const CooldownAmount = (textCommandEx.cooldown) * 1000

            if (TimeStamps.has(message.author.id)) {
                const ExpirationTime = TimeStamps.get(message.author.id) + CooldownAmount

                if (CurrentTime < ExpirationTime) {
                    const TimeLeft = (ExpirationTime - CurrentTime) / 1000

                    try {
                        message.delete()
                    } catch (error) {

                    }



                    const CooldownEmbed = new MessageEmbed()
                        .setDescription(`You are on cooldown! You can use the ` + "`" + `${textCommandEx.name}` + "` command in " + "`" + `${TimeLeft.toFixed(1)}` + "` seconds.")
                        .setColor(error_color)

                    return message.channel.send({ embeds: [CooldownEmbed] }).then(msg => {
                        setTimeout(() => {

                            if (message.deletable == true) {
                                msg.delete()
                            }

                        }, 4000);
                    })
                }
            }

            TimeStamps.set(message.author.id, CurrentTime)

            setTimeout(() => TimeStamps.delete(message.author.id), CooldownAmount)

        }

    }

    try {
        await textCommandEx.execute(message, args, client, textCommandQuery);
    } catch (error) {
        console.error(error);
        await message.reply({ content: ` ${XEmoji} The bot encountered an error while running this command, please try again.\n\n`, allowedMentions: { repliedUser: false } });

        Log(client,
            ":warning: The command handler reported an error!",
            `**Error:**\n` + "```" + error + "```" + `\n**Origin:**\n` + "```/text_commands/" + textCommandQuery + ".js" + "```" + "\n**Command Type:**\n```Text Based Command```",
            errcolor
        )
    }

})


client.login(token);