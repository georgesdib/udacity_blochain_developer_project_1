/**
 *          BlockchainController
 *       (Do not change this code)
 * 
 * This class expose the endpoints that the client applications will use to interact with the 
 * Blockchain dataset
 */

 import express = require("express");
 import BlockChain = require('./src/blockchain');

export class BlockchainController {

    app: express;
    blockchain: BlockChain.Blockchain;

    //The constructor receive the instance of the express.js app and the Blockchain class
    public constructor(app: express, blockchainObj: BlockChain.Blockchain) {
        this.app = app;
        this.blockchain = blockchainObj;
        // All the endpoints methods needs to be called in the constructor to initialize the route.
        this.validateChain();
        this.getBlockByHeight();
        this.requestOwnership();
        this.submitStar();
        this.getBlockByHash();
        this.getStarsByOwner();
        this.tamperChain();
        this.tamperBlock()
    }

    // Enpoint to validate the chain (POST Endpoint)
    validateChain() {
        this.app.post("/validateChain", async (req, res) => {
            const message = await this.blockchain.validateChain();
            if (message.length === 0) {
                return res.status(200).json("Chain is valid");
            } else {
                res.status(500).json(message);
            }
        });
    }

    // Enpoint to tamper with the chain (POST Endpoint)
    tamperChain() {
        this.app.post("/tamperChain/:height", async (req, res) => {
            if(req.params.height) {
                const height = parseInt(req.params.height);
                const block = this.blockchain.tamperWithChain(height);
                if (block) {
                    return res.status(200).send("Chain tampered");
                } else {
                    res.status(500).send("Block not found");
                }
            } else {
                return res.status(500).send("Check the Body Parameter!");
            }
        });
    }

    // Enpoint to tamper with the block (POST Endpoint)
    tamperBlock() {
        this.app.post("/tamperBlock/:height", async (req, res) => {
            if(req.params.height) {
                const height = parseInt(req.params.height);
                const block = this.blockchain.tamperWithBlock(height);
                if (block) {
                    return res.status(200).send("Block tampered");
                } else {
                    res.status(500).send("Block not found");
                }
            } else {
                return res.status(500).send("Check the Body Parameter!");
            }
        });
    }
    
    // Enpoint to Get a Block by Height (GET Endpoint)
    getBlockByHeight() {
        this.app.get("/block/height/:height", async (req, res) => {
            if(req.params.height) {
                const height = parseInt(req.params.height);
                let block = await this.blockchain.getBlockByHeight(height);
                if(block){
                    return res.status(200).json(block);
                } else {
                    return res.status(404).send("Block Not Found!");
                }
            } else {
                return res.status(404).send("Block Not Found! Review the Parameters!");
            }
            
        });
    }

    // Endpoint that allows user to request Ownership of a Wallet address (POST Endpoint)
    requestOwnership() {
        this.app.post("/requestValidation", async (req, res) => {
            if(req.body.address) {
                const address = req.body.address;
                const message = await this.blockchain.requestMessageOwnershipVerification(address);
                if(message){
                    return res.status(200).json(message);
                } else {
                    return res.status(500).send("An error happened!");
                }
            } else {
                return res.status(500).send("Check the Body Parameter!");
            }
        });
    }

    // Endpoint that allow Submit a Star, yu need first to `requestOwnership` to have the message (POST endpoint)
    submitStar() {
        this.app.post("/submitstar", async (req, res) => {
            if(req.body.address && req.body.message && req.body.signature && req.body.star) {
                const address = req.body.address;
                const message = req.body.message;
                const signature = req.body.signature;
                const star = req.body.star;
                try {
                    let block = await this.blockchain.submitStar(address, message, signature, star);
                    if(block){
                        return res.status(200).json(block);
                    } else {
                        return res.status(500).send("An error happened!");
                    }
                } catch (error) {
                    return res.status(500).send(error);
                }
            } else {
                return res.status(500).send("Check the Body Parameter!");
            }
        });
    }

    // This endpoint allows you to retrieve the block by hash (GET endpoint)
    getBlockByHash() {
        this.app.get("/block/hash/:hash", async (req, res) => {
            if(req.params.hash) {
                const hash = req.params.hash;
                let block = await this.blockchain.getBlockByHash(hash);
                if(block){
                    return res.status(200).json(block);
                } else {
                    return res.status(404).send("Block Not Found!");
                }
            } else {
                return res.status(404).send("Block Not Found! Review the Parameters!");
            }
            
        });
    }

    // This endpoint allows you to request the list of Stars registered by an owner
    getStarsByOwner() {
        this.app.get("/blocks/:address", async (req, res) => {
            if(req.params.address) {
                const address = req.params.address;
                try {
                    let stars = await this.blockchain.getStarsByWalletAddress(address);
                    if(stars){
                        return res.status(200).json(stars);
                    } else {
                        return res.status(404).send("Block Not Found!");
                    }
                } catch (error) {
                    return res.status(500).send("An error happened!");
                }
            } else {
                return res.status(500).send("Block Not Found! Review the Parameters!");
            }
            
        });
    }

}