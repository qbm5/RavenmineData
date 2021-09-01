# RavenmineData
Very simple node script to read a bit of extra data from the ravenmine pool.  

Only around 14 hours of data is available from teh API.  The app will keep collecting data in realtime if it remains open.


important files are main.js, install.cmb and run.cmd
1. Ensure node.js is installed 14.16 or newer.
2. Copy the above files files to a folder on your system
3. Double click 'install.cmd' (installs required dependencies)
4. Edit 'run.cmd' to include your wallet address and save
5. Double click run.cmd or run the command in cmd. (keep file open, will update every 60 seconds)
run 

run with:  node main --u walletxxxxxxxxxxxxxxxxxxxx
  

Output updates every 60 seconds
  
  ![2021-08-30 16_26_52-Window](https://user-images.githubusercontent.com/18061986/131401624-305c11b2-a8a8-473a-9c80-3da8bf123ed0.png)

