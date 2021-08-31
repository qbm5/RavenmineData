var axios = require('axios');
const LocalStorage = require('node-localstorage').LocalStorage;
global.localStorage = new LocalStorage('./blockStore');

let walletString = '';
// extract wallet from arguments
for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.toLowerCase() == '--u' && process.argv[i + 1]) {
        walletString = process.argv[i + 1]
    }
}

if (walletString === '') {
    console.error('Could not locate wallet address.  Example: node main --u xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
}


const poolData = "https://api-ravencoin.flypool.org/poolStats";
const payoutData = `https://api-ravencoin.flypool.org/miner/${walletString}/dashboard/payouts`;
const blockData = "https://api-ravencoin.flypool.org/blocks";

/** Manage querying data from apis */
class MiningInfo {
    constructor() {
        let tmp = localStorage.getItem('blocks');
        if (tmp) {
            this.blocks = JSON.parse(tmp);
        }
    }

    usd = 0;
    blocks = [];

    /** Query data */
    async UpdateStats() {
        // Query wallet block data
        let resp = await axios.get(payoutData);
        let data = resp.data.data;
        if (data && data.rounds) {

            for (let i = 0; i < data.rounds.length; i++) {
                const block = data.rounds[i];
                const match = this.blocks.find((b) => b.block == block.block);
                if (!match) {
                    var nBlk = new MinedBlocks();
                    nBlk.block = block.block;
                    nBlk.amount = block.amount
                    // query is mising time, get it elsewhere
                    this.blocks.unshift(nBlk);
                }

            }
        }

        // Query current price data (based on Ravenmine data, not real time data)
        resp = await axios.get(poolData);
        data = resp.data.data;

        if (data) {
            this.usd = data.price.usd;
        }

        // query pool block history for timing
        resp = await axios.get(blockData);
        data = resp.data.data;

        if (data) {
            for (let i = 0; i < data.length; i++) {
                const rnd = data[i];
                const match = this.blocks.find((b) => b.block == rnd.number);
                if (match) {
                    match.time = rnd.time * 1000; // convert short unix time to standard unix time
                }

            }
        }

        // remove data older than 50 hours
        const oldest = new Date();
        oldest.setHours(oldest.getHours() - 50);
        this.blocks = this.blocks.filter(b => { return new Date(b.time) > oldest })

        // store locally to build up.  Used to populate data over 12 hours old, and to ensure data inst lost when you have to close the app
        localStorage.setItem('blocks', JSON.stringify(this.blocks));
    }

    /** Create output  */
    GetLast(title, hr, time, endTime) {
        let start = new Date();
        if (hr) {
            start.setHours(start.getHours() - hr);
        } else {
            start = time;
        }
        let sum = 0;
        let cnt = 0;
        let pending = 0;
        let lastReported = 0;

        for (let i = 0; i < this.blocks.length; i++) {
            const blk = this.blocks[i];
            const blkTime = new Date(blk.time);
            if (!endTime) {
                if (blkTime > start) {
                    if (blk.amount) {
                        sum += blk.amount;
                        cnt++;
                        if (!lastReported) {
                            lastReported = blk.block
                        }
                    }
                }
            } else {
                if (blkTime > start && blkTime < endTime) {
                    if (blk.amount) {
                        sum += blk.amount;
                        cnt++;
                        if (!lastReported) {
                            lastReported = blk.block
                        }
                    }
                }
            }
        }
        let coin = sum / 100000000;  // remove floating point logic


        return `[${title} -- Blks Fnd: ${cnt.toString().padStart(4)}   - Coins Mined: ${(coin).toFixed(2).padStart(8)} - Earned: $${((coin) * this.usd).toFixed(2).padStart(8)}]`
    }
}

class MinedBlocks {
    block = 0;
    amount = 0;
    time = 0;
}



const miner = new MiningInfo();

function writeToConsole() {
    miner.UpdateStats().then(() => {
        var start = new Date((new Date()).setHours(0, 0, 0, 0));
        var end = new Date((new Date()).setHours(4, 0, 0, 0));
        var startOfYesterday = new Date();
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        startOfYesterday.setHours(0, 0, 0, 0);
        console.log('     ');
        console.log(`${new Date().toLocaleString()} -- Current Price: $${miner.usd}`);
        console.log(`${miner.GetLast("Today".padEnd(15), null, start)}`);
        console.log(`${miner.GetLast("Yesterday".padEnd(15), null, startOfYesterday, start)}`);
        console.log(`${miner.GetLast("1 Hour".padEnd(15), 1)}`);
        console.log(`${miner.GetLast("2 Hour".padEnd(15), 2)}`);
        console.log(`${miner.GetLast("6 Hours".padEnd(15), 6)}`);
        console.log(`${miner.GetLast("12 Hours".padEnd(15), 12)}`);
        console.log(`${miner.GetLast("18 Hours".padEnd(15), 18)}`);
        console.log(`${miner.GetLast("24 Hours".padEnd(15), 24)}`);
        console.log('----------')
        console.log(`${miner.GetLast("12-04".padEnd(15), null, start, end)}`);
        start = new Date((new Date()).setHours(4, 0, 0, 1));
        end = new Date((new Date()).setHours(8, 0, 0, 0));
        console.log(`${miner.GetLast("04-08".padEnd(15), null, start, end)}`);
        start = new Date((new Date()).setHours(8, 0, 0, 1));
        end = new Date((new Date()).setHours(12, 0, 0, 0));
        console.log(`${miner.GetLast("08-12".padEnd(15), null, start, end)}`);
        start = new Date((new Date()).setHours(12, 0, 0, 1));
        end = new Date((new Date()).setHours(16, 0, 0, 0));
        console.log(`${miner.GetLast("12-04".padEnd(15), null, start, end)}`);
        start = new Date((new Date()).setHours(16, 0, 0, 1));
        end = new Date((new Date()).setHours(20, 0, 0, 0));
        console.log(`${miner.GetLast("04-08".padEnd(15), null, start, end)}`);
        start = new Date((new Date()).setHours(20, 0, 0, 1));
        end = new Date((new Date()).setHours(23, 59, 59, 0));
        console.log(`${miner.GetLast("08-12".padEnd(15), null, start, end)}`);



        // console.log(`${miner.GetLast("  6 Hours", 6)}`);
        // console.log(`${miner.GetLast(" 12 Hours", 12)}`);
        // console.log(`${miner.GetLast(" 18 Hours", 18)}`);
        // console.log(`${miner.GetLast(" 24 Hours", 24)}`);
    });

}

// initial write
writeToConsole();
// write ever 60 seconds (60 * 1000)
setInterval(() => {
    writeToConsole();
}, 60 * 1000);

