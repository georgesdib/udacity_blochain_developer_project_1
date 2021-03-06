/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

import SHA256 = require('crypto-js/sha256');
import BlockClass = require('./block');
import bitcoinMessage = require('bitcoinjs-message');

export class Blockchain {

    chain: BlockClass.Block[];
    height: number;

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    async tamperWithBlock(height) {
        const block: BlockClass.Block = await this.getBlockByHeight(height);
        if (block) {
            block.time = 3;
            return block;
        }
        return null;
    }
    
    async tamperWithChain(height) {
        const block = await this.getBlockByHeight(height);
        if (block) {
            block.previousBlockHash = "123456";
            return block;
        }
        return null;
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            self.getChainHeight().then((height: number) => {
                if (height > -1) {
                    block.previousBlockHash = self.chain[self.height].hash;
                }
                block.height = height + 1;
                block.time = new Date().getTime().toString().slice(0, -3);
                block.hash = SHA256(JSON.stringify(block)).toString();
                // Validate the chain first
                self.validateChain().then((errors: string[]) => {
                    if (errors.length === 0) {
                        self.chain.push(block);
                        self.height++;
                        resolve(block);
                    } else {
                        reject(errors);
                    }
                })
            }).catch((error) => reject(error))
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
           resolve(`${address}:${new Date().getTime().toString().slice(0,-3)}:starRegistry`);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            const time = parseInt(message.split(':')[1]);
            const currentTime = parseInt(new Date().getTime().toString().slice(0,-3));
            if (Math.floor((currentTime - time) / 60) > 5) {
                reject("More than 5 minutes have elapsed");
            } else {
                try {
                    if(bitcoinMessage.verify(message, address, signature)) {
                        let block = new BlockClass.Block({owner: address, star: star});
                        this._addBlock(block).then((block) => {
                            resolve(block);
                        }).catch((error) => reject(error));
                    } else {
                        reject("Signature not valid");
                    }
                } catch(err) { //if bitcoinMessage.verify throws an error, catch it and report it
                    reject(err.message);
                }
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.find(p => p.hash === hash);
            if (block) {
                resolve(block);
            } else {
                reject("Block hash not found");
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height): Promise<BlockClass.Block> {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress (address) {
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
            self.chain.forEach((block) => {
                block.getBData()
                    .then((message) => {
                        if (message['owner'] === address) {
                            stars.push(message);
                        }
                    })
                    .catch(() => {})
            });
            resolve(stars);
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain(): Promise<string[]> {
        let self = this;
        let errorLog: string[] = [];
        return new Promise(async (resolve, reject) => {
            // Resolve when all promises resolve
            // return the validation return and the block height to check previous hash
            Promise.all(self.chain.map((block) => [block.validate(), block.height]))
                .then((values) => {
                    values.forEach((value: (Promise<boolean> | number)[]) => {
                        //first value is the validation
                        (value[0] as Promise<boolean>).then((passed) => {
                            //second value is the block height
                            const height: number = value[1] as number;
                            if (!passed) {
                                errorLog.push(`Block at height ${height} is not valid`);
                            }
                            if (height > 0 && self.chain[height].previousBlockHash !== self.chain[height-1].hash) {
                                errorLog.push(`Block ${height} previousBlockHash is not the same as the previous hash`);        
                            }
                        })
                    });
                    resolve(errorLog);
                });
        });
    }

}

module.exports.Blockchain = Blockchain;   