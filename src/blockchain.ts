import { hash, isHashProofed } from "./helpers"

export interface Block {
    header: {
        nonce: number
        hashBlock: string
    }
    payload: {
        sequence: number
        timestamp: number
        data: any
        previousHash: string
    }
}

export class Blockchain {
    #chain: Block[] = [];
    private powPrefix = '0';

    constructor(private readonly difficulty: number = 4) {
        this.#chain.push(this.createGenesisBlock());
    
    }

    private get lastBlock(): Block {
        return this.#chain.at(-1) as Block;
    }

    get chain() {
        return this.#chain;
    }

    private createGenesisBlock(): Block {
        const payload: Block["payload"] = {
            sequence: 0,
            timestamp: +new Date,
            data: "initial block",
            previousHash: ''
        }

        return {
            header: {
                nonce: 0,
                hashBlock: hash(JSON.stringify(payload))
            },
            payload
        }
    }

    private previousHashBlock(): string {
        return this.lastBlock.header.hashBlock;
    }

    createBlock(data: any): Block['payload'] {

        const newBlock: Block["payload"] = {
            sequence: this.lastBlock.payload.sequence+1,
            timestamp: +new Date,
            data: data,
            previousHash: this.previousHashBlock()
        };

        console.log(`Created block ${newBlock.sequence}: ${JSON.stringify(newBlock, null, 2)}`);

        return newBlock;
    }

    mineBlock(block: Block['payload']) {
        let nonce = 0;
        let startTime = +new Date();
    
        while (true) {
          const hashBlock: string = hash(JSON.stringify(block));
          const proofingHash = hash(hashBlock + nonce);
    
          if (isHashProofed({
            hash: proofingHash,
            difficulty: this.difficulty,
            prefix: this.powPrefix
          })) {
            const endTime = +new Date();
            const shortHash = hashBlock.slice(0, 12);
            const mineTime = (endTime - startTime) / 1000;
    
            console.log(`Mined block ${block.sequence} in ${mineTime} seconds. Hash: ${shortHash} (${nonce} attempts)`)
            return {
              minedBlock: { payload: { ...block }, header: { nonce, hashBlock } },
              minedHash: proofingHash,
              shortHash,
              mineTime
            }
          }
          nonce++;
        }
    }

    verifyBlock(block: Block) {
        
        if (block.payload.previousHash !== this.previousHashBlock()) {
          console.error(`Invalid block #${block.payload.sequence}: \
            Previous block hash is "${this.previousHashBlock().slice(0, 12)}" not "${block.payload.previousHash.slice(0, 12)}"`)
          return
        }
    
        if (!isHashProofed({
          hash: hash(hash(JSON.stringify(block.payload)) + block.header.nonce),
          difficulty: this.difficulty,
          prefix: this.powPrefix
        })) {
          console.error(`Invalid block #${block.payload.sequence}: Hash is not proofed, nonce ${block.header.nonce} is not valid`);
          return
        }
    
        return true
    }
    
    pushBlock(block: Block) {
        if (this.verifyBlock(block)) this.#chain.push(block)
        console.log(`Pushed block #${JSON.stringify(block, null, 2)}`)
        return this.#chain
    }
}