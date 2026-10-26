FemDash!Mania

1. Open this folder in VS Code (File > Open Folder > femdash-mania).
2. Install the "Live Server" extension if you don't have it.
3. Right-click index.html > Open with Live Server.

Add songs: put an mp3 in assets/, then add an entry to songs.json
(name, artist, audio path, optional cover path). Without a "chart" the game
generates one from the audio.
Optional "preview": start time in seconds for the 15 second clip that plays on song select.

Discord Rich Presence (optional, Live Server folder only)
Browsers can't talk to Discord directly, so a tiny local bridge does it.
1. Go to https://discord.com/developers/applications > New Application. Name it
   FemDash!Mania (that name shows as "Playing FemDash!Mania"). Copy the Application ID.
2. Open rpc-bridge/rpc-config.json and paste the ID into "clientId".
   Optional: upload a picture under Rich Presence > Art Assets and put its name in "largeImageKey".
3. Install Node.js, then in a terminal:  cd rpc-bridge  then  npm install  then  npm start
4. Keep the Discord desktop app open and the bridge running while you play.
Your status shows what you are browsing or playing, difficulty, accuracy and combo.
If the bridge isn't running, the game just ignores it.
