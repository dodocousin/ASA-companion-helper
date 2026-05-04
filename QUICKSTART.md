# Quick Start Guide

Get your ARK Discord RCON Bot up and running in minutes!

## 📋 Prerequisites Checklist

- [ ] Node.js v16.9.0+ installed
- [ ] Discord bot created in Developer Portal
- [ ] Bot invited to your Discord server
- [ ] ARK servers with RCON enabled
- [ ] All required IDs collected (see below)

## 🚀 Setup in 5 Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Your Bot

Edit `config.json` with your information:

**Required Discord Information:**
- `Token`: Get from Discord Developer Portal → Your Application → Bot → Token
- `ClientID`: Discord Developer Portal → Your Application → Application ID
- `GuildID`: Right-click your Discord server → Copy ID
- `AllowedRoleIDs`: Right-click role(s) → Copy ID (can add multiple)
- `AuditLogChannelID`: Right-click channel → Copy ID

**Required Server Information:**
For each ARK server, add:
- `ServerName`: Any name you want (e.g., "Astraeos")
- `IP`: Your server's IP address
- `Port`: RCON port (usually game port + 10)
- `Password`: Your RCON password

### 3. Deploy Commands to Discord

```bash
npm run deploy
```

### 4. Start the Bot

```bash
npm start
```

### 5. Test It!

In Discord, try:
```
/rcon_all command:"SaveWorld"
```

## ✅ Verification

If everything is working, you should see:
- ✅ Bot shows as online in Discord
- ✅ Slash commands appear when you type `/`
- ✅ Commands execute without errors
- ✅ Audit logs appear in your designated channel

## 🔧 Common Issues

**Bot shows offline:**
- Check your bot token in config.json
- Make sure bot is invited to your server

**Commands don't appear:**
- Run `npm run deploy` again
- Wait a few minutes for Discord to update
- Refresh Discord (Ctrl+R)

**Permission denied:**
- Make sure your role ID is in `AllowedRoleIDs`
- Check you have the role assigned

**RCON errors:**
- Verify RCON port is correct (not game port)
- Test RCON password is correct
- Check server is online

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Learn how to add custom commands
- Set up the bot to run in the background

## 🆘 Need Help?

1. Check console output for error messages
2. Verify all IDs are correct
3. Test RCON connection manually
4. Review the troubleshooting section in README.md

---

**That's it! You're ready to manage your ARK servers through Discord! 🎮**
