require('dotenv').config()
const { WEB3_PROVIDER_URL } = process.env;
const { ethers } = require('ethers');
const Web3 = require('web3');
const { Abis, privateKey } = require('../config/app');
const TBL = require("../config/tables");
TBL.create_table()

const provider = new ethers.providers.JsonRpcProvider(WEB3_PROVIDER_URL);
const wallet = new ethers.Wallet(privateKey, provider);
const vault = new ethers.Contract(Abis.vault.address, Abis.vault.abi, provider);
const rewarder = new ethers.Contract(Abis.rewarder.address, Abis.rewarder.abi, provider);
const ContractSigner = rewarder.connect(wallet);


const web3 = new Web3(WEB3_PROVIDER_URL);
var contract = new web3.eth.Contract(Abis.vault.abi, Abis.vault.address);

let blockNum = 21123449;

const Past_Event = () => {

    TBL.getFrom(async (rs) => {

        if (rs) {
            blockNum = rs.fromBlock;
        }
        let tempNum = blockNum;

        contract.getPastEvents('RewardPaid', {
            fromBlock: blockNum,
            toBlock: 'latest'
        })
            .then(async (events) => {
                for (let i = 0; i < events.length; i++) {
                    let info = {
                        transactionHash: events[i].transactionHash,
                        user: events[i].returnValues.user,
                        rewardsToken: events[i].returnValues.rewardsToken,
                        reward: events[i].returnValues.reward.toString(),
                        updated: true,
                        transactionHash1: "",
                        blockNumber: events[i].blockNumber,
                        running: true
                    };
                    TBL.check(events[i].transactionHash, blockNum, async (res) => {

                        console.log("Step1 : ", events[i].transactionHash)

                        if (res === true) {
                            TBL.insert(info)
                            try {
                                let tx = await ContractSigner.updateReward(events[i].returnValues.user, events[i].returnValues.reward, { gasLimit: ethers.utils.hexlify(250000), gasPrice: ethers.utils.parseUnits('100', "gwei") });
                                tx.wait();
                                info.transactionHash1 = tx.hash;
                            } catch (e) {
                                console.log("Step 1 issue : ", e)
                                info.updated = false;
                            }
                            info.running = false
                            TBL.update(info);
                        }
                    })
                }
                if (events.length) {
                    tempNum = events[events.length - 1].blockNumber;
                }
            });

        await TBL.getUncalledTransaction(async (data) => {
            if (!data.length) return;

            for (var i = 0; i < data.length; i++) {
                let info = {
                    transactionHash: data[i].transactionHash,
                    updated: true,
                    transactionHash1: "",
                };

                console.log("Step2 : ", data[i].transactionHash)

                try {
                    let tx = await ContractSigner.updateReward(data[i].user, data[i].reward, { gasLimit: ethers.utils.hexlify(250000), gasPrice: ethers.utils.parseUnits('100', "gwei") });
                    tx.wait();
                    info.transactionHash1 = tx.hash;
                } catch (e) {
                    console.log("Step 2 issue : ", e)
                    info.updated = false;
                }
                TBL.update(info);
            }
        });

        TBL.getPrev(async (result) => {
            await TBL.getData(result.fromBlock, async (data) => {
                if (!data.length) return;

                for (var i = 0; i < data.length; i++) {
                    if (data[i].transactionHash1 == "") continue;

                    console.log("Step3 Hash : ", data[i].transactionHash)
                    console.log("Step3 Hash1 : ", data[i].transactionHash1)

                    await web3.eth.getTransactionReceipt(data[i].transactionHash1).then(async (res) => {
                        let info = {
                            transactionHash: data[i].transactionHash,
                            updated: true,
                            transactionHash1: "",
                        };
                        if (!res) return;
                        if (res && res.status) return;

                        try {
                            let tx = await ContractSigner.updateReward(data[i].user, data[i].reward, { gasLimit: ethers.utils.hexlify(250000), gasPrice: ethers.utils.parseUnits('100', "gwei") });
                            tx.wait();
                            info.transactionHash1 = tx.hash;
                        } catch (e) {
                            console.log("Step 3 issue : ", e)
                            info.updated = false;
                        }

                        TBL.update(info);
                    })
                }
            })
        })

        TBL.updatePrev(blockNum)

        const curBlock = await web3.eth.getBlockNumber();
        if (blockNum === tempNum && tempNum + 100 <= curBlock) {
            blockNum = curBlock - 100
        } else {
            blockNum = tempNum
        }
        TBL.updateFrom(blockNum);

    })
}

const Paid_Event = () => {
    vault.on("RewardPaid", async (user, rewardsToken, reward, { transactionHash, blockNumber }) => {
        let info = {
            transactionHash,
            user,
            rewardsToken,
            reward: reward.toString(),
            updated: true,
            transactionHash1: "",
            blockNumber,
            running: true
        };

        TBL.existAndUncalled(info, async (res) => {
            if (res) {
                try {
                    let tx = await ContractSigner.updateReward(user, reward, { gasLimit: ethers.utils.hexlify(250000), gasPrice: ethers.utils.parseUnits('100', "gwei") });
                    tx.wait();
                    info.transactionHash1 = tx.hash;
                } catch (e) {
                    console.log("Paid_Event 1 issue : ", e)
                    info.updated = false;
                }

                TBL.update(info);
                return;
            }
        })

        TBL.insert(info);

        try {
            let tx = await ContractSigner.updateReward(user, reward, { gasLimit: ethers.utils.hexlify(250000), gasPrice: ethers.utils.parseUnits('100', "gwei") });
            tx.wait();
            info.transactionHash1 = tx.hash;

        } catch (e) {
            console.log("Paid_Event 2 issue : ", e)
            info.updated = false;
        }
        info.running = false;
        TBL.update(info);
    });
};

setInterval(Past_Event, 900000)

Past_Event()
Paid_Event()